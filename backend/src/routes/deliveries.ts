import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/deliveries/estimate
router.post('/estimate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { distanceKm, vehicleType, isRefrigerated } = req.body as {
    distanceKm: number; vehicleType?: string; isRefrigerated?: boolean;
  };

  if (!distanceKm || distanceKm <= 0) {
    res.status(400).json({ error: 'Valid distanceKm is required' });
    return;
  }

  const baseCharge = 100;
  const perKmRates: Record<string, number> = {
    THREE_WHEELER: 4, PICKUP: 5, MINI_TRUCK: 6, TEMPO: 7, TRUCK: 8, TRACTOR: 5,
  };
  const perKmRate = perKmRates[vehicleType || 'MINI_TRUCK'] || 6;
  let transportCost = baseCharge + (distanceKm * perKmRate);
  const refrigSurcharge = isRefrigerated ? Math.round(transportCost * 0.3) : 0;
  if (isRefrigerated) transportCost *= 1.3;
  transportCost = Math.round(transportCost);

  res.json({
    distanceKm,
    vehicleType: vehicleType || 'MINI_TRUCK',
    isRefrigerated: isRefrigerated || false,
    transportCost,
    estimatedDuration: Math.round(distanceKm * 2.5),
    breakdown: {
      baseCharge,
      distanceCharge: Math.round(distanceKm * perKmRate),
      refrigerationSurcharge: refrigSurcharge,
    },
    note: 'Estimate only. Actual cost may vary based on road conditions and availability.',
  });
});

// GET /api/deliveries/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const delivery = await prisma.delivery.findUnique({
    where: { id: req.params.id },
    include: {
      order: {
        include: {
          farmer: { select: { id: true, name: true } },
          buyer: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, title: true, commodity: { select: { name: true } } } } } },
        },
      },
      transportProfile: {
        include: {
          user: { select: { id: true, name: true, mobile: true } },
          vehicles: { where: { isActive: true }, take: 1 },
        },
      },
    },
  });

  if (!delivery) { res.status(404).json({ error: 'Delivery not found' }); return; }

  const userId = req.user!.id;
  const isInvolved = delivery.order.farmerId === userId || delivery.order.buyerId === userId ||
    delivery.transportProfile.userId === userId || req.user!.role === 'ADMIN';
  if (!isInvolved) { res.status(403).json({ error: 'Access denied' }); return; }

  res.json({ delivery });
});

export default router;
