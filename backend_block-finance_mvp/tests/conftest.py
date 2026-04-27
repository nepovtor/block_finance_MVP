from __future__ import annotations

import os
from pathlib import Path

import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEST_DATA_DIR = BACKEND_DIR / ".test-data"
TEST_DATA_DIR.mkdir(exist_ok=True)
TEST_DB_PATH = TEST_DATA_DIR / "test.db"
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"

if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()

os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ["ENVIRONMENT"] = "test"
os.environ["CONSENT_HASH_SECRET"] = "test-consent-secret"


@pytest.fixture(scope="session", autouse=True)
def migrate_database():
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    command.upgrade(config, "head")


@pytest_asyncio.fixture()
async def client():
    from app.main import app

    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as test_client:
        yield test_client
