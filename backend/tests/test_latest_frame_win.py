from app.streaming.hub import StreamingHUB

hub  = StreamingHUB()

def test_latest_frame_win():
    viewer = hub.register_viewer("viewer-001", "device-001")

    frame1 = b"jpeg-1"
    frame2 = b"jpeg-2"
    frame3 = b"jpeg-3"

    hub.publish_frame("device-001",frame1)
    hub.publish_frame("device-001",frame2)
    hub.publish_frame("device-001",frame3)

    assert viewer.queue.get_nowait() == frame3