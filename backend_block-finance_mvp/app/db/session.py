from collections.abc import AsyncGenerator
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_URL = f"sqlite+aiosqlite:///{BACKEND_DIR / 'test.db'}"


def is_local_environment() -> bool:
    environment = os.getenv("ENVIRONMENT", "development").strip().lower()
    return environment in {"", "local", "development", "dev", "test"}


def normalize_database_url(raw_url: Optional[str]) -> str:
    database_url = (raw_url or "").strip()

    if not database_url:
        if is_local_environment():
            return DEFAULT_DATABASE_URL

        raise RuntimeError(
            "DATABASE_URL is required in non-local environments. "
            "Set DATABASE_URL to your Railway PostgreSQL connection string."
        )

    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

    if database_url.startswith("postgresql://") and "+asyncpg" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    try:
        make_url(database_url)
    except ArgumentError as exc:
        raise RuntimeError(
            "Invalid DATABASE_URL. Expected a valid SQLAlchemy async URL, for example "
            "'postgresql+asyncpg://...' on Railway or 'sqlite+aiosqlite:///./test.db' locally."
        ) from exc

    return database_url


DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL"))

engine = create_async_engine(DATABASE_URL, echo=False)

SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def check_database_connection() -> bool:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
