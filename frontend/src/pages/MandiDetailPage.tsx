import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Building2 } from 'lucide-react';
import { marketsApi } from '../api/markets';
import PriceTable from '../components/Mandi/PriceTable';
import DataFreshnessBadge from '../components/UI/DataFreshnessBadge';
import Pagination from '../components/UI/Pagination';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import type { Market, MarketPrice, DataFreshnessMeta } from '../types';

export default function MandiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [market, setMarket] = useState<Market | null>(null);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [meta, setMeta] = useState<DataFreshnessMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    marketsApi.get(id).then(({ data }) => setMarket(data.market)).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    marketsApi.prices(id, { page, limit: 30 })
      .then(({ data }) => {
        setPrices(data.data);
        setTotal(data.pagination?.total ?? 0);
        setPages(data.pagination?.pages ?? 0);
        if (data.meta) {
          setMeta({
            source: data.meta.source ?? 'AGMARKNET via data.gov.in',
            sourceUrl: data.meta.sourceUrl,
            lastSynchronized: data.meta.lastSynchronized ?? null,
            apiConfigured: data.meta.apiConfigured ?? false,
          });
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id, page]);

  if (!market) return <div className="page-container"><LoadingSkeleton type="text" rows={4} /></div>;

  return (
    <div className="page-container">
      <Link to="/mandi-prices" className="btn-ghost text-sm mb-6 inline-flex">
        <ArrowLeft className="w-4 h-4" /> Back to Mandi Prices
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="section-heading mb-1">{market.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {market.district}, {market.state}
              </span>
              {market.apmc && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {market.apmc}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {market.eNamStatus && <span className="badge badge-green">e-NAM Enabled</span>}
            <span className={`badge ${market.isActive ? 'badge-green' : 'badge-gray'}`}>
              {market.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {meta && <DataFreshnessBadge meta={meta} className="mb-4" />}

      <h2 className="text-lg font-semibold mb-3">Price Data ({total.toLocaleString('en-IN')} records)</h2>

      {isLoading ? (
        <LoadingSkeleton rows={10} cols={6} />
      ) : (
        <>
          <PriceTable prices={prices} showMarket={false} showSource />
          <Pagination page={page} pages={pages} total={total} limit={30} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
