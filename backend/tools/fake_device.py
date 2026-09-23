import argparse
import asyncio
import sys
import websockets

# Minimal 1x1 valid JPEG frame
SAMPLE_JPEG = (
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00"
    b"\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19"
    b"\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9"
    b"=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00"
    b"\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03"
    b"\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
)


async def main():
    parser = argparse.ArgumentParser(description="Simulate an ESP32 camera streaming to the hub.")
    parser.add_argument("--url", default="ws://127.0.0.1:8000", help="Hub WebSocket base URL")
    parser.add_argument("--device", default="camera-001", help="Device ID")
    parser.add_argument("--fps", type=float, default=15.0, help="Target frames per second")
    parser.add_argument("--continuous", "-c", action="store_true", help="Send frames continuously until stopped")
    parser.add_argument("--count", type=int, default=10, help="Number of frames to send if not continuous")

    args = parser.parse_args()
    ws_uri = f"{args.url.rstrip('/')}/ws/device/{args.device}"
    interval = 1.0 / max(args.fps, 1.0)

    print(f"Connecting to {ws_uri} (fps={args.fps}, continuous={args.continuous})...")

    async with websockets.connect(ws_uri) as websocket:
        print("Device connected.")
        num = 0
        while True:
            num += 1
            await websocket.send(SAMPLE_JPEG)
            if not args.continuous:
                print(f"Sent frame #{num}")
                if num >= args.count:
                    break
            elif num % int(args.fps * 2) == 0:
                print(f"Sent {num} frames...")

            await asyncio.sleep(interval)

        print("Done sending frames.")


if __name__ == "__main__":
    asyncio.run(main())