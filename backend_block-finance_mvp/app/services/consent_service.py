from __future__ import annotations

from datetime import datetime
import hashlib
import os

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game_session import GameSession
from app.models.refresh_token import RefreshToken
from app.models.reward import Reward
from app.models.transaction import Transaction
from app.models.user import User
from app.models.user_consent import UserConsent

CONSENT_VERSION = "2026-04-privacy-v1"
PERSONAL_DATA_CONSENT_TYPE = "personal_data_phone"


def hash_metadata(value: str | None) -> str | None:
    if not value:
        return None

    salt = (
        os.getenv("CONSENT_HASH_SECRET")
        or os.getenv("SECRET_KEY")
        or "block-finance-demo-consent-salt"
    )

    return hashlib.sha256(f"{salt}:{value}".encode("utf-8")).hexdigest()


async def create_user_consent(
    session: AsyncSession,
    user_id: int,
    consent_type: str = PERSONAL_DATA_CONSENT_TYPE,
    consent_version: str = CONSENT_VERSION,
    client_ip: str | None = None,
    user_agent: str | None = None,
) -> UserConsent:
    consent = UserConsent(
        user_id=user_id,
        consent_type=consent_type,
        consent_version=consent_version or CONSENT_VERSION,
        ip_hash=hash_metadata(client_ip),
        user_agent_hash=hash_metadata(user_agent),
    )
    session.add(consent)
    return consent


async def get_personal_data_consent_status(
    session: AsyncSession,
    user: User,
) -> dict:
    consent = await session.scalar(
        select(UserConsent)
        .where(
            UserConsent.user_id == user.id,
            UserConsent.consent_type == PERSONAL_DATA_CONSENT_TYPE,
        )
        .order_by(UserConsent.accepted_at.desc(), UserConsent.id.desc())
    )

    if consent is None:
        return {
            "accepted": False,
            "consent_type": PERSONAL_DATA_CONSENT_TYPE,
            "consent_version": CONSENT_VERSION,
            "accepted_at": None,
            "revoked_at": None,
        }

    return {
        "accepted": consent.revoked_at is None,
        "consent_type": consent.consent_type,
        "consent_version": consent.consent_version,
        "accepted_at": consent.accepted_at.isoformat() if consent.accepted_at else None,
        "revoked_at": consent.revoked_at.isoformat() if consent.revoked_at else None,
    }


async def revoke_personal_data_consent(
    session: AsyncSession,
    user: User,
) -> dict:
    consent = await session.scalar(
        select(UserConsent)
        .where(
            UserConsent.user_id == user.id,
            UserConsent.consent_type == PERSONAL_DATA_CONSENT_TYPE,
            UserConsent.revoked_at.is_(None),
        )
        .order_by(UserConsent.accepted_at.desc(), UserConsent.id.desc())
    )

    if consent is None:
        return await get_personal_data_consent_status(session, user)

    consent.revoked_at = datetime.utcnow()
    await session.commit()

    return await get_personal_data_consent_status(session, user)


async def delete_user_account(
    session: AsyncSession,
    user: User,
) -> None:
    user_id = user.id

    await session.execute(delete(UserConsent).where(UserConsent.user_id == user_id))
    await session.execute(delete(RefreshToken).where(RefreshToken.user_id == user_id))
    await session.execute(delete(GameSession).where(GameSession.user_id == user_id))
    await session.execute(delete(Reward).where(Reward.user_id == user_id))
    await session.execute(delete(Transaction).where(Transaction.user_id == user_id))
    await session.execute(delete(User).where(User.id == user_id))

    await session.commit()
