from __future__ import annotations

import hashlib
import hmac
import secrets
from typing import Any

from fastapi import Depends, Header, HTTPException
from sqlalchemy import inspect, select, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.services.user_service import serialize_user_profile

PBKDF2_ITERATIONS = 120_000
TOKEN_PREFIX = "bfmvp_"


def normalize_phone(phone: str) -> str:
    return "".join(character for character in phone if character.isdigit() or character == "+")


def hash_password(password: str, salt: str | None = None) -> str:
    password_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    ).hex()
    return f"{password_salt}${digest}"


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash or "$" not in stored_hash:
        return False

    salt, digest = stored_hash.split("$", 1)
    candidate = hash_password(password, salt).split("$", 1)[1]
    return hmac.compare_digest(candidate, digest)


def issue_auth_token() -> str:
    return f"{TOKEN_PREFIX}{secrets.token_urlsafe(32)}"


def ensure_user_schema(connection: Connection) -> None:
    inspector = inspect(connection)
    columns = {column["name"] for column in inspector.get_columns("users")}
    dialect = connection.dialect.name

    if "password_hash" not in columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))

    if "auth_token" not in columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN auth_token VARCHAR"))

    index_name = "ix_users_auth_token"
    indexes = {index["name"] for index in inspector.get_indexes("users")}
    if index_name not in indexes:
        if dialect == "sqlite":
            connection.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_auth_token "
                    "ON users (auth_token)"
                )
            )
        else:
            connection.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_auth_token "
                    "ON users (auth_token)"
                )
            )


async def register_user(
    session: AsyncSession,
    name: str,
    phone: str,
    password: str,
) -> dict[str, Any]:
    normalized_phone = normalize_phone(phone)
    existing_user = await session.scalar(select(User).where(User.phone == normalized_phone))
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="User with this phone already exists")

    user = User(
        name=name.strip(),
        phone=normalized_phone,
        password_hash=hash_password(password),
        auth_token=issue_auth_token(),
        level=1,
        xp=0,
        streak=0,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return {
        "token": user.auth_token,
        "user": await serialize_user_profile(session, user),
    }


async def login_user(
    session: AsyncSession,
    phone: str,
    password: str,
) -> dict[str, Any]:
    normalized_phone = normalize_phone(phone)
    user = await session.scalar(select(User).where(User.phone == normalized_phone))
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone or password")

    user.auth_token = issue_auth_token()
    await session.commit()

    return {
        "token": user.auth_token,
        "user": await serialize_user_profile(session, user),
    }


async def logout_user(session: AsyncSession, user: User) -> None:
    user.auth_token = None
    await session.commit()


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization required")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    user = await db.scalar(select(User).where(User.auth_token == token))
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user
