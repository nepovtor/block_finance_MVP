from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.user_service import serialize_user_profile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await serialize_user_profile(db, current_user)
