/**
 * KisanConnect Seed Script
 * Seeds demo users, markets, commodities, products, and price data.
 * All demo marketplace data is marked with isDemo: true.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_MARKETS = [
  { name: 'Azadpur Mandi', state: 'Delhi', district: 'North West Delhi', latitude: 28.7225, longitude: 77.1617 },
  { name: 'APMC Market Pune', state: 'Maharashtra', district: 'Pune', latitude: 18.5204, longitude: 73.8567 },
  { name: 'Koyambedu Market', state: 'Tamil Nadu', district: 'Chennai', latitude: 13.0715, longitude: 80.1880 },
  { name: 'Yeshwanthpur Market', state: 'Karnataka', district: 'Bangalore', latitude: 13.0302, longitude: 77.5513 },
  { name: 'Ghazipur Mandi', state: 'Uttar Pradesh', district: 'Ghazipur', latitude: 25.5858, longitude: 83.5630 },
  { name: 'Lasalgaon APMC', state: 'Maharashtra', district: 'Nashik', latitude: 20.1167, longitude: 74.0833 },
  { name: 'Khurja Mandi', state: 'Uttar Pradesh', district: 'Bulandshahr', latitude: 28.2510, longitude: 77.8560 },
  { name: 'Vashi APMC', state: 'Maharashtra', district: 'Navi Mumbai', latitude: 19.0658, longitude: 73.0005 },
  { name: 'Ahmedabad APMC', state: 'Gujarat', district: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Jalandhar Grain Market', state: 'Punjab', district: 'Jalandhar', latitude: 31.3260, longitude: 75.5762 },
];

const DEMO_COMMODITIES = [
  { name: 'Tomato', normalizedName: 'tomato', category: 'VEGETABLE' },
  { name: 'Onion', normalizedName: 'onion', category: 'VEGETABLE' },
  { name: 'Potato', normalizedName: 'potato', category: 'VEGETABLE' },
  { name: 'Brinjal', normalizedName: 'brinjal', category: 'VEGETABLE' },
  { name: 'Capsicum', normalizedName: 'capsicum', category: 'VEGETABLE' },
  { name: 'Green Chilli', normalizedName: 'green_chilli', category: 'VEGETABLE' },
  { name: 'Cauliflower', normalizedName: 'cauliflower', category: 'VEGETABLE' },
  { name: 'Cabbage', normalizedName: 'cabbage', category: 'VEGETABLE' },
  { name: 'Carrot', normalizedName: 'carrot', category: 'VEGETABLE' },
  { name: 'Mango', normalizedName: 'mango', category: 'FRUIT' },
  { name: 'Banana', normalizedName: 'banana', category: 'FRUIT' },
  { name: 'Apple', normalizedName: 'apple', category: 'FRUIT' },
  { name: 'Grapes', normalizedName: 'grapes', category: 'FRUIT' },
  { name: 'Pomegranate', normalizedName: 'pomegranate', category: 'FRUIT' },
  { name: 'Wheat', normalizedName: 'wheat', category: 'GRAIN' },
  { name: 'Rice', normalizedName: 'rice', category: 'GRAIN' },
  { name: 'Maize', normalizedName: 'maize', category: 'GRAIN' },
  { name: 'Tur Dal', normalizedName: 'tur_dal', category: 'PULSE' },
  { name: 'Chana', normalizedName: 'chana', category: 'PULSE' },
  { name: 'Groundnut', normalizedName: 'groundnut', category: 'OILSEED' },
  { name: 'Mustard', normalizedName: 'mustard', category: 'OILSEED' },
  { name: 'Turmeric', normalizedName: 'turmeric', category: 'SPICE' },
  { name: 'Coriander', normalizedName: 'coriander', category: 'SPICE' },
  { name: 'Cumin', normalizedName: 'cumin', category: 'SPICE' },
];

// Demo prices (per quintal, INR) — realistic range
// [minPrice, maxPrice, modalPrice]
const COMMODITY_PRICES: Record<string, [number, number, number]> = {
  tomato: [800, 2400, 1600],
  onion: [600, 1800, 1200],
  potato: [500, 1200, 800],
  brinjal: [600, 1600, 1100],
  capsicum: [1500, 4000, 2800],
  green_chilli: [1000, 3500, 2200],
  cauliflower: [700, 1800, 1200],
  cabbage: [400, 1000, 700],
  carrot: [800, 2000, 1400],
  mango: [2000, 6000, 4000],
  banana: [800, 1800, 1200],
  apple: [4000, 9000, 6500],
  grapes: [3000, 8000, 5500],
  pomegranate: [5000, 12000, 8000],
  wheat: [2100, 2400, 2250],
  rice: [3000, 5000, 3800],
  maize: [1500, 2000, 1750],
  tur_dal: [8000, 12000, 9500],
  chana: [5000, 7000, 5800],
  groundnut: [5000, 7000, 6200],
  mustard: [5000, 6500, 5500],
  turmeric: [8000, 15000, 11000],
  coriander: [5000, 9000, 7000],
  cumin: [15000, 25000, 20000],
};

async function createDemoMarketPrices(
  marketId: string,
  commodityId: string,
  normalizedName: string,
  varietyId: string | null
) {
  const [baseMin, baseMax, baseModal] = COMMODITY_PRICES[normalizedName] ?? [1000, 2000, 1500];

  // Generate 90 days of historical prices with slight variation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingCount = await prisma.marketPrice.count({ where: { marketId, commodityId } });
  if (existingCount > 0) return; // Skip if already seeded

  const priceRecords = [];
  for (let i = 90; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip ~20% of days (market closed / no arrivals)
    if (Math.random() < 0.2) continue;

    const variation = 0.8 + Math.random() * 0.4; // ±20% variation
    const seasonal = 1 + 0.1 * Math.sin((i / 90) * Math.PI * 2); // Slight seasonal

    const minPrice = Math.round(baseMin * variation * seasonal);
    const maxPrice = Math.round(baseMax * variation * seasonal);
    const modalPrice = Math.round(baseModal * variation * seasonal);

    priceRecords.push({
      marketId,
      commodityId,
      varietyId,
      minPrice,
      maxPrice,
      modalPrice,
      arrivals: Math.round(5 + Math.random() * 100), // tonnes
      priceDate: date,
      source: 'demo-seed',
      sourceUrl: null,
    });
  }

  await prisma.marketPrice.createMany({ data: priceRecords });
}

async function main() {
  console.log('[Seed] Starting KisanConnect seed...');

  // ─── Users ───────────────────────────────────────────────────────
  console.log('[Seed] Creating demo users...');

  const adminHash = await bcrypt.hash('admin123', 12);
  const farmerHash = await bcrypt.hash('farmer123', 12);
  const buyerHash = await bcrypt.hash('buyer123', 12);
  const transportHash = await bcrypt.hash('transport123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kisanconnect.in' },
    create: {
      name: 'Admin KisanConnect',
      email: 'admin@kisanconnect.in',
      mobile: '9000000001',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
    update: {},
  });

  const farmer = await prisma.user.upsert({
    where: { email: 'farmer@demo.in' },
    create: {
      name: 'Ramesh Kumar [DEMO]',
      email: 'farmer@demo.in',
      mobile: '9000000002',
      passwordHash: farmerHash,
      role: 'FARMER',
      farmerProfile: {
        create: {
          village: 'Rampur',
          district: 'Nashik',
          state: 'Maharashtra',
          pincode: '422001',
          farmSize: 5.5,
          farmSizeUnit: 'acres',
        },
      },
    },
    update: {},
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@demo.in' },
    create: {
      name: 'Priya Traders [DEMO]',
      email: 'buyer@demo.in',
      mobile: '9000000003',
      passwordHash: buyerHash,
      role: 'BUYER',
      buyerProfile: {
        create: {
          companyName: 'Priya Agro Traders [DEMO]',
          district: 'Pune',
          state: 'Maharashtra',
          buyerType: 'TRADER',
        },
      },
    },
    update: {},
  });

  console.log(`[Seed] Users: admin=${admin.id}, farmer=${farmer.id}, buyer=${buyer.id}`);

  const transport = await prisma.user.upsert({
    where: { email: 'transport@demo.in' },
    create: {
      name: 'Suresh Driver [DEMO]',
      email: 'transport@demo.in',
      mobile: '9000000004',
      passwordHash: transportHash,
      role: 'TRANSPORT',
      transportProfile: {
        create: {
          district: 'Nashik',
          state: 'Maharashtra',
          licenseNumber: 'MH15DL2024',
          isAvailable: true,
          isVerified: true,
          serviceArea: JSON.stringify(['Nashik', 'Pune', 'Mumbai']),
          vehicles: {
            create: [
              { type: 'MINI_TRUCK', registrationNumber: 'MH15AB1234', capacityKg: 2000, isRefrigerated: false },
              { type: 'TEMPO', registrationNumber: 'MH15CD5678', capacityKg: 800, isRefrigerated: false },
            ],
          },
        },
      },
    },
    update: {},
  });

  console.log(`[Seed] Transport user: ${transport.id}`);

  // ─── Markets ──────────────────────────────────────────────────────
  console.log('[Seed] Creating demo markets...');
  const marketIds: string[] = [];

  for (const m of DEMO_MARKETS) {
    const market = await prisma.market.upsert({
      where: { name_district_state: { name: m.name, district: m.district, state: m.state } },
      create: m,
      update: {},
    });
    marketIds.push(market.id);
  }

  // ─── Commodities ──────────────────────────────────────────────────
  console.log('[Seed] Creating commodities...');
  const commodityMap: Record<string, string> = {}; // normalizedName -> id

  for (const c of DEMO_COMMODITIES) {
    const commodity = await prisma.commodity.upsert({
      where: { normalizedName: c.normalizedName },
      create: c,
      update: {},
    });
    commodityMap[c.normalizedName] = commodity.id;
  }

  // Varieties for some commodities
  const tomatoId = commodityMap['tomato'];
  const onionId = commodityMap['onion'];

  if (tomatoId) {
    for (const v of ['Hybrid', 'Desi', 'Cherry']) {
      await prisma.commodityVariety.upsert({
        where: { commodityId_normalizedName: { commodityId: tomatoId, normalizedName: v.toLowerCase() } },
        create: { commodityId: tomatoId, name: v, normalizedName: v.toLowerCase() },
        update: {},
      });
    }
  }

  if (onionId) {
    for (const v of ['Red', 'White', 'Pink']) {
      await prisma.commodityVariety.upsert({
        where: { commodityId_normalizedName: { commodityId: onionId, normalizedName: v.toLowerCase() } },
        create: { commodityId: onionId, name: v, normalizedName: v.toLowerCase() },
        update: {},
      });
    }
  }

  // ─── Demo Market Prices ───────────────────────────────────────────
  console.log('[Seed] Generating demo market prices (90-day history)...');

  // Seed prices for all markets × all commodities
  const topMarketIds = marketIds;
  const topCommodities = DEMO_COMMODITIES;

  for (const marketId of topMarketIds) {
    for (const commodity of topCommodities) {
      const commodityId = commodityMap[commodity.normalizedName];
      if (commodityId) {
        await createDemoMarketPrices(marketId, commodityId, commodity.normalizedName, null);
      }
    }
  }

  // ─── Demo Products ────────────────────────────────────────────────
  console.log('[Seed] Creating demo marketplace products...');

  const demoProducts = [
    { commodityKey: 'tomato', title: 'Fresh Hybrid Tomatoes [DEMO]', description: 'Farm-fresh hybrid tomatoes from Nashik. Grade A quality, ideal for wholesale.', quantity: 50, unit: 'Quintal', price: 1800, location: 'Nashik, Maharashtra' },
    { commodityKey: 'onion', title: 'Red Onion, Export Quality [DEMO]', description: 'Lasalgaon origin red onions. High dry matter content. Available in 25kg bags.', quantity: 200, unit: 'Quintal', price: 1400, location: 'Nashik, Maharashtra' },
    { commodityKey: 'potato', title: 'Pukhraj Potato from Agra [DEMO]', description: 'Pukhraj variety potato, freshly harvested, 35-50mm size. Cold storage available.', quantity: 100, unit: 'Quintal', price: 900, location: 'Agra, Uttar Pradesh' },
    { commodityKey: 'wheat', title: 'Sharbati Wheat (Premium) [DEMO]', description: 'Premium Sharbati wheat from MP. High gluten, ideal for atta mills.', quantity: 500, unit: 'Quintal', price: 2350, location: 'Bhopal, Madhya Pradesh' },
    { commodityKey: 'turmeric', title: 'Erode Turmeric Finger [DEMO]', description: 'Polished Erode turmeric fingers. Curcumin content 3.5%+. FSSAI approved.', quantity: 30, unit: 'Quintal', price: 12000, location: 'Erode, Tamil Nadu' },
    { commodityKey: 'grapes', title: 'Thompson Seedless Grapes [DEMO]', description: 'Export quality Thompson seedless grapes from Sangli. Uniform berry size.', quantity: 20, unit: 'Quintal', price: 6000, location: 'Sangli, Maharashtra' },
  ];

  for (const dp of demoProducts) {
    const commodityId = commodityMap[dp.commodityKey];
    if (!commodityId) continue;

    const existing = await prisma.product.findFirst({
      where: { title: dp.title, farmerId: farmer.id },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          farmerId: farmer.id,
          commodityId,
          title: dp.title,
          description: dp.description,
          quantity: dp.quantity,
          unit: dp.unit,
          price: dp.price,
          location: dp.location,
          isDemo: true,
          isActive: true,
        },
      });
    }
  }

  // ─── Demo Order ───────────────────────────────────────────────────
  console.log('[Seed] Creating demo order...');

  const firstProduct = await prisma.product.findFirst({
    where: { farmerId: farmer.id, isDemo: true, isActive: true },
  });

  if (firstProduct) {
    const existingOrder = await prisma.order.findFirst({
      where: { buyerId: buyer.id, farmerId: farmer.id },
    });

    if (!existingOrder) {
      await prisma.order.create({
        data: {
          buyerId: buyer.id,
          farmerId: farmer.id,
          status: 'ACCEPTED',
          totalAmount: firstProduct.price * 10,
          notes: 'Demo order — please disregard',
          items: {
            create: {
              productId: firstProduct.id,
              quantity: 10,
              unit: firstProduct.unit,
              price: firstProduct.price,
            },
          },
        },
      });
    }
  }

  // ─── Data Source ──────────────────────────────────────────────────
  await prisma.dataSource.upsert({
    where: { name: 'data.gov.in-agmarknet' },
    create: {
      name: 'data.gov.in-agmarknet',
      url: 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
      isActive: true,
      status: 'IDLE',
    },
    update: {},
  });

  console.log('[Seed] ✓ Seed complete!');
  console.log('[Seed] Demo credentials:');
  console.log('  Admin:     admin@kisanconnect.in / admin123');
  console.log('  Farmer:    farmer@demo.in / farmer123');
  console.log('  Buyer:     buyer@demo.in / buyer123');
  console.log('  Transport: transport@demo.in / transport123');
}

main()
  .catch((err) => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
