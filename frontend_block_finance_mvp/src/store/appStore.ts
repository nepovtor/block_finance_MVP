import { create } from "zustand";

type Reward = {
  type: string;
  value: number;
  source?: string;
} | null;

type User = {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
};

type AppState = {
  user: User;
  reward: Reward;
  gameSessionId: number | null;
  setUser: (user: User) => void;
  setReward: (reward: Reward) => void;
  setGameSessionId: (sessionId: number | null) => void;
  addXP: (value: number) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: {
    name: "Alex",
    level: 3,
    xp: 240,
    xpToNext: 300,
    streak: 4,
  },
  reward: null,
  gameSessionId: null,
  setUser: (user) => set({ user }),
  setReward: (reward) => set({ reward }),
  setGameSessionId: (gameSessionId) => set({ gameSessionId }),
  addXP: (value) =>
    set((state) => ({
      user: {
        ...state.user,
        xp: state.user.xp + value,
      },
    })),
}));
