import apiClient from './client';
import type { User } from '../types';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  mobile?: string;
  password: string;
  role: 'FARMER' | 'BUYER' | 'TRANSPORT';
  district?: string;
  state?: string;
  village?: string;
  companyName?: string;
  licenseNumber?: string;
  vehicleType?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),

  register: (payload: RegisterPayload) =>
    apiClient.post<LoginResponse>('/auth/register', payload),

  me: () => apiClient.get<{ user: User }>('/auth/me'),
};
