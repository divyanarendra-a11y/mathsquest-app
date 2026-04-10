import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateStars, calculatePuzzleXp, calculateLevel, WORLD_UNLOCK_THRESHOLD } from '../lib/xp.js';
import { addXpToLeaderboard } from '../lib/redis.js';

const router = Router();

const AttemptSchema = z.object({
  score: z.number().int().min(0),
  maxScore: z.number().int().min(1),
  timeTaken: z.number().int().min(0),
  hintsUsed: z.number().int().min(0).default(0),
});

// POST /puzzles/:id/attempt
router.post('/:id/attempt', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const puzzleId = req.params.id;

  const parsed = AttemptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  const { score, maxScore, timeTaken, hintsUsed } = parsed.data;

  const puzzle = await prisma.puzzle.findFirst({
    where: { OR: [{ id: puzzleId }, { slug: puzzleId }] },
    include: { world: true },
  });

  if (!puzzle) {
    res.status(404).json({ error: 'Puzzle not found' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true, streakDays: true, classId: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const starsEarned = calculateStars(score, maxScore);

  // Check if this is the first 3-star clear for this puzzle
  const previousBest = await prisma.puzzleAttempt.findFirst({
    where: { userId, puzzleId: puzzle.id, starsEarned: 3 },
  });
  const isFirstThreeStar = starsEarned === 3 && !previousBest;

  const { xpGained, breakdown } = calculatePuzzleXp(
    score, maxScore, starsEarned, isFirstThreeStar, user.streakDays,
  );

  const result = await prisma.$transaction(async (tx: typeof prisma) => {
    // Record the attempt
    const attempt = await tx.puzzleAttempt.create({
      data: { userId, puzzleId: puzzle.id, score, timeTaken, hintsUsed, starsEarned },
    });

    // Update user XP
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { xp: { increment: xpGained } },
      select: { xp: true, level: true },
    });

    const newLevel = calculateLevel(updatedUser.xp);
    if (newLevel !== updatedUser.level) {
      await tx.user.update({ where: { id: userId }, data: { level: newLevel } });
    }

    // Update world progress
    const allAttempts = await tx.puzzleAttempt.findMany({
      where: { userId, puzzle: { worldId: puzzle.worldId } },
      include: { puzzle: true },
    });

    const allPuzzlesInWorld = await tx.puzzle.findMany({ where: { worldId: puzzle.worldId } });
    const totalPuzzles = allPuzzlesInWorld.length;

    // Best stars per puzzle
    const bestStarsByPuzzle: Record<string, number> = {};
    for (const a of allAttempts) {
      const current = bestStarsByPuzzle[a.puzzleId] ?? 0;
      if (a.starsEarned > current) bestStarsByPuzzle[a.puzzleId] = a.starsEarned;
    }

    const puzzlesCompleted = Object.values(bestStarsByPuzzle).filter((s) => s > 0).length;
    const totalStars = Object.values(bestStarsByPuzzle).reduce((sum, s) => sum + s, 0);
    const percentComplete = totalPuzzles > 0 ? (puzzlesCompleted / totalPuzzles) * 100 : 0;

    await tx.worldProgress.upsert({
      where: { userId_worldId: { userId, worldId: puzzle.worldId } },
      update: {
        starsEarned: totalStars,
        percentComplete,
        puzzlesAttempted: allAttempts.length,
      },
      create: {
        userId,
        worldId: puzzle.worldId,
        starsEarned: totalStars,
        percentComplete,
        puzzlesAttempted: allAttempts.length,
      },
    });

    // Check if next world unlocks
    const worldUnlocked = percentComplete >= WORLD_UNLOCK_THRESHOLD;

    return {
      attempt,
      xpGained,
      breakdown,
      newXp: updatedUser.xp + xpGained,
      newLevel,
      starsEarned,
      worldProgress: { percentComplete, starsEarned: totalStars, worldUnlocked },
    };
  });

  // Update leaderboard in Redis (non-blocking)
  if (user.classId) {
    addXpToLeaderboard(user.classId, userId, xpGained).catch(() => {});
  }

  res.json(result);
});

export default router;
