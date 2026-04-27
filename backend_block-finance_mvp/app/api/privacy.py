from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.consent_service import (
    CONSENT_VERSION,
    PERSONAL_DATA_CONSENT_TYPE,
    delete_user_account,
    get_personal_data_consent_status,
    revoke_personal_data_consent,
)

router = APIRouter(prefix="/privacy", tags=["privacy"])


@router.get("/policy")
async def privacy_policy_meta():
    return {
        "title": "Privacy Policy",
        "consent_type": PERSONAL_DATA_CONSENT_TYPE,
        "consent_version": CONSENT_VERSION,
        "personal_data_used": ["phone_number"],
        "purpose": [
            "account access",
            "demo profile operation",
            "game progress and leaderboard records",
        ],
    }


@router.get("/consent")
async def consent_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_personal_data_consent_status(db, current_user)


@router.post("/consent/revoke")
async def revoke_consent(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await revoke_personal_data_consent(db, current_user)


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await delete_user_account(db, current_user)
