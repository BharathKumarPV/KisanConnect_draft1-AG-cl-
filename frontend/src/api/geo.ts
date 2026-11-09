import apiClient from './client';

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry?: unknown;
  source: 'osrm' | 'haversine';
}

export interface NearbyMarket {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  apmc?: string;
  eNamStatus: boolean;
}

export const geoApi = {
  getRoute: (params: {
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
  }) => apiClient.get<RouteResult>('/geo/route', { params }),

  getDistance: (params: {
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
  }) => apiClient.get<{ distanceKm: number; durationMinutes: number; source: string }>('/geo/distance', { params }),

  getNearbyMarkets: (params: {
    lat: number;
    lng: number;
    radiusKm?: number;
  }) => apiClient.get<{ markets: NearbyMarket[] }>('/geo/nearby-markets', { params }),
};
