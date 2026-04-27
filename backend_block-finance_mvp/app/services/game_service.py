from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game_session import GameSession
from app.models.user import User


def ensure_game_session_schema(connection):
    dialect = connection.dialect.name

    if dialect == "sqlite":
        columns = {
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(game_sessions)").fetchall()
        }

        if "duration_seconds" not in columns:
            connection.exec_driver_sql(
                "ALTER TABLE game_sessions ADD COLUMN duration_seconds INTEGER DEFAULT 0"
            )

        if "finished_at" not in columns:
            connection.exec_driver_sql(
                "ALTER TABLE game_sessions ADD COLUMN finished_at DATETIME"
            )

        return

    if dialect == "postgresql":
        connection.execute(
            text("ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0")
        )
        connection.execute(
            text("ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP")
        )


async def start_game(session: AsyncSession, user_id: int):
    gs = GameSession(user_id=user_id)
    session.add(gs)
    await session.commit()
    await session.refresh(gs)

    return {"session_id": gs.id}


async def finish_game(
    session: AsyncSession,
    session_id: int,
    score: int,
    moves_used: int = 0,
    extra_moves_used: int = 0,
):
    gs = await session.scalar(select(GameSession).where(GameSession.id == session_id))
    if gs is None:
        raise HTTPException(status_code=404, detail="Game session not found")

    user = await session.scalar(select(User).where(User.id == gs.user_id))
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    finished_at = datetime.utcnow()
    duration_seconds = 0

    if gs.created_at is not None:
        duration_seconds = max(0, int((finished_at - gs.created_at).total_seconds()))

    xp_gain = score + extra_moves_used * 10
    gs.moves_used = moves_used
    gs.score = score
    gs.extra_moves_used = extra_moves_used
    gs.finished_at = finished_at
    gs.duration_seconds = duration_seconds
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
        .where(GameSession.score > 0)
        .order_by(
            GameSession.score.desc(),
            GameSession.duration_seconds.asc(),
            GameSession.finished_at.asc().nullslast(),
            GameSession.created_at.asc(),
        )
        .limit(safe_limit)
    )

    entries = []

    for rank, (game_session, user_name) in enumerate(result.all(), start=1):
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
