from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.transaction import TransactionCreate
from app.services.transaction_service import create_transaction

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("/demo")
async def demo_transaction(payload: TransactionCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await create_transaction(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
