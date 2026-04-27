from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.transactions import router as transaction_router
from app.api.game import router as game_router
from app.api.rewards import router as reward_router
from app.api.users import router as user_router
from app.api.auth import router as auth_router
from app.api.privacy import router as privacy_router
from app.db.session import SessionLocal, engine
from app.core.observability import configure_logging, init_sentry, RequestIdMiddleware, wrap_with_sentry
from app.services.user_service import ensure_demo_user

import app.models.user
import app.models.transaction
import app.models.reward
import app.models.game_session
import app.models.user_consent

load_dotenv()
configure_logging()
init_sentry()

DEFAULT_ALLOWED_ORIGINS = (
    "http://127.0.0.1:5173",
    "http://localhost:5173",
)
DEFAULT_ALLOWED_ORIGIN_REGEX = (
    r"^https?://("
    r"localhost|127\.0\.0\.1|"
    r"192\.168\.\d{1,3}\.\d{1,3}|"
    r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
    r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?$"
)


def get_allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS") or os.getenv("CORS_ORIGINS")
    if not raw_origins:
        return list(DEFAULT_ALLOWED_ORIGINS)

    origins = [origin.strip() for origin in raw_origins.split(",")]
    return [origin for origin in origins if origin]


def get_allowed_origin_regex() -> str | None:
    raw_regex = os.getenv("ALLOWED_ORIGIN_REGEX")
    if raw_regex is not None:
        cleaned = raw_regex.strip()
        return cleaned or None

    return DEFAULT_ALLOWED_ORIGIN_REGEX


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with SessionLocal() as session:
        await ensure_demo_user(session)

    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Block Finance MVP API",
        description="Backend API for demo transactions, rewards, and game sessions.",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(RequestIdMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_origin_regex=get_allowed_origin_regex(),
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

    @app.get("/ready", tags=["meta"])
    async def ready():
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))

        return {"status": "ready"}

    app.include_router(transaction_router)
    app.include_router(game_router)
    app.include_router(reward_router)
    app.include_router(user_router)
    app.include_router(auth_router)
    app.include_router(privacy_router)

    return app


app = wrap_with_sentry(create_app())
