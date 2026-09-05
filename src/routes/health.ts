import { Router, Request, Response } from 'express';
import { db } from '../store/db.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

healthRouter.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'live', timestamp: new Date().toISOString() });
});

healthRouter.get('/ready', async (_req: Request, res: Response) => {
  const isMemory =
    process.env.NODE_ENV === 'test' ||
    process.env.USE_MEMORY_STORE === 'true' ||
    process.env.DATABASE_URL?.includes(':memory:');

  if (isMemory) {
    res.status(200).json({ status: 'ready', database: 'in-memory', timestamp: new Date().toISOString() });
    return;
  }

  const isDbHealthy = await db.isHealthy();
  if (isDbHealthy) {
    res.status(200).json({ status: 'ready', database: 'connected', timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({ status: 'degraded', database: 'unreachable', timestamp: new Date().toISOString() });
  }
});
