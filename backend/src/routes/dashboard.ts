import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/stats - public stats for landing page
router.get('/stats', async (_req, res: Response): Promise<void> => {
  const [markets, commodities, products, states] = await Promise.all([
    prisma.market.count({ where: { isActive: true } }),
    prisma.commodity.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.market.groupBy({ by: ['state'], _count: { id: true } }),
  ]);

  res.json({ markets, commodities, products, states: states.length });
});

// GET /api/dashboard/farmer - farmer dashboard data
router.get('/farmer', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'FARMER' && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Farmer access required' });
    return;
  }

  const [products, orders, notifications, profile] = await Promise.all([
    prisma.product.findMany({
      where: { farmerId: req.user!.id },
      include: { commodity: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.order.findMany({
      where: { farmerId: req.user!.id },
      include: {
        buyer: { select: { id: true, name: true } },
        items: { include: { product: { select: { title: true } } } },
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.notification.findMany({
      where: { userId: req.user!.id, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.farmerProfile.findUnique({ where: { userId: req.user!.id } }),
  ]);

  const [totalRevenue, activeProducts, pendingOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { farmerId: req.user!.id, status: { in: ['COMPLETED', 'READY'] } },
      _sum: { totalAmount: true },
    }),
    prisma.product.count({ where: { farmerId: req.user!.id, isActive: true } }),
    prisma.order.count({ where: { farmerId: req.user!.id, status: 'PENDING' } }),
  ]);

  res.json({
    profile,
    recentProducts: products,
    recentOrders: orders,
    notifications,
    stats: {
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
      activeProducts,
      pendingOrders,
      totalOrders: await prisma.order.count({ where: { farmerId: req.user!.id } }),
    },
  });
});

// GET /api/dashboard/buyer - buyer dashboard data
router.get('/buyer', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'BUYER' && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Buyer access required' });
    return;
  }

  const [orders, notifications, favorites, profile] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: req.user!.id },
      include: {
        farmer: { select: { id: true, name: true } },
        items: { include: { product: { select: { title: true, commodity: { select: { name: true } } } } } },
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.notification.findMany({
      where: { userId: req.user!.id, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          include: { commodity: { select: { name: true } }, farmer: { select: { name: true } } },
        },
      },
      take: 5,
    }),
    prisma.buyerProfile.findUnique({ where: { userId: req.user!.id } }),
  ]);

  const totalSpent = await prisma.order.aggregate({
    where: { buyerId: req.user!.id, status: { in: ['COMPLETED', 'READY'] } },
    _sum: { totalAmount: true },
  });

  res.json({
    profile,
    recentOrders: orders,
    notifications,
    favorites,
    stats: {
      totalOrders: await prisma.order.count({ where: { buyerId: req.user!.id } }),
      totalSpent: totalSpent._sum.totalAmount ?? 0,
      pendingOrders: await prisma.order.count({ where: { buyerId: req.user!.id, status: 'PENDING' } }),
      savedProducts: await prisma.favorite.count({ where: { userId: req.user!.id } }),
    },
  });
});

// GET /api/dashboard/transport - transport provider dashboard data
router.get('/transport', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'TRANSPORT' && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Transport access required' });
    return;
  }

  const profile = await prisma.transportProfile.findUnique({
    where: { userId: req.user!.id },
    include: { vehicles: true },
  });

  if (!profile) {
    res.status(404).json({ error: 'Transport profile not found' });
    return;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [deliveries, monthlyEarnings, totalEarnings, notifications] = await Promise.all([
    prisma.delivery.findMany({
      where: { transportProfileId: profile.id },
      include: {
        order: { include: { buyer: { select: { name: true } }, farmer: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.delivery.aggregate({
      where: { transportProfileId: profile.id, status: 'DELIVERED', deliveredAt: { gte: startOfMonth } },
      _sum: { transportCost: true },
    }),
    prisma.delivery.aggregate({
      where: { transportProfileId: profile.id, status: 'DELIVERED' },
      _sum: { transportCost: true },
    }),
    prisma.notification.findMany({
      where: { userId: req.user!.id, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  res.json({
    profile,
    recentDeliveries: deliveries,
    notifications,
    stats: {
      totalDeliveries: profile.totalDeliveries,
      monthlyEarnings: monthlyEarnings._sum.transportCost ?? 0,
      totalEarnings: totalEarnings._sum.transportCost ?? 0,
      pendingDeliveries: deliveries.filter(d => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
    },
  });
});

export default router;
