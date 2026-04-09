export const XP_RULES = {
  PUZZLE_COMPLETE: 10,
  FIRST_THREE_STAR: 25,
  DAILY_LOGIN: 5,
  WIN_CHALLENGE: 15,
  STREAK_3_MULTIPLIER: 1.5,
  STREAK_7_MULTIPLIER: 2.0,
} as const;

export const WORLD_UNLOCK_THRESHOLD = 80; // percent

export function calculateLevel(xp: number): number {
  // Level thresholds: 0, 100, 250, 450, 700, 1000, ...
  // Formula: level n requires n*(n+1)*50 total XP
  let level = 1;
  while (xp >= level * (level + 1) * 50) {
    level++;
  }
  return level;
}

export function xpToNextLevel(currentXp: number, currentLevel: number): number {
  const nextLevelThreshold = currentLevel * (currentLevel + 1) * 50;
  return Math.max(0, nextLevelThreshold - currentXp);
}

export function applyStreakMultiplier(baseXp: number, streakDays: number): number {
  if (streakDays >= 7) return Math.round(baseXp * XP_RULES.STREAK_7_MULTIPLIER);
  if (streakDays >= 3) return Math.round(baseXp * XP_RULES.STREAK_3_MULTIPLIER);
  return baseXp;
}

export function calculatePuzzleXp(
  score: number,
  maxScore: number,
  starsEarned: number,
  isFirstThreeStar: boolean,
  streakDays: number,
): { xpGained: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  const baseXp = XP_RULES.PUZZLE_COMPLETE;
  breakdown.puzzleComplete = applyStreakMultiplier(baseXp, streakDays);

  if (isFirstThreeStar && starsEarned === 3) {
    breakdown.firstThreeStar = XP_RULES.FIRST_THREE_STAR;
  }

  const xpGained = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { xpGained, breakdown };
}

export function calculateStars(score: number, maxScore: number): number {
  const pct = (score / maxScore) * 100;
  if (pct >= 90) return 3;
  if (pct >= 70) return 2;
  if (pct >= 50) return 1;
  return 0;
}

export function updateStreak(lastLoginDate: Date | null): {
  newStreakDays: number;
  xpBonus: number;
  hintBonus: number;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!lastLoginDate) {
    return { newStreakDays: 1, xpBonus: XP_RULES.DAILY_LOGIN, hintBonus: 1 };
  }

  const last = new Date(lastLoginDate);
  const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
  const diffDays = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Already logged in today
    return { newStreakDays: 0, xpBonus: 0, hintBonus: 0 };
  }

  if (diffDays === 1) {
    // Consecutive day — streak continues (actual increment handled by caller)
    return { newStreakDays: 1, xpBonus: XP_RULES.DAILY_LOGIN, hintBonus: 1 };
  }

  // Streak broken
  return { newStreakDays: 1, xpBonus: XP_RULES.DAILY_LOGIN, hintBonus: 1 };
}
