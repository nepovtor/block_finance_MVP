from pydantic import BaseModel

class TransactionCreate(BaseModel):
    user_id: int
    amount: float
    category: str
