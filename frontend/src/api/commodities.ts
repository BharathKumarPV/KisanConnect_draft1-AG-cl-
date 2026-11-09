import apiClient from './client';
import type { Commodity, MarketPrice, ApiResponse } from '../types';

export const commoditiesApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Commodity[]>>('/commodities', { params }),

  categories: () =>
    apiClient.get<Array<{ category: string; count: number }>>('/commodities/categories'),

  get: (id: string) =>
    apiClient.get<{ commodity: Commodity }>(`/commodities/${id}`),

  prices: (id: string, params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<MarketPrice[]> & { commodity: Commodity }>(`/commodities/${id}/prices`, { params }),
};
