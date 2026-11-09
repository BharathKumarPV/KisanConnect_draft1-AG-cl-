import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pricesApi } from '../api/prices';
import { commoditiesApi } from '../api/commodities';
import PriceTrendChart from '../components/Charts/PriceTrendChart';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import EmptyState from '../components/UI/EmptyState';
import type { MarketPrice, Commodity } from '../types';

const DATE_RANGES = [
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
];

export default function PriceTrendsPage() {
  const [searchParams] = useSearchParams();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [commodity, setCommodity] = useState(searchParams.get('commodity') || '');
  const [market, setMarket] = useState('');
  const [days, setDays] = useState(90);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    commoditiesApi.list({ limit: 200 }).then(({ data }) => setCommodities(data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!commodity) return;
    setIsLoading(true);
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    pricesApi.history({ commodity, market: market || undefined, from, to })
      .then(({ data }) => setPrices(data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [commodity, market, days]);

  const avgModal = prices.length > 0
    ? prices.reduce((s, p) => s + p.modalPrice, 0) / prices.length
    : 0;

  const minModal = prices.length > 0 ? Math.min(...prices.map((p) => p.modalPrice)) : 0;
  const maxModal = prices.length > 0 ? Math.max(...prices.map((p) => p.modalPrice)) : 0;

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-heading">Price Trends</h1>
        <p className="text-sm text-gray-500">Historical price analysis for agricultural commodities.</p>
      </div>

      {/* Controls */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            className="select flex-1"
          >
            <option value="">Select a commodity...</option>
            {commodities.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Market name (optional)"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="input flex-1"
          />
          <div className="flex gap-2">
            {DATE_RANGES.map(({ label, days: d }) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-2 rounded-lg text-sm border ${days === d ? 'bg-green-700 text-white border-green-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!commodity ? (
        <EmptyState
          title="Select a commodity"
          description="Choose a commodity above to view its price trend chart."
        />
      ) : isLoading ? (
        <LoadingSkeleton type="text" rows={6} />
      ) : (
        <>
          {/* Summary stats */}
          {prices.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Average Modal Price</p>
                <p className="text-2xl font-bold text-green-700">₹{Math.round(avgModal).toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400">per Quintal</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Lowest Price</p>
                <p className="text-2xl font-bold text-blue-600">₹{minModal.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400">per Quintal</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Highest Price</p>
                <p className="text-2xl font-bold text-red-500">₹{maxModal.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400">per Quintal</p>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="font-semibold mb-4">
              {commodity} — Price Trend ({days} days){market && ` · ${market}`}
            </h2>
            <PriceTrendChart prices={prices} height={340} />
            <p className="text-xs text-gray-400 mt-2 text-center">
              Source: AGMARKNET via data.gov.in · Prices per Quintal (₹) · Data may include multiple markets
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            {prices.length.toLocaleString('en-IN')} data points over {days} days.
            Prices are indicative wholesale rates.
          </p>
        </>
      )}
    </div>
  );
}
