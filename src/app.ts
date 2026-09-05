import express, { Request, Response, NextFunction } from 'express';
import { webhookRouter } from './routes/webhook.js';
import { requirementsRouter } from './routes/requirements.js';
import { formsSyncRouter } from './routes/forms-sync.js';
import { healthRouter } from './routes/health.js';
import { metricsRouter, httpRequestDuration } from './routes/metrics.js';

export const app = express();

// Middleware: Capture raw body buffer for HMAC signature verification
app.use(
  express.json({
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: true }));

// Observability Middleware: Track HTTP durations for Prometheus
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
  });
  next();
});

// Mount Routes (supporting both root and /api prefixed routes on Vercel)
app.use(['/webhooks/whatsapp', '/api/webhooks/whatsapp'], webhookRouter);
app.use(['/internal/requirements', '/api/internal/requirements'], requirementsRouter);
app.use(['/internal/forms/responses/sync', '/api/internal/forms/responses/sync'], formsSyncRouter);
app.use(['/health', '/api/health'], healthRouter);
app.use(['/metrics', '/api/metrics'], metricsRouter);

// Root informative route
app.get(['/', '/api'], (_req: Request, res: Response) => {
  res.json({
    service: 'WhatsApp Student Helpdesk Assistant for HOD',
    status: 'operational',
    version: '1.0.0',
    endpoints: {
      webhook: '/webhooks/whatsapp',
      health: '/health',
      healthLive: '/health/live',
      healthReady: '/health/ready',
      metrics: '/metrics',
      requirements: '/internal/requirements',
    },
  });
});

// Centralized error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Application Error]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
