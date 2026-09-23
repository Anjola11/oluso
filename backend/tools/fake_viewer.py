import asyncio
import os
import sys
import time
from pathlib import Path

import websockets

DEVICE_ID = sys.argv[1] if len(sys.argv) > 1 else "camera-001"
URL = f"ws://127.0.0.1:8000/ws/view/{DEVICE_ID}"
OUT = Path("latest.jpg")


async def main():
    async for ws in websockets.connect(URL, max_size=None):  # auto-reconnects
        print(f"[viewer] connected to {URL}")
        frames = nbytes = bad = 0
        t0 = time.monotonic()
        last_frame = b""
        try:
            async for msg in ws:
                if not isinstance(msg, bytes):
                    continue
                frames += 1
                nbytes += len(msg)
                last_frame = msg
                if msg[:2] != b"\xff\xd8":  # JPEG start-of-image marker
                    bad += 1

                elapsed = time.monotonic() - t0
                if elapsed >= 1.0:
                    print(f"[viewer] {frames / elapsed:4.1f} FPS | "
                          f"{nbytes / frames / 1024:5.1f} KB/frame | bad JPEG headers: {bad}")
                    try:
                        tmp = OUT.with_suffix(".tmp")
                        tmp.write_bytes(last_frame)
                        os.replace(tmp, OUT)
                    except PermissionError:
                        pass  # file open in a viewer; try again next second
                    frames = nbytes = bad = 0
                    t0 = time.monotonic()
        except websockets.ConnectionClosed:
            print("[viewer] disconnected, retrying...")


asyncio.run(main())