import { create } from "zustand";

export type Language = "en" | "ru";

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

type DemoProductState = {
  paymentsToday: number;
  savingsGoalCurrent: number;
  savingsGoalTarget: number;
  referralInvites: number;
  referralTarget: number;
  hasSeenValueIntro: boolean;
  lastSavingsBonus: string | null;
};

const DEMO_PRODUCT_STORAGE_KEY = "block-finance-demo-product-state";
const LANGUAGE_STORAGE_KEY = "block-finance-language";
const LANGUAGE_SELECTED_STORAGE_KEY = "block-finance-language-selected";

function loadLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === "en" || raw === "ru") {
      return raw;
    }
    return "en";
  } catch {
    return "en";
  }
}

function loadHasSelectedLanguage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(LANGUAGE_SELECTED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function persistLanguage(language: Language) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.localStorage.setItem(LANGUAGE_SELECTED_STORAGE_KEY, "true");
}

function loadDemoProductState(): DemoProductState {
  if (typeof window === "undefined") {
    return {
      paymentsToday: 0,
      savingsGoalCurrent: 35,
      savingsGoalTarget: 100,
      referralInvites: 1,
      referralTarget: 3,
      hasSeenValueIntro: false,
      lastSavingsBonus: null,
    };
  }

  try {
    const raw = window.localStorage.getItem(DEMO_PRODUCT_STORAGE_KEY);

    if (!raw) {
      return {
        paymentsToday: 0,
        savingsGoalCurrent: 35,
        savingsGoalTarget: 100,
        referralInvites: 1,
        referralTarget: 3,
        hasSeenValueIntro: false,
        lastSavingsBonus: null,
      };
    }

    const parsed = JSON.parse(raw) as Partial<DemoProductState>;
    return {
      paymentsToday: parsed.paymentsToday ?? 0,
      savingsGoalCurrent: parsed.savingsGoalCurrent ?? 35,
      savingsGoalTarget: parsed.savingsGoalTarget ?? 100,
      referralInvites: parsed.referralInvites ?? 1,
      referralTarget: parsed.referralTarget ?? 3,
      hasSeenValueIntro: parsed.hasSeenValueIntro ?? false,
      lastSavingsBonus: parsed.lastSavingsBonus ?? null,
    };
  } catch {
    return {
      paymentsToday: 0,
      savingsGoalCurrent: 35,
      savingsGoalTarget: 100,
      referralInvites: 1,
      referralTarget: 3,
      hasSeenValueIntro: false,
      lastSavingsBonus: null,
    };
  }
}

function persistDemoProductState(state: DemoProductState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEMO_PRODUCT_STORAGE_KEY, JSON.stringify(state));
}

type AppState = {
  user: User;
  reward: Reward;
  gameSessionId: number | null;
  language: Language;
  hasSelectedLanguage: boolean;
  demoProduct: DemoProductState;
  setUser: (user: User) => void;
  setReward: (reward: Reward) => void;
  setGameSessionId: (sessionId: number | null) => void;
  setLanguage: (language: Language) => void;
  addXP: (value: number) => void;
  recordPayment: () => number;
  addToSavingsGoal: (amount: number, bonusMessage?: string | null) => void;
  recordReferralInvite: () => number;
  setHasSeenValueIntro: (value: boolean) => void;
};

const initialDemoProductState = loadDemoProductState();
const initialLanguage = loadLanguage();
const initialHasSelectedLanguage = loadHasSelectedLanguage();

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
  language: initialLanguage,
  hasSelectedLanguage: initialHasSelectedLanguage,
  demoProduct: initialDemoProductState,
  setUser: (user) => set({ user }),
  setReward: (reward) => set({ reward }),
  setGameSessionId: (gameSessionId) => set({ gameSessionId }),
  setLanguage: (language) => {
    persistLanguage(language);
    set({ language, hasSelectedLanguage: true });
  },
  addXP: (value) =>
    set((state) => ({
      user: {
        ...state.user,
        xp: state.user.xp + value,
      },
    })),
  recordPayment: () => {
    let nextCount = 0;

    set((state) => {
      nextCount = state.demoProduct.paymentsToday + 1;
      const demoProduct = {
        ...state.demoProduct,
        paymentsToday: nextCount,
      };
      persistDemoProductState(demoProduct);
      return { demoProduct };
    });

    return nextCount;
  },
  addToSavingsGoal: (amount, bonusMessage = null) =>
    set((state) => {
      const demoProduct = {
        ...state.demoProduct,
        savingsGoalCurrent: Math.min(
          state.demoProduct.savingsGoalTarget,
          state.demoProduct.savingsGoalCurrent + amount
        ),
        lastSavingsBonus: bonusMessage,
      };
      persistDemoProductState(demoProduct);
      return { demoProduct };
    }),
  recordReferralInvite: () => {
    let nextCount = 0;

    set((state) => {
      nextCount = Math.min(
        state.demoProduct.referralTarget,
        state.demoProduct.referralInvites + 1
      );
      const demoProduct = {
        ...state.demoProduct,
        referralInvites: nextCount,
      };
      persistDemoProductState(demoProduct);
      return { demoProduct };
    });

    return nextCount;
  },
  setHasSeenValueIntro: (value) =>
    set((state) => {
      const demoProduct = {
        ...state.demoProduct,
        hasSeenValueIntro: value,
      };
      persistDemoProductState(demoProduct);
      return { demoProduct };
    }),
}));
