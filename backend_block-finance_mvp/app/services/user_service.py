from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.reward_service import get_active_reward

DEMO_USER_ID = 1
DEFAULT_XP_TO_NEXT = 300


async def sync_user_id_sequence(session: AsyncSession) -> None:
    # Postgres does not advance the sequence when a row is inserted with an explicit id.
    if session.bind is None or session.bind.dialect.name != "postgresql":
        return

    await session.execute(
        text(
            """
            SELECT setval(
                pg_get_serial_sequence('users', 'id'),
                COALESCE((SELECT MAX(id) FROM users), 1),
                true
            )
            """
        )
    )


async def ensure_demo_user(session: AsyncSession) -> User:
    user = await session.scalar(select(User).where(User.id == DEMO_USER_ID))
    if user is not None:
        await sync_user_id_sequence(session)
        return user

    user = User(
        id=DEMO_USER_ID,
        name="Alex",
        phone="+10000000000",
        level=3,
        xp=240,
        streak=4,
    )
    session.add(user)
    await session.commit()
    await sync_user_id_sequence(session)
    await session.commit()
    return user


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    return await session.scalar(select(User).where(User.id == user_id))


async def serialize_user_profile(
    session: AsyncSession, user: User
) -> dict[str, int | str | dict[str, int | str] | None]:
    active_reward = await get_active_reward(session, user.id)

    return {
        "id": user.id,
        "name": user.name,
        "level": user.level,
        "xp": user.xp,
        "xpToNext": DEFAULT_XP_TO_NEXT,
        "streak": user.streak,
        "activeReward": (
            {
                "type": active_reward.type,
                "value": active_reward.value,
                "source": active_reward.source,
            }
            if active_reward is not None
            else None
        ),
    }
