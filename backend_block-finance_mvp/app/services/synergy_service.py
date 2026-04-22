from app.schemas.reward import RewardCreate

def process_synergy(user_id: int, category: str):
    if category == "coffee":
        return RewardCreate(user_id=user_id, type="extra_move", value=1, source="coffee_payment")
    return None
