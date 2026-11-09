import { useState, useEffect } from 'react';
import { Info, Truck, IndianRupee, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { deliveriesApi } from '../../api/deliveries';
import type { MarketPrice, DeliveryEstimate } from '../../types';

interface Props {
  productPrice: number;
  productUnit: string;
  quantity: number;
  latestMarketPrice?: MarketPrice | null;
  deliveryLat?: number;
  deliveryLng?: number;
  pickupLat?: number;
  pickupLng?: number;
}

export default function PriceBreakdown({
  productPrice,
  productUnit,
  quantity,
  latestMarketPrice,
  deliveryLat,
  deliveryLng,
  pickupLat,
  pickupLng,
}: Props) {
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);

  const PLATFORM_FEE_PERCENT = 2;
  const produceAmount = productPrice * quantity;
  const platformFee = Math.round(produceAmount * PLATFORM_FEE_PERCENT / 100);
  const transportCost = estimate?.transportCost ?? 0;
  const totalBuyer = produceAmount + transportCost + platformFee;
  const farmerReceives = produceAmount - platformFee;

  const mandiModal = latestMarketPrice?.modalPrice;
  const priceDiff = mandiModal ? productPrice - mandiModal : null;
  const priceDiffPct = mandiModal ? ((productPrice - mandiModal) / mandiModal * 100) : null;

  useEffect(() => {
    if (deliveryLat && deliveryLng && pickupLat && pickupLng) {
      setEstimateLoading(true);
      deliveriesApi.estimate({
        pickupLat,
        pickupLng,
        deliveryLat,
        deliveryLng,
      })
        .then(({ data }) => setEstimate(data))
        .catch(() => setEstimate(null))
        .finally(() => setEstimateLoading(false));
    }
  }, [deliveryLat, deliveryLng, pickupLat, pickupLng]);

  function formatINR(n: number) {
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <IndianRupee className="w-4 h-4 text-green-700" />
        <h3 className="font-semibold text-sm text-gray-800">Price Breakdown</h3>
      </div>

      {/* Mandi comparison */}
      {mandiModal && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2">vs. Mandi Reference Price ({latestMarketPrice?.market?.name})</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Mandi modal price</p>
              <p className="text-sm font-semibold">{formatINR(mandiModal)} / {productUnit}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Farmer asking price</p>
              <p className="text-sm font-semibold text-green-700">{formatINR(productPrice)} / {productUnit}</p>
            </div>
          </div>
          {priceDiff !== null && priceDiffPct !== null && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              priceDiff > 0 ? 'text-red-600' : priceDiff < 0 ? 'text-green-600' : 'text-gray-500'
            }`}>
              {priceDiff > 0 ? <TrendingUp className="w-3 h-3" /> : priceDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {priceDiff > 0
                ? `${formatINR(Math.abs(priceDiff))} (${Math.abs(priceDiffPct).toFixed(1)}%) above mandi price`
                : priceDiff < 0
                ? `${formatINR(Math.abs(priceDiff))} (${Math.abs(priceDiffPct).toFixed(1)}%) below mandi price`
                : 'At mandi price'}
            </div>
          )}
        </div>
      )}

      {/* Cost breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Produce cost ({quantity} {productUnit} × {formatINR(productPrice)})</span>
          <span className="font-medium">{formatINR(produceAmount)}</span>
        </div>

        {estimateLoading ? (
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Transport cost</span>
            <span>Estimating…</span>
          </div>
        ) : estimate ? (
          <div className="text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Transport ({estimate.distanceKm.toFixed(1)} km)</span>
              <span className="font-medium">{formatINR(estimate.transportCost)}</span>
            </div>
            <div className="mt-1 ml-5 text-xs text-gray-400 space-y-0.5">
              <div className="flex justify-between"><span>Base fare</span><span>{formatINR(estimate.breakdown.baseFare)}</span></div>
              <div className="flex justify-between"><span>Distance ({estimate.distanceKm.toFixed(1)} km)</span><span>{formatINR(estimate.breakdown.distanceFare)}</span></div>
              {estimate.breakdown.refrigerationSurcharge > 0 && (
                <div className="flex justify-between"><span>❄ Refrigeration</span><span>{formatINR(estimate.breakdown.refrigerationSurcharge)}</span></div>
              )}
            </div>
          </div>
        ) : (deliveryLat && deliveryLng) ? null : (
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span className="flex items-center gap-1 text-xs"><Truck className="w-3.5 h-3.5" /> Transport cost</span>
            <span className="text-xs">Enter delivery location</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1">
            Platform fee ({PLATFORM_FEE_PERCENT}%)
            <span title="KisanConnect platform service fee"><Info className="w-3 h-3 text-gray-400" /></span>
          </span>
          <span className="font-medium">{formatINR(platformFee)}</span>
        </div>

        <div className="border-t border-gray-200 pt-2 mt-2 space-y-1.5">
          <div className="flex items-center justify-between font-semibold text-sm">
            <span className="text-gray-800">Total you pay</span>
            <span className="text-lg text-gray-900">{formatINR(totalBuyer)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Farmer receives</span>
            <span className="font-medium text-green-700">{formatINR(farmerReceives)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 flex items-start gap-1">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        Mandi prices are APMC wholesale rates from data.gov.in. Transport cost is estimated and may vary. Final settlement on delivery confirmation.
      </p>
    </div>
  );
}
