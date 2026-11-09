import apiClient from './client';
import type { Product, ApiResponse } from '../types';
import type { MarketPrice } from '../types';

export interface ProductPayload {
  commodityId: string;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  images?: string[];
  location: string;
}

export const marketplaceApi = {
  listProducts: (params?: Record<string, string | number | boolean>) =>
    apiClient.get<ApiResponse<Product[]>>('/marketplace/products', { params }),

  getProduct: (id: string) =>
    apiClient.get<{ product: Product; latestMarketPrice: MarketPrice | null }>(`/marketplace/products/${id}`),

  createProduct: (data: ProductPayload) =>
    apiClient.post<{ product: Product }>('/marketplace/products', data),

  updateProduct: (id: string, data: Partial<ProductPayload> & { isActive?: boolean }) =>
    apiClient.patch<{ product: Product }>(`/marketplace/products/${id}`, data),

  deleteProduct: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/marketplace/products/${id}`),

  toggleFavorite: (id: string) =>
    apiClient.post<{ favorited: boolean }>(`/marketplace/products/${id}/favorite`),
};
