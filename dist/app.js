import express from 'express';
import { webhookRouter } from './routes/webhook.js';
import { requirementsRouter } from './routes/requirements.js';
import { formsSyncRouter } from './routes/forms-sync.js';
import { healthRouter } from './routes/health.js';
import { metricsRouter, httpRequestDuration } from './routes/metrics.js';
export const app = express();
// Middleware: Capture raw body buffer for HMAC signature verification
app.use(express.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express.urlencoded({ extended: true }));
// Observability Middleware: Track HTTP durations for Prometheus
app.use((req, res, next) => {
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
// Mount Routes
app.use('/webhooks/whatsapp', webhookRouter);
app.use('/internal/requirements', requirementsRouter);
app.use('/internal/forms/responses/sync', formsSyncRouter);
app.use('/health', healthRouter);
app.use('/metrics', metricsRouter);
// Root informative route
app.get('/', (_req, res) => {
    res.json({
        service: 'WhatsApp Student Helpdesk Assistant for HOD',
        status: 'operational',
        version: '1.0.0',
        endpoints: {
            webhook: '/webhooks/whatsapp',
            healthLive: '/health/live',
            healthReady: '/health/ready',
            metrics: '/metrics',
            requirements: '/internal/requirements',
        },
    });
});
// Centralized error handler
app.use((err, _req, res, _next) => {
    console.error('[Unhandled Application Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
