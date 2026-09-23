from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import config
from app.streaming.hub import StreamingHub
from app.streaming.routes import create_streaming_router


app = FastAPI(
    title="Oluso Streaming Hub",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

