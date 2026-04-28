from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game_session import GameSession
from app.models.user import User

MAX_SCORE = 100_000
MAX_MOVES_USED = 500
MAX_EXTRA_MOVES_USED = 20
MAX_SCORE_PER_MOVE = 1_000
MAX_EXTRA_MOVE_SCORE_BONUS = 2_500
BASE_SCORE_TOLERANCE = 5_000


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def validate_game_result(score: int, moves_used: int, extra_moves_used: int) -> None:
    if score < 0:
        raise HTTPException(status_code=422, detail="Score cannot be negative")

    if moves_used < 0:
        raise HTTPException(status_code=422, detail="Moves cannot be negative")

    if extra_moves_used < 0:
        raise HTTPException(status_code=422, detail="Extra moves cannot be negative")

    if score > MAX_SCORE:
        raise HTTPException(status_code=422, detail="Score is outside allowed range")

    if moves_used > MAX_MOVES_USED:
        raise HTTPException(status_code=422, detail="Moves count is outside allowed range")

    if extra_moves_used > MAX_EXTRA_MOVES_USED:
        raise HTTPException(status_code=422, detail="Extra moves count is outside allowed range")

    if score > 0 and moves_used == 0:
        raise HTTPException(status_code=422, detail="Positive score requires at least one move")

    allowed_score = (
        moves_used * MAX_SCORE_PER_MOVE
        + extra_moves_used * MAX_EXTRA_MOVE_SCORE_BONUS
        + BASE_SCORE_TOLERANCE
    )

    if score > allowed_score:
        raise HTTPException(status_code=422, detail="Suspicious score rejected")


async def start_game(session: AsyncSession, user_id: int):
    game_session = GameSession(user_id=user_id)
    session.add(game_session)
    await session.commit()
    await session.refresh(game_session)

    return {"session_id": game_session.id}


async def finish_game(
    session: AsyncSession,
    user_id: int,
    session_id: int,
    score: int,
    moves_used: int = 0,
    extra_moves_used: int = 0,
):
    validate_game_result(score, moves_used, extra_moves_used)

    game_session = await session.scalar(
        select(GameSession).where(
            GameSession.id == session_id,
            GameSession.user_id == user_id,
        )
    )

    if game_session is None:
        raise HTTPException(status_code=404, detail="Game session not found")

    if game_session.finished_at is not None:
        raise HTTPException(status_code=409, detail="Game session already finished")

    user = await session.scalar(select(User).where(User.id == user_id))

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    finished_at = utcnow()
    duration_seconds = 0

    if game_session.created_at is not None:
        duration_seconds = max(0, int((finished_at - game_session.created_at).total_seconds()))

    xp_gain = score + extra_moves_used * 10

    game_session.moves_used = moves_used
    game_session.score = score
    game_session.extra_moves_used = extra_moves_used
    game_session.finished_at = finished_at
    game_session.duration_seconds = duration_seconds
    user.xp += xp_gain

    await session.commit()

    return {
        "xp_gained": xp_gain,
        "extra_moves_used": extra_moves_used,
        "duration_seconds": duration_seconds,
    }


async def get_leaderboard(session: AsyncSession, limit: int = 10):
    safe_limit = max(1, min(limit, 25))

    result = await session.execute(
        select(GameSession, User.name)
        .join(User, User.id == GameSession.user_id)
        .where(
            GameSession.score > 0,
            GameSession.finished_at.is_not(None),
        )
        .order_by(
            GameSession.score.desc(),
            GameSession.duration_seconds.asc(),
            GameSession.finished_at.asc(),
            GameSession.created_at.asc(),
        )
        .limit(500)
    )

    best_by_user: dict[int, tuple[GameSession, str]] = {}

    for game_session, user_name in result.all():
        if game_session.user_id not in best_by_user:
            best_by_user[game_session.user_id] = (game_session, user_name)

        if len(best_by_user) >= safe_limit:
            break

    entries = []

    for rank, (game_session, user_name) in enumerate(best_by_user.values(), start=1):
        entries.append(
            {
                "rank": rank,
                "name": user_name,
                "score": game_session.score,
                "duration_seconds": game_session.duration_seconds,
                "moves_used": game_session.moves_used,
                "extra_moves_used": game_session.extra_moves_used,
                "finished_at": game_session.finished_at.isoformat()
                if game_session.finished_at
                else None,
            }
        )

    return {"leaders": entries}
