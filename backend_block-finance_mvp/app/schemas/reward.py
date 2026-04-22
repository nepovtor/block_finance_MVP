from pydantic import BaseModel

class RewardCreate(BaseModel):
    user_id: int
    type: str
    value: int
    source: str
