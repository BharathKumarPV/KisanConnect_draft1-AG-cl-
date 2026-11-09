import { prisma } from '../lib/prisma';
import { dataGovProvider, DataGovRecord } from './dataGovProvider';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Karnataka',
  'Maharashtra',
  'Madhya Pradesh',
  'Uttar Pradesh',
  'Rajasthan',
  'Gujarat',
  'Punjab',
  'Haryana',
  'Tamil Nadu',
  'Telangana',
  'West Bengal',
];

function normalizeStr(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, '_');
}

async function upsertMarket(
  name: string,
  state: string,
  district: string
): Promise<string> {
  const existing = await prisma.market.findFirst({
    where: {
      name: { equals: name },
      district: { equals: district },
      state: { equals: state },
    },
  });

  if (existing) return existing.id;

  const created = await prisma.market.create({
    data: { name, state, district },
  });
  return created.id;
}

async function upsertCommodity(name: string): Promise<string> {
  const normalized = normalizeStr(name);
  const existing = await prisma.commodity.findUnique({
    where: { normalizedName: normalized },
  });

  if (existing) return existing.id;

  // Categorize based on commodity name
  const category = categorizeCommodity(name);
  const created = await prisma.commodity.create({
    data: { name, normalizedName: normalized, category },
  });
  return created.id;
}

function categorizeCommodity(name: string): string {
  const n = name.toLowerCase();
  const vegetables = ['tomato', 'onion', 'potato', 'brinjal', 'ladyfinger', 'cabbage', 'cauliflower', 'carrot', 'radish', 'spinach', 'bitter gourd', 'bottle gourd', 'ridge gourd', 'snake gourd', 'drumstick', 'cucumber', 'green chilli', 'capsicum', 'garlic', 'ginger'];
  const fruits = ['mango', 'banana', 'apple', 'orange', 'grapes', 'papaya', 'watermelon', 'muskmelon', 'pineapple', 'pomegranate', 'guava', 'coconut', 'lemon', 'lime', 'kinnow'];
  const grains = ['wheat', 'rice', 'maize', 'jowar', 'bajra', 'ragi', 'barley', 'paddy'];
  const pulses = ['tur', 'urad', 'moong', 'masur', 'chana', 'gram', 'arhar', 'soyabean', 'lentil'];
  const spices = ['turmeric', 'chilli', 'coriander', 'cumin', 'pepper', 'cardamom', 'clove', 'ginger powder', 'fennel', 'fenugreek', 'ajwain'];
  const oilseeds = ['groundnut', 'mustard', 'sunflower', 'sesame', 'linseed', 'castor', 'safflower', 'copra'];

  if (vegetables.some((v) => n.includes(v))) return 'VEGETABLE';
  if (fruits.some((f) => n.includes(f))) return 'FRUIT';
  if (grains.some((g) => n.includes(g))) return 'GRAIN';
  if (pulses.some((p) => n.includes(p))) return 'PULSE';
  if (spices.some((s) => n.includes(s))) return 'SPICE';
  if (oilseeds.some((o) => n.includes(o))) return 'OILSEED';
  return 'OTHER';
}

async function upsertVariety(commodityId: string, name: string): Promise<string | null> {
  if (!name || name === 'Other' || name === 'FAQ' || name.toLowerCase() === 'unspecified') {
    return null;
  }

  const normalized = normalizeStr(name);
  const existing = await prisma.commodityVariety.findFirst({
    where: { commodityId, normalizedName: normalized },
  });

  if (existing) return existing.id;

  const created = await prisma.commodityVariety.create({
    data: { commodityId, name, normalizedName: normalized },
  });
  return created.id;
}

async function upsertDataSource(): Promise<string> {
  const source = await prisma.dataSource.upsert({
    where: { name: 'data.gov.in-agmarknet' },
    create: {
      name: 'data.gov.in-agmarknet',
      url: 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
      isActive: true,
    },
    update: {},
  });
  return source.id;
}

export async function syncMandiData(states?: string[]): Promise<{
  imported: number;
  errors: string[];
  duration: number;
}> {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalImported = 0;

  const targetStates = states || INDIAN_STATES;
  const sourceId = await upsertDataSource();

  // Create sync log
  const syncLog = await prisma.dataSyncLog.create({
    data: { dataSourceId: sourceId, status: 'RUNNING' },
  });

  await prisma.dataSource.update({
    where: { id: sourceId },
    data: { status: 'RUNNING' },
  });

  try {
    for (const state of targetStates) {
      try {
        console.log(`[SyncService] Fetching prices for ${state}...`);
        const records = await dataGovProvider.fetchAllPagesForState(state);
        console.log(`[SyncService] Got ${records.length} records for ${state}`);

        let stateImported = 0;
        for (const record of records) {
          try {
            await processRecord(record);
            stateImported++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`${state}/${record.Market}/${record.Commodity}: ${msg}`);
          }
        }
        totalImported += stateImported;
        console.log(`[SyncService] Imported ${stateImported} records for ${state}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to fetch ${state}: ${msg}`);
        console.error(`[SyncService] Error for ${state}:`, msg);
      }
    }

    const duration = Date.now() - startTime;

    await prisma.dataSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL',
        completedAt: new Date(),
        recordsImported: totalImported,
        errors: JSON.stringify(errors.slice(0, 100)),
        duration,
      },
    });

    await prisma.dataSource.update({
      where: { id: sourceId },
      data: {
        status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL',
        lastSyncAt: new Date(),
        recordsImported: { increment: totalImported },
        errorCount: { increment: errors.length },
      },
    });

    return { imported: totalImported, errors, duration };
  } catch (err) {
    const duration = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : String(err);

    await prisma.dataSyncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: JSON.stringify([msg]),
        duration,
      },
    });

    await prisma.dataSource.update({
      where: { id: sourceId },
      data: { status: 'FAILED' },
    });

    throw err;
  }
}

async function processRecord(record: DataGovRecord): Promise<void> {
  const priceDate = dataGovProvider.parseDate(record.Arrival_Date);
  const minPrice = dataGovProvider.parsePrice(record['Min_x0020_Price']);
  const maxPrice = dataGovProvider.parsePrice(record['Max_x0020_Price']);
  const modalPrice = dataGovProvider.parsePrice(record['Modal_x0020_Price']);

  // Skip invalid prices
  if (modalPrice <= 0) return;

  const marketId = await upsertMarket(record.Market, record.State, record.District);
  const commodityId = await upsertCommodity(record.Commodity);
  const varietyId = await upsertVariety(commodityId, record.Variety);

  // Check for existing record (same market, commodity, variety, date)
  const existing = await prisma.marketPrice.findFirst({
    where: {
      marketId,
      commodityId,
      varietyId: varietyId ?? undefined,
      priceDate,
    },
  });

  if (existing) {
    // Update with latest data
    await prisma.marketPrice.update({
      where: { id: existing.id },
      data: {
        minPrice,
        maxPrice,
        modalPrice,
        retrievedAt: new Date(),
        rawData: JSON.stringify(record),
      },
    });
  } else {
    await prisma.marketPrice.create({
      data: {
        marketId,
        commodityId,
        varietyId,
        minPrice,
        maxPrice,
        modalPrice,
        priceDate,
        source: 'data.gov.in',
        sourceUrl: 'https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi',
        rawData: JSON.stringify(record),
      },
    });
  }
}

export async function getSyncStatus(): Promise<{
  isConfigured: boolean;
  lastSync: Date | null;
  totalRecords: number;
  recentLogs: Array<{ status: string; recordsImported: number; startedAt: Date; duration: number | null }>;
}> {
  const source = await prisma.dataSource.findUnique({
    where: { name: 'data.gov.in-agmarknet' },
    include: {
      syncLogs: {
        orderBy: { startedAt: 'desc' },
        take: 5,
        select: {
          status: true,
          recordsImported: true,
          startedAt: true,
          duration: true,
        },
      },
    },
  });

  const totalRecords = await prisma.marketPrice.count();

  return {
    isConfigured: dataGovProvider.isConfigured(),
    lastSync: source?.lastSyncAt ?? null,
    totalRecords,
    recentLogs: (source?.syncLogs ?? []).map((l) => ({
      status: l.status,
      recordsImported: l.recordsImported,
      startedAt: l.startedAt,
      duration: l.duration,
    })),
  };
}
