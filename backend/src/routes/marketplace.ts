import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireFarmer } from '../middleware/roles';

const router = Router();

const ProductSchema = z.object({
  commodityId: z.string(),
  title: z.string().min(3),
  description: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().default('Quintal'),
  price: z.number().positive(),
  images: z.array(z.string()).optional(),
  location: z.string(),
});

// GET /api/marketplace/products
router.get('/products', async (req: AuthRequest, res: Response): Promise<void> => {
  const { commodity, category, state, search, page = '1', limit = '20', farmerOnly } = req.query;

  const pageNum = Math.max(1, parseInt(String(page)));
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));
  const skip = (pageNum - 1) * limitNum;

  const where: Record<string, unknown> = { isActive: true };

  const catParam = category ? String(category).trim().toUpperCase() : null;
  const commParam = commodity ? String(commodity).trim() : null;
  const KNOWN_CATEGORIES = ['VEGETABLE', 'FRUIT', 'GRAIN', 'PULSE', 'SPICE', 'OILSEED', 'OTHER'];

  // Category matching
  if (catParam && KNOWN_CATEGORIES.includes(catParam)) {
    where.commodity = { category: { equals: catParam } };
  } else if (commParam && KNOWN_CATEGORIES.includes(commParam.toUpperCase())) {
    where.commodity = { category: { equals: commParam.toUpperCase() } };
  } else if (commParam) {
    where.commodity = {
      OR: [
        { name: { contains: commParam } },
        { normalizedName: { contains: commParam.toLowerCase().replace(/\s+/g, '_') } },
      ],
    };
  }

  if (state) {
    where.location = { contains: String(state) };
  }

  if (search) {
    const s = String(search).trim();
    where.OR = [
      { title: { contains: s } },
      { description: { contains: s } },
      { location: { contains: s } },
    ];
  }

  if (farmerOnly === 'true' && req.user) {
    where.farmerId = req.user.id;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        commodity: { select: { id: true, name: true, category: true, unit: true } },
        farmer: { select: { id: true, name: true } },
        _count: { select: { favorites: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: products,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// GET /api/marketplace/products/:id
router.get('/products/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      commodity: { select: { id: true, name: true, category: true, unit: true } },
      farmer: {
        select: {
          id: true,
          name: true,
          farmerProfile: {
            select: { village: true, district: true, state: true },
          },
        },
      },
      _count: { select: { favorites: true } },
    },
  });

  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  // Get latest market price for price transparency
  const latestPrice = await prisma.marketPrice.findFirst({
    where: { commodityId: product.commodityId },
    orderBy: { priceDate: 'desc' },
    include: { market: { select: { name: true, state: true } } },
  });

  res.json({ product, latestMarketPrice: latestPrice });
});

// POST /api/marketplace/products - create product (farmer only)
router.post('/products', authenticate, requireFarmer, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = ProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { images, ...data } = parsed.data;
  const product = await prisma.product.create({
    data: {
      ...data,
      images: images ? JSON.stringify(images) : null,
      farmerId: req.user!.id,
    },
    include: {
      commodity: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ product });
});

// PATCH /api/marketplace/products/:id
router.patch('/products/:id', authenticate, requireFarmer, async (req: AuthRequest, res: Response): Promise<void> => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  if (product.farmerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Not authorized to update this product' });
    return;
  }

  const { images, ...rest } = req.body;
  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(images ? { images: JSON.stringify(images) } : {}),
    },
  });

  res.json({ product: updated });
});

// DELETE /api/marketplace/products/:id
router.delete('/products/:id', authenticate, requireFarmer, async (req: AuthRequest, res: Response): Promise<void> => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  if (product.farmerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ success: true });
});

// POST /api/marketplace/products/:id/favorite
router.post('/products/:id/favorite', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: req.user!.id, productId: req.params.id } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    res.json({ favorited: false });
  } else {
    await prisma.favorite.create({ data: { userId: req.user!.id, productId: req.params.id } });
    res.json({ favorited: true });
  }
});

export default router;
