import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? '/api'
    : 'http://localhost:3000/api');

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kisan_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

// Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error.config?.url || '');
    // Only remove session if /auth/me explicitly returned 401 (token expired/invalid)
    if (error.response?.status === 401 && url.includes('/auth/me')) {
      localStorage.removeItem('kisan_token');
      localStorage.removeItem('kisan_user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
