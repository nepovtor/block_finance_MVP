from collections.abc import AsyncGenerator
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_URL = f"sqlite+aiosqlite:///{BACKEND_DIR / 'test.db'}"


def normalize_database_url(url: str) -> str:
    if not url:
        raise RuntimeError("DATABASE_URL is not set")

    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)

    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)

    return url


raw_database_url = os.getenv("DATABASE_URL")

if raw_database_url:
    DATABASE_URL = normalize_database_url(raw_database_url)
else:
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

    if ENVIRONMENT in {"production", "prod"}:
        raise RuntimeError("DATABASE_URL is required in production")

    DATABASE_URL = DEFAULT_DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
