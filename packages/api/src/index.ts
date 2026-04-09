import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import worldsRouter from './routes/worlds.js';
import puzzlesRouter from './routes/puzzles.js';
import classesRouter from './routes/classes.js';
import challengesRouter from './routes/challenges.js';

const app = express();
const PORT = process.env.API_PORT ?? 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Routes
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/worlds', worldsRouter);
app.use('/puzzles', puzzlesRouter);
app.use('/classes', classesRouter);
app.use('/challenges', challengesRouter);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`MathsQuest API running on http://localhost:${PORT}`);
});

export default app;
