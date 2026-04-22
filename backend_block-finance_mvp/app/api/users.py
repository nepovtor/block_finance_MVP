from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.user_service import get_user_by_id, serialize_user_profile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}")
async def get_user_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return serialize_user_profile(user)
