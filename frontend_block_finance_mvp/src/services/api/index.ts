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
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
};

export type ConsentStatusResponse = {
  accepted: boolean;
  consent_type: string;
  consent_version: string;
  accepted_at: string | null;
  revoked_at: string | null;
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

export async function register(
  name: string,
  phone: string,
  password: string,
  personalDataConsent: boolean
) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      phone,
      password,
      personal_data_consent: personalDataConsent,
      consent_version: "2026-04-privacy-v1",
    }),
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


export async function getConsentStatus() {
  return apiFetch<ConsentStatusResponse>("/privacy/consent");
}

export async function revokePersonalDataConsent() {
  return apiFetch<ConsentStatusResponse>("/privacy/consent/revoke", {
    method: "POST",
  });
}

export async function deleteAccount() {
  return apiFetch<null>("/privacy/account", {
    method: "DELETE",
  });
}
