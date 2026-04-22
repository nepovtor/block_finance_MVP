from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.transaction import TransactionCreate
from app.services.transaction_service import create_transaction

router = APIRouter(prefix="/transactions")

@router.post("/demo")
async def demo_transaction(payload: TransactionCreate, db: AsyncSession = Depends(get_db)):
    return await create_transaction(db, payload)
