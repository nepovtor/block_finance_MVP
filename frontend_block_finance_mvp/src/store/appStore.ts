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
  setReward: (reward: Reward) => void;
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
  setReward: (reward) => set({ reward }),
  addXP: (value) =>
    set((state) => ({
      user: {
        ...state.user,
        xp: state.user.xp + value,
      },
    })),
}));