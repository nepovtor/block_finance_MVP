from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reward import Reward


async def get_active_reward(
    session: AsyncSession, user_id: int, reward_type: Optional[str] = None
) -> Optional[Reward]:
    query = (
        select(Reward)
        .where(
            Reward.user_id == user_id,
            Reward.is_used == False,
        )
        .order_by(Reward.created_at.desc(), Reward.id.desc())
    )
    if reward_type is not None:
        query = query.where(Reward.type == reward_type)

    return await session.scalar(query)


async def consume_reward(
    session: AsyncSession, user_id: int, reward_type: str
) -> Optional[Reward]:
    reward = await get_active_reward(session, user_id, reward_type)
    if reward is None:
        return None

    reward.is_used = True
    await session.commit()
    return reward
