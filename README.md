# KisanConnect 🌾

**Smart India Hackathon (SIH) — Problem Statement 26033**
> *Multiple intermediaries reduce farmers' earnings and increase consumer prices.*

KisanConnect is a full-stack agricultural commerce and logistics platform that directly connects **farmers**, **buyers**, and **transport providers** — eliminating unnecessary intermediaries through price transparency and coordinated logistics.

---

## 🚀 Live Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@kisanconnect.in` | `admin123` |
| Farmer | `farmer@demo.in` | `farmer123` |
| Buyer | `buyer@demo.in` | `buyer123` |
| Transport Provider | `transport@demo.in` | `transport123` |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                 KisanConnect Platform                │
├──────────┬────────────┬─────────────┬───────────────┤
│  Farmer  │   Buyer    │  Transport  │     Admin     │
│ Dashboard│ Dashboard  │  Dashboard  │   Dashboard   │
├──────────┴────────────┴─────────────┴───────────────┤
│           React + Vite + TypeScript + Tailwind       │
├──────────────────────────────────────────────────────┤
│           Node.js + Express + Prisma (SQLite)        │
├──────────────────────────────────────────────────────┤
│  data.gov.in AGMARKNET  │  OSRM (routing)  │  OSM   │
└──────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Leaflet (maps), Recharts
- **Backend:** Node.js, Express, Prisma ORM, SQLite (PostgreSQL-ready)
- **Data:** data.gov.in AGMARKNET API, OpenStreetMap, OSRM routing
- **Auth:** JWT (bcrypt cost 12), role-based access control

---

## ✨ Features

### 🌾 Farmers
- List produce with quantity, price, and location
- Accept or decline incoming buyer orders
- View order delivery status in real-time
- Access live mandi price comparison to price produce fairly
- Dashboard with revenue stats and notifications

### 🛒 Buyers
- Browse marketplace with direct-from-farmer listings
- Full price breakdown: produce cost + transport + 2% platform fee vs mandi reference price
- Delivery address input with GPS location capture
- Real-time delivery tracking (5-step progress: Assigned → Picked Up → In Transit → Delivered)
- Mandi price intelligence before large purchases

### 🚛 Transport Providers *(New)*
- Accept agricultural delivery jobs (Uber-style job board)
- Availability toggle (online/offline)
- Multi-vehicle management (Mini Truck, Tempo, Tractor, Pickup, Refrigerated)
- Per-delivery earnings: ₹100 base + ₹6/km (refrigerated +30%)
- Status workflow: Accepted → Picked Up → In Transit → Delivered

### 📊 Market Data
- Real-time APMC mandi prices from **data.gov.in AGMARKNET**
- Min / Max / Modal price with source attribution
- 90-day historical price trends
- Multi-market comparison
- Price alerts

### 🗺️ Maps & Routing
- Interactive APMC market map (Leaflet + OpenStreetMap — no API key)
- Route planning via OSRM (with Haversine fallback)
- Distance and estimated travel time
- Nearby markets geolocation finder

---

## 🔧 Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set JWT_SECRET and optionally DATA_GOV_API_KEY

npm install
npx prisma db push
npx tsx src/seed.ts    # Loads demo data
npx tsx src/index.ts   # Starts on http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # Starts on http://localhost:5173
```

### Environment Variables (backend/.env)

```env
DATABASE_URL="file:../database/kisanconnect.db"
JWT_SECRET=your-long-random-secret-here
DATA_GOV_API_KEY=              # Optional: get free key at data.gov.in
SYNC_INTERVAL_HOURS=6
PORT=3000
NODE_ENV=development
OSRM_URL=https://router.project-osrm.org
CORS_ORIGINS=http://localhost:5173
PLATFORM_FEE_PERCENT=2
```

> **Never commit your `.env` file.** It is in `.gitignore`.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (FARMER / BUYER / TRANSPORT) |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Get current user profile |

### Marketplace
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/marketplace/products` | Browse listings |
| POST | `/api/marketplace/products` | Create listing (FARMER) |
| GET | `/api/marketplace/products/:id` | Product + latest mandi price |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order with delivery address |
| PATCH | `/api/orders/:id/status` | Accept / Cancel / Complete |
| GET | `/api/orders` | List orders (role-filtered) |

### Transport
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transport/deliveries/available` | Available delivery jobs |
| POST | `/api/transport/deliveries/:id/accept` | Accept job |
| PATCH | `/api/transport/deliveries/:id/status` | Update delivery status |
| GET | `/api/transport/earnings` | Earnings summary |
| POST | `/api/transport/vehicles` | Add vehicle |

### Geo
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/geo/distance` | Road distance + duration (OSRM) |
| GET | `/api/geo/route` | Full route geometry |
| GET | `/api/geo/nearby-markets` | APMC markets near lat/lng |

### Market Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prices/latest` | Latest mandi prices |
| GET | `/api/prices/history` | Historical prices |

---

## 💰 Pricing Model

```
Total Buyer Pays = Produce Cost + Transport Cost + Platform Fee (2%)
Farmer Receives  = Produce Cost − Platform Fee (2%)
Transport Earns  = ₹100 base + ₹6/km × distance (refrigerated: +30%)
```

All costs are shown transparently before the buyer confirms an order.

---

## 🔐 Security

- JWT signed with `JWT_SECRET` (single source — authService.ts)
- bcrypt cost 12 for password hashing
- Zod validation on all POST/PATCH endpoints
- Role-based middleware on every protected route
- Resource ownership checked before modifications
- In-memory rate limiter (100 req/15 min per IP)
- Never expose API keys in frontend code

---

## 📚 Research Foundation

This platform is backed by academic research on Indian agricultural supply chains, price asymmetry, and digital marketplace adoption. See [`01-research-report.md`](docs/01-research-report.md) for 10 verified sources and loophole analysis.

---

## 🏆 SIH Context

**Problem Statement:** 26033 — Agricultural Supply Chain and Digital Marketplace  
**Category:** Smart Agriculture  
**Approach:** Uber/Ola-inspired matching model applied to agricultural logistics — connecting farmers (suppliers), buyers (demand), and transport providers (logistics) in one transparent ecosystem.

---

*Built for Smart India Hackathon 2024 · KisanConnect Team*
