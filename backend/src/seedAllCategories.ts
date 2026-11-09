import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

async function seed() {
  console.log('[SeedAllCategories] Populating comprehensive catalog across all 7 categories...');

  // 1. Password hashes
  const farmerPasswordHash = await bcrypt.hash('farmer123', 12);

  // 2. Verified Farmers across major agricultural regions in India
  const farmersData = [
    { name: 'Ramesh Patel', email: 'ramesh.patel@kisanconnect.in', mobile: '9820123401', village: 'Lasalgaon', district: 'Nashik', state: 'Maharashtra' },
    { name: 'Harpreet Singh', email: 'harpreet.singh@kisanconnect.in', mobile: '9820123402', village: 'Samrala', district: 'Ludhiana', state: 'Punjab' },
    { name: 'Suresh Kumar', email: 'suresh.kumar@kisanconnect.in', mobile: '9820123403', village: 'Sehore', district: 'Bhopal', state: 'Madhya Pradesh' },
    { name: 'Priya Sharma', email: 'priya.sharma@kisanconnect.in', mobile: '9820123404', village: 'Modakkurichi', district: 'Erode', state: 'Tamil Nadu' },
    { name: 'Rajesh Choudhary', email: 'rajesh.choudhary@kisanconnect.in', mobile: '9820123405', village: 'Tenali', district: 'Guntur', state: 'Andhra Pradesh' },
    { name: 'Venkatesh Rao', email: 'venkatesh.rao@kisanconnect.in', mobile: '9820123406', village: 'Pandavapura', district: 'Mandya', state: 'Karnataka' },
    { name: 'Anil Verma', email: 'anil.verma@kisanconnect.in', mobile: '9820123407', village: 'Khandauli', district: 'Agra', state: 'Uttar Pradesh' },
    { name: 'Devendra Yadav', email: 'devendra.yadav@kisanconnect.in', mobile: '9820123408', village: 'Deoli', district: 'Kota', state: 'Rajasthan' },
  ];

  const farmerMap = new Map<string, string>(); // email -> userId

  for (const f of farmersData) {
    const user = await prisma.user.upsert({
      where: { email: f.email },
      create: {
        name: f.name,
        email: f.email,
        mobile: f.mobile,
        passwordHash: farmerPasswordHash,
        role: 'FARMER',
        farmerProfile: {
          create: {
            village: f.village,
            district: f.district,
            state: f.state,
          },
        },
      },
      update: {
        name: f.name,
      },
    });
    farmerMap.set(f.email, user.id);
  }

  // Also update original demo farmer name to remove [DEMO]
  await prisma.user.updateMany({
    where: { email: 'farmer@demo.in' },
    data: { name: 'Ramesh Patel' },
  });

  // 3. Ensure Commodities for all categories
  const allCommodities = [
    // VEGETABLE
    { name: 'Tomato', normalizedName: 'tomato', category: 'VEGETABLE', unit: 'Quintal' },
    { name: 'Onion', normalizedName: 'onion', category: 'VEGETABLE', unit: 'Quintal' },
    { name: 'Potato', normalizedName: 'potato', category: 'VEGETABLE', unit: 'Quintal' },
    { name: 'Green Chilli', normalizedName: 'green_chilli', category: 'VEGETABLE', unit: 'Quintal' },
    { name: 'Cauliflower', normalizedName: 'cauliflower', category: 'VEGETABLE', unit: 'Quintal' },
    { name: 'Capsicum', normalizedName: 'capsicum', category: 'VEGETABLE', unit: 'Quintal' },
    { name: 'Brinjal', normalizedName: 'brinjal', category: 'VEGETABLE', unit: 'Quintal' },
    { name: 'Carrot', normalizedName: 'carrot', category: 'VEGETABLE', unit: 'Quintal' },
    { name: 'Cabbage', normalizedName: 'cabbage', category: 'VEGETABLE', unit: 'Quintal' },

    // FRUIT
    { name: 'Grapes', normalizedName: 'grapes', category: 'FRUIT', unit: 'Quintal' },
    { name: 'Mango', normalizedName: 'mango', category: 'FRUIT', unit: 'Quintal' },
    { name: 'Orange', normalizedName: 'orange', category: 'FRUIT', unit: 'Quintal' },
    { name: 'Apple', normalizedName: 'apple', category: 'FRUIT', unit: 'Quintal' },
    { name: 'Banana', normalizedName: 'banana', category: 'FRUIT', unit: 'Quintal' },
    { name: 'Pomegranate', normalizedName: 'pomegranate', category: 'FRUIT', unit: 'Quintal' },

    // GRAIN
    { name: 'Wheat', normalizedName: 'wheat', category: 'GRAIN', unit: 'Quintal' },
    { name: 'Basmati Rice', normalizedName: 'basmati_rice', category: 'GRAIN', unit: 'Quintal' },
    { name: 'Rice', normalizedName: 'rice', category: 'GRAIN', unit: 'Quintal' },
    { name: 'Maize', normalizedName: 'maize', category: 'GRAIN', unit: 'Quintal' },
    { name: 'Bajra', normalizedName: 'bajra', category: 'GRAIN', unit: 'Quintal' },

    // PULSE
    { name: 'Tur Dal', normalizedName: 'tur_dal', category: 'PULSE', unit: 'Quintal' },
    { name: 'Chana', normalizedName: 'chana', category: 'PULSE', unit: 'Quintal' },
    { name: 'Moong Dal', normalizedName: 'moong_dal', category: 'PULSE', unit: 'Quintal' },
    { name: 'Urad Dal', normalizedName: 'urad_dal', category: 'PULSE', unit: 'Quintal' },
    { name: 'Masoor Dal', normalizedName: 'masoor_dal', category: 'PULSE', unit: 'Quintal' },

    // SPICE
    { name: 'Turmeric', normalizedName: 'turmeric', category: 'SPICE', unit: 'Quintal' },
    { name: 'Cumin', normalizedName: 'cumin', category: 'SPICE', unit: 'Quintal' },
    { name: 'Red Chilli', normalizedName: 'red_chilli', category: 'SPICE', unit: 'Quintal' },
    { name: 'Black Pepper', normalizedName: 'black_pepper', category: 'SPICE', unit: 'Quintal' },
    { name: 'Cardamom', normalizedName: 'cardamom', category: 'SPICE', unit: 'Quintal' },
    { name: 'Coriander', normalizedName: 'coriander', category: 'SPICE', unit: 'Quintal' },

    // OILSEED
    { name: 'Mustard', normalizedName: 'mustard', category: 'OILSEED', unit: 'Quintal' },
    { name: 'Soybean', normalizedName: 'soybean', category: 'OILSEED', unit: 'Quintal' },
    { name: 'Groundnut', normalizedName: 'groundnut', category: 'OILSEED', unit: 'Quintal' },
    { name: 'Sesame', normalizedName: 'sesame', category: 'OILSEED', unit: 'Quintal' },
    { name: 'Sunflower Seeds', normalizedName: 'sunflower_seeds', category: 'OILSEED', unit: 'Quintal' },

    // OTHER
    { name: 'Cotton', normalizedName: 'cotton', category: 'OTHER', unit: 'Quintal' },
    { name: 'Sugarcane', normalizedName: 'sugarcane', category: 'OTHER', unit: 'Quintal' },
    { name: 'Organic Jaggery', normalizedName: 'organic_jaggery', category: 'OTHER', unit: 'Quintal' },
    { name: 'Jute', normalizedName: 'jute', category: 'OTHER', unit: 'Quintal' },
  ];

  const commIdMap = new Map<string, string>(); // normalizedName -> commodityId

  for (const c of allCommodities) {
    const record = await prisma.commodity.upsert({
      where: { normalizedName: c.normalizedName },
      create: {
        name: c.name,
        normalizedName: c.normalizedName,
        category: c.category,
        unit: c.unit,
      },
      update: {
        name: c.name,
        category: c.category,
        unit: c.unit,
      },
    });
    commIdMap.set(c.normalizedName, record.id);
  }

  // 4. Clean up any existing titles that contain [DEMO]
  const oldDemoProducts = await prisma.product.findMany({
    where: { title: { contains: '[DEMO]' } },
  });
  for (const p of oldDemoProducts) {
    await prisma.product.update({
      where: { id: p.id },
      data: {
        title: p.title.replace(/\s*\[DEMO\]/g, '').trim(),
        isDemo: false,
      },
    });
  }

  // Also clean up any other demo users
  await prisma.user.updateMany({
    where: { name: { contains: '[DEMO]' } },
    data: {
      name: 'Ramesh Patel',
    },
  });

  // 5. Rich Listings for ALL 7 Categories
  const productsToCreate = [
    // === 1. VEGETABLE ===
    {
      farmerEmail: 'ramesh.patel@kisanconnect.in',
      commodityKey: 'tomato',
      title: 'Fresh Nashik Hybrid Tomatoes',
      description: 'Grade-A field tomatoes, farm-picked, rich red color, firm texture, ideal for wholesale & food processing.',
      quantity: 150,
      unit: 'Quintal',
      price: 1750,
      location: 'Nashik, Maharashtra',
      latitude: 19.9975,
      longitude: 73.7898,
    },
    {
      farmerEmail: 'ramesh.patel@kisanconnect.in',
      commodityKey: 'onion',
      title: 'Export Quality Lasalgaon Red Onions',
      description: 'Lasalgaon origin red onions. Cured and graded, 55mm+ size, long shelf life. Packaged in breathable mesh bags.',
      quantity: 200,
      unit: 'Quintal',
      price: 1400,
      location: 'Lasalgaon, Maharashtra',
      latitude: 20.1167,
      longitude: 74.0833,
    },
    {
      farmerEmail: 'anil.verma@kisanconnect.in',
      commodityKey: 'potato',
      title: 'Pukhraj Potatoes from Agra',
      description: 'Freshly harvested Agra Pukhraj variety, 45-60mm size, low sugar content, perfect for chips & table use.',
      quantity: 220,
      unit: 'Quintal',
      price: 950,
      location: 'Agra, Uttar Pradesh',
      latitude: 27.1767,
      longitude: 78.0081,
    },
    {
      farmerEmail: 'rajesh.choudhary@kisanconnect.in',
      commodityKey: 'green_chilli',
      title: 'G4 Hot Green Chillies',
      description: 'Bright green, fresh and pungent G4 chillies. Hand-sorted and ready for daily mandi dispatch.',
      quantity: 80,
      unit: 'Quintal',
      price: 2400,
      location: 'Guntur, Andhra Pradesh',
      latitude: 16.3067,
      longitude: 80.4365,
    },
    {
      farmerEmail: 'harpreet.singh@kisanconnect.in',
      commodityKey: 'cauliflower',
      title: 'Snowball Fresh Cauliflower Curds',
      description: 'Compact white curds, jacketed with fresh green leaves. Harvested at peak maturity in Ludhiana.',
      quantity: 110,
      unit: 'Quintal',
      price: 1200,
      location: 'Ludhiana, Punjab',
      latitude: 30.9010,
      longitude: 75.8573,
    },

    // === 2. FRUIT ===
    {
      farmerEmail: 'ramesh.patel@kisanconnect.in',
      commodityKey: 'grapes',
      title: 'Thompson Seedless Table Grapes',
      description: 'Export-grade Thompson seedless grapes from Sangli belt. High brix, uniform bunches, packaged in corrugated boxes.',
      quantity: 90,
      unit: 'Quintal',
      price: 5800,
      location: 'Sangli, Maharashtra',
      latitude: 16.8524,
      longitude: 74.5815,
    },
    {
      farmerEmail: 'ramesh.patel@kisanconnect.in',
      commodityKey: 'mango',
      title: 'Devgad Alphonso Mangoes (GI Tagged)',
      description: 'Authentic Devgad Alphonso mangoes, naturally ripened with grass hay. Exceptional aroma and sweet pulp.',
      quantity: 45,
      unit: 'Quintal',
      price: 7800,
      location: 'Ratnagiri, Maharashtra',
      latitude: 16.9902,
      longitude: 73.3120,
    },
    {
      farmerEmail: 'suresh.kumar@kisanconnect.in',
      commodityKey: 'orange',
      title: 'Nagpur Sweet Mandarin Oranges',
      description: 'Fresh juicy Nagpur oranges, bright orange peel, balanced sweet and tangy flavor. Graded into 15kg cartons.',
      quantity: 160,
      unit: 'Quintal',
      price: 3400,
      location: 'Nagpur, Maharashtra',
      latitude: 21.1458,
      longitude: 79.0882,
    },
    {
      farmerEmail: 'harpreet.singh@kisanconnect.in',
      commodityKey: 'apple',
      title: 'Royal Delicious Mountain Apples',
      description: 'Crisp, aromatic Royal Delicious apples grown in high-altitude orchards. Wax-free, deep red coloration.',
      quantity: 140,
      unit: 'Quintal',
      price: 6600,
      location: 'Shimla, Himachal Pradesh',
      latitude: 31.1048,
      longitude: 77.1734,
    },
    {
      farmerEmail: 'venkatesh.rao@kisanconnect.in',
      commodityKey: 'banana',
      title: 'Robusta G9 Clean Fresh Bananas',
      description: 'Green mature G9 Cavendish bananas. Uniform finger length, disease-free stems, harvested for institutional buyers.',
      quantity: 250,
      unit: 'Quintal',
      price: 1350,
      location: 'Mandya, Karnataka',
      latitude: 12.5218,
      longitude: 76.8951,
    },

    // === 3. GRAIN ===
    {
      farmerEmail: 'suresh.kumar@kisanconnect.in',
      commodityKey: 'wheat',
      title: 'MP Sharbati Golden Whole Wheat',
      description: 'Premium Sehore Sharbati wheat. Golden grains with heavy test weight, high protein, ideal for whole wheat atta.',
      quantity: 500,
      unit: 'Quintal',
      price: 2450,
      location: 'Sehore, Madhya Pradesh',
      latitude: 23.2033,
      longitude: 77.0844,
    },
    {
      farmerEmail: 'harpreet.singh@kisanconnect.in',
      commodityKey: 'basmati_rice',
      title: 'Traditional 1121 Extra Long Basmati Rice',
      description: 'Aged 1121 Basmati paddy/rice, remarkable kernel elongation upon cooking with exquisite natural aroma.',
      quantity: 380,
      unit: 'Quintal',
      price: 4300,
      location: 'Karnal, Haryana',
      latitude: 29.6857,
      longitude: 76.9905,
    },
    {
      farmerEmail: 'venkatesh.rao@kisanconnect.in',
      commodityKey: 'rice',
      title: 'Sona Masoori Raw Paddy Rice',
      description: 'Fine grain Sona Masoori rice from Tungabhadra river basin. Low starch, lightweight, preferred for daily consumption.',
      quantity: 320,
      unit: 'Quintal',
      price: 3650,
      location: 'Raichur, Karnataka',
      latitude: 16.2076,
      longitude: 77.3463,
    },
    {
      farmerEmail: 'venkatesh.rao@kisanconnect.in',
      commodityKey: 'maize',
      title: 'High-Density Yellow Corn Maize',
      description: 'Moisture < 12%, clean yellow corn maize for feed manufacturing and starch extraction plants.',
      quantity: 280,
      unit: 'Quintal',
      price: 1850,
      location: 'Davanagere, Karnataka',
      latitude: 14.4644,
      longitude: 75.9218,
    },
    {
      farmerEmail: 'devendra.yadav@kisanconnect.in',
      commodityKey: 'bajra',
      title: 'Rajasthan Hybrid Pearl Millet (Bajra)',
      description: 'High-energy organic Bajra grains with rich iron content. Cleaned and destoned, packaged in 50kg bags.',
      quantity: 210,
      unit: 'Quintal',
      price: 1720,
      location: 'Kota, Rajasthan',
      latitude: 25.2138,
      longitude: 75.8648,
    },

    // === 4. PULSE ===
    {
      farmerEmail: 'venkatesh.rao@kisanconnect.in',
      commodityKey: 'tur_dal',
      title: 'Gulbarga Desi Unpolished Tur Dal',
      description: 'GI-tagged Gulbarga Red Gram / Tur Dal. Unpolished, high nutritional retention, fast cooking with authentic taste.',
      quantity: 170,
      unit: 'Quintal',
      price: 9900,
      location: 'Kalaburagi, Karnataka',
      latitude: 17.3297,
      longitude: 76.8343,
    },
    {
      farmerEmail: 'suresh.kumar@kisanconnect.in',
      commodityKey: 'chana',
      title: 'Desi Brown Bengal Gram (Chana)',
      description: 'Clean bold brown chickpea chana. High germination rate, ideal for besan mills and dal processors.',
      quantity: 220,
      unit: 'Quintal',
      price: 5750,
      location: 'Bhopal, Madhya Pradesh',
      latitude: 23.2599,
      longitude: 77.4126,
    },
    {
      farmerEmail: 'ramesh.patel@kisanconnect.in',
      commodityKey: 'moong_dal',
      title: 'Latur Shiny Whole Green Moong',
      description: 'Clean green gram (whole moong) with uniform seed size. Free from infestation, optimal for sprouting & wholesale.',
      quantity: 130,
      unit: 'Quintal',
      price: 7600,
      location: 'Latur, Maharashtra',
      latitude: 18.4088,
      longitude: 76.5604,
    },
    {
      farmerEmail: 'ramesh.patel@kisanconnect.in',
      commodityKey: 'urad_dal',
      title: 'Maharashtra Bold Black Urad Dal',
      description: 'Whole black gram (urad) harvested from Marathwada region. High protein content, uniform black coat.',
      quantity: 95,
      unit: 'Quintal',
      price: 8350,
      location: 'Nagpur, Maharashtra',
      latitude: 21.1458,
      longitude: 79.0882,
    },
    {
      farmerEmail: 'suresh.kumar@kisanconnect.in',
      commodityKey: 'masoor_dal',
      title: 'Whole Red Masoor Lentils',
      description: 'Machine-graded small brown whole lentils (red inside). Thoroughly dried, excellent shelf stability.',
      quantity: 125,
      unit: 'Quintal',
      price: 6200,
      location: 'Indore, Madhya Pradesh',
      latitude: 22.7196,
      longitude: 75.8577,
    },

    // === 5. SPICE ===
    {
      farmerEmail: 'priya.sharma@kisanconnect.in',
      commodityKey: 'turmeric',
      title: 'Erode Salem Double-Polished Turmeric',
      description: 'Famous Salem quality turmeric fingers. Curcumin content 3.8%+, deep golden yellow, lab-tested for purity.',
      quantity: 85,
      unit: 'Quintal',
      price: 12800,
      location: 'Erode, Tamil Nadu',
      latitude: 11.3410,
      longitude: 77.7172,
    },
    {
      farmerEmail: 'devendra.yadav@kisanconnect.in',
      commodityKey: 'cumin',
      title: 'Unjha Machine Cleaned Cumin Seeds (Jeera)',
      description: 'Export-quality Gujarat cumin seeds, 99% purity (Singapore quality), intensely aromatic with high essential oil.',
      quantity: 65,
      unit: 'Quintal',
      price: 21500,
      location: 'Unjha, Gujarat',
      latitude: 23.8037,
      longitude: 72.3926,
    },
    {
      farmerEmail: 'rajesh.choudhary@kisanconnect.in',
      commodityKey: 'red_chilli',
      title: 'Guntur Sannam S4 Dry Red Chilli',
      description: 'World-renowned Guntur S4 dried red chillies with stem. Bright red color, high heat (SHU 25,000+), moisture < 10%.',
      quantity: 100,
      unit: 'Quintal',
      price: 16800,
      location: 'Guntur, Andhra Pradesh',
      latitude: 16.3067,
      longitude: 80.4365,
    },
    {
      farmerEmail: 'priya.sharma@kisanconnect.in',
      commodityKey: 'black_pepper',
      title: 'Malabar Wayanad Bold Black Pepper',
      description: 'Tellicherry Garbled Special Extra Bold (TGSEB) black peppercorns from Wayanad hills. Piperine > 5.5%.',
      quantity: 40,
      unit: 'Quintal',
      price: 49500,
      location: 'Wayanad, Kerala',
      latitude: 11.6854,
      longitude: 76.1320,
    },
    {
      farmerEmail: 'priya.sharma@kisanconnect.in',
      commodityKey: 'cardamom',
      title: 'Idukki Green Cardamom 8mm Bold',
      description: 'High-range green cardamom pods, 8mm+ diameter, vibrant green color, premium aroma, vacuum packed.',
      quantity: 15,
      unit: 'Quintal',
      price: 195000,
      location: 'Idukki, Kerala',
      latitude: 9.8497,
      longitude: 76.9774,
    },

    // === 6. OILSEED ===
    {
      farmerEmail: 'devendra.yadav@kisanconnect.in',
      commodityKey: 'mustard',
      title: 'Rajasthan High-Oil Black Mustard Seed (Sarson)',
      description: 'Black bold mustard seeds from Bharatpur belt. Oil content > 40%, clean, dry, suited for expeller oil processing.',
      quantity: 260,
      unit: 'Quintal',
      price: 5450,
      location: 'Bharatpur, Rajasthan',
      latitude: 27.2152,
      longitude: 77.5030,
    },
    {
      farmerEmail: 'suresh.kumar@kisanconnect.in',
      commodityKey: 'soybean',
      title: 'Malwa Yellow Soybean Seeds',
      description: 'Non-GMO Yellow Soybean. Protein content 38%+, oil content 19%+, moisture controlled, cleaned & graded.',
      quantity: 340,
      unit: 'Quintal',
      price: 4700,
      location: 'Indore, Madhya Pradesh',
      latitude: 22.7196,
      longitude: 75.8577,
    },
    {
      farmerEmail: 'devendra.yadav@kisanconnect.in',
      commodityKey: 'groundnut',
      title: 'Saurashtra Bold Groundnut (Peanut) Pods',
      description: 'Double-kernel bold groundnuts from Rajkot region. High oil yield, crunchy kernels, dried to safe storage moisture.',
      quantity: 230,
      unit: 'Quintal',
      price: 6300,
      location: 'Rajkot, Gujarat',
      latitude: 22.3039,
      longitude: 70.8022,
    },
    {
      farmerEmail: 'devendra.yadav@kisanconnect.in',
      commodityKey: 'sesame',
      title: 'Natural White Sesame Seeds (Til)',
      description: 'Premium white sesame seeds. Purity 99.9%, sweet nutty taste, ideal for confectionery and cold-pressed sesame oil.',
      quantity: 75,
      unit: 'Quintal',
      price: 11800,
      location: 'Surendranagar, Gujarat',
      latitude: 22.7274,
      longitude: 71.6370,
    },
    {
      farmerEmail: 'venkatesh.rao@kisanconnect.in',
      commodityKey: 'sunflower_seeds',
      title: 'High-Yield Black Sunflower Seeds',
      description: 'Clean black sunflower seeds with oil percentage exceeding 38%. Sourced directly from Bellary farmers.',
      quantity: 130,
      unit: 'Quintal',
      price: 4950,
      location: 'Koppal, Karnataka',
      latitude: 15.3533,
      longitude: 76.1558,
    },

    // === 7. OTHER ===
    {
      farmerEmail: 'rajesh.choudhary@kisanconnect.in',
      commodityKey: 'cotton',
      title: 'Telangana Long Staple Raw Cotton (Kapas)',
      description: 'Clean raw seed cotton with staple length 29-30mm. High ginning outturn, low trash content, stored in dry warehouse.',
      quantity: 250,
      unit: 'Quintal',
      price: 7200,
      location: 'Warangal, Telangana',
      latitude: 17.9689,
      longitude: 79.5941,
    },
    {
      farmerEmail: 'ramesh.patel@kisanconnect.in',
      commodityKey: 'sugarcane',
      title: 'High-Sucrose Fresh Sugarcane (Co-0238)',
      description: 'Co-0238 variety sugarcane harvested for sugar mills and jaggery units. High brix and juice recovery percentage.',
      quantity: 1200,
      unit: 'Quintal',
      price: 350,
      location: 'Kolhapur, Maharashtra',
      latitude: 16.7050,
      longitude: 74.2433,
    },
    {
      farmerEmail: 'ramesh.patel@kisanconnect.in',
      commodityKey: 'organic_jaggery',
      title: 'Kolhapur Chemical-Free Pure Jaggery (Gur)',
      description: 'Traditional solid jaggery blocks prepared without chemical clarifiers. Rich in iron, natural golden brown color.',
      quantity: 160,
      unit: 'Quintal',
      price: 3900,
      location: 'Kolhapur, Maharashtra',
      latitude: 16.7050,
      longitude: 74.2433,
    },
    {
      farmerEmail: 'harpreet.singh@kisanconnect.in',
      commodityKey: 'jute',
      title: 'Raw Tossa Jute Fiber (TD-5)',
      description: 'Well-retted golden Tossa jute fibers. Good tensile strength, low moisture, packed in standard commercial bales.',
      quantity: 180,
      unit: 'Quintal',
      price: 5200,
      location: 'Kolkata, West Bengal',
      latitude: 22.5726,
      longitude: 88.3639,
    },
  ];

  for (const prod of productsToCreate) {
    const commodityId = commIdMap.get(prod.commodityKey);
    const farmerId = farmerMap.get(prod.farmerEmail);
    if (!commodityId || !farmerId) {
      console.warn(`[Skip] missing commodity or farmer for ${prod.title}`);
      continue;
    }

    const existing = await prisma.product.findFirst({
      where: { title: prod.title },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          quantity: prod.quantity,
          price: prod.price,
          unit: prod.unit,
          description: prod.description,
          location: prod.location,
          latitude: prod.latitude,
          longitude: prod.longitude,
          isActive: true,
          isDemo: false,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          farmerId,
          commodityId,
          title: prod.title,
          description: prod.description,
          quantity: prod.quantity,
          unit: prod.unit,
          price: prod.price,
          location: prod.location,
          latitude: prod.latitude,
          longitude: prod.longitude,
          isActive: true,
          isDemo: false,
        },
      });
    }
  }

  const counts = await prisma.product.findMany({
    where: { isActive: true },
    include: { commodity: { select: { category: true } } },
  });

  const categoryCounts: Record<string, number> = {};
  for (const p of counts) {
    const cat = p.commodity?.category || 'UNKNOWN';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  console.log('[SeedAllCategories] Active products by category:', categoryCounts);
  console.log(`[SeedAllCategories] Total active listings: ${counts.length}`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[SeedAllCategories] Error:', e);
    process.exit(1);
  });
