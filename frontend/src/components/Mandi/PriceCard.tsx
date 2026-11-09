import type { MarketPrice } from '../../types';
import { TrendingUp, MapPin, Calendar } from 'lucide-react';

interface PriceCardProps {
  price: MarketPrice;
  onClick?: () => void;
}

export default function PriceCard({ price, onClick }: PriceCardProps) {
  const isDemo = price.source === 'demo-seed';

  return (
    <div
      className={`card p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{price.commodity?.name}</h3>
          {price.variety && (
            <span className="text-xs text-gray-500">{price.variety.name}</span>
          )}
        </div>
        {isDemo && <span className="badge badge-demo text-xs">DEMO</span>}
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-bold text-gray-900">
          ₹{price.modalPrice.toLocaleString('en-IN')}
        </span>
        <span className="text-xs text-gray-500">/{price.unit}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-green-600" />
          <span>Max: ₹{price.maxPrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 rotate-180 text-red-500" />
          <span>Min: ₹{price.minPrice.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {price.market?.name}, {price.market?.state}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(price.priceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
}
