#!/usr/bin/env python3
import argparse
import asyncio
import sys
import time
from pathlib import Path
import websockets


async def run_check(url: str, device: str, duration: float, save_path: Path | None) -> int:
    ws_url = f"{url.rstrip('/')}/ws/view/{device}"
    print(f"Connecting to {ws_url} for {duration:.1f}s...")

    frames = 0
    total_bytes = 0
    last_frame = b""
    start_time = time.monotonic()

    try:
        async with websockets.connect(ws_url) as ws:
            while True:
                remaining = duration - (time.monotonic() - start_time)
                if remaining <= 0:
                    break

                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=remaining)
                    if isinstance(msg, bytes):
                        frames += 1
                        total_bytes += len(msg)
                        last_frame = msg
                except asyncio.TimeoutError:
                    break
    except Exception as err:
        print(f"Connection error: {err}", file=sys.stderr)

    elapsed = max(time.monotonic() - start_time, 0.001)
    fps = frames / elapsed
    avg_kb = (total_bytes / 1024) / frames if frames > 0 else 0.0

    print(f"Results: {frames} frames received in {elapsed:.1f}s")
    print(f"FPS: {fps:.1f} | Avg frame: {avg_kb:.1f} KB | Total: {total_bytes / 1024:.1f} KB")

    if save_path and last_frame:
        try:
            save_path.parent.mkdir(parents=True, exist_ok=True)
            save_path.write_bytes(last_frame)
            print(f"Saved latest frame to {save_path}")
        except Exception as err:
            print(f"Failed to save frame: {err}", file=sys.stderr)

    if frames > 0:
        print("Smoke test PASSED.")
        return 0
    else:
        print("Smoke test FAILED: No frames received.", file=sys.stderr)
        return 1


def main():
    parser = argparse.ArgumentParser(description="Headless smoke test for Oluso camera stream.")
    parser.add_argument("--url", default="ws://127.0.0.1:8000", help="Base WebSocket URL (default: ws://127.0.0.1:8000)")
    parser.add_argument("--device", default="camera-001", help="Device ID to watch (default: camera-001)")
    parser.add_argument("--duration", type=float, default=10.0, help="Test duration in seconds (default: 10)")
    parser.add_argument("--save", type=Path, default=None, help="Optional file path to save the last received frame")

    args = parser.parse_args()
    code = asyncio.run(run_check(args.url, args.device, args.duration, args.save))
    sys.exit(code)


if __name__ == "__main__":
    main()
