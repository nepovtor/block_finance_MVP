from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import AuthLoginPayload, AuthRegisterPayload
from app.services.auth_service import (
    get_current_user,
    login_user,
    logout_user,
    register_user,
)
from app.models.user import User
from app.services.user_service import serialize_user_profile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(payload: AuthRegisterPayload, db: AsyncSession = Depends(get_db)):
    return await register_user(db, payload.name, payload.phone, payload.password)


@router.post("/login")
async def login(payload: AuthLoginPayload, db: AsyncSession = Depends(get_db)):
    return await login_user(db, payload.phone, payload.password)


@router.get("/me")
async def me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await serialize_user_profile(db, current_user)


@router.post("/logout", status_code=204)
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await logout_user(db, current_user)
