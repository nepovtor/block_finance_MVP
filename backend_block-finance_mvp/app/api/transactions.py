from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.transaction import TransactionCreate
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.transaction_service import create_transaction

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/demo")
async def demo_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_transaction(db, current_user.id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
