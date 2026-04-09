import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('mq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('mq_token');
    }
    return Promise.reject(err);
  },
);

export interface WorldData {
  id: string;
  slug: string;
  name: string;
  description: string;
  curriculumUnit: string;
  orderIndex: number;
  color: string;
  iconEmoji: string;
  unlocked: boolean;
  starsEarned: number;
  percentComplete: number;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: { id: string; name: string } }>('/auth/login', { email, password }),
};

export const usersApi = {
  getProgress: (userId: string) =>
    api.get<{
      user: { id: string; name: string; xp: number; level: number; streakDays: number; avatarId: string };
      worlds: WorldData[];
      hints: number;
    }>(`/users/${userId}/progress`),
};

export const puzzlesApi = {
  attempt: (puzzleId: string, data: { score: number; maxScore: number; timeTaken: number; hintsUsed?: number }) =>
    api.post<{ xpGained: number; starsEarned: number; newXp: number; newLevel: number }>(
      `/puzzles/${puzzleId}/attempt`,
      data,
    ),
};
