import apiClient from './client';
import type { Market, MarketPrice, ApiResponse } from '../types';

export const marketsApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Market[]>>('/markets', { params }),

  states: () =>
    apiClient.get<Array<{ state: string; count: number }>>('/markets/states'),

  get: (id: string) =>
    apiClient.get<{ market: Market }>(`/markets/${id}`),

  prices: (id: string, params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<MarketPrice[]>>(`/markets/${id}/prices`, { params }),
};
