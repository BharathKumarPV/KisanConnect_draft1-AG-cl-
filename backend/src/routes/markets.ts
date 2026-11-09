import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/markets - list markets with optional filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { state, district, search, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { isActive: true };
  if (state) where.state = { equals: String(state) };
  if (district) where.district = { contains: String(district) };
  if (search) {
    where.OR = [
      { name: { contains: String(search) } },
      { district: { contains: String(search) } },
      { state: { contains: String(search) } },
    ];
  }

  const [markets, total] = await Promise.all([
    prisma.market.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: [{ state: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        state: true,
        district: true,
        apmc: true,
        eNamStatus: true,
        latitude: true,
        longitude: true,
        _count: { select: { prices: true } },
      },
    }),
    prisma.market.count({ where }),
  ]);

  res.json({
    data: markets,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// GET /api/markets/states - distinct states with market counts
router.get('/states', async (_req: Request, res: Response): Promise<void> => {
  const states = await prisma.market.groupBy({
    by: ['state'],
    _count: { id: true },
    where: { isActive: true },
    orderBy: { state: 'asc' },
  });

  res.json(states.map((s) => ({ state: s.state, count: s._count.id })));
});

// GET /api/markets/:id - single market detail
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const market = await prisma.market.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { prices: true } },
    },
  });

  if (!market) {
    res.status(404).json({ error: 'Market not found' });
    return;
  }

  res.json({ market });
});

// GET /api/markets/:id/prices - prices for a market
router.get('/:id/prices', async (req: Request, res: Response): Promise<void> => {
  const { commodity, from, to, page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { marketId: req.params.id };

  if (commodity) {
    where.commodity = {
      normalizedName: { contains: String(commodity).toLowerCase().replace(/\s+/g, '_') },
    };
  }

  if (from || to) {
    where.priceDate = {
      ...(from ? { gte: new Date(String(from)) } : {}),
      ...(to ? { lte: new Date(String(to)) } : {}),
    };
  }

  const [prices, total] = await Promise.all([
    prisma.marketPrice.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { priceDate: 'desc' },
      include: {
        commodity: { select: { id: true, name: true, category: true } },
        variety: { select: { id: true, name: true } },
        market: { select: { id: true, name: true, state: true, district: true } },
      },
    }),
    prisma.marketPrice.count({ where }),
  ]);

  // Data freshness info
  const latestSync = await prisma.dataSource.findUnique({
    where: { name: 'data.gov.in-agmarknet' },
    select: { lastSyncAt: true, status: true },
  });

  res.json({
    data: prices,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    meta: {
      source: 'AGMARKNET via data.gov.in',
      sourceUrl: 'https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi',
      lastSynchronized: latestSync?.lastSyncAt ?? null,
      syncStatus: latestSync?.status ?? 'UNKNOWN',
    },
  });
});

export default router;
