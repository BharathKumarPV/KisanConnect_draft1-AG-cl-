import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

export interface MandiSearchFilters {
  commodity: string;
  state: string;
  district: string;
  market: string;
}

interface MandiSearchFormProps {
  filters: MandiSearchFilters;
  onFiltersChange: (filters: MandiSearchFilters) => void;
  states?: string[];
  isLoading?: boolean;
}

const POPULAR_COMMODITIES = [
  'Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Maize',
  'Chana', 'Tur Dal', 'Mustard', 'Turmeric', 'Cumin', 'Groundnut',
];

export default function MandiSearchForm({
  filters,
  onFiltersChange,
  states = [],
  isLoading = false,
}: MandiSearchFormProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (key: keyof MandiSearchFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({ commodity: '', state: '', district: '', market: '' });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v.trim() !== '');

  return (
    <div className="card p-4 mb-6">
      {/* Main search row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search commodity (e.g. Tomato, Onion, Wheat...)"
            value={filters.commodity}
            onChange={(e) => handleChange('commodity', e.target.value)}
            className="input pl-9"
          />
        </div>

        <select
          value={filters.state}
          onChange={(e) => handleChange('state', e.target.value)}
          className="select w-full sm:w-44"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost text-sm flex-shrink-0 ${showFilters ? 'bg-gray-100' : ''}`}
        >
          <Filter className="w-4 h-4" />
          More filters
        </button>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn-ghost text-sm text-red-600 flex-shrink-0">
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="District (e.g. Nashik)"
            value={filters.district}
            onChange={(e) => handleChange('district', e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Market name (e.g. Azadpur)"
            value={filters.market}
            onChange={(e) => handleChange('market', e.target.value)}
            className="input"
          />
        </div>
      )}

      {/* Quick commodity chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {POPULAR_COMMODITIES.map((c) => (
          <button
            key={c}
            onClick={() => handleChange('commodity', filters.commodity === c ? '' : c)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filters.commodity === c
                ? 'bg-green-700 text-white border-green-700'
                : 'border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-700'
            }`}
          >
            {c}
          </button>
        ))}
        {isLoading && (
          <span className="text-xs text-gray-400 self-center ml-1">Loading...</span>
        )}
      </div>
    </div>
  );
}
