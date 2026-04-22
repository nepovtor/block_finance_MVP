from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.models.reward import Reward
from app.services.synergy_service import process_synergy
from app.services.user_service import get_user_by_id

async def create_transaction(session: AsyncSession, data):
    user = await get_user_by_id(session, data.user_id)
    if user is None:
        raise ValueError(f"User {data.user_id} not found")

    tx = Transaction(user_id=data.user_id, amount=data.amount, category=data.category)
    session.add(tx)
    await session.flush()

    reward_data = process_synergy(data.user_id, data.category)
    reward_payload = None

    if reward_data:
        reward = Reward(**reward_data.dict())
        session.add(reward)
        reward_payload = {"type": reward.type, "value": reward.value}

    await session.commit()

    return {"transaction_created": True, "reward_granted": reward_payload is not None, "reward": reward_payload}
