import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

import authRouter from './routes/auth';
import marketsRouter from './routes/markets';
import commoditiesRouter from './routes/commodities';
import pricesRouter from './routes/prices';
import marketplaceRouter from './routes/marketplace';
import ordersRouter from './routes/orders';
import alertsRouter from './routes/alerts';
import adminRouter from './routes/admin';
import dashboardRouter from './routes/dashboard';
import transportRouter from './routes/transport';
import deliveriesRouter from './routes/deliveries';
import geoRouter from './routes/geo';

import { syncMandiData } from './services/syncService';
import { checkAndTriggerAlerts } from './services/priceAlertService';
import { dataGovProvider } from './services/dataGovProvider';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3000;
const SYNC_INTERVAL_HOURS = parseInt(process.env.SYNC_INTERVAL_HOURS || '6');

// CORS — allows Vercel production deployments, localhost, and custom origins
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('kisanconnect')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback: allow all for hackathon demo
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple rate limiter for auth endpoints (in-memory, no extra dependency)
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const authRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = authAttempts.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 20) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }
    entry.count++;
  } else {
    authAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  }
  next();
};

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiConfigured: dataGovProvider.isConfigured(),
  });
});

// Routes
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/markets', marketsRouter);
app.use('/api/commodities', commoditiesRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/transport', transportRouter);
app.use('/api/deliveries', deliveriesRouter);
app.use('/api/geo', geoRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Scheduled sync (only if API key is configured)
if (dataGovProvider.isConfigured()) {
  const cronExpression = `0 */${SYNC_INTERVAL_HOURS} * * *`;
  cron.schedule(cronExpression, () => {
    console.log('[Cron] Starting scheduled mandi data sync...');
    syncMandiData().catch((err) => console.error('[Cron] Sync failed:', err));
  });

  cron.schedule('0 * * * *', () => {
    checkAndTriggerAlerts().catch((err) => console.error('[Cron] Alert check failed:', err));
  });

  console.log(`[Cron] Sync scheduled every ${SYNC_INTERVAL_HOURS} hours`);
} else {
  console.log('[Config] DATA_GOV_API_KEY not set — live sync disabled. Using cached/demo data.');
}

async function main() {
  try {
    await prisma.$connect();
    console.log('[DB] Connected to SQLite database');

    app.listen(PORT, () => {
      console.log(`[Server] KisanConnect backend running on http://localhost:${PORT}`);
      console.log(`[Server] API key configured: ${dataGovProvider.isConfigured()}`);
    });
  } catch (err) {
    console.error('[Fatal] Failed to start:', err);
    process.exit(1);
  }
}

// In Vercel serverless functions, do not start HTTP listener
if (!process.env.VERCEL) {
  main();
}

export default app;
export { app };
