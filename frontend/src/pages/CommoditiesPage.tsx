import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { commoditiesApi } from '../api/commodities';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import Pagination from '../components/UI/Pagination';
import type { Commodity } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  VEGETABLE: 'badge-green',
  FRUIT: 'badge-amber',
  GRAIN: 'badge-blue',
  PULSE: 'badge-red',
  SPICE: 'badge-amber',
  OILSEED: 'badge-gray',
  OTHER: 'badge-gray',
};

export default function CommoditiesPage() {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    commoditiesApi.categories().then(({ data }) => setCategories(data)).catch(console.error);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params: Record<string, string | number> = { page, limit: 40 };
    if (selectedCategory) params.category = selectedCategory;
    if (search) params.search = search;

    commoditiesApi.list(params)
      .then(({ data }) => {
        setCommodities(data.data);
        setTotal(data.pagination?.total ?? 0);
        setPages(data.pagination?.pages ?? 0);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [page, selectedCategory, search]);

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-heading">Commodities</h1>
        <p className="text-sm text-gray-500">Browse all tracked agricultural commodities and their price history.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search commodities..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedCategory(''); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!selectedCategory ? 'bg-green-700 text-white border-green-700' : 'border-gray-300 text-gray-600 hover:border-green-400'}`}
          >
            All ({categories.reduce((s, c) => s + c.count, 0)})
          </button>
          {categories.map(({ category, count }) => (
            <button
              key={category}
              onClick={() => { setSelectedCategory(category === selectedCategory ? '' : category); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedCategory === category ? 'bg-green-700 text-white border-green-700' : 'border-gray-300 text-gray-600 hover:border-green-400'}`}
            >
              {category} ({count})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" rows={12} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {commodities.map((c) => (
              <Link
                key={c.id}
                to={`/commodities/${c.normalizedName}`}
                className="card p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                    {c.name}
                  </h3>
                  <span className={`badge ${CATEGORY_COLORS[c.category] || 'badge-gray'}`}>
                    {c.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {c._count?.prices.toLocaleString('en-IN') ?? 0} price records
                </p>
                {c.varieties && c.varieties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.varieties.slice(0, 3).map((v) => (
                      <span key={v.id} className="badge badge-gray text-xs">{v.name}</span>
                    ))}
                    {c.varieties.length > 3 && (
                      <span className="badge badge-gray text-xs">+{c.varieties.length - 3}</span>
                    )}
                  </div>
                )}
                <p className="text-xs text-green-700 mt-3 font-medium group-hover:underline">
                  View prices →
                </p>
              </Link>
            ))}
          </div>

          <Pagination page={page} pages={pages} total={total} limit={40} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
