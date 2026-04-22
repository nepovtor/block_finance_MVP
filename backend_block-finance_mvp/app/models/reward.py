from sqlalchemy import Integer, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.base import Base

class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String)
    value: Mapped[int] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
