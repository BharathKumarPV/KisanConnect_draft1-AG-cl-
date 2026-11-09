import type { MarketPrice } from '../../types';
import SourceBadge from './SourceBadge';
import EmptyState from '../UI/EmptyState';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceTableProps {
  prices: MarketPrice[];
  showMarket?: boolean;
  showCommodity?: boolean;
  showSource?: boolean;
}

function formatPrice(price: number) {
  return `₹${price.toLocaleString('en-IN')}`;
}

function PriceIndicator({ modal, min, max }: { modal: number; min: number; max: number }) {
  const range = max - min;
  if (range === 0) return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  const pos = (modal - min) / range;
  if (pos > 0.65) return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
  if (pos < 0.35) return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
  return <Minus className="w-3.5 h-3.5 text-amber-500" />;
}

export default function PriceTable({
  prices,
  showMarket = true,
  showCommodity = true,
  showSource = false,
}: PriceTableProps) {
  if (prices.length === 0) {
    return (
      <EmptyState
        title="No price data available"
        description="No data available from source for the selected filters."
      />
    );
  }

  return (
    <div className="table-container">
      <table className="table-base">
        <thead className="table-head">
          <tr>
            {showCommodity && <th className="table-th">Commodity</th>}
            {showMarket && <th className="table-th">Market</th>}
            <th className="table-th">State</th>
            <th className="table-th">Variety</th>
            <th className="table-th text-right">Min (₹/Qtl)</th>
            <th className="table-th text-right">Modal (₹/Qtl)</th>
            <th className="table-th text-right">Max (₹/Qtl)</th>
            <th className="table-th">Date</th>
            {showSource && <th className="table-th">Source</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {prices.map((p) => (
            <tr key={p.id} className="table-tr">
              {showCommodity && (
                <td className="table-td font-medium text-gray-900">
                  {p.commodity?.name ?? '—'}
                  {p.commodity?.category && (
                    <span className={`ml-2 badge badge-${getCategoryColor(p.commodity.category)}`}>
                      {p.commodity.category}
                    </span>
                  )}
                </td>
              )}
              {showMarket && (
                <td className="table-td">{p.market?.name ?? '—'}</td>
              )}
              <td className="table-td text-gray-600">{p.market?.state ?? '—'}</td>
              <td className="table-td text-gray-600">{p.variety?.name ?? 'FAQ'}</td>
              <td className="table-td text-right text-gray-700">{formatPrice(p.minPrice)}</td>
              <td className="table-td text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <PriceIndicator modal={p.modalPrice} min={p.minPrice} max={p.maxPrice} />
                  <span className="font-semibold text-gray-900">{formatPrice(p.modalPrice)}</span>
                </div>
              </td>
              <td className="table-td text-right text-gray-700">{formatPrice(p.maxPrice)}</td>
              <td className="table-td text-gray-500">
                {new Date(p.priceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </td>
              {showSource && (
                <td className="table-td">
                  <SourceBadge source={p.source} sourceUrl={p.sourceUrl ?? undefined} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'VEGETABLE': return 'green';
    case 'FRUIT': return 'amber';
    case 'GRAIN': return 'blue';
    case 'PULSE': return 'red';
    case 'SPICE': return 'amber';
    case 'OILSEED': return 'gray';
    default: return 'gray';
  }
}
