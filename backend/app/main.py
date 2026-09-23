import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.streaming.hub import StreamingHub
from app.streaming.routes import create_streaming_router


app = FastAPI(
    title="Oluso Streaming Hub",
    version="0.1.0",
)

# CORS configuration: reads allowed origins from CORS_ORIGINS env var (e.g. Vercel URL),
# defaulting to '*' if not explicitly set, while always permitting local network dev via allow_origin_regex.
cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()
allow_origins = []
if cors_origins_env:
    if cors_origins_env == "*":
        allow_origins = ["*"]
    else:
        allow_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"^(http://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):\d+|https://.*\.vercel\.app)$",
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

hub = StreamingHub()


@app.get("/")
@app.get("/health")
def server_health():
    return {
        "status": "ok",
        "service": "streaming-hub",
    }


@app.get("/api/devices")
def get_devices():
    return hub.list_devices()


app.include_router(create_streaming_router(hub))

