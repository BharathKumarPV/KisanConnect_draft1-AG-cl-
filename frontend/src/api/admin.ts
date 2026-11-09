import apiClient from './client';

export const adminApi = {
  stats: () => apiClient.get('/admin/stats'),
  users: (params?: Record<string, string | number>) => apiClient.get('/admin/users', { params }),
  updateUser: (id: string, data: Record<string, unknown>) => apiClient.patch(`/admin/users/${id}`, data),
  triggerSync: (states?: string[]) => apiClient.post('/admin/sync', { states }),
  syncStatus: () => apiClient.get('/admin/sync/status'),
  syncLogs: (params?: Record<string, string | number>) => apiClient.get('/admin/sync/logs', { params }),
};
