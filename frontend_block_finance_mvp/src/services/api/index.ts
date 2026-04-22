import { apiFetch } from "./client";

export const DEMO_USER_ID = 1;

export type DemoPaymentResponse = {
  transaction_created: boolean;
  reward_granted: boolean;
  reward: {
    type: string;
    value: number;
    source?: string;
  } | null;
};

export type UserProfile = {
  id: number;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  activeReward: {
    type: string;
    value: number;
    source?: string;
  } | null;
};

export type GameSessionResponse = {
  session_id: number;
};

export type FinishGameResponse = {
  xp_gained: number;
  extra_moves_used: number;
};

export type RewardUseResponse = {
  reward_used: boolean;
  reward: {
    id: number;
    type: string;
    value: number;
    source: string;
  };
};

export async function makeDemoPayment() {
  return apiFetch<DemoPaymentResponse>("/transactions/demo", {
    method: "POST",
    body: JSON.stringify({
      user_id: DEMO_USER_ID,
      amount: 5,
      category: "coffee",
    }),
  });
}

export async function getProfile() {
  return apiFetch<UserProfile>(`/users/${DEMO_USER_ID}`);
}

export async function startGameSession() {
  return apiFetch<GameSessionResponse>(`/game/start?user_id=${DEMO_USER_ID}`, {
    method: "POST",
  });
}

export async function useReward(rewardType: string) {
  return apiFetch<RewardUseResponse>(
    `/rewards/use?user_id=${DEMO_USER_ID}&reward_type=${rewardType}`,
    {
      method: "POST",
    }
  );
}

export async function finishGameSession(
  sessionId: number,
  score: number,
  movesUsed: number,
  extraMovesUsed: number
) {
  return apiFetch<FinishGameResponse>(
    `/game/finish?session_id=${sessionId}&score=${score}&moves_used=${movesUsed}&extra_moves_used=${extraMovesUsed}`,
    {
      method: "POST",
    }
  );
}
