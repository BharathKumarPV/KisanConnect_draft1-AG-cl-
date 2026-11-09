import apiClient from './client';
import type { TransportProfile, Vehicle, Delivery, ApiResponse } from '../types';

export const transportApi = {
  // Profile
  getProfile: () =>
    apiClient.get<{ profile: TransportProfile }>('/transport/profile'),

  createProfile: (data: {
    licenseNumber: string;
    district: string;
    state: string;
    serviceArea?: string;
  }) => apiClient.post<{ profile: TransportProfile }>('/transport/profile', data),

  updateAvailability: (isAvailable: boolean) =>
    apiClient.patch<{ profile: TransportProfile }>('/transport/profile/availability', { isAvailable }),

  // Vehicles
  listVehicles: () =>
    apiClient.get<{ vehicles: Vehicle[] }>('/transport/vehicles'),

  addVehicle: (data: {
    type: string;
    registrationNumber: string;
    capacityKg: number;
    isRefrigerated?: boolean;
  }) => apiClient.post<{ vehicle: Vehicle }>('/transport/vehicles', data),

  updateVehicle: (id: string, data: Partial<Vehicle>) =>
    apiClient.patch<{ vehicle: Vehicle }>(`/transport/vehicles/${id}`, data),

  deleteVehicle: (id: string) =>
    apiClient.delete(`/transport/vehicles/${id}`),

  // Deliveries
  getAvailableDeliveries: () =>
    apiClient.get<ApiResponse<Delivery[]>>('/transport/deliveries/available'),

  getMyDeliveries: (params?: { status?: string; page?: number }) =>
    apiClient.get<ApiResponse<Delivery[]>>('/transport/deliveries/mine', { params }),

  acceptDelivery: (deliveryId: string, vehicleId: string) =>
    apiClient.post<{ delivery: Delivery }>(`/transport/deliveries/${deliveryId}/accept`, { vehicleId }),

  updateDeliveryStatus: (deliveryId: string, status: string) =>
    apiClient.patch<{ delivery: Delivery }>(`/transport/deliveries/${deliveryId}/status`, { status }),

  getEarnings: () =>
    apiClient.get<{ totalEarnings: number; monthlyEarnings: number; deliveryCount: number }>('/transport/earnings'),
};
