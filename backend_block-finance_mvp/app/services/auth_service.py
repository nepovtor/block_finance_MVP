from __future__ import annotations

import hashlib
import hmac
import secrets
from asyncio import sleep
from typing import Any

from fastapi import Depends, Header, HTTPException
from sqlalchemy import inspect, select, text
from sqlalchemy.engine import Connection
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.services.user_service import serialize_user_profile

PBKDF2_ITERATIONS = 120_000
TOKEN_PREFIX = "bfmvp_"
MIN_PASSWORD_LENGTH = 8
MIN_PHONE_DIGITS = 10
MAX_PHONE_DIGITS = 15
FAILED_LOGIN_DELAY_SECONDS = 0.35


def normalize_phone(phone: str) -> str:
    digits = "".join(character for character in phone if character.isdigit())
    return f"+{digits}" if digits else ""


def validate_name(name: str) -> str:
    cleaned_name = " ".join(name.split()).strip()
    if len(cleaned_name) < 2 or len(cleaned_name) > 80:
        raise HTTPException(status_code=422, detail="Name must be between 2 and 80 characters")
    return cleaned_name


def validate_phone(phone: str) -> str:
    normalized_phone = normalize_phone(phone)
    digit_count = len(normalized_phone.removeprefix("+"))

    if digit_count < MIN_PHONE_DIGITS or digit_count > MAX_PHONE_DIGITS:
        raise HTTPException(status_code=422, detail="Enter a valid phone number")

    return normalized_phone


def validate_password(password: str) -> str:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters",
        )

    has_letter = any(character.isalpha() for character in password)
    has_digit = any(character.isdigit() for character in password)
    if not has_letter or not has_digit:
        raise HTTPException(
            status_code=422,
            detail="Password must contain at least one letter and one number",
        )

    return password


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


def hash_auth_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


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
    cleaned_name = validate_name(name)
    normalized_phone = validate_phone(phone)
    validated_password = validate_password(password)
    existing_user = await session.scalar(select(User).where(User.phone == normalized_phone))
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="User with this phone already exists")

    raw_token = issue_auth_token()
    user = User(
        name=cleaned_name,
        phone=normalized_phone,
        password_hash=hash_password(validated_password),
        auth_token=hash_auth_token(raw_token),
        level=1,
        xp=0,
        streak=0,
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=409,
            detail="User with this phone already exists",
        ) from exc
    await session.refresh(user)

    return {
        "token": raw_token,
        "user": await serialize_user_profile(session, user),
    }


async def login_user(
    session: AsyncSession,
    phone: str,
    password: str,
) -> dict[str, Any]:
    normalized_phone = validate_phone(phone)
    validate_password(password)
    user = await session.scalar(select(User).where(User.phone == normalized_phone))
    if user is None or not verify_password(password, user.password_hash):
        await sleep(FAILED_LOGIN_DELAY_SECONDS)
        raise HTTPException(status_code=401, detail="Invalid phone or password")

    raw_token = issue_auth_token()
    user.auth_token = hash_auth_token(raw_token)
    await session.commit()

    return {
        "token": raw_token,
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

    user = await db.scalar(select(User).where(User.auth_token == hash_auth_token(token)))
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user
