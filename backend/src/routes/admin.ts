import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';
import { syncMandiData, getSyncStatus } from '../services/syncService';
import { dataGovProvider } from '../services/dataGovProvider';

const router = Router();

// GET /api/admin/stats
router.get('/stats', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  const [users, markets, commodities, products, orders, prices] = await Promise.all([
    prisma.user.count(),
    prisma.market.count(),
    prisma.commodity.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.marketPrice.count(),
  ]);

  const syncStatus = await getSyncStatus();

  res.json({ users, markets, commodities, products, orders, prices, syncStatus });
});

// GET /api/admin/users
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', role, search } = req.query;
  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(100, parseInt(String(limit)));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (role) where.role = String(role).toUpperCase();
  if (search) {
    where.OR = [
      { name: { contains: String(search) } },
      { email: { contains: String(search) } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, mobile: true, role: true, isActive: true, createdAt: true,
        farmerProfile: { select: { district: true, state: true } },
        buyerProfile: { select: { district: true, state: true, companyName: true } },
        _count: { select: { products: true, ordersAsBuyer: true, ordersAsFarmer: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ data: users, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const VALID_ROLES = ['FARMER', 'BUYER', 'TRANSPORT', 'ADMIN'];
  const { isActive, role } = req.body;

  // Prevent admin from changing their own role
  if (req.params.id === req.user!.id && role) {
    res.status(400).json({ error: 'Cannot change your own role.' });
    return;
  }

  if (role && !VALID_ROLES.includes(String(role).toUpperCase())) {
    res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      ...(role ? { role: String(role).toUpperCase() } : {}),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  res.json({ user: updated });
});

// POST /api/admin/sync - trigger data sync
router.post('/sync', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!dataGovProvider.isConfigured()) {
    res.status(400).json({ error: 'DATA_GOV_API_KEY is not configured. Set it in backend/.env to enable sync.' });
    return;
  }

  const { states } = req.body as { states?: string[] };

  // Fire and forget sync
  syncMandiData(states).then((result) => {
    console.log(`[Admin Sync] Completed: ${result.imported} records, ${result.errors.length} errors`);
  }).catch((err) => {
    console.error('[Admin Sync] Failed:', err);
  });

  res.json({ message: 'Sync started in background', apiConfigured: true });
});

// GET /api/admin/sync/status
router.get('/sync/status', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  const status = await getSyncStatus();
  res.json(status);
});

// GET /api/admin/sync/logs
router.get('/sync/logs', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(50, parseInt(String(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    prisma.dataSyncLog.findMany({
      skip,
      take: limitNum,
      orderBy: { startedAt: 'desc' },
      include: { dataSource: { select: { name: true } } },
    }),
    prisma.dataSyncLog.count(),
  ]);

  res.json({ data: logs, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

// DELETE /api/admin/products/:id - hard delete
router.delete('/products/:id', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  await prisma.product.delete({ where: { id: _req.params.id } });
  res.json({ success: true });
});

export default router;
