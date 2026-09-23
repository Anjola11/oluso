import asyncio
from dataclasses import dataclass
import time
from typing import Any


@dataclass
class ViewerConnection:
    viewer_id: str
    queue: asyncio.Queue[bytes]


class StreamingHub:
    def __init__(self):
        self.devices: dict[str, Any] = {}
        self.viewers: dict[str, dict[str, ViewerConnection]] = {}
        self.last_frame_at: dict[str, float] = {}
        self.known_devices: set[str] = set()

    def register_device(self, device_id: str, websocket: Any):
        self.devices[device_id] = websocket
        self.known_devices.add(device_id)

    def unregister_device(self, device_id: str, websocket: Any | None = None):
        if websocket is None or self.devices.get(device_id) is websocket:
            self.devices.pop(device_id, None)

    def register_viewer(self, viewer_id: str, device_id: str) -> ViewerConnection:
        queue: asyncio.Queue[bytes] = asyncio.Queue(maxsize=1)
        viewer = ViewerConnection(viewer_id=viewer_id, queue=queue)
        self.viewers.setdefault(device_id, {})[viewer_id] = viewer
        return viewer

    def unregister_viewer(self, device_id: str, viewer_id: str):
        viewers = self.viewers.get(device_id)
        if viewers is None:
            return

        viewers.pop(viewer_id, None)

        if not viewers:
            self.viewers.pop(device_id, None)

    def publish_frame(self, device_id: str, frame: bytes):
        self.last_frame_at[device_id] = time.time()
        viewers = self.viewers.get(device_id)
        if not viewers:
            return

        for viewer in viewers.values():
            queue = viewer.queue
            if queue.full():
                queue.get_nowait()
            queue.put_nowait(frame)

    def list_devices(self) -> list[dict[str, Any]]:
        # Sort for deterministic output
        devices = []
        for dev_id in sorted(self.known_devices):
            devices.append({
                "device_id": dev_id,
                "online": dev_id in self.devices,
                "viewers": len(self.viewers.get(dev_id, {})),
                "last_frame_at": self.last_frame_at.get(dev_id),
            })
        return devices


# Alias for backwards compatibility
StreamingHUB = StreamingHub

