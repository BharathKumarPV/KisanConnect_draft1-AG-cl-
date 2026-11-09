import apiClient from './client';
import type { MarketPrice, ApiResponse } from '../types';

export interface PriceCompareItem {
  marketId: string;
  marketName: string;
  state: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceDate: string;
  variety?: string | null;
  note: string;
}

export const pricesApi = {
  latest: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<MarketPrice[]>>('/prices/latest', { params }),

  history: (params: { commodity: string; market?: string; from?: string; to?: string; variety?: string }) =>
    apiClient.get<{ data: MarketPrice[] }>('/prices/history', { params }),

  compare: (commodity: string, markets?: string) =>
    apiClient.get<{
      commodity: { id: string; name: string; unit: string };
      comparison: PriceCompareItem[];
      disclaimer: string;
    }>('/prices/compare', { params: { commodity, ...(markets ? { markets } : {}) } }),
};
