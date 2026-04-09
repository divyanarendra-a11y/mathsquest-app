import axios from 'axios';

const BASE_URL = import.meta.env.VITE_TEACHER_API_URL ?? '/api';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mq_teacher_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mq_teacher_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export interface Student {
  id: string;
  name: string;
  xp: number;
  level: number;
  streakDays: number;
  avatarId: string;
  worldProgress: Array<{
    world: { id: string; name: string; orderIndex: number; color: string; iconEmoji: string };
    starsEarned: number;
    percentComplete: number;
  }>;
}

export interface ClassData {
  id: string;
  name: string;
  leaderboardEnabled: boolean;
  students: Student[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarId: string;
  level: number;
  weeklyXp: number;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: { id: string; name: string } }>('/auth/login', { email, password }),
};

export const classApi = {
  getClass: (classId: string) => api.get<ClassData>(`/classes/${classId}`),
  getLeaderboard: (classId: string) =>
    api.get<{ leaderboard: LeaderboardEntry[]; resetDay: string }>(`/classes/${classId}/leaderboard`),
};
