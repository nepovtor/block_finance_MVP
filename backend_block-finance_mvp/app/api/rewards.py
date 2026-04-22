from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.reward_service import consume_reward

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.post("/use")
async def use_reward(
    user_id: int, reward_type: str, db: AsyncSession = Depends(get_db)
):
    reward = await consume_reward(db, user_id, reward_type)
    if reward is None:
        raise HTTPException(status_code=404, detail="Reward not found")

    return {
        "reward_used": True,
        "reward": {
            "id": reward.id,
            "type": reward.type,
            "value": reward.value,
            "source": reward.source,
        },
    }
