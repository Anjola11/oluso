import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.streaming.hub import StreamingHub

logger = logging.getLogger(__name__)


def create_streaming_router(hub: StreamingHub) -> APIRouter:
    stream_router = APIRouter()

    @stream_router.websocket("/ws/device/{device_id}")
    async def device_websocket(
        websocket: WebSocket,
        device_id: str,
    ):
        await websocket.accept()

        hub.register_device(
            device_id=device_id,
            websocket=websocket,
        )
        logger.info("Device connected: %s", device_id)

        try:
            while True:
                frame = await websocket.receive_bytes()

                hub.publish_frame(
                    device_id=device_id,
                    frame=frame,
                )

        except WebSocketDisconnect:
            pass

        finally:
            hub.unregister_device(device_id, websocket)
            logger.info("Device disconnected: %s", device_id)

    @stream_router.websocket("/ws/view/{device_id}")
    async def viewer_websocket(
        websocket: WebSocket,
        device_id: str,
    ):
        await websocket.accept()

        viewer_id = str(id(websocket))

        viewer = hub.register_viewer(
            device_id=device_id,
            viewer_id=viewer_id,
        )
        logger.info("Viewer connected: %s (viewer_id=%s)", device_id, viewer_id)

        try:
            while True:
                frame = await viewer.queue.get()

                await websocket.send_bytes(frame)

        except WebSocketDisconnect:
            pass

        finally:
            hub.unregister_viewer(
                device_id=device_id,
                viewer_id=viewer_id,
            )
            logger.info("Viewer disconnected: %s (viewer_id=%s)", device_id, viewer_id)

    return stream_router