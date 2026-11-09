import apiClient from './client';
import type { Delivery, DeliveryEstimate } from '../types';

export const deliveriesApi = {
  estimate: (params: {
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    vehicleType?: string;
    isRefrigerated?: boolean;
  }) =>
    apiClient.get<DeliveryEstimate>('/deliveries/estimate', { params }),

  get: (id: string) =>
    apiClient.get<{ delivery: Delivery }>(`/deliveries/${id}`),
};
