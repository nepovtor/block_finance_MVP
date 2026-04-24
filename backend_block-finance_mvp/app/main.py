from contextlib import asynccontextmanager
import os
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.transactions import router as transaction_router
from app.api.game import router as game_router
from app.api.rewards import router as reward_router
from app.api.users import router as user_router
from app.db.base import Base
from app.db.session import DATABASE_URL, SessionLocal, check_database_connection, engine
from app.services.user_service import ensure_demo_user

import app.models.user
import app.models.transaction
import app.models.reward
import app.models.game_session

load_dotenv()

DEFAULT_CORS_ORIGINS = (
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


def parse_csv_env(name: str) -> list[str]:
    raw_value = os.getenv(name, "")
    values = [value.strip() for value in raw_value.split(",")]
    return [value for value in values if value]


def get_allowed_origins() -> list[str]:
    configured_origins = (
        parse_csv_env("CORS_ORIGINS")
        or parse_csv_env("ALLOWED_ORIGINS")
    )
    frontend_url = os.getenv("FRONTEND_URL", "").strip()

    merged_origins = [
        *configured_origins,
        *( [frontend_url] if frontend_url else [] ),
    ]

    if merged_origins:
        return list(dict.fromkeys(merged_origins))

    return list(DEFAULT_CORS_ORIGINS)


def get_allowed_origin_regex() -> Optional[str]:
    raw_regex = os.getenv("ALLOWED_ORIGIN_REGEX")
    if raw_regex is not None:
        cleaned = raw_regex.strip()
        return cleaned or None

    return DEFAULT_ALLOWED_ORIGIN_REGEX


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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
        return {"status": "ok", "environment": os.getenv("ENVIRONMENT", "development")}

    @app.get("/ready", tags=["meta"])
    async def ready():
        database_ready = await check_database_connection()
        return {
            "status": "ok" if database_ready else "degraded",
            "database": "ok" if database_ready else "unavailable",
            "database_url_configured": bool(DATABASE_URL),
        }

    app.include_router(transaction_router)
    app.include_router(game_router)
    app.include_router(reward_router)
    app.include_router(user_router)

    return app


app = create_app()
