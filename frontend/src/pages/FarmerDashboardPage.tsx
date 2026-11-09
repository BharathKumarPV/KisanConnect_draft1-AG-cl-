import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, ShoppingCart, TrendingUp, Bell, CheckCircle, XCircle, Truck, IndianRupee } from 'lucide-react';
import apiClient from '../api/client';
import { marketplaceApi } from '../api/marketplace';
import { ordersApi } from '../api/orders';
import { useAuth } from '../hooks/useAuth';
import ProductForm from '../components/Marketplace/ProductForm';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import type { ProductPayload } from '../api/marketplace';
import type { Order, Product, Notification } from '../types';

interface DashboardData {
  stats: { totalRevenue: number; activeProducts: number; pendingOrders: number; totalOrders: number };
  recentProducts: Product[];
  recentOrders: Order[];
  notifications: Notification[];
}

const ORDER_BADGE: Record<string, string> = {
  PENDING: 'badge-amber',
  ACCEPTED: 'badge-blue',
  PROCESSING: 'badge-blue',
  READY: 'badge-green',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-red',
};

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  PENDING: '⏳ Awaiting transport',
  ACCEPTED: '🚛 Driver assigned',
  PICKED_UP: '📦 Picked up',
  IN_TRANSIT: '🛣️ In transit',
  DELIVERED: '✅ Delivered',
  CANCELLED: '❌ Cancelled',
};

export default function FarmerDashboardPage() {
  const { user } = useAuth();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadDashboard = useCallback(() => {
    apiClient.get('/dashboard/farmer')
      .then(({ data }) => setDashData(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleCreateProduct = async (data: ProductPayload) => {
    setFormLoading(true);
    try {
      await marketplaceApi.createProduct(data);
      setShowProductForm(false);
      loadDashboard();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create listing.';
      alert(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleOrderStatus = async (orderId: string, status: 'ACCEPTED' | 'CANCELLED') => {
    setUpdatingOrderId(orderId);
    try {
      await ordersApi.updateStatus(orderId, status);
      loadDashboard();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to update order.';
      alert(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (isLoading) return <div className="page-container"><LoadingSkeleton type="card" rows={4} /></div>;

  const stats = dashData?.stats;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-heading">Farmer Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {user?.name} 🌾</p>
        </div>
        <button onClick={() => setShowProductForm(!showProductForm)} className="btn-primary">
          <Plus className="w-4 h-4" />
          {showProductForm ? 'Cancel' : 'List Produce'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Listings', value: stats?.activeProducts ?? 0, icon: Package, color: 'text-green-700' },
          { label: 'Pending Orders', value: stats?.pendingOrders ?? 0, icon: ShoppingCart, color: 'text-amber-600' },
          { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Revenue', value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* New product form */}
      {showProductForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-base font-semibold mb-4">New Listing</h2>
          <ProductForm onSubmit={handleCreateProduct} isLoading={formLoading} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-green-700" /> My Listings</h2>
            <Link to="/marketplace" className="text-xs text-green-700 hover:underline">View all</Link>
          </div>
          {(dashData?.recentProducts ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No listings yet. Click "List Produce" to start.</p>
          ) : (
            <div className="space-y-3">
              {dashData?.recentProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.quantity} {p.unit} · ₹{p.price.toLocaleString('en-IN')}/{p.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${p.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders with Accept/Reject */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-amber-600" /> Incoming Orders</h2>
          </div>
          {(dashData?.recentOrders ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No orders received yet.</p>
          ) : (
            <div className="space-y-3">
              {dashData?.recentOrders.map((o) => (
                <div key={o.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">#{o.id.slice(-8)}</p>
                      <p className="text-xs text-gray-500">from {o.buyer?.name}</p>
                    </div>
                    <span className={`badge text-xs ${ORDER_BADGE[o.status] || 'badge-gray'}`}>{o.status}</span>
                  </div>

                  {/* Price breakdown */}
                  <div className="text-xs text-gray-600 mb-2 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span className="font-semibold text-green-700">₹{o.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    {o.produceAmount && (
                      <div className="flex justify-between text-gray-400">
                        <span>You receive</span>
                        <span className="text-green-600 font-medium">₹{Math.round(o.produceAmount * 0.98).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>

                  {/* Delivery status */}
                  {(o as Order & { delivery?: { status: string } }).delivery && (
                    <p className="text-xs text-blue-600 flex items-center gap-1 mb-2">
                      <Truck className="w-3 h-3" />
                      {DELIVERY_STATUS_LABEL[(o as Order & { delivery?: { status: string } }).delivery!.status] || 'Delivery in progress'}
                    </p>
                  )}

                  {/* Accept / Reject buttons for PENDING orders */}
                  {o.status === 'PENDING' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleOrderStatus(o.id, 'ACCEPTED')}
                        disabled={updatingOrderId === o.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {updatingOrderId === o.id ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleOrderStatus(o.id, 'CANCELLED')}
                        disabled={updatingOrderId === o.id}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {updatingOrderId === o.id ? '...' : 'Decline'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        {(dashData?.notifications ?? []).length > 0 && (
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-green-700" />
              <h2 className="font-semibold">Notifications</h2>
            </div>
            <div className="space-y-3">
              {dashData?.notifications.map((n) => (
                <div key={n.id} className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Price intelligence link */}
      <div className="mt-6 card p-5 bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-800 mb-1">📊 Market Price Intelligence</h3>
        <p className="text-sm text-green-700 mb-3">
          Compare mandi prices before deciding where and at what price to sell your produce.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link to="/mandi-prices" className="btn-primary text-sm">Mandi Prices</Link>
          <Link to="/mandi-compare" className="btn-secondary text-sm">Compare Markets</Link>
          <Link to="/price-trends" className="btn-secondary text-sm">Price Trends</Link>
        </div>
      </div>
    </div>
  );
}
