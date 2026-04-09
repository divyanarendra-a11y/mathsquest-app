import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 100, 3000);
      },
    });

    redis.on('error', (err) => {
      // Log but don't crash — leaderboard degrades gracefully
      console.warn('[Redis] connection error:', err.message);
    });
  }
  return redis;
}

const LEADERBOARD_KEY = (classId: string) => `leaderboard:weekly:${classId}`;
const LEADERBOARD_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function addXpToLeaderboard(
  classId: string,
  userId: string,
  xpDelta: number,
): Promise<void> {
  try {
    const r = getRedis();
    const key = LEADERBOARD_KEY(classId);
    await r.zincrby(key, xpDelta, userId);
    await r.expire(key, LEADERBOARD_TTL_SECONDS);
  } catch {
    // Non-fatal
  }
}

export async function getLeaderboard(
  classId: string,
  limit = 20,
): Promise<Array<{ userId: string; weeklyXp: number }>> {
  try {
    const r = getRedis();
    const key = LEADERBOARD_KEY(classId);
    const results = await r.zrevrange(key, 0, limit - 1, 'WITHSCORES');

    const entries: Array<{ userId: string; weeklyXp: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      entries.push({ userId: results[i], weeklyXp: Number(results[i + 1]) });
    }
    return entries;
  } catch {
    return [];
  }
}

export async function resetWeeklyLeaderboard(classId: string): Promise<void> {
  try {
    const r = getRedis();
    await r.del(LEADERBOARD_KEY(classId));
  } catch {
    // Non-fatal
  }
}
