import { Router, Response } from 'express';
import axios from 'axios';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const OSRM_BASE = process.env.OSRM_URL || 'https://router.project-osrm.org';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/geo/route
router.get('/route', async (req: AuthRequest, res: Response): Promise<void> => {
  const { fromLat, fromLng, toLat, toLng } = req.query;
  if (!fromLat || !fromLng || !toLat || !toLng) {
    res.status(400).json({ error: 'fromLat, fromLng, toLat, toLng required' });
    return;
  }
  try {
    const url = `${OSRM_BASE}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const { data } = await axios.get(url, { timeout: 10000 });
    if (data.code !== 'Ok' || !data.routes?.length) {
      res.json({ found: false, error: 'No route found' });
      return;
    }
    const route = data.routes[0];
    res.json({
      found: true,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMinutes: Math.round(route.duration / 60),
      geometry: route.geometry,
    });
  } catch (err) {
    console.error('[Geo] Route failed:', err instanceof Error ? err.message : err);
    res.json({ found: false, error: 'Routing service unavailable' });
  }
});

// GET /api/geo/distance
router.get('/distance', async (req: AuthRequest, res: Response): Promise<void> => {
  const { fromLat, fromLng, toLat, toLng } = req.query;
  if (!fromLat || !fromLng || !toLat || !toLng) {
    res.status(400).json({ error: 'fromLat, fromLng, toLat, toLng required' });
    return;
  }
  try {
    const url = `${OSRM_BASE}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const { data } = await axios.get(url, { timeout: 10000 });
    if (data.code === 'Ok' && data.routes?.length) {
      res.json({
        distanceKm: Math.round((data.routes[0].distance / 1000) * 10) / 10,
        durationMinutes: Math.round(data.routes[0].duration / 60),
        source: 'osrm',
      });
      return;
    }
  } catch { /* fallback below */ }

  const h = haversineDistance(parseFloat(String(fromLat)), parseFloat(String(fromLng)), parseFloat(String(toLat)), parseFloat(String(toLng)));
  res.json({
    distanceKm: Math.round(h * 1.3 * 10) / 10,
    durationMinutes: Math.round((h * 1.3) / 0.4),
    source: 'estimate',
    note: 'Estimated. Actual road distance may vary.',
  });
});

// GET /api/geo/nearby-markets
router.get('/nearby-markets', async (req: AuthRequest, res: Response): Promise<void> => {
  const { lat, lng, radiusKm = '50' } = req.query;
  if (!lat || !lng) { res.status(400).json({ error: 'lat and lng required' }); return; }

  const userLat = parseFloat(String(lat));
  const userLng = parseFloat(String(lng));
  const radius = parseFloat(String(radiusKm));

  const markets = await prisma.market.findMany({
    where: { isActive: true },
    select: { id: true, name: true, state: true, district: true, latitude: true, longitude: true, eNamStatus: true },
  });

  const nearby = markets
    .filter(m => m.latitude && m.longitude)
    .map(m => ({ ...m, distanceKm: Math.round(haversineDistance(userLat, userLng, m.latitude!, m.longitude!) * 10) / 10 }))
    .filter(m => m.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({ data: nearby });
});

export default router;
