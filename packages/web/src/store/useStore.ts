import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProgress, WorldData } from '../lib/api';

interface AuthState {
  token: string | null;
  userId: string | null;
  userName: string | null;
}

interface UserState {
  xp: number;
  level: number;
  streakDays: number;
  avatarId: string;
  hints: number;
  worlds: WorldData[];
}

interface AppStore extends AuthState, UserState {
  // Auth actions
  setAuth: (token: string, userId: string, userName: string) => void;
  logout: () => void;

  // User data actions
  setProgress: (progress: UserProgress) => void;
  addXp: (amount: number) => void;
  updateWorldProgress: (worldId: string, updates: Partial<WorldData>) => void;
  decrementHints: () => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      // Auth
      token: null,
      userId: null,
      userName: null,

      // User state
      xp: 0,
      level: 1,
      streakDays: 0,
      avatarId: 'avatar_1',
      hints: 0,
      worlds: [],

      setAuth: (token, userId, userName) => {
        localStorage.setItem('mq_token', token);
        set({ token, userId, userName });
      },

      logout: () => {
        localStorage.removeItem('mq_token');
        set({ token: null, userId: null, userName: null, worlds: [], xp: 0, level: 1 });
      },

      setProgress: (progress) =>
        set({
          xp: progress.user.xp,
          level: progress.user.level,
          streakDays: progress.user.streakDays,
          avatarId: progress.user.avatarId,
          hints: progress.hints,
          worlds: progress.worlds,
        }),

      addXp: (amount) =>
        set((state) => ({ xp: state.xp + amount })),

      updateWorldProgress: (worldId, updates) =>
        set((state) => ({
          worlds: state.worlds.map((w) =>
            w.id === worldId ? { ...w, ...updates } : w,
          ),
        })),

      decrementHints: () =>
        set((state) => ({ hints: Math.max(0, state.hints - 1) })),
    }),
    {
      name: 'mathsquest-store',
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        userName: state.userName,
        avatarId: state.avatarId,
      }),
    },
  ),
);
