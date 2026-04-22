from sqlalchemy import Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.base import Base

class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    moves_used: Mapped[int] = mapped_column(Integer, default=0)
    extra_moves_used: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
