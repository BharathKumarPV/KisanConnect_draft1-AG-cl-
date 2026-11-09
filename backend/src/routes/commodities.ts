import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/commodities
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { category, search, page = '1', limit = '50' } = req.query;

  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(200, Math.max(1, parseInt(String(limit))));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};
  if (category) where.category = String(category).toUpperCase();
  if (search) {
    where.name = { contains: String(search) };
  }

  const [commodities, total] = await Promise.all([
    prisma.commodity.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { name: 'asc' },
      include: {
        varieties: { select: { id: true, name: true } },
        _count: { select: { prices: true } },
      },
    }),
    prisma.commodity.count({ where }),
  ]);

  res.json({
    data: commodities,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// GET /api/commodities/categories
router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  const categories = await prisma.commodity.groupBy({
    by: ['category'],
    _count: { id: true },
    orderBy: { category: 'asc' },
  });

  res.json(categories.map((c) => ({ category: c.category, count: c._count.id })));
});

// GET /api/commodities/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const commodity = await prisma.commodity.findFirst({
    where: {
      OR: [
        { id: req.params.id },
        { normalizedName: req.params.id.toLowerCase() },
      ],
    },
    include: {
      varieties: true,
      _count: { select: { prices: true } },
    },
  });

  if (!commodity) {
    res.status(404).json({ error: 'Commodity not found' });
    return;
  }

  res.json({ commodity });
});

// GET /api/commodities/:id/prices - prices across all markets for this commodity
router.get('/:id/prices', async (req: Request, res: Response): Promise<void> => {
  const { from, to, state, page = '1', limit = '30' } = req.query;

  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));
  const skip = (pageNum - 1) * limitNum;

  const commodity = await prisma.commodity.findFirst({
    where: {
      OR: [
        { id: req.params.id },
        { normalizedName: req.params.id.toLowerCase() },
      ],
    },
  });

  if (!commodity) {
    res.status(404).json({ error: 'Commodity not found' });
    return;
  }

  const where: Record<string, unknown> = { commodityId: commodity.id };
  if (from || to) {
    where.priceDate = {
      ...(from ? { gte: new Date(String(from)) } : {}),
      ...(to ? { lte: new Date(String(to)) } : {}),
    };
  }
  if (state) {
    where.market = { state: { equals: String(state) } };
  }

  const [prices, total] = await Promise.all([
    prisma.marketPrice.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { priceDate: 'desc' },
      include: {
        market: { select: { id: true, name: true, state: true, district: true } },
        variety: { select: { id: true, name: true } },
      },
    }),
    prisma.marketPrice.count({ where }),
  ]);

  res.json({
    commodity,
    data: prices,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

export default router;
