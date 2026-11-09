import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MarketPrice } from '../../types';

interface PriceHistoryChartProps {
  prices: MarketPrice[];
  height?: number;
}

export default function PriceHistoryChart({ prices, height = 280 }: PriceHistoryChartProps) {
  const data = prices.map((p) => ({
    date: new Date(p.priceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    modal: p.modalPrice,
    min: p.minPrice,
    max: p.maxPrice,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg text-gray-500 text-sm">
        No historical data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="modalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#15803d" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
          width={55}
        />
        <Tooltip
          formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Modal Price']}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="modal"
          stroke="#15803d"
          strokeWidth={2}
          fill="url(#modalGradient)"
          name="Modal Price"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
