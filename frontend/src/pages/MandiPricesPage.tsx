import { useState, useEffect } from 'react';
import MandiSearchForm, { MandiSearchFilters } from '../components/Mandi/MandiSearchForm';
import PriceTable from '../components/Mandi/PriceTable';
import DataFreshnessBadge from '../components/UI/DataFreshnessBadge';
import Pagination from '../components/UI/Pagination';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import ErrorState from '../components/UI/ErrorState';
import { useMandiPrices } from '../hooks/useMandiPrices';
import { marketsApi } from '../api/markets';

export default function MandiPricesPage() {
  const [filters, setFilters] = useState<MandiSearchFilters>({
    commodity: '',
    state: '',
    district: '',
    market: '',
  });
  const [page, setPage] = useState(1);
  const [states, setStates] = useState<string[]>([]);

  const { prices, total, pages, meta, isLoading, error, refetch } = useMandiPrices({
    ...filters,
    page,
    limit: 30,
  });

  useEffect(() => {
    marketsApi.states().then(({ data }) => setStates(data.map((s) => s.state))).catch(console.error);
  }, []);

  const handleFilterChange = (newFilters: MandiSearchFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-heading">Mandi Prices</h1>
        <p className="text-sm text-gray-500">
          Daily wholesale prices from APMC markets. Data sourced from Government of India portal.
        </p>
      </div>

      <MandiSearchForm
        filters={filters}
        onFiltersChange={handleFilterChange}
        states={states}
        isLoading={isLoading}
      />

      {meta && (
        <div className="mb-4">
          <DataFreshnessBadge meta={meta} />
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading ? (
        <LoadingSkeleton rows={10} cols={7} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{total.toLocaleString('en-IN')}</span> price records
              {filters.commodity && <> for <span className="font-medium">{filters.commodity}</span></>}
              {filters.state && <> in <span className="font-medium">{filters.state}</span></>}
            </p>
          </div>

          <PriceTable prices={prices} showSource />

          <Pagination
            page={page}
            pages={pages}
            total={total}
            limit={30}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
