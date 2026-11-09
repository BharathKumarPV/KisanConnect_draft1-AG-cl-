import { useState, useEffect, useCallback } from 'react';
import { pricesApi } from '../api/prices';
import type { MarketPrice, DataFreshnessMeta } from '../types';

interface UseMandiPricesOptions {
  commodity?: string;
  state?: string;
  district?: string;
  market?: string;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

export function useMandiPrices(options: UseMandiPricesOptions = {}) {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [meta, setMeta] = useState<DataFreshnessMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { commodity, state, district, market, page = 1, limit = 20, autoFetch = true } = options;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (commodity) params.commodity = commodity;
      if (state) params.state = state;
      if (district) params.district = district;
      if (market) params.market = market;

      const { data } = await pricesApi.latest(params);
      setPrices(data.data);
      setTotal(data.pagination?.total ?? 0);
      setPages(data.pagination?.pages ?? 0);
      if (data.meta) {
        setMeta({
          source: data.meta.source ?? 'AGMARKNET via data.gov.in',
          sourceUrl: data.meta.sourceUrl,
          lastSynchronized: data.meta.lastSynchronized ?? null,
          apiConfigured: data.meta.apiConfigured ?? false,
          note: data.meta.note ?? null,
        });
      }
    } catch (err) {
      setError('Failed to load mandi prices. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [commodity, state, district, market, page, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [fetch, autoFetch]);

  return { prices, total, pages, meta, isLoading, error, refetch: fetch };
}
