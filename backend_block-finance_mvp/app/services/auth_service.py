from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from asyncio import sleep
from datetime import datetime, timedelta
from typing import Any

import jwt
from fastapi import Depends, Header, HTTPException
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.services.consent_service import CONSENT_VERSION, create_user_consent, hash_metadata
from app.services.rate_limit_service import record_login_failure, record_login_success
from app.services.user_service import serialize_user_profile

PBKDF2_ITERATIONS = 120_000
MIN_PASSWORD_LENGTH = 8
MIN_PHONE_DIGITS = 10
MAX_PHONE_DIGITS = 15
FAILED_LOGIN_DELAY_SECONDS = 0.35
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))


def utcnow() -> datetime:
    return datetime.utcnow()


def get_jwt_secret() -> str:
    return os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY") or "block-finance-demo-jwt-secret"


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
        raise HTTPException(status_code=422, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters")

    has_letter = any(character.isalpha() for character in password)
    has_digit = any(character.isdigit() for character in password)

    if not has_letter or not has_digit:
        raise HTTPException(status_code=422, detail="Password must contain at least one letter and one number")

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


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(user: User) -> str:
    now = utcnow()
    expires_at = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user.id),
        "typ": "access",
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": secrets.token_urlsafe(16),
    }

    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Access token expired") from exc
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid access token") from exc

    if payload.get("typ") != "access":
        raise HTTPException(status_code=401, detail="Invalid access token")

    return payload


async def create_refresh_token(
    session: AsyncSession,
    user: User,
    client_ip: str | None = None,
    user_agent: str | None = None,
) -> str:
    raw_token = secrets.token_urlsafe(48)

    session.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            jti=secrets.token_urlsafe(24),
            expires_at=utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            ip_hash=hash_metadata(client_ip),
            user_agent_hash=hash_metadata(user_agent),
        )
    )

    return raw_token


async def build_auth_response(
    session: AsyncSession,
    user: User,
    client_ip: str | None = None,
    user_agent: str | None = None,
) -> dict[str, Any]:
    access_token = create_access_token(user)
    refresh_token = await create_refresh_token(session, user, client_ip, user_agent)

    return {
        "token": access_token,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": await serialize_user_profile(session, user),
    }


async def register_user(
    session: AsyncSession,
    name: str,
    phone: str,
    password: str,
    personal_data_consent: bool = False,
    consent_version: str = CONSENT_VERSION,
    client_ip: str | None = None,
    user_agent: str | None = None,
) -> dict[str, Any]:
    if not personal_data_consent:
        raise HTTPException(status_code=422, detail="Personal data consent is required for registration")

    cleaned_name = validate_name(name)
    normalized_phone = validate_phone(phone)
    validated_password = validate_password(password)
    existing_user = await session.scalar(select(User).where(User.phone == normalized_phone))

    if existing_user is not None:
        raise HTTPException(status_code=409, detail="User with this phone already exists")

    user = User(
        name=cleaned_name,
        phone=normalized_phone,
        password_hash=hash_password(validated_password),
        auth_token=None,
        level=1,
        xp=0,
        streak=0,
    )

    session.add(user)

    try:
        await session.flush()
        await create_user_consent(
            session,
            user_id=user.id,
            consent_version=consent_version,
            client_ip=client_ip,
            user_agent=user_agent,
        )
        response = await build_auth_response(session, user, client_ip, user_agent)
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(status_code=409, detail="User with this phone already exists") from exc

    return response


async def login_user(
    session: AsyncSession,
    phone: str,
    password: str,
    client_ip: str | None = None,
    user_agent: str | None = None,
) -> dict[str, Any]:
    normalized_phone = validate_phone(phone)
    validate_password(password)

    user = await session.scalar(select(User).where(User.phone == normalized_phone))

    if user is None or not verify_password(password, user.password_hash):
        if client_ip:
            record_login_failure(normalized_phone, client_ip)

        await sleep(FAILED_LOGIN_DELAY_SECONDS)
        raise HTTPException(status_code=401, detail="Invalid phone or password")

    if client_ip:
        record_login_success(normalized_phone, client_ip)

    response = await build_auth_response(session, user, client_ip, user_agent)
    await session.commit()

    return response


async def refresh_auth_tokens(
    session: AsyncSession,
    refresh_token: str,
    client_ip: str | None = None,
    user_agent: str | None = None,
) -> dict[str, Any]:
    stored_token = await session.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_token(refresh_token))
    )

    if stored_token is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if stored_token.revoked_at is not None:
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    if stored_token.expires_at <= utcnow():
        stored_token.revoked_at = utcnow()
        await session.commit()
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user = await session.scalar(select(User).where(User.id == stored_token.user_id))

    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    stored_token.revoked_at = utcnow()
    response = await build_auth_response(session, user, client_ip, user_agent)
    await session.commit()

    return response


async def logout_user(session: AsyncSession, user: User) -> None:
    await session.execute(
        update(RefreshToken)
        .where(
            RefreshToken.user_id == user.id,
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=utcnow())
    )

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

    payload = decode_access_token(token)
    user_id = payload.get("sub")

    try:
        parsed_user_id = int(user_id)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Invalid access token") from exc

    user = await db.scalar(select(User).where(User.id == parsed_user_id))

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return user
