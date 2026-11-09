import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MarketPrice } from '../../types';

interface PriceTrendChartProps {
  prices: MarketPrice[];
  title?: string;
  height?: number;
}

interface ChartPoint {
  date: string;
  min: number;
  modal: number;
  max: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export default function PriceTrendChart({ prices, height = 300 }: PriceTrendChartProps) {
  const data: ChartPoint[] = prices.map((p) => ({
    date: formatDate(p.priceDate),
    min: p.minPrice,
    modal: p.modalPrice,
    max: p.maxPrice,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg text-gray-500 text-sm">
        No historical data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
          formatter={(value: number) => formatPrice(value)}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Max Price" />
        <Line type="monotone" dataKey="modal" stroke="#15803d" strokeWidth={2} dot={false} name="Modal Price" />
        <Line type="monotone" dataKey="min" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Min Price" />
      </LineChart>
    </ResponsiveContainer>
  );
}
