import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pricesApi } from '../api/prices';
import { commoditiesApi } from '../api/commodities';
import MandiCompareChart from '../components/Charts/MandiCompareChart';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import EmptyState from '../components/UI/EmptyState';
import type { Commodity } from '../types';
import type { PriceCompareItem } from '../api/prices';
import { Info } from 'lucide-react';

export default function MandiComparePage() {
  const [searchParams] = useSearchParams();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [commodity, setCommodity] = useState(searchParams.get('commodity') || '');
  const [comparison, setComparison] = useState<PriceCompareItem[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    commoditiesApi.list({ limit: 200 }).then(({ data }) => setCommodities(data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!commodity) return;
    setIsLoading(true);
    setError('');
    pricesApi.compare(commodity)
      .then(({ data }) => {
        setComparison(data.comparison);
        setDisclaimer(data.disclaimer);
      })
      .catch((err) => {
        setError(err?.response?.data?.error ?? 'Failed to load comparison data.');
      })
      .finally(() => setIsLoading(false));
  }, [commodity]);

  const sortedComparison = [...comparison].sort((a, b) => a.modalPrice - b.modalPrice);

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-heading">Mandi Comparison</h1>
        <p className="text-sm text-gray-500">
          Compare indicative prices across markets for any commodity.
        </p>
      </div>

      <div className="card p-4 mb-6">
        <select
          value={commodity}
          onChange={(e) => setCommodity(e.target.value)}
          className="select max-w-xs"
        >
          <option value="">Select a commodity to compare...</option>
          {commodities.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {!commodity ? (
        <EmptyState
          title="Select a commodity"
          description="Choose a commodity to compare its prices across all markets with available data."
        />
      ) : isLoading ? (
        <LoadingSkeleton type="text" rows={6} />
      ) : error ? (
        <div className="card p-8 text-center text-red-500">{error}</div>
      ) : comparison.length === 0 ? (
        <EmptyState title="No comparison data" description="No market price data available for this commodity in the last 14 days." />
      ) : (
        <>
          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2 text-sm">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="text-amber-800">{disclaimer}</span>
          </div>

          {/* Chart */}
          <div className="card p-6 mb-6">
            <h2 className="font-semibold mb-4">{commodity} — Indicative Price Comparison (₹/Quintal)</h2>
            <MandiCompareChart data={sortedComparison} height={360} />
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="table-th">Market</th>
                  <th className="table-th">State</th>
                  <th className="table-th">District</th>
                  <th className="table-th text-right">Min (₹/Qtl)</th>
                  <th className="table-th text-right">Modal (₹/Qtl)</th>
                  <th className="table-th text-right">Max (₹/Qtl)</th>
                  <th className="table-th">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedComparison.map((item, i) => (
                  <tr key={item.marketId} className={`table-tr ${i === 0 ? 'bg-green-50' : ''}`}>
                    <td className="table-td font-medium">
                      {item.marketName}
                      {i === 0 && <span className="ml-2 badge badge-green text-xs">Lowest</span>}
                    </td>
                    <td className="table-td text-gray-600">{item.state}</td>
                    <td className="table-td text-gray-600">{item.district}</td>
                    <td className="table-td text-right text-gray-700">₹{item.minPrice.toLocaleString('en-IN')}</td>
                    <td className="table-td text-right font-semibold text-gray-900">₹{item.modalPrice.toLocaleString('en-IN')}</td>
                    <td className="table-td text-right text-gray-700">₹{item.maxPrice.toLocaleString('en-IN')}</td>
                    <td className="table-td text-gray-500 text-xs">
                      {new Date(item.priceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Indicative price differences only. Does not account for transport, mandi fees, or quality variation.
          </p>
        </>
      )}
    </div>
  );
}
