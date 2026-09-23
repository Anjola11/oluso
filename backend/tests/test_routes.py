from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from app.streaming.hub import StreamingHub
from app.streaming.routes import create_streaming_router


@pytest.fixture
def streaming_env():
    app = FastAPI()
    hub = StreamingHub()
    app.include_router(create_streaming_router(hub))
    return app, hub


def test_ws_frame_reaches_viewer(streaming_env):
    """Verify end-to-end WebSocket frame transmission from device to viewer."""
    app, hub = streaming_env
    client = TestClient(app)

    with client.websocket_connect("/ws/view/cam-test-1") as viewer_ws:
        with client.websocket_connect("/ws/device/cam-test-1") as device_ws:
            frame_payload = b"\xff\xd8\xff\xe0\x00\x10JFIF"  # simulated JPEG header bytes
            device_ws.send_bytes(frame_payload)
            received = viewer_ws.receive_bytes()
            assert received == frame_payload


def test_ws_multiple_viewers_receive_same_frame(streaming_env):
    """Verify that multiple connected viewers receive the broadcasted frame."""
    app, hub = streaming_env
    client = TestClient(app)

    with client.websocket_connect("/ws/view/cam-broadcast") as viewer1:
        with client.websocket_connect("/ws/view/cam-broadcast") as viewer2:
            with client.websocket_connect("/ws/device/cam-broadcast") as device:
                frame_payload = b"broadcast-frame-data"
                device.send_bytes(frame_payload)
                assert viewer1.receive_bytes() == frame_payload
                assert viewer2.receive_bytes() == frame_payload


def test_ws_viewer_disconnects_cleanly(streaming_env):
    """Verify that viewer disconnects and is unregistered from the hub."""
    app, hub = streaming_env
    client = TestClient(app)

    with client.websocket_connect("/ws/view/cam-viewer-clean") as viewer:
        assert "cam-viewer-clean" in hub.viewers
        assert len(hub.viewers["cam-viewer-clean"]) == 1

    # After websocket context closes, viewer should be cleaned up
    assert "cam-viewer-clean" not in hub.viewers


def test_ws_device_disconnects_cleanly(streaming_env):
    """Verify that device disconnects and is unregistered from the hub."""
    app, hub = streaming_env
    client = TestClient(app)

    with client.websocket_connect("/ws/device/cam-device-clean") as device:
        assert "cam-device-clean" in hub.devices

    # After websocket context closes, device should be cleaned up
    assert "cam-device-clean" not in hub.devices


def test_ws_publishing_when_no_viewers_exist_does_not_crash(streaming_env):
    """Verify that a device publishing frames when no viewers are connected does not crash."""
    app, hub = streaming_env
    client = TestClient(app)

    with client.websocket_connect("/ws/device/cam-alone") as device:
        device.send_bytes(b"frame-1")
        device.send_bytes(b"frame-2")


def test_health_endpoints():
    """Verify that both / and /health return 200 with status ok."""
    from app.main import app
    client = TestClient(app)

    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json() == {"status": "ok", "service": "streaming-hub"}

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json() == {"status": "ok", "service": "streaming-hub"}


def test_api_devices_endpoint():
    """Verify that /api/devices returns the list of devices."""
    from app.main import app, hub
    client = TestClient(app)

    res = client.get("/api/devices")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_cors_headers_local_origin():
    """Verify that CORS middleware permits local development origins."""
    from app.main import app
    client = TestClient(app)

    headers = {"Origin": "http://192.168.1.50:5173"}
    res = client.get("/health", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://192.168.1.50:5173"


def test_cors_headers_vercel_origin():
    """Verify that CORS middleware permits deployed Vercel domains."""
    from app.main import app
    client = TestClient(app)

    headers = {"Origin": "https://oluso-streaming.vercel.app"}
    res = client.get("/health", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://oluso-streaming.vercel.app"

