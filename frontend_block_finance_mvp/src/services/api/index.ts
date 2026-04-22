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

export async function demoLogin() {
  return Promise.resolve({ ok: true });
}

export async function getProfile() {
  return Promise.resolve({
    name: "Alex",
    level: 3,
    xp: 240,
    xpToNext: 300,
    streak: 4,
  });
}

export async function makeDemoPayment() {
  return apiFetch<DemoPaymentResponse>("/transactions/demo", {
    method: "POST",
    body: JSON.stringify({
      user_id: 1,
      amount: 5,
      category: "coffee",
    }),
  });
}

export async function startGameSession() {
  return Promise.resolve({ session_id: 1 });
}

export async function finishGameSession(score: number) {
  return Promise.resolve({ success: true, score });
}