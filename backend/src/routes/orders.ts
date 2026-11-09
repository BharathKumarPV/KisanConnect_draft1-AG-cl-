import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const PLATFORM_FEE_PERCENT = 2;

const OrderCreateSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    unit: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  transportCost: z.number().min(0).default(0),
});

// GET /api/orders
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { role } = req.user!;
  const { status, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(50, Math.max(1, parseInt(String(limit))));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (role === 'FARMER') where.farmerId = req.user!.id;
  else if (role === 'BUYER') where.buyerId = req.user!.id;
  if (status) where.status = String(status).toUpperCase();

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        farmer: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, title: true, commodity: { select: { name: true } } } } } },
        delivery: { select: { id: true, status: true, transportCost: true, distanceKm: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ data: orders, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      buyer: { select: { id: true, name: true, email: true, mobile: true } },
      farmer: { select: { id: true, name: true, email: true, mobile: true } },
      items: {
        include: {
          product: { select: { id: true, title: true, location: true, commodity: { select: { name: true } } } },
        },
      },
      delivery: {
        include: {
          transportProfile: {
            include: { user: { select: { id: true, name: true, mobile: true } } },
          },
        },
      },
      reviews: true,
    },
  });

  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

  if (order.buyerId !== req.user!.id && order.farmerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  // Get market reference price for transparency
  const firstItem = order.items[0];
  let marketReference = null;
  if (firstItem?.product) {
    const latestPrice = await prisma.marketPrice.findFirst({
      where: { commodityId: firstItem.product.commodity?.name ? undefined : undefined },
      orderBy: { priceDate: 'desc' },
      include: { market: { select: { name: true, state: true } } },
    });
    if (latestPrice) {
      marketReference = {
        mandiPrice: latestPrice.modalPrice,
        market: latestPrice.market?.name,
        state: latestPrice.market?.state,
        priceDate: latestPrice.priceDate,
        unit: latestPrice.unit,
      };
    }
  }

  res.json({
    order,
    priceBreakdown: {
      produceAmount: order.produceAmount,
      transportCost: order.transportCost,
      platformFee: order.platformFee,
      totalAmount: order.totalAmount,
      farmerReceives: order.produceAmount,
      transportProviderReceives: order.transportCost,
    },
    marketReference,
  });
});

// POST /api/orders
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'BUYER' && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only buyers can create orders' });
    return;
  }

  const parsed = OrderCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { items, notes, deliveryAddress, deliveryLat, deliveryLng, transportCost } = parsed.data;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map(i => i.productId) }, isActive: true },
  });

  if (products.length !== items.length) {
    res.status(400).json({ error: 'One or more products not found or inactive' });
    return;
  }

  const farmerIds = [...new Set(products.map(p => p.farmerId))];
  if (farmerIds.length > 1) {
    res.status(400).json({ error: 'All items must be from the same farmer' });
    return;
  }

  const farmerId = farmerIds[0];
  let produceAmount = 0;

  const orderItems = items.map(item => {
    const product = products.find(p => p.id === item.productId)!;
    const lineTotal = product.price * item.quantity;
    produceAmount += lineTotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit || product.unit,
      price: product.price,
    };
  });

  const platformFee = Math.round(produceAmount * PLATFORM_FEE_PERCENT / 100);
  const totalAmount = produceAmount + transportCost + platformFee;

  const order = await prisma.order.create({
    data: {
      buyerId: req.user!.id,
      farmerId,
      produceAmount,
      transportCost,
      platformFee,
      totalAmount,
      notes,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      items: { create: orderItems },
    },
    include: {
      items: true,
      buyer: { select: { id: true, name: true } },
      farmer: { select: { id: true, name: true } },
    },
  });

  // Notify farmer
  await prisma.notification.create({
    data: {
      userId: farmerId,
      type: 'ORDER_UPDATE',
      title: 'New Order Received',
      message: `New order from ${order.buyer.name} for ₹${totalAmount.toLocaleString('en-IN')}.`,
      data: JSON.stringify({ orderId: order.id }),
    },
  });

  res.status(201).json({
    order,
    priceBreakdown: {
      produceAmount,
      transportCost,
      platformFee,
      totalAmount,
      farmerReceives: produceAmount,
    },
  });
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const StatusSchema = z.object({
    status: z.enum(['PENDING', 'ACCEPTED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED']),
  });

  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid status', details: parsed.error.flatten() });
    return;
  }

  const { status } = parsed.data;
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }

  const validTransitions: Record<string, string[]> = {
    FARMER: ['ACCEPTED', 'PROCESSING', 'READY', 'CANCELLED'],
    BUYER: ['CANCELLED'],
    ADMIN: ['PENDING', 'ACCEPTED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'],
  };

  const allowed = validTransitions[req.user!.role] || [];
  if (!allowed.includes(status)) {
    res.status(403).json({ error: `Cannot set status to ${status} with your role` });
    return;
  }

  if (order.farmerId !== req.user!.id && order.buyerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
  });

  // If farmer accepts and there's a delivery address, create a pending delivery
  if (status === 'ACCEPTED' && order.deliveryAddress && order.transportCost > 0) {
    const existingDelivery = await prisma.delivery.findUnique({ where: { orderId: order.id } });
    if (!existingDelivery) {
      // Get farmer location from product
      const firstItem = await prisma.orderItem.findFirst({
        where: { orderId: order.id },
        include: { product: true },
      });

      // Find an available transport provider (or create pending for any to accept)
      const availableTransport = await prisma.transportProfile.findFirst({
        where: { isAvailable: true, isVerified: false }, // For demo, match any; in prod, match by area
        orderBy: { totalDeliveries: 'asc' },
      });

      if (availableTransport || true) {
        // Create a pending delivery for transport providers to accept
        const defaultTransport = availableTransport || await prisma.transportProfile.findFirst();
        if (defaultTransport) {
          await prisma.delivery.create({
            data: {
              orderId: order.id,
              transportProfileId: defaultTransport.id,
              pickupAddress: firstItem?.product?.location || 'Farmer location',
              pickupLat: firstItem?.product?.latitude,
              pickupLng: firstItem?.product?.longitude,
              deliveryAddress: order.deliveryAddress,
              deliveryLat: order.deliveryLat,
              deliveryLng: order.deliveryLng,
              transportCost: order.transportCost,
              status: 'PENDING',
            },
          });
        }
      }
    }
  }

  // Notify the other party
  const notifyUserId = req.user!.id === order.farmerId ? order.buyerId : order.farmerId;
  await prisma.notification.create({
    data: {
      userId: notifyUserId,
      type: 'ORDER_UPDATE',
      title: 'Order Status Updated',
      message: `Order #${order.id.slice(-8)} updated to: ${status}.`,
      data: JSON.stringify({ orderId: order.id }),
    },
  });

  res.json({ order: updated });
});

export default router;
