import { Router, Request, Response } from 'express';
import client from 'prom-client';

export const metricsRouter = Router();

// Register default Prometheus collection metrics (process CPU, memory, heap, event loop)
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom Helpdesk Metrics
export const inboundMessagesCounter = new client.Counter({
  name: 'whatsapp_helpdesk_inbound_messages_total',
  help: 'Total number of inbound student messages received via WhatsApp',
  labelNames: ['type'],
  registers: [register],
});

export const faqHitsCounter = new client.Counter({
  name: 'whatsapp_helpdesk_faq_hits_total',
  help: 'Total number of queries answered from approved FAQ knowledge base',
  labelNames: ['category'],
  registers: [register],
});

export const escalationsCounter = new client.Counter({
  name: 'whatsapp_helpdesk_escalations_total',
  help: 'Total number of cases escalated to HOD/Human review',
  labelNames: ['urgency', 'category'],
  registers: [register],
});

export const requirementsCreatedCounter = new client.Counter({
  name: 'whatsapp_helpdesk_requirements_created_total',
  help: 'Total number of formal student requirements recorded',
  labelNames: ['category'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

metricsRouter.get('/', async (_req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
});
