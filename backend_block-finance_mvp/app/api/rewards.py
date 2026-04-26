from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.reward_service import consume_reward

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.post("/use")
async def use_reward(
    reward_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    reward = await consume_reward(db, current_user.id, reward_type)
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
