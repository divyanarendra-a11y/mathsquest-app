import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateLevel, WORLD_UNLOCK_THRESHOLD } from '../lib/xp.js';

const router = Router();

// GET /users/:id/progress
router.get('/:id/progress', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (req.user?.userId !== id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const [user, worldProgress, hints] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, xp: true, level: true, streakDays: true, avatarId: true, classId: true },
    }),
    prisma.worldProgress.findMany({
      where: { userId: id },
      include: { world: { select: { id: true, slug: true, name: true, orderIndex: true } } },
    }),
    prisma.hintToken.findUnique({ where: { userId: id } }),
  ]);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Determine which worlds are unlocked
  const worlds = await prisma.world.findMany({ orderBy: { orderIndex: 'asc' } });
  const progressMap = Object.fromEntries(worldProgress.map((wp) => [wp.worldId, wp]));

  const worldsWithUnlock = worlds.map((world) => {
    const progress = progressMap[world.id];
    const prevWorld = worlds.find((w) => w.orderIndex === world.orderIndex - 1);

    let unlocked = world.orderIndex === 1;
    if (prevWorld) {
      const prevProgress = progressMap[prevWorld.id];
      unlocked = (prevProgress?.percentComplete ?? 0) >= WORLD_UNLOCK_THRESHOLD;
    }

    return {
      ...world,
      unlocked,
      starsEarned: progress?.starsEarned ?? 0,
      percentComplete: progress?.percentComplete ?? 0,
      puzzlesAttempted: progress?.puzzlesAttempted ?? 0,
    };
  });

  res.json({
    user,
    worlds: worldsWithUnlock,
    hints: hints?.balance ?? 0,
  });
});

// PUT /users/:id/xp
router.put('/:id/xp', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (req.user?.userId !== id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const parsed = z.object({ xpDelta: z.number().int().min(0) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid xpDelta' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { xp: { increment: parsed.data.xpDelta } },
    select: { xp: true, level: true },
  });

  const newLevel = calculateLevel(user.xp);
  if (newLevel !== user.level) {
    await prisma.user.update({ where: { id }, data: { level: newLevel } });
  }

  res.json({ xp: user.xp, level: newLevel });
});

// GET /users/:id/hints
router.get('/:id/hints', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (req.user?.userId !== id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const hint = await prisma.hintToken.findUnique({ where: { userId: id } });
  res.json({ balance: hint?.balance ?? 0, lastEarned: hint?.lastEarned ?? null });
});

// POST /users/:id/hints/use
router.post('/:id/hints/use', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  if (req.user?.userId !== id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const hint = await prisma.hintToken.findUnique({ where: { userId: id } });
  if (!hint || hint.balance < 1) {
    res.status(400).json({ error: 'No hint tokens available' });
    return;
  }

  const updated = await prisma.hintToken.update({
    where: { userId: id },
    data: { balance: { decrement: 1 } },
  });

  res.json({ balance: updated.balance });
});

export default router;
