from collections.abc import AsyncGenerator
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_URL = f"sqlite+aiosqlite:///{BACKEND_DIR / 'test.db'}"


def normalize_database_url(raw_url: Optional[str]) -> str:
    database_url = (raw_url or "").strip()

    if not database_url:
        return DEFAULT_DATABASE_URL

    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+asyncpg://", 1)

    if database_url.startswith("postgresql://") and "+asyncpg" not in database_url:
        return database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

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
