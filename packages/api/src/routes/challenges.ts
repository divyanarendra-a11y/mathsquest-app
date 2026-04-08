import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { XP_RULES } from '../lib/xp.js';
import { addXpToLeaderboard } from '../lib/redis.js';

const router = Router();

const CreateChallengeSchema = z.object({
  opponentId: z.string(),
  puzzleId: z.string(),
  classId: z.string(),
});

// POST /challenges — create head-to-head challenge
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateChallengeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  const { opponentId, puzzleId, classId } = parsed.data;
  const challengerId = req.user!.userId;

  if (challengerId === opponentId) {
    res.status(400).json({ error: 'Cannot challenge yourself' });
    return;
  }

  const challenge = await prisma.challenge.create({
    data: { classId, challengerId, opponentId, puzzleId },
  });

  res.status(201).json(challenge);
});

// PUT /challenges/:id/complete — record result and award XP to winner
router.put('/:id/complete', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = z.object({ score: z.number().int().min(0) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid score' });
    return;
  }

  const userId = req.user!.userId;
  const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });

  if (!challenge) {
    res.status(404).json({ error: 'Challenge not found' });
    return;
  }

  const isChallenger = challenge.challengerId === userId;
  const isOpponent = challenge.opponentId === userId;

  if (!isChallenger && !isOpponent) {
    res.status(403).json({ error: 'Not a participant in this challenge' });
    return;
  }

  const updateData = isChallenger
    ? { challengerScore: parsed.data.score }
    : { opponentScore: parsed.data.score };

  const updated = await prisma.challenge.update({
    where: { id: challenge.id },
    data: updateData,
  });

  // If both scores recorded, resolve
  if (updated.challengerScore !== null && updated.opponentScore !== null) {
    const winnerId =
      updated.challengerScore > updated.opponentScore
        ? updated.challengerId
        : updated.opponentScore > updated.challengerScore
          ? updated.opponentId
          : null; // draw

    await prisma.challenge.update({
      where: { id: challenge.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    if (winnerId) {
      const winner = await prisma.user.update({
        where: { id: winnerId },
        data: { xp: { increment: XP_RULES.WIN_CHALLENGE } },
        select: { classId: true },
      });
      if (winner.classId) {
        addXpToLeaderboard(winner.classId, winnerId, XP_RULES.WIN_CHALLENGE).catch(() => {});
      }
    }

    return res.json({ status: 'COMPLETED', winnerId });
  }

  res.json({ status: 'IN_PROGRESS', waiting: isChallenger ? 'opponent' : 'challenger' });
});

export default router;
