import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const AlertSchema = z.object({
  commodityId: z.string(),
  marketId: z.string().optional(),
  targetPrice: z.number().positive(),
  condition: z.enum(['ABOVE', 'BELOW']),
});

// ─── NOTIFICATIONS routes MUST come before /:id to avoid route collision ──────

// GET /api/alerts/notifications
router.get('/notifications', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', unreadOnly } = req.query;
  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(50, parseInt(String(limit)));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { userId: req.user!.id };
  if (unreadOnly === 'true') where.isRead = false;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
  ]);

  res.json({ data: notifications, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

// PATCH /api/alerts/notifications/read-all  (before /notifications/:id/read)
router.patch('/notifications/read-all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true });
});

// PATCH /api/alerts/notifications/:id/read
router.patch('/notifications/:id/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { isRead: true },
  });
  res.json({ success: true });
});

// ─── ALERTS CRUD ──────────────────────────────────────────────────────────────

// GET /api/alerts
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const alerts = await prisma.priceAlert.findMany({
    where: { userId: req.user!.id },
    include: { commodity: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: alerts });
});

// POST /api/alerts
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = AlertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const alert = await prisma.priceAlert.create({
    data: { ...parsed.data, userId: req.user!.id },
    include: { commodity: { select: { id: true, name: true } } },
  });
  res.status(201).json({ alert });
});

// PATCH /api/alerts/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const alert = await prisma.priceAlert.findUnique({ where: { id: req.params.id } });
  if (!alert || alert.userId !== req.user!.id) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  const updated = await prisma.priceAlert.update({
    where: { id: req.params.id },
    data: { isActive: req.body.isActive },
  });
  res.json({ alert: updated });
});

// DELETE /api/alerts/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const alert = await prisma.priceAlert.findUnique({ where: { id: req.params.id } });
  if (!alert || alert.userId !== req.user!.id) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  await prisma.priceAlert.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
