from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.game_service import finish_game, get_leaderboard, start_game

router = APIRouter(prefix="/game", tags=["game"])


@router.post("/start")
async def start(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await start_game(db, current_user.id)


@router.post("/finish")
async def finish(
    session_id: int,
    score: int,
    moves_used: int = 0,
    extra_moves_used: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await finish_game(
        db,
        current_user.id,
        session_id,
        score,
        moves_used,
        extra_moves_used,
    )


@router.get("/leaderboard")
async def leaderboard(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    return await get_leaderboard(db, limit)
