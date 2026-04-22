from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.game_service import start_game, finish_game

router = APIRouter(prefix="/game")

@router.post("/start")
async def start(user_id: int, db: AsyncSession = Depends(get_db)):
    return await start_game(db, user_id)

@router.post("/finish")
async def finish(session_id: int, score: int, db: AsyncSession = Depends(get_db)):
    return await finish_game(db, session_id, score)
