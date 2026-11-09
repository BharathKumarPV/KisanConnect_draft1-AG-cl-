import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useMarketplace } from '../hooks/useMarketplace';
import { useAuth } from '../hooks/useAuth';
import ProductCard from '../components/Marketplace/ProductCard';
import Pagination from '../components/UI/Pagination';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import EmptyState from '../components/UI/EmptyState';
import ErrorState from '../components/UI/ErrorState';

const CATEGORIES = ['', 'VEGETABLE', 'FRUIT', 'GRAIN', 'PULSE', 'SPICE', 'OILSEED', 'OTHER'];

export default function MarketplacePage() {
  const { isAuthenticated, user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { products, total, pages, isLoading, error, refetch } = useMarketplace({
    search: search || undefined,
    commodity: category || undefined,
    page,
    limit: 20,
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-heading">Marketplace</h1>
          <p className="text-sm text-gray-500">Direct listings from farmers. All demo data marked [DEMO].</p>
        </div>
        {isAuthenticated && user?.role === 'FARMER' && (
          <Link to="/farmer-dashboard" className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> List Produce
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search produce, location..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="select w-full sm:w-44"
        >
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        <span className="font-medium">{total.toLocaleString('en-IN')}</span> listings available
      </p>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <LoadingSkeleton type="card" rows={8} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No listings found"
          description="Try adjusting your search or filters. Farmers can list produce from their dashboard."
          action={
            isAuthenticated && user?.role === 'FARMER' ? (
              <Link to="/farmer-dashboard" className="btn-primary text-sm">List Your Produce</Link>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination page={page} pages={pages} total={total} limit={20} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
