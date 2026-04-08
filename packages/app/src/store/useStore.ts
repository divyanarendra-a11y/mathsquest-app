import { create } from 'zustand';
import type { WorldData } from '../lib/api';

interface AppStore {
  token: string | null;
  userId: string | null;
  userName: string | null;
  xp: number;
  level: number;
  streakDays: number;
  avatarId: string;
  hints: number;
  worlds: WorldData[];

  setAuth: (token: string, userId: string, userName: string) => void;
  logout: () => void;
  setProgress: (data: { user: { xp: number; level: number; streakDays: number; avatarId: string }; worlds: WorldData[]; hints: number }) => void;
  addXp: (amount: number) => void;
}

export const useStore = create<AppStore>((set) => ({
  token: null,
  userId: null,
  userName: null,
  xp: 0,
  level: 1,
  streakDays: 0,
  avatarId: 'avatar_1',
  hints: 0,
  worlds: [],

  setAuth: (token, userId, userName) => set({ token, userId, userName }),
  logout: () => set({ token: null, userId: null, userName: null, worlds: [], xp: 0, level: 1 }),
  setProgress: (data) => set({
    xp: data.user.xp,
    level: data.user.level,
    streakDays: data.user.streakDays,
    avatarId: data.user.avatarId,
    hints: data.hints,
    worlds: data.worlds,
  }),
  addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
}));
