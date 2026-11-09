import { useState, useEffect, useRef } from 'react';
import { marketsApi } from '../api/markets';
import type { Market } from '../types';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';

export default function MandiMapPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    marketsApi
      .list({ limit: 200 })
      .then(({ data }) => setMarkets(data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!mapRef.current || markets.length === 0 || mapInstanceRef.current) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.default.map(mapRef.current).setView([22.5, 80], 5);
      mapInstanceRef.current = map;

      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const icon = L.default.divIcon({
        className: '',
        html: `<div style="width:10px;height:10px;background:#15803d;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      markets
        .filter((m) => m.latitude && m.longitude)
        .forEach((m) => {
          L.default
            .marker([m.latitude!, m.longitude!], { icon })
            .addTo(map)
            .bindPopup(
              `<strong>${m.name}</strong><br/>${m.district}, ${m.state}${m.eNamStatus ? '<br/><span style="color:#15803d;font-size:11px">e-NAM Enabled</span>' : ''}`
            );
        });
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markets]);

  const marketsWithCoords = markets.filter((m) => m.latitude && m.longitude);

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-heading">Market Map</h1>
        <p className="text-sm text-gray-500">
          APMC markets across India. Green dots indicate markets with location data.
          Map data © OpenStreetMap contributors.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="text" rows={4} />
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-700 rounded-full border-2 border-white shadow" />
              Market location
            </span>
            <span className="font-medium">
              {marketsWithCoords.length} of {markets.length} markets mapped
            </span>
          </div>

          <div ref={mapRef} className="w-full rounded-xl border border-gray-200" style={{ height: '560px' }} />

          <div className="mt-4 card overflow-hidden">
            <div className="table-container">
              <table className="table-base">
                <thead className="table-head">
                  <tr>
                    <th className="table-th">Market</th>
                    <th className="table-th">District</th>
                    <th className="table-th">State</th>
                    <th className="table-th">e-NAM</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {markets.slice(0, 20).map((m) => (
                    <tr key={m.id} className="table-tr">
                      <td className="table-td font-medium">{m.name}</td>
                      <td className="table-td text-gray-600">{m.district}</td>
                      <td className="table-td text-gray-600">{m.state}</td>
                      <td className="table-td">
                        {m.eNamStatus ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
