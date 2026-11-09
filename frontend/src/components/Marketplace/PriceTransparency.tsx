import { ExternalLink, Info } from 'lucide-react';
import type { MarketPrice } from '../../types';

interface PriceTransparencyProps {
  productPrice: number;
  productUnit: string;
  latestMarketPrice: MarketPrice | null;
}

export default function PriceTransparency({
  productPrice,
  productUnit,
  latestMarketPrice,
}: PriceTransparencyProps) {
  if (!latestMarketPrice) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
        No current mandi price data available for this commodity.
      </div>
    );
  }

  const marketModal = latestMarketPrice.modalPrice;
  const diff = productPrice - marketModal;
  const diffPct = ((diff / marketModal) * 100).toFixed(1);
  const isAbove = diff > 0;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="font-semibold text-amber-800">Price Transparency</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Listing Price</p>
          <p className="font-bold text-gray-900">
            ₹{productPrice.toLocaleString('en-IN')} / {productUnit}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">
            AGMARKNET Modal Price
            <span className="ml-1 text-gray-400">
              ({new Date(latestMarketPrice.priceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
            </span>
          </p>
          <p className="font-bold text-gray-700">
            ₹{marketModal.toLocaleString('en-IN')} / {latestMarketPrice.unit}
            <span className="text-xs font-normal ml-1 text-gray-500">
              @ {latestMarketPrice.market?.name}
            </span>
          </p>
        </div>
      </div>

      <div className={`text-xs px-2 py-1.5 rounded ${isAbove ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
        This listing is {Math.abs(parseFloat(diffPct))}% {isAbove ? 'above' : 'below'} the latest
        recorded mandi modal price. Verify price before transacting.
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Source:{' '}
        <a
          href="https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 hover:underline inline-flex items-center gap-0.5"
        >
          AGMARKNET via data.gov.in <ExternalLink className="w-3 h-3" />
        </a>
        . Prices are indicative.
      </div>
    </div>
  );
}
