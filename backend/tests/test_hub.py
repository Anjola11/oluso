import pytest
from app.streaming.hub import StreamingHub


@pytest.fixture
def hub() -> StreamingHub:
    return StreamingHub()


def test_frame_reaches_viewer(hub: StreamingHub):
    """Verify that a published frame reaches a registered viewer."""
    viewer = hub.register_viewer(viewer_id="viewer-001", device_id="camera-001")
    frame = b"jpeg-test-frame-001"

    hub.publish_frame("camera-001", frame)

    assert not viewer.queue.empty()
    assert viewer.queue.get_nowait() == frame


def test_latest_frame_replaces_old_frame(hub: StreamingHub):
    """Verify that slower viewers only get the latest frame, dropping older unconsumed frames."""
    viewer = hub.register_viewer(viewer_id="viewer-001", device_id="camera-001")

    frame1 = b"jpeg-frame-1"
    frame2 = b"jpeg-frame-2"
    frame3 = b"jpeg-frame-3"

    hub.publish_frame("camera-001", frame1)
    hub.publish_frame("camera-001", frame2)
    hub.publish_frame("camera-001", frame3)

    # Queue maxsize is 1, so it must contain only the newest frame
    assert viewer.queue.qsize() == 1
    assert viewer.queue.get_nowait() == frame3
    assert viewer.queue.empty()


def test_multiple_viewers_receive_same_frame(hub: StreamingHub):
    """Verify that multiple viewers for the same device receive identical frames."""
    viewer1 = hub.register_viewer(viewer_id="viewer-001", device_id="camera-001")
    viewer2 = hub.register_viewer(viewer_id="viewer-002", device_id="camera-001")
    viewer_other = hub.register_viewer(viewer_id="viewer-003", device_id="camera-other")

    frame = b"broadcast-frame-data"
    hub.publish_frame("camera-001", frame)

    assert viewer1.queue.get_nowait() == frame
    assert viewer2.queue.get_nowait() == frame
    assert viewer_other.queue.empty()


def test_viewer_disconnects_cleanly(hub: StreamingHub):
    """Verify that viewer unregistration cleans up state cleanly."""
    hub.register_viewer(viewer_id="viewer-001", device_id="camera-001")
    hub.register_viewer(viewer_id="viewer-002", device_id="camera-001")

    assert len(hub.viewers["camera-001"]) == 2

    # Unregister first viewer
    hub.unregister_viewer("camera-001", "viewer-001")
    assert "viewer-001" not in hub.viewers["camera-001"]
    assert "viewer-002" in hub.viewers["camera-001"]

    # Unregister second viewer: camera bucket should be completely removed
    hub.unregister_viewer("camera-001", "viewer-002")
    assert "camera-001" not in hub.viewers

    # Unregistering non-existent viewer or camera does not raise error
    hub.unregister_viewer("camera-001", "viewer-001")
    hub.unregister_viewer("unknown-camera", "viewer-001")


def test_device_disconnects_cleanly(hub: StreamingHub):
    """Verify that device registration and unregistration cleans up state cleanly."""
    mock_ws = object()
    hub.register_device("camera-001", mock_ws)
    assert hub.devices.get("camera-001") is mock_ws

    hub.unregister_device("camera-001")
    assert "camera-001" not in hub.devices

    # Unregistering non-existent device does not raise error
    hub.unregister_device("camera-001")
    hub.unregister_device("unknown-device")


def test_publishing_when_no_viewers_exist_does_not_crash(hub: StreamingHub):
    """Verify that publishing to a device with no viewers (or an unknown device) does not crash."""
    # Publishing to a device that has never had viewers
    hub.publish_frame("camera-ghost", b"ghost-frame")

    # Publishing to a registered device with 0 viewers
    hub.register_device("camera-empty", object())
    hub.publish_frame("camera-empty", b"empty-frame")


def test_list_devices_and_last_frame(hub: StreamingHub):
    """Verify that list_devices tracks online state, viewers, and last_frame_at."""
    # Initially empty
    assert hub.list_devices() == []

    # Register camera-001
    mock_ws = object()
    hub.register_device("camera-001", mock_ws)

    devices = hub.list_devices()
    assert len(devices) == 1
    assert devices[0]["device_id"] == "camera-001"
    assert devices[0]["online"] is True
    assert devices[0]["viewers"] == 0
    assert devices[0]["last_frame_at"] is None

    # Register a viewer
    hub.register_viewer("v1", "camera-001")
    devices = hub.list_devices()
    assert devices[0]["viewers"] == 1

    # Publish frame
    hub.publish_frame("camera-001", b"frame-1")
    devices = hub.list_devices()
    assert devices[0]["last_frame_at"] is not None
    assert isinstance(devices[0]["last_frame_at"], float)

    # Disconnect device: still known, but online is False
    hub.unregister_device("camera-001", mock_ws)
    devices = hub.list_devices()
    assert len(devices) == 1
    assert devices[0]["device_id"] == "camera-001"
    assert devices[0]["online"] is False
    # last_frame_at is preserved
    assert devices[0]["last_frame_at"] is not None


def test_register_duplicate_device_returns_old_websocket(hub: StreamingHub):
    """Verify that registering a duplicate device returns the old websocket and prevents stale unregister."""
    ws1 = object()
    ws2 = object()

    # First registration
    assert hub.register_device("camera-001", ws1) is None
    assert hub.devices.get("camera-001") is ws1
    assert hub.list_devices()[0]["online"] is True

    # Second registration with same ID returns ws1
    old = hub.register_device("camera-001", ws2)
    assert old is ws1
    assert hub.devices.get("camera-001") is ws2

    # Old websocket closing does NOT unregister ws2
    hub.unregister_device("camera-001", ws1)
    assert hub.devices.get("camera-001") is ws2
    assert hub.list_devices()[0]["online"] is True

    # Active websocket unregister cleanly marks offline
    hub.unregister_device("camera-001", ws2)
    assert "camera-001" not in hub.devices
    assert hub.list_devices()[0]["online"] is False