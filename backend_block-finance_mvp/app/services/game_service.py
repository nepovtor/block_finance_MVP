from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.game_session import GameSession
from app.models.reward import Reward
from app.models.user import User

async def start_game(session: AsyncSession, user_id: int):
    gs = GameSession(user_id=user_id)
    session.add(gs)
    await session.commit()
    return {"session_id": gs.id}

async def finish_game(session: AsyncSession, session_id: int, score: int):
    gs = await session.scalar(select(GameSession).where(GameSession.id == session_id))
    user = await session.scalar(select(User).where(User.id == gs.user_id))

    rewards = await session.execute(
        select(Reward).where(Reward.user_id == gs.user_id, Reward.type == "extra_move", Reward.is_used == False)
    )
    extra_moves = rewards.scalars().all()

    for r in extra_moves:
        r.is_used = True

    xp_gain = score + len(extra_moves) * 10
    user.xp += xp_gain

    await session.commit()

    return {"xp_gained": xp_gain, "extra_moves_used": len(extra_moves)}
