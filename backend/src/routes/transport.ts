import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireTransport } from '../middleware/roles';

const router = Router();

const VehicleSchema = z.object({
  type: z.enum(['TRUCK', 'MINI_TRUCK', 'TEMPO', 'THREE_WHEELER', 'TRACTOR', 'PICKUP']),
  registrationNumber: z.string().optional(),
  capacityKg: z.number().positive().default(1000),
  isRefrigerated: z.boolean().default(false),
});

const ProfileUpdateSchema = z.object({
  licenseNumber: z.string().optional(),
  serviceArea: z.string().optional(),
  isAvailable: z.boolean().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
});

// GET /api/transport/profile
router.get('/profile', authenticate, requireTransport, async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await prisma.transportProfile.findUnique({
    where: { userId: req.user!.id },
    include: {
      vehicles: { where: { isActive: true } },
      user: { select: { name: true, email: true, mobile: true } },
      _count: { select: { deliveries: true } },
    },
  });
  if (!profile) {
    res.status(404).json({ error: 'Transport profile not found' });
    return;
  }
  res.json({ profile });
});

// PATCH /api/transport/profile
router.patch('/profile', authenticate, requireTransport, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = ProfileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const profile = await prisma.transportProfile.update({
    where: { userId: req.user!.id },
    data: parsed.data,
  });
  res.json({ profile });
});

// POST /api/transport/vehicles
router.post('/vehicles', authenticate, requireTransport, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = VehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }
  const profile = await prisma.transportProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) {
    res.status(404).json({ error: 'Transport profile not found' });
    return;
  }
  const vehicle = await prisma.vehicle.create({
    data: { ...parsed.data, transportProfileId: profile.id },
  });
  res.status(201).json({ vehicle });
});

// PATCH /api/transport/vehicles/:id
router.patch('/vehicles/:id', authenticate, requireTransport, async (req: AuthRequest, res: Response): Promise<void> => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: { transportProfile: true },
  });
  if (!vehicle || vehicle.transportProfile.userId !== req.user!.id) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }
  const allowedFields = ['type', 'registrationNumber', 'capacityKg', 'isRefrigerated', 'isActive'];
  const updateData: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  }
  const updated = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: updateData,
  });
  res.json({ vehicle: updated });
});

// GET /api/transport/deliveries
router.get('/deliveries', authenticate, requireTransport, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(50, Math.max(1, parseInt(String(limit))));
  const skip = (pageNum - 1) * limitNum;

  const profile = await prisma.transportProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) { res.status(404).json({ error: 'Transport profile not found' }); return; }

  const where: Record<string, unknown> = { transportProfileId: profile.id };
  if (status) where.status = String(status).toUpperCase();

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where, skip, take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            farmer: { select: { id: true, name: true } },
            buyer: { select: { id: true, name: true } },
            items: { include: { product: { select: { title: true, commodity: { select: { name: true } } } } } },
          },
        },
      },
    }),
    prisma.delivery.count({ where }),
  ]);

  res.json({ data: deliveries, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

// GET /api/transport/deliveries/available
router.get('/deliveries/available', authenticate, requireTransport, async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await prisma.transportProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) { res.status(404).json({ error: 'Transport profile not found' }); return; }

  const deliveries = await prisma.delivery.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      order: {
        include: {
          farmer: { select: { id: true, name: true, farmerProfile: { select: { district: true, state: true } } } },
          buyer: { select: { id: true, name: true } },
          items: { include: { product: { select: { title: true, quantity: true, unit: true, commodity: { select: { name: true } } } } } },
        },
      },
    },
  });

  res.json({ data: deliveries });
});

// PATCH /api/transport/deliveries/:id/accept
router.patch('/deliveries/:id/accept', authenticate, requireTransport, async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await prisma.transportProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) { res.status(404).json({ error: 'Transport profile not found' }); return; }

  const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id } });
  if (!delivery || delivery.status !== 'PENDING') {
    res.status(400).json({ error: 'Delivery not available for acceptance' });
    return;
  }

  const updated = await prisma.delivery.update({
    where: { id: req.params.id },
    data: { transportProfileId: profile.id, status: 'ACCEPTED', acceptedAt: new Date() },
  });

  const order = await prisma.order.findUnique({ where: { id: delivery.orderId } });
  if (order) {
    await prisma.notification.createMany({
      data: [
        { userId: order.farmerId, type: 'DELIVERY_UPDATE', title: 'Transport Assigned', message: `Transport provider assigned for order #${order.id.slice(-8)}.`, data: JSON.stringify({ orderId: order.id, deliveryId: delivery.id }) },
        { userId: order.buyerId, type: 'DELIVERY_UPDATE', title: 'Transport Assigned', message: `Transport provider assigned for your order #${order.id.slice(-8)}.`, data: JSON.stringify({ orderId: order.id, deliveryId: delivery.id }) },
      ],
    });
  }

  res.json({ delivery: updated });
});

// PATCH /api/transport/deliveries/:id/status
router.patch('/deliveries/:id/status', authenticate, requireTransport, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, reason } = req.body as { status: string; reason?: string };
  const validStatuses = ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be: ${validStatuses.join(', ')}` });
    return;
  }

  const profile = await prisma.transportProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) { res.status(404).json({ error: 'Transport profile not found' }); return; }

  const delivery = await prisma.delivery.findUnique({ where: { id: req.params.id } });
  if (!delivery || delivery.transportProfileId !== profile.id) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const timestamps: Record<string, object> = {
    PICKED_UP: { pickedUpAt: new Date() },
    DELIVERED: { deliveredAt: new Date() },
    CANCELLED: { cancelledAt: new Date(), cancellationReason: reason || null },
  };

  const updated = await prisma.delivery.update({
    where: { id: req.params.id },
    data: { status, ...(timestamps[status] || {}) },
  });

  if (status === 'DELIVERED') {
    await prisma.order.update({ where: { id: delivery.orderId }, data: { status: 'COMPLETED' } });
    await prisma.transportProfile.update({ where: { id: profile.id }, data: { totalDeliveries: { increment: 1 } } });
  }

  const order = await prisma.order.findUnique({ where: { id: delivery.orderId } });
  if (order) {
    const msgs: Record<string, string> = {
      PICKED_UP: 'Produce picked up and on its way.',
      IN_TRANSIT: 'Delivery is in transit.',
      DELIVERED: 'Order delivered successfully!',
      CANCELLED: 'Delivery has been cancelled.',
    };
    await prisma.notification.createMany({
      data: [
        { userId: order.farmerId, type: 'DELIVERY_UPDATE', title: 'Delivery Update', message: msgs[status] || status },
        { userId: order.buyerId, type: 'DELIVERY_UPDATE', title: 'Delivery Update', message: msgs[status] || status },
      ],
    });
  }

  res.json({ delivery: updated });
});

// GET /api/transport/earnings
router.get('/earnings', authenticate, requireTransport, async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await prisma.transportProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) { res.status(404).json({ error: 'Transport profile not found' }); return; }

  const completed = await prisma.delivery.findMany({
    where: { transportProfileId: profile.id, status: 'DELIVERED' },
    select: { transportCost: true, deliveredAt: true },
  });

  const totalEarnings = completed.reduce((s, d) => s + d.transportCost, 0);
  const now = new Date();
  const thisMonth = completed.filter(d => d.deliveredAt && d.deliveredAt.getMonth() === now.getMonth() && d.deliveredAt.getFullYear() === now.getFullYear());

  res.json({
    totalEarnings,
    monthlyEarnings: thisMonth.reduce((s, d) => s + d.transportCost, 0),
    totalDeliveries: completed.length,
    monthlyDeliveries: thisMonth.length,
  });
});

export default router;
