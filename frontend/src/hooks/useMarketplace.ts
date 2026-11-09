import { useState, useEffect, useCallback } from 'react';
import { marketplaceApi } from '../api/marketplace';
import type { Product } from '../types';

interface UseMarketplaceOptions {
  commodity?: string;
  category?: string;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
  farmerOnly?: boolean;
  autoFetch?: boolean;
}

export function useMarketplace(options: UseMarketplaceOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { commodity, category, state, search, page = 1, limit = 20, farmerOnly = false, autoFetch = true } = options;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean> = { page, limit };
      if (category) params.category = category;
      if (commodity) params.commodity = commodity;
      if (state) params.state = state;
      if (search) params.search = search;
      if (farmerOnly) params.farmerOnly = true;

      const { data } = await marketplaceApi.listProducts(params);
      setProducts(data.data);
      setTotal(data.pagination?.total ?? 0);
      setPages(data.pagination?.pages ?? 0);
    } catch (err) {
      setError('Failed to load products. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [commodity, state, search, page, limit, farmerOnly]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [fetch, autoFetch]);

  return { products, total, pages, isLoading, error, refetch: fetch };
}
