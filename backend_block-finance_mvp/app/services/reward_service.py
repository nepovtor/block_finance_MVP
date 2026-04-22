from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reward import Reward


async def consume_reward(
    session: AsyncSession, user_id: int, reward_type: str
) -> Reward | None:
    reward = await session.scalar(
        select(Reward)
        .where(
            Reward.user_id == user_id,
            Reward.type == reward_type,
            Reward.is_used == False,
        )
        .order_by(Reward.created_at.asc())
    )
    if reward is None:
        return None

    reward.is_used = True
    await session.commit()
    return reward
