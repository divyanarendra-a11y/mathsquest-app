import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /worlds
router.get('/', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const worlds = await prisma.world.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      _count: { select: { puzzles: true } },
    },
  });
  res.json(worlds);
});

// GET /worlds/:id/puzzles
router.get('/:id/puzzles', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const world = await prisma.world.findFirst({
    where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
  });

  if (!world) {
    res.status(404).json({ error: 'World not found' });
    return;
  }

  const puzzles = await prisma.puzzle.findMany({
    where: { worldId: world.id },
    orderBy: { orderIndex: 'asc' },
  });

  res.json({ world, puzzles });
});

export default router;
