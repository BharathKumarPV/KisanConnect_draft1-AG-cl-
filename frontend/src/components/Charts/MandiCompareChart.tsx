import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { PriceCompareItem } from '../../api/prices';

interface MandiCompareChartProps {
  data: PriceCompareItem[];
  height?: number;
}

const COLORS = ['#15803d', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export default function MandiCompareChart({ data, height = 320 }: MandiCompareChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg text-gray-500 text-sm">
        No comparison data available
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: `${item.marketName}\n${item.state}`,
    shortName: item.marketName.length > 14 ? item.marketName.slice(0, 14) + '…' : item.marketName,
    min: item.minPrice,
    modal: item.modalPrice,
    max: item.maxPrice,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="shortName"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            angle={-20}
            textAnchor="end"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
            width={55}
          />
          <Tooltip
            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="min" name="Min Price" fill="#3b82f6" radius={[2, 2, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={`${COLORS[i % COLORS.length]}33`} />
            ))}
          </Bar>
          <Bar dataKey="modal" name="Modal Price" fill="#15803d" radius={[2, 2, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
          <Bar dataKey="max" name="Max Price" fill="#ef4444" radius={[2, 2, 0, 0]}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={`${COLORS[i % COLORS.length]}99`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 text-center mt-1">
        Indicative price difference. Does not account for transport, commission, or local taxes.
      </p>
    </div>
  );
}
