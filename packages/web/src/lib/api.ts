import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mq_token');
      window.location.href = '/login';
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
  puzzlesAttempted: number;
}

export interface UserProgress {
  user: {
    id: string;
    name: string;
    xp: number;
    level: number;
    streakDays: number;
    avatarId: string;
  };
  worlds: WorldData[];
  hints: number;
}

export interface PuzzleAttemptResult {
  xpGained: number;
  breakdown: Record<string, number>;
  newXp: number;
  newLevel: number;
  starsEarned: number;
  worldProgress: { percentComplete: number; starsEarned: number; worldUnlocked: boolean };
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: { id: string; name: string } }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<{ token: string; user: { id: string; name: string } }>('/auth/register', { name, email, password }),
};

export const usersApi = {
  getProgress: (userId: string) => api.get<UserProgress>(`/users/${userId}/progress`),
  updateXp: (userId: string, xpDelta: number) => api.put(`/users/${userId}/xp`, { xpDelta }),
  getHints: (userId: string) => api.get(`/users/${userId}/hints`),
  useHint: (userId: string) => api.post(`/users/${userId}/hints/use`),
};

export const puzzlesApi = {
  attempt: (puzzleId: string, data: { score: number; maxScore: number; timeTaken: number; hintsUsed?: number }) =>
    api.post<PuzzleAttemptResult>(`/puzzles/${puzzleId}/attempt`, data),
};

export const classesApi = {
  getLeaderboard: (classId: string) => api.get(`/classes/${classId}/leaderboard`),
};
