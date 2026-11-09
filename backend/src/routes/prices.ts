import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { dataGovProvider } from '../services/dataGovProvider';

const router = Router();

// GET /api/prices/latest - latest prices with filters
router.get('/latest', async (req: Request, res: Response): Promise<void> => {
  const { commodity, state, district, market, page = '1', limit = '30' } = req.query;

  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = {};

  if (commodity) {
    where.commodity = {
      OR: [
        { name: { contains: String(commodity) } },
        { normalizedName: { contains: String(commodity).toLowerCase().replace(/\s+/g, '_') } },
      ],
    };
  }

  if (state || district || market) {
    where.market = {
      ...(state ? { state: { equals: String(state) } } : {}),
      ...(district ? { district: { contains: String(district) } } : {}),
      ...(market ? { name: { contains: String(market) } } : {}),
    };
  }

  // Get latest date available
  const latestRecord = await prisma.marketPrice.findFirst({
    where,
    orderBy: { priceDate: 'desc' },
    select: { priceDate: true },
  });

  if (latestRecord) {
    // Filter to within 7 days of latest to show "latest" data
    const cutoff = new Date(latestRecord.priceDate);
    cutoff.setDate(cutoff.getDate() - 7);
    (where as Record<string, unknown>).priceDate = { gte: cutoff };
  }

  const [prices, total] = await Promise.all([
    prisma.marketPrice.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: [{ priceDate: 'desc' }, { modalPrice: 'desc' }],
      include: {
        commodity: { select: { id: true, name: true, category: true, unit: true } },
        market: { select: { id: true, name: true, state: true, district: true } },
        variety: { select: { id: true, name: true } },
      },
    }),
    prisma.marketPrice.count({ where }),
  ]);

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
      apiConfigured: dataGovProvider.isConfigured(),
      note: dataGovProvider.isConfigured()
        ? null
        : 'API key not configured — showing cached/demo data.',
    },
  });
});

// GET /api/prices/history - price history for a commodity+market
router.get('/history', async (req: Request, res: Response): Promise<void> => {
  const commodityParam = req.query.commodity || req.query.commodityId;
  const { market, from, to, variety } = req.query;

  if (!commodityParam) {
    res.status(400).json({ error: 'commodity parameter is required' });
    return;
  }

  const where: Record<string, unknown> = {};

  where.commodity = {
    OR: [
      { id: String(commodityParam) },
      { name: { equals: String(commodityParam) } },
      { normalizedName: String(commodityParam).toLowerCase().replace(/\s+/g, '_') },
    ],
  };

  if (market) {
    where.market = {
      OR: [
        { id: String(market) },
        { name: { contains: String(market) } },
      ],
    };
  }

  if (variety) {
    where.variety = { name: { contains: String(variety) } };
  }

  // Default: last 90 days
  const toDate = to ? new Date(String(to)) : new Date();
  const fromDate = from
    ? new Date(String(from))
    : new Date(toDate.getTime() - 90 * 24 * 60 * 60 * 1000);

  where.priceDate = { gte: fromDate, lte: toDate };

  const prices = await prisma.marketPrice.findMany({
    where,
    orderBy: { priceDate: 'asc' },
    include: {
      commodity: { select: { id: true, name: true, unit: true } },
      market: { select: { id: true, name: true, state: true, district: true } },
      variety: { select: { id: true, name: true } },
    },
    take: 500,
  });

  res.json({ data: prices });
});

// GET /api/prices/compare - compare prices across multiple markets
router.get('/compare', async (req: Request, res: Response): Promise<void> => {
  const { commodity, markets } = req.query;

  if (!commodity) {
    res.status(400).json({ error: 'commodity parameter is required' });
    return;
  }

  const marketList = markets
    ? String(markets).split(',').map((m) => m.trim())
    : [];

  const commodityRecord = await prisma.commodity.findFirst({
    where: {
      OR: [
        { id: String(commodity) },
        { name: { equals: String(commodity) } },
        { normalizedName: String(commodity).toLowerCase().replace(/\s+/g, '_') },
      ],
    },
  });

  if (!commodityRecord) {
    res.status(404).json({ error: 'Commodity not found' });
    return;
  }

  // Get latest price per market
  const marketWhere: Record<string, unknown> = {};
  if (marketList.length > 0) {
    marketWhere.OR = marketList.map((m) => ({
      OR: [{ id: m }, { name: { contains: m } }],
    }));
  }

  // Find recent cutoff (last 14 days)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);

  const rawPrices = await prisma.marketPrice.findMany({
    where: {
      commodityId: commodityRecord.id,
      priceDate: { gte: cutoff },
      ...(marketList.length > 0 ? { market: marketWhere } : {}),
    },
    orderBy: { priceDate: 'desc' },
    include: {
      market: { select: { id: true, name: true, state: true, district: true } },
      variety: { select: { id: true, name: true } },
    },
    take: 500,
  });

  // Deduplicate: one latest price per market
  const marketMap = new Map<string, typeof rawPrices[0]>();
  for (const price of rawPrices) {
    if (!marketMap.has(price.marketId)) {
      marketMap.set(price.marketId, price);
    }
  }

  const comparison = Array.from(marketMap.values()).map((p) => ({
    marketId: p.market.id,
    marketName: p.market.name,
    state: p.market.state,
    district: p.market.district,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    modalPrice: p.modalPrice,
    priceDate: p.priceDate,
    variety: p.variety?.name ?? null,
    note: 'Indicative price difference — does not account for transport, commission or local taxes.',
  }));

  res.json({
    commodity: commodityRecord,
    comparison,
    disclaimer: 'Prices are indicative. Actual prices may vary based on quality, transport costs, and market conditions.',
  });
});

export default router;
