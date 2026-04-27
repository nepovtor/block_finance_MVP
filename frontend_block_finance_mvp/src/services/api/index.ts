import { apiFetch } from "./client";

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

export type AuthResponse = {
  token: string;
  user: UserProfile;
};

export type GameSessionResponse = {
  session_id: number;
};

export type FinishGameResponse = {
  xp_gained: number;
  extra_moves_used: number;
};

export type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  duration_seconds: number;
  moves_used: number;
  extra_moves_used: number;
  finished_at: string | null;
};

export type LeaderboardResponse = {
  leaders: LeaderboardEntry[];
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
      amount: 5,
      category: "coffee",
    }),
  });
}

export async function getProfile() {
  return apiFetch<UserProfile>("/auth/me");
}

export async function login(phone: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

export async function register(name: string, phone: string, password: string) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, phone, password }),
  });
}

export async function logout() {
  return apiFetch<null>("/auth/logout", {
    method: "POST",
  });
}

export async function startGameSession() {
  return apiFetch<GameSessionResponse>("/game/start", {
    method: "POST",
  });
}

export async function useReward(rewardType: string) {
  return apiFetch<RewardUseResponse>(`/rewards/use?reward_type=${rewardType}`, {
    method: "POST",
  });
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


export async function getLeaderboard(limit = 10) {
  return apiFetch<LeaderboardResponse>(`/game/leaderboard?limit=${limit}`);
}
