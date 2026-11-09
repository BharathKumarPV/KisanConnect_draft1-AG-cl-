import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { commoditiesApi } from '../api/commodities';
import { pricesApi } from '../api/prices';
import PriceTable from '../components/Mandi/PriceTable';
import PriceHistoryChart from '../components/Charts/PriceHistoryChart';
import Pagination from '../components/UI/Pagination';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import type { Commodity, MarketPrice } from '../types';

export default function CommodityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [commodity, setCommodity] = useState<Commodity | null>(null);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [history, setHistory] = useState<MarketPrice[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    commoditiesApi.get(id).then(({ data }) => setCommodity(data.commodity)).catch(console.error);
    pricesApi
      .history({ commodity: id })
      .then(({ data }) => setHistory(data.data))
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    commoditiesApi.prices(id, { page, limit: 30 })
      .then(({ data }) => {
        setPrices(data.data);
        setTotal(data.pagination?.total ?? 0);
        setPages(data.pagination?.pages ?? 0);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id, page]);

  if (!commodity) return <div className="page-container"><LoadingSkeleton type="text" rows={4} /></div>;

  return (
    <div className="page-container">
      <Link to="/commodities" className="btn-ghost text-sm mb-6 inline-flex">
        <ArrowLeft className="w-4 h-4" /> Back to Commodities
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="section-heading mb-1">{commodity.name}</h1>
          <div className="flex items-center gap-2">
            <span className="badge badge-green">{commodity.category}</span>
            <span className="text-sm text-gray-500">Unit: {commodity.unit}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">
              {commodity._count?.prices.toLocaleString('en-IN') ?? 0} price records
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/mandi-compare?commodity=${commodity.name}`} className="btn-secondary text-sm">
            Compare Markets
          </Link>
          <Link to={`/price-trends?commodity=${commodity.name}`} className="btn-secondary text-sm">
            Price Trends
          </Link>
        </div>
      </div>

      {history.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold mb-4">90-Day Price History (Modal Price ₹/Quintal)</h2>
          <PriceHistoryChart prices={history} height={260} />
        </div>
      )}

      {/* Varieties */}
      {commodity.varieties && commodity.varieties.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-gray-500 self-center">Varieties:</span>
          {commodity.varieties.map((v) => (
            <span key={v.id} className="badge badge-gray">{v.name}</span>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Market Prices</h2>

      {isLoading ? (
        <LoadingSkeleton rows={10} cols={6} />
      ) : (
        <>
          <PriceTable prices={prices} showCommodity={false} showSource />
          <Pagination page={page} pages={pages} total={total} limit={30} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
