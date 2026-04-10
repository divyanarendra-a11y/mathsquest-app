import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { signToken } from '../middleware/auth.js';
import { updateStreak } from '../lib/xp.js';

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  classCode: z.string().optional(),
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  // Try student first
  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.passwordHash) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Handle daily login streak + XP
    const { newStreakDays, xpBonus, hintBonus } = updateStreak(user.lastLoginDate);
    if (newStreakDays > 0) {
      await prisma.$transaction(async (tx: TxClient) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            lastLoginDate: new Date(),
            streakDays: newStreakDays === 1 && user.streakDays > 0
              ? user.streakDays + 1
              : newStreakDays,
            xp: { increment: xpBonus },
          },
        });

        if (hintBonus > 0) {
          await tx.hintToken.upsert({
            where: { userId: user.id },
            update: { balance: { increment: hintBonus }, lastEarned: new Date() },
            create: { userId: user.id, balance: 1, lastEarned: new Date() },
          });
        }
      });
    }

    const token = signToken({ userId: user.id, email: user.email, role: 'student' });
    res.json({ token, user: { id: user.id, name: user.name, xp: user.xp, avatarId: user.avatarId } });
    return;
  }

  // Try teacher
  const teacher = await prisma.teacher.findUnique({ where: { email } });
  if (teacher?.passwordHash) {
    const valid = await bcrypt.compare(password, teacher.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const token = signToken({ userId: teacher.id, email: teacher.email, role: 'teacher' });
    res.json({ token, user: { id: teacher.id, name: teacher.name, role: 'teacher' } });
    return;
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      lastLoginDate: new Date(),
      streakDays: 1,
      xp: 5, // daily login bonus on first sign-up
    },
  });

  await prisma.hintToken.create({ data: { userId: user.id, balance: 3 } });

  const token = signToken({ userId: user.id, email: user.email, role: 'student' });
  res.status(201).json({ token, user: { id: user.id, name: user.name, xp: user.xp, avatarId: user.avatarId } });
});

export default router;
