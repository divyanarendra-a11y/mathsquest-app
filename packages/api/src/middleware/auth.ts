import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireTeacher(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'teacher') {
      res.status(403).json({ error: 'Teacher access required' });
      return;
    }
    next();
  });
}

export function signToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET ?? 'dev-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}
