import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

interface TestResult {
  suite: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ suite, name, status: 'PASS', durationMs: Date.now() - start });
    console.log(`  [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    const errorMsg = err.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}` : err.message;
    results.push({ suite, name, status: 'FAIL', details: errorMsg, durationMs: Date.now() - start });
    console.error(`  [FAIL] ${name}: ${errorMsg}`);
  }
}

async function main() {
  console.log('=== KisanConnect End-to-End Test Suite ===\n');

  let adminToken = '';
  let farmerToken = '';
  let buyerToken = '';
  let transportToken = '';

  // 1. Auth Suite
  console.log('[Suite 1: Authentication & Authorization]');
  await runTest('Auth', 'Login as Admin', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@kisanconnect.in',
      password: 'admin123'
    });
    if (!res.data.token || res.data.user.role !== 'ADMIN') throw new Error('Invalid login response');
    adminToken = res.data.token;
  });

  await runTest('Auth', 'Login as Farmer', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'farmer@demo.in',
      password: 'farmer123'
    });
    if (!res.data.token || res.data.user.role !== 'FARMER') throw new Error('Invalid login response');
    farmerToken = res.data.token;
  });

  await runTest('Auth', 'Login as Buyer', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'buyer@demo.in',
      password: 'buyer123'
    });
    if (!res.data.token || res.data.user.role !== 'BUYER') throw new Error('Invalid login response');
    buyerToken = res.data.token;
  });

  await runTest('Auth', 'Login as Transport Provider', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'transport@demo.in',
      password: 'transport123'
    });
    if (!res.data.token || res.data.user.role !== 'TRANSPORT') throw new Error('Invalid login response');
    transportToken = res.data.token;
  });

  await runTest('Auth', 'Verify Me endpoint (/auth/me)', async () => {
    const res = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    if (res.data.user.email !== 'farmer@demo.in') throw new Error('Wrong user returned');
  });

  await runTest('Auth', 'Reject unauthenticated access to protected route', async () => {
    try {
      await axios.get(`${API_BASE}/orders`);
      throw new Error('Should have rejected with 401');
    } catch (e: any) {
      if (e.response?.status !== 401) throw e;
    }
  });

  // 2. Dashboards Suite
  console.log('\n[Suite 2: Role Dashboards]');
  await runTest('Dashboard', 'Public Landing Stats (/dashboard/stats)', async () => {
    const res = await axios.get(`${API_BASE}/dashboard/stats`);
    if (typeof res.data.markets !== 'number' || typeof res.data.commodities !== 'number') {
      throw new Error('Stats structure mismatch');
    }
  });

  await runTest('Dashboard', 'Farmer Dashboard (/dashboard/farmer)', async () => {
    const res = await axios.get(`${API_BASE}/dashboard/farmer`, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    if (!res.data.stats || !Array.isArray(res.data.recentProducts)) {
      throw new Error('Farmer dashboard structure mismatch');
    }
  });

  await runTest('Dashboard', 'Buyer Dashboard (/dashboard/buyer)', async () => {
    const res = await axios.get(`${API_BASE}/dashboard/buyer`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    if (!res.data.stats || !Array.isArray(res.data.recentOrders)) {
      throw new Error('Buyer dashboard structure mismatch');
    }
  });

  await runTest('Dashboard', 'Transport Dashboard (/dashboard/transport)', async () => {
    const res = await axios.get(`${API_BASE}/dashboard/transport`, {
      headers: { Authorization: `Bearer ${transportToken}` }
    });
    if (!res.data.profile || !res.data.stats) {
      throw new Error('Transport dashboard structure mismatch');
    }
  });

  await runTest('Dashboard', 'RBAC Enforcement: Buyer cannot access Farmer Dashboard', async () => {
    try {
      await axios.get(`${API_BASE}/dashboard/farmer`, {
        headers: { Authorization: `Bearer ${buyerToken}` }
      });
      throw new Error('Should have rejected with 403');
    } catch (e: any) {
      if (e.response?.status !== 403) throw e;
    }
  });

  // 3. Market Data & Pricing Transparency
  console.log('\n[Suite 3: Market Data & Pricing]');
  let testCommodityId = '';
  await runTest('MarketData', 'List Commodities & Varieties', async () => {
    const res = await axios.get(`${API_BASE}/commodities`);
    if (!res.data.data || res.data.data.length === 0) throw new Error('No commodities found');
    testCommodityId = res.data.data[0].id;
  });

  await runTest('MarketData', 'Get Latest Mandi Prices', async () => {
    const res = await axios.get(`${API_BASE}/prices/latest?limit=5`);
    if (!res.data.data || res.data.data.length === 0) throw new Error('No prices found');
    const first = res.data.data[0];
    if (typeof first.modalPrice !== 'number' || !first.market || !first.commodity) {
      throw new Error('Price object missing required fields');
    }
  });

  await runTest('MarketData', 'Price History Trends (90-day)', async () => {
    const res = await axios.get(`${API_BASE}/prices/history?commodityId=${testCommodityId}`);
    if (!Array.isArray(res.data.data)) throw new Error('History data must be an array');
  });

  // 4. Geo, Routing & Logistics Calculation
  console.log('\n[Suite 4: Geo, Routing & Logistics]');
  // Pune (18.5204, 73.8567) to Mumbai (19.0760, 72.8777) ~ 150 km
  const puneLat = 18.5204;
  const puneLng = 73.8567;
  const mumbaiLat = 19.0760;
  const mumbaiLng = 72.8777;

  await runTest('Geo', 'Calculate Distance & Duration (/geo/distance)', async () => {
    const res = await axios.get(`${API_BASE}/geo/distance`, {
      params: { fromLat: puneLat, fromLng: puneLng, toLat: mumbaiLat, toLng: mumbaiLng }
    });
    if (typeof res.data.distanceKm !== 'number' || res.data.distanceKm <= 0) {
      throw new Error('Invalid distance calculated');
    }
    console.log(`    Calculated: ${res.data.distanceKm} km via ${res.data.source}`);
  });

  await runTest('Geo', 'Find Nearby Mandis (/geo/nearby-markets)', async () => {
    const res = await axios.get(`${API_BASE}/geo/nearby-markets`, {
      params: { lat: puneLat, lng: puneLng, radiusKm: 150 }
    });
    if (!Array.isArray(res.data.markets)) throw new Error('Nearby markets response invalid');
  });

  await runTest('Logistics', 'Delivery Cost Estimate Breakdown (/deliveries/estimate)', async () => {
    const res = await axios.get(`${API_BASE}/deliveries/estimate`, {
      params: {
        pickupLat: puneLat,
        pickupLng: puneLng,
        deliveryLat: mumbaiLat,
        deliveryLng: mumbaiLng,
        vehicleType: 'MINI_TRUCK',
        isRefrigerated: false
      }
    });
    if (!res.data.breakdown || typeof res.data.transportCost !== 'number') {
      throw new Error('Delivery estimate breakdown invalid');
    }
    console.log(`    Estimated cost: Rs ${res.data.transportCost} (${res.data.distanceKm} km)`);
  });

  // 5. Marketplace, Orders & Delivery Lifecycle
  console.log('\n[Suite 5: Marketplace & End-to-End Uber-Style Delivery Flow]');
  let createdProductId = '';
  let createdOrderId = '';
  let createdDeliveryId = '';

  await runTest('Marketplace', 'Farmer Creates Produce Listing', async () => {
    const res = await axios.post(`${API_BASE}/marketplace/products`, {
      commodityId: testCommodityId,
      title: 'Fresh Farm Tomatoes (A-Grade)',
      description: 'Organically grown, ready for bulk dispatch',
      quantity: 500,
      unit: 'kg',
      price: 28,
      location: 'Pune Rural Farm',
      latitude: puneLat,
      longitude: puneLng
    }, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    if (!res.data.product?.id) throw new Error('Product creation failed');
    createdProductId = res.data.product.id;
  });

  await runTest('Marketplace', 'Buyer Views Product with Mandi Transparency Data', async () => {
    const res = await axios.get(`${API_BASE}/marketplace/products/${createdProductId}`);
    if (!res.data.product) throw new Error('Failed to retrieve product details');
  });

  await runTest('Orders', 'Buyer Places Order with Delivery Address & GPS', async () => {
    const res = await axios.post(`${API_BASE}/orders`, {
      items: [{ productId: createdProductId, quantity: 100, unit: 'kg' }],
      deliveryAddress: 'Navi Mumbai APMC Retail Hub',
      deliveryLat: mumbaiLat,
      deliveryLng: mumbaiLng,
      notes: 'Please pack in crates'
    }, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    if (!res.data.order?.id) throw new Error('Order creation failed');
    createdOrderId = res.data.order.id;
    console.log(`    Order placed: ${createdOrderId}, Total: Rs ${res.data.order.totalAmount}`);
  });

  await runTest('Orders', 'Farmer Accepts Order (Triggers Delivery Job Creation)', async () => {
    const res = await axios.patch(`${API_BASE}/orders/${createdOrderId}/status`, {
      status: 'ACCEPTED'
    }, {
      headers: { Authorization: `Bearer ${farmerToken}` }
    });
    if (res.data.order.status !== 'ACCEPTED') throw new Error('Order status update failed');
  });

  await runTest('Transport', 'Transport Provider Views Available Delivery Jobs', async () => {
    const res = await axios.get(`${API_BASE}/transport/deliveries/available`, {
      headers: { Authorization: `Bearer ${transportToken}` }
    });
    const found = res.data.data.find((d: any) => d.orderId === createdOrderId);
    if (!found) throw new Error('Auto-generated delivery job for accepted order not found in pool');
    createdDeliveryId = found.id;
    console.log(`    Found matching delivery job: ${createdDeliveryId} (${found.distanceKm} km, Rs ${found.transportCost})`);
  });

  let driverVehicleId = '';
  await runTest('Transport', 'List Transport Provider Vehicles', async () => {
    const res = await axios.get(`${API_BASE}/transport/vehicles`, {
      headers: { Authorization: `Bearer ${transportToken}` }
    });
    if (!res.data.vehicles || res.data.vehicles.length === 0) throw new Error('No vehicles found');
    driverVehicleId = res.data.vehicles[0].id;
  });

  await runTest('Transport', 'Transport Provider Accepts Delivery Job', async () => {
    const res = await axios.post(`${API_BASE}/transport/deliveries/${createdDeliveryId}/accept`, {
      vehicleId: driverVehicleId
    }, {
      headers: { Authorization: `Bearer ${transportToken}` }
    });
    if (res.data.delivery.status !== 'ACCEPTED') throw new Error('Delivery job accept failed');
  });

  await runTest('Transport', 'Driver Updates Status: PICKED_UP', async () => {
    const res = await axios.patch(`${API_BASE}/transport/deliveries/${createdDeliveryId}/status`, {
      status: 'PICKED_UP'
    }, {
      headers: { Authorization: `Bearer ${transportToken}` }
    });
    if (res.data.delivery.status !== 'PICKED_UP') throw new Error('Status transition failed');
  });

  await runTest('Transport', 'Driver Updates Status: IN_TRANSIT', async () => {
    const res = await axios.patch(`${API_BASE}/transport/deliveries/${createdDeliveryId}/status`, {
      status: 'IN_TRANSIT'
    }, {
      headers: { Authorization: `Bearer ${transportToken}` }
    });
    if (res.data.delivery.status !== 'IN_TRANSIT') throw new Error('Status transition failed');
  });

  await runTest('Transport', 'Driver Completes Delivery: DELIVERED', async () => {
    const res = await axios.patch(`${API_BASE}/transport/deliveries/${createdDeliveryId}/status`, {
      status: 'DELIVERED'
    }, {
      headers: { Authorization: `Bearer ${transportToken}` }
    });
    if (res.data.delivery.status !== 'DELIVERED') throw new Error('Status transition failed');
  });

  await runTest('Orders', 'Verify Order Status Auto-Completed & Trackable by Buyer', async () => {
    const res = await axios.get(`${API_BASE}/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    if (res.data.order.status !== 'COMPLETED') throw new Error('Order was not marked COMPLETED upon delivery');
    if (!res.data.order.delivery || res.data.order.delivery.status !== 'DELIVERED') {
      throw new Error('Delivery relationship not populated or incorrect status');
    }
  });

  await runTest('Transport', 'Verify Transport Provider Earnings Updated', async () => {
    const res = await axios.get(`${API_BASE}/transport/earnings`, {
      headers: { Authorization: `Bearer ${transportToken}` }
    });
    if (typeof res.data.totalEarnings !== 'number' || res.data.totalEarnings <= 0) {
      throw new Error('Earnings not updated');
    }
    console.log(`    Driver total earnings: Rs ${res.data.totalEarnings}`);
  });

  // Summary
  console.log('\n=== Test Execution Summary ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
