import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ShoppingBag, MapPin, TrendingUp, ArrowRight, Sprout, AlertTriangle, Truck, Users, Leaf } from 'lucide-react';
import apiClient from '../api/client';
import PriceCard from '../components/Mandi/PriceCard';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import type { MarketPrice } from '../types';

interface Stats {
  markets: number;
  commodities: number;
  products: number;
  states: number;
}

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Live Mandi Prices',
    description: 'Access daily wholesale prices from APMC markets across India, sourced from the Government of India data portal.',
    link: '/mandi-prices',
    color: 'bg-green-50',
    iconColor: 'text-green-700',
  },
  {
    icon: TrendingUp,
    title: 'Price Trends & History',
    description: 'Analyse 90-day price history, spot seasonal patterns, and compare prices across multiple markets.',
    link: '/price-trends',
    color: 'bg-blue-50',
    iconColor: 'text-blue-700',
  },
  {
    icon: ShoppingBag,
    title: 'Direct Marketplace',
    description: 'Farmers list produce directly; buyers discover and connect — cutting out unnecessary middlemen.',
    link: '/marketplace',
    color: 'bg-amber-50',
    iconColor: 'text-amber-700',
  },
  {
    icon: MapPin,
    title: 'Market Map',
    description: 'Visualise APMC markets across India on an interactive map to find the nearest trading location.',
    link: '/mandi-map',
    color: 'bg-purple-50',
    iconColor: 'text-purple-700',
  },
];

const ROLES = [
  {
    icon: Leaf,
    emoji: '🌾',
    title: 'Farmers',
    desc: 'List your produce, set fair prices, and connect directly with buyers. No middlemen eating your margin.',
    color: 'border-green-200 bg-green-50',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-700',
    cta: 'Start Selling',
    ctaLink: '/register',
  },
  {
    icon: ShoppingBag,
    emoji: '🛒',
    title: 'Buyers',
    desc: 'Source directly from farmers at transparent prices. Compare mandi rates and get the best value.',
    color: 'border-amber-200 bg-amber-50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    cta: 'Start Buying',
    ctaLink: '/marketplace',
  },
  {
    icon: Truck,
    emoji: '🚛',
    title: 'Transport Providers',
    desc: 'Accept agricultural delivery jobs near you. Transparent per-delivery earnings. Work on your schedule.',
    color: 'border-blue-200 bg-blue-50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    cta: 'Join as Driver',
    ctaLink: '/register',
  },
];

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [latestPrices, setLatestPrices] = useState<MarketPrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/dashboard/stats').then(({ data }) => setStats(data)).catch(console.error);
    apiClient
      .get('/prices/latest', { params: { limit: 6 } })
      .then(({ data }) => setLatestPrices(data.data))
      .catch(console.error)
      .finally(() => setPricesLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sprout className="w-5 h-5 text-green-300" />
              <span className="text-green-300 text-sm font-medium">Powered by data.gov.in AGMARKNET · SIH 26033</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
              Farm to Buyer,{' '}
              <span className="text-amber-400">Directly.</span>
            </h1>
            <p className="text-lg text-green-200 mb-8 leading-relaxed">
              KisanConnect eliminates unnecessary intermediaries — connecting farmers, buyers and transport providers
              in one transparent ecosystem. Real mandi prices. Fair earnings. Coordinated logistics.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/mandi-prices" className="btn-accent text-base px-6 py-3">
                Check Mandi Prices <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/marketplace" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors text-base">
                Explore Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      {stats && (
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'APMC Markets', value: stats.markets.toLocaleString('en-IN') },
                { label: 'Commodities Tracked', value: stats.commodities.toLocaleString('en-IN') },
                { label: 'States Covered', value: stats.states.toLocaleString('en-IN') },
                { label: 'Marketplace Listings', value: stats.products.toLocaleString('en-IN') },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold text-green-700">{value}</p>
                  <p className="text-sm text-gray-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Role cards */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-700" />
              <span className="text-sm font-medium text-green-700 uppercase tracking-wide">Who it's for</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">One Platform, Three Roles</h2>
            <p className="text-gray-500">KisanConnect seamlessly connects farmers, commercial buyers, and transport logistics in an integrated agricultural network</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROLES.map(({ icon: Icon, emoji, title, desc, color, iconBg, iconColor, cta, ctaLink }) => (
              <div key={title} className={`rounded-2xl border-2 p-6 ${color} flex flex-col`}>
                <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-7 h-7 ${iconColor}`} />
                </div>
                <div className="text-2xl mb-1">{emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{desc}</p>
                <Link to={ctaLink} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green-800 hover:text-green-700">
                  {cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Prices */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-heading">Today's Mandi Prices</h2>
              <p className="section-subheading">Latest wholesale prices from APMC markets</p>
            </div>
            <Link to="/mandi-prices" className="btn-secondary text-sm hidden sm:inline-flex">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {pricesLoading ? (
            <LoadingSkeleton type="card" rows={6} />
          ) : latestPrices.length === 0 ? (
            <div className="card p-8 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700 mb-1">Price data synchronizing</h3>
              <p className="text-sm text-gray-500 mb-4">
                Connecting to daily APMC market price feeds. Please check the Mandi Prices directory.
              </p>
              <Link to="/mandi-prices" className="btn-secondary text-sm">Go to Mandi Prices</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestPrices.map((p) => (
                <PriceCard key={p.id} price={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Everything You Need</h2>
            <p className="text-gray-500">From farm gate to wholesale market — one platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, link, color, iconColor }) => (
              <Link key={link} to={link} className="card p-6 hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">How It Works</h2>
            <p className="text-gray-500">Like ordering a cab — but for agricultural produce</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '📋', title: 'Farmer Lists', desc: 'Farmer lists 500 kg tomatoes with quantity, price, and location.' },
              { step: '02', icon: '🔍', title: 'Buyer Discovers', desc: 'Buyer searches tomatoes, sees farmer details, mandi comparison, and estimated transport cost.' },
              { step: '03', icon: '📦', title: 'Order Placed', desc: 'Buyer places order with delivery address. Platform auto-posts a delivery job.' },
              { step: '04', icon: '🚛', title: 'Driver Delivers', desc: 'Nearby transport provider accepts the job and delivers. All parties track progress.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="text-center relative">
                <div className="w-16 h-16 bg-green-700 rounded-2xl flex flex-col items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl">{icon}</span>
                </div>
                <div className="absolute top-6 left-[60%] hidden md:block w-full h-0.5 bg-gray-200" style={{ width: 'calc(100% - 4rem)' }} />
                <span className="inline-block text-xs text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full mb-2">{step}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data disclaimer */}
      <section className="py-6 bg-amber-50 border-t border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-amber-800">
          <strong>Data transparency:</strong> Mandi price data is sourced from{' '}
          <a href="https://data.gov.in" className="underline" target="_blank" rel="noopener noreferrer">
            data.gov.in
          </a>{' '}
          (AGMARKNET/NHM). Indicative APMC wholesale rates support fair negotiations between farmers, buyers, and transport partners.
        </div>
      </section>
    </div>
  );
}
