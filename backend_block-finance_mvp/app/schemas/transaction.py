from pydantic import BaseModel

class TransactionCreate(BaseModel):
    amount: float
    category: str
