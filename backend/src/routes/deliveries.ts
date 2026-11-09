import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { optionalAuth, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Estimate logic supporting both GET and POST with coords or distanceKm
const handleEstimate = async (req: Request, res: Response): Promise<void> => {
  const params = { ...req.query, ...req.body };
  let distanceKm = parseFloat(String(params.distanceKm || '0'));

  const { pickupLat, pickupLng, deliveryLat, deliveryLng, vehicleType, isRefrigerated } = params;

  if ((!distanceKm || distanceKm <= 0) && pickupLat && pickupLng && deliveryLat && deliveryLng) {
    const rawDist = haversineDistance(
      parseFloat(String(pickupLat)),
      parseFloat(String(pickupLng)),
      parseFloat(String(deliveryLat)),
      parseFloat(String(deliveryLng))
    );
    // Road factor 1.3
    distanceKm = Math.round(rawDist * 1.3 * 10) / 10;
  }

  if (!distanceKm || distanceKm <= 0) {
    distanceKm = 10; // Sensible default if coordinates are identical or missing
  }

  const baseCharge = 100;
  const perKmRates: Record<string, number> = {
    THREE_WHEELER: 4, PICKUP: 5, MINI_TRUCK: 6, TEMPO: 7, TRUCK: 8, TRACTOR: 5,
  };
  const vType = String(vehicleType || 'MINI_TRUCK');
  const perKmRate = perKmRates[vType] || 6;
  const isRefrig = String(isRefrigerated) === 'true' || Boolean(isRefrigerated);

  let transportCost = baseCharge + (distanceKm * perKmRate);
  const refrigSurcharge = isRefrig ? Math.round(transportCost * 0.3) : 0;
  if (isRefrig) transportCost += refrigSurcharge;
  transportCost = Math.round(transportCost);

  res.json({
    distanceKm,
    vehicleType: vType,
    isRefrigerated: isRefrig,
    transportCost,
    estimatedDuration: Math.round(distanceKm * 2.5),
    breakdown: {
      baseCharge,
      baseFare: baseCharge,
      distanceCharge: Math.round(distanceKm * perKmRate),
      distanceFare: Math.round(distanceKm * perKmRate),
      refrigerationSurcharge: refrigSurcharge,
    },
    note: 'Estimate only. Actual cost may vary based on road conditions and availability.',
  });
};

router.get('/estimate', optionalAuth, handleEstimate);
router.post('/estimate', optionalAuth, handleEstimate);

// GET /api/deliveries/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const delivery = await prisma.delivery.findUnique({
    where: { id: req.params.id },
    include: {
      order: {
        include: {
          farmer: { select: { id: true, name: true } },
          buyer: { select: { id: true, name: true } },
          items: { include: { product: { select: { title: true } } } },
        },
      },
      transportProfile: {
        include: {
          user: { select: { name: true, mobile: true } },
          vehicles: true,
        },
      },
    },
  });

  if (!delivery) {
    res.status(404).json({ error: 'Delivery not found' });
    return;
  }

  // Access check
  const isFarmer = delivery.order.farmerId === req.user!.id;
  const isBuyer = delivery.order.buyerId === req.user!.id;
  const isDriver = delivery.transportProfile?.userId === req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';

  if (!isFarmer && !isBuyer && !isDriver && !isAdmin) {
    res.status(403).json({ error: 'Not authorized to view this delivery' });
    return;
  }

  res.json({ delivery });
});

export default router;
