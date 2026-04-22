from sqlalchemy import Integer, String, ForeignKey, DateTime, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    amount: Mapped[float] = mapped_column(Numeric)
    category: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    source: Mapped[str] = mapped_column(String, default="demo")
