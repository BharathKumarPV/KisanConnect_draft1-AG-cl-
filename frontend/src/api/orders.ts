import apiClient from './client';
import type { Order, ApiResponse } from '../types';

export const ordersApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Order[]>>('/orders', { params }),

  get: (id: string) =>
    apiClient.get<{ order: Order }>(`/orders/${id}`),

  create: (data: {
    items: Array<{ productId: string; quantity: number; unit: string }>;
    notes?: string;
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLng?: number;
  }) => apiClient.post<{ order: Order }>('/orders', data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<{ order: Order }>(`/orders/${id}/status`, { status }),
};
