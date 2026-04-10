import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireTeacher } from '../middleware/auth.js';
import { getLeaderboard } from '../lib/redis.js';

const router = Router();

// GET /classes/:id/leaderboard  — weekly XP, from Redis cache
router.get('/:id/leaderboard', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const classId = req.params.id;

  const classRecord = await prisma.class.findUnique({ where: { id: classId } });
  if (!classRecord) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }

  if (!classRecord.leaderboardEnabled) {
    res.status(403).json({ error: 'Leaderboard is disabled for this class' });
    return;
  }

  const entries = await getLeaderboard(classId);

  // Hydrate with user names
  const userIds = entries.map((e) => e.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatarId: true, level: true },
  });

  interface UserRow { id: string; name: string; avatarId: string; level: number }
  const userMap = Object.fromEntries((users as UserRow[]).map((u) => [u.id, u]));

  const leaderboard = entries
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
      ...(userMap[entry.userId] ?? { name: 'Unknown', avatarId: 'avatar_1', level: 1 }),
    }))
    .filter((e) => userMap[e.userId]);

  res.json({ classId, leaderboard, resetDay: 'Monday' });
});

// GET /classes/:id — teacher only
router.get('/:id', requireTeacher, async (req: Request, res: Response): Promise<void> => {
  const classRecord = await prisma.class.findUnique({
    where: { id: req.params.id },
    include: {
      students: {
        select: {
          id: true,
          name: true,
          xp: true,
          level: true,
          streakDays: true,
          avatarId: true,
          worldProgress: { include: { world: true } },
        },
      },
    },
  });

  if (!classRecord) {
    res.status(404).json({ error: 'Class not found' });
    return;
  }

  if (classRecord.teacherId !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  res.json(classRecord);
});

export default router;
