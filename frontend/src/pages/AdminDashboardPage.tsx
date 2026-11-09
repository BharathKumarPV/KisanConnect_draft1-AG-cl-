import { useState, useEffect, useCallback } from 'react';
import { Users, Building2, Leaf, ShoppingBag, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { adminApi } from '../api/admin';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import type { User } from '../types';

interface AdminStats {
  users: number;
  markets: number;
  commodities: number;
  products: number;
  orders: number;
  prices: number;
  syncStatus: {
    isConfigured: boolean;
    lastSync: string | null;
    totalRecords: number;
    recentLogs: Array<{ status: string; recordsImported: number; startedAt: string; duration: number | null }>;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userPage] = useState(1);

  const load = useCallback(() => {
    setIsLoading(true);
    Promise.all([
      adminApi.stats(),
      adminApi.users({ page: userPage, limit: 10 }),
    ]).then(([statsRes, usersRes]) => {
      setStats(statsRes.data);
      setUsers(usersRes.data.data);
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [userPage]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncMessage('');
    try {
      const { data } = await adminApi.triggerSync();
      setSyncMessage(data.message || 'Sync started in background.');
      setTimeout(() => load(), 3000); // Refresh after 3s
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Sync failed.';
      setSyncMessage(msg);
    } finally {
      setSyncLoading(false);
    }
  };

  if (isLoading) return <div className="page-container"><LoadingSkeleton type="card" rows={4} /></div>;

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-heading">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Users', value: stats?.users ?? 0, icon: Users, color: 'text-blue-600' },
          { label: 'Markets', value: stats?.markets ?? 0, icon: Building2, color: 'text-green-700' },
          { label: 'Commodities', value: stats?.commodities ?? 0, icon: Leaf, color: 'text-emerald-600' },
          { label: 'Products', value: stats?.products ?? 0, icon: ShoppingBag, color: 'text-amber-600' },
          { label: 'Orders', value: stats?.orders ?? 0, icon: ShoppingBag, color: 'text-purple-600' },
          { label: 'Price Records', value: (stats?.prices ?? 0).toLocaleString('en-IN'), icon: RefreshCw, color: 'text-sky-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Sync */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Data Sync (data.gov.in)</h2>

          <div className="flex items-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${stats?.syncStatus.isConfigured ? 'bg-green-500' : 'bg-red-400'}`} />
            <span className="text-sm">
              API Key: {stats?.syncStatus.isConfigured ? (
                <span className="text-green-600 font-medium">Configured</span>
              ) : (
                <span className="text-red-600 font-medium">Not configured — set DATA_GOV_API_KEY in backend/.env</span>
              )}
            </span>
          </div>

          <div className="text-sm text-gray-600 mb-4 space-y-1">
            <p>Last sync: {stats?.syncStatus.lastSync
              ? new Date(stats.syncStatus.lastSync).toLocaleString('en-IN')
              : 'Never synced'}
            </p>
            <p>Total price records: <strong>{stats?.syncStatus.totalRecords.toLocaleString('en-IN') ?? 0}</strong></p>
          </div>

          {syncMessage && (
            <div className={`text-sm rounded p-2 mb-3 ${syncMessage.includes('fail') || syncMessage.includes('key') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {syncMessage}
            </div>
          )}

          <button
            onClick={handleSync}
            disabled={syncLoading || !stats?.syncStatus.isConfigured}
            className="btn-primary text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
            {syncLoading ? 'Starting sync...' : 'Trigger Sync Now'}
          </button>

          {/* Recent logs */}
          {(stats?.syncStatus.recentLogs ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Recent Sync Logs</p>
              <div className="space-y-2">
                {stats?.syncStatus.recentLogs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {log.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : log.status === 'FAILED' ? (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span className="text-gray-600">{new Date(log.startedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-medium">{log.recordsImported} records</span>
                    {log.duration && <span className="text-gray-400">({(log.duration / 1000).toFixed(1)}s)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User management */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Recent Users</h2>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name.replace(' [DEMO]', '')}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`badge ${u.role === 'FARMER' ? 'badge-green' : u.role === 'BUYER' ? 'badge-amber' : 'badge-blue'}`}>
                    {u.role}
                  </span>
                  <span className={`badge ${u.isActive ? 'badge-gray' : 'badge-red'}`}>
                    {u.isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions box */}
      <div className="mt-6 card p-5 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Set <code className="bg-blue-100 px-1 rounded">DATA_GOV_API_KEY</code> in <code className="bg-blue-100 px-1 rounded">backend/.env</code></li>
          <li>Click "Trigger Sync Now" to fetch live AGMARKNET data</li>
          <li>Sync runs automatically every {import.meta.env.VITE_SYNC_INTERVAL ?? 6} hours when configured</li>
          <li>Demo credentials: admin@kisanconnect.in / farmer@demo.in / buyer@demo.in (all password123 prefix)</li>
        </ol>
      </div>
    </div>
  );
}
