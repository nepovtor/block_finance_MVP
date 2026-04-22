from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.transactions import router as transaction_router
from app.api.game import router as game_router
from app.db.base import Base
from app.db.session import engine

import app.models.user
import app.models.transaction
import app.models.reward
import app.models.game_session

DEFAULT_ALLOWED_ORIGINS = (
    "http://127.0.0.1:5173",
    "http://localhost:5173",
)


def get_allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS")
    if not raw_origins:
        return list(DEFAULT_ALLOWED_ORIGINS)

    origins = [origin.strip() for origin in raw_origins.split(",")]
    return [origin for origin in origins if origin]


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Block Finance MVP API",
        description="Backend API for demo transactions, rewards, and game sessions.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["meta"])
    async def root():
        return {
            "name": "Block Finance MVP API",
            "healthcheck": "/health",
            "docs": "/docs",
        }

    @app.get("/health", tags=["meta"])
    async def health():
        return {"status": "ok"}

    app.include_router(transaction_router)
    app.include_router(game_router)

    return app


app = create_app()
