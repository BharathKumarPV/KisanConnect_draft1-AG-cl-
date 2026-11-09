import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, TrendingUp, Heart, Bell, Truck, MapPin, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../hooks/useAuth';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import type { Order, Notification, Delivery } from '../types';

interface DashboardData {
  stats: { totalOrders: number; totalSpent: number; pendingOrders: number; savedProducts: number };
  recentOrders: Order[];
  notifications: Notification[];
  favorites: Array<{ id: string; product: { id: string; title: string; price: number; unit: string; farmer: { name: string } } }>;
}

const ORDER_BADGE: Record<string, string> = {
  PENDING: 'badge-amber',
  ACCEPTED: 'badge-blue',
  PROCESSING: 'badge-blue',
  READY: 'badge-green',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-red',
};

const DELIVERY_STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-yellow-600',
  ACCEPTED: 'text-blue-600',
  PICKED_UP: 'text-indigo-600',
  IN_TRANSIT: 'text-purple-600',
  DELIVERED: 'text-green-600',
  CANCELLED: 'text-red-500',
};

const DELIVERY_STEP: Record<string, number> = {
  PENDING: 0, ACCEPTED: 1, PICKED_UP: 2, IN_TRANSIT: 3, DELIVERED: 4,
};

function DeliveryTracker({ delivery }: { delivery: Delivery }) {
  const steps = ['Pending', 'Assigned', 'Picked Up', 'In Transit', 'Delivered'];
  const current = DELIVERY_STEP[delivery.status] ?? 0;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, i) => (
          <div key={step} className="flex flex-col items-center flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              i <= current
                ? 'border-green-600 bg-green-600 text-white'
                : 'border-gray-300 bg-white text-gray-400'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-full h-0.5 mt-3 ${i < current ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        {steps.map((step, i) => (
          <span key={step} className={`text-xs flex-1 text-center ${i === current ? 'font-semibold text-green-700' : 'text-gray-400'}`}>
            {step}
          </span>
        ))}
      </div>
      <div className={`mt-2 text-xs font-medium ${DELIVERY_STATUS_COLOR[delivery.status] || 'text-gray-500'}`}>
        Status: {delivery.status.replace('_', ' ')}
        {delivery.distanceKm && ` · ${delivery.distanceKm.toFixed(1)} km`}
        {delivery.transportCost && ` · ₹${Math.round(delivery.transportCost).toLocaleString('en-IN')} transport`}
      </div>
    </div>
  );
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, Order>>({});

  const loadDashboard = useCallback(() => {
    apiClient.get('/dashboard/buyer')
      .then(({ data }) => setDashData(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleExpandOrder = async (orderId: string) => {
    if (activeOrderId === orderId) {
      setActiveOrderId(null);
      return;
    }
    setActiveOrderId(orderId);
    if (!orderDetails[orderId]) {
      try {
        const { data } = await apiClient.get(`/orders/${orderId}`);
        setOrderDetails(prev => ({ ...prev, [orderId]: data.order }));
      } catch {/* ignore */}
    }
  };

  if (isLoading) return <div className="page-container"><LoadingSkeleton type="card" rows={4} /></div>;

  const stats = dashData?.stats;

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-heading">Buyer Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome, {user?.name} 🛒</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: 'text-green-700' },
          { label: 'Pending Orders', value: stats?.pendingOrders ?? 0, icon: Clock, color: 'text-amber-600' },
          { label: 'Total Spent', value: `₹${(stats?.totalSpent ?? 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Saved Products', value: stats?.savedProducts ?? 0, icon: Heart, color: 'text-pink-500' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Orders with delivery tracking */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-green-700" /> My Orders
            </h2>
            <Link to="/marketplace" className="text-xs text-green-700 hover:underline">Browse more</Link>
          </div>
          {(dashData?.recentOrders ?? []).length === 0 ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">No orders yet.</p>
              <Link to="/marketplace" className="btn-primary text-sm">Browse Marketplace</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashData?.recentOrders.map((o) => {
                const detail = orderDetails[o.id];
                const isExpanded = activeOrderId === o.id;
                return (
                  <div key={o.id} className="border border-gray-100 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleExpandOrder(o.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">#{o.id.slice(-8)}</p>
                          <p className="text-xs text-gray-500">
                            {o.farmer?.name} · ₹{o.totalAmount.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge text-xs ${ORDER_BADGE[o.status] || 'badge-gray'}`}>{o.status}</span>
                          <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-400 mt-2 mb-1">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

                        {/* Price breakdown if available */}
                        {(detail?.produceAmount || detail?.transportCost) && (
                          <div className="text-xs text-gray-600 space-y-0.5 mb-2">
                            {detail.produceAmount && <div className="flex justify-between"><span>Produce</span><span>₹{detail.produceAmount.toLocaleString('en-IN')}</span></div>}
                            {detail.transportCost && <div className="flex justify-between"><span>Transport</span><span>₹{Math.round(detail.transportCost).toLocaleString('en-IN')}</span></div>}
                            {detail.platformFee && <div className="flex justify-between"><span>Platform fee</span><span>₹{Math.round(detail.platformFee).toLocaleString('en-IN')}</span></div>}
                          </div>
                        )}

                        {/* Delivery tracking */}
                        {detail?.delivery ? (
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <Truck className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-xs font-medium text-gray-700">Delivery Tracking</span>
                            </div>
                            {detail.delivery.deliveryAddress && (
                              <div className="flex items-start gap-1 mb-2">
                                <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-gray-500">{detail.delivery.deliveryAddress}</span>
                              </div>
                            )}
                            <DeliveryTracker delivery={detail.delivery} />
                            {detail.delivery.status === 'DELIVERED' && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-green-600 font-medium">
                                <CheckCircle className="w-3.5 h-3.5" /> Delivered successfully!
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Truck className="w-3 h-3" /> Awaiting delivery assignment
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Saved Products */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" /> Saved Products
            </h2>
          </div>
          {(dashData?.favorites ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No saved products yet. Browse the marketplace and save items.</p>
          ) : (
            <div className="space-y-3">
              {dashData?.favorites.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{f.product.title}</p>
                    <p className="text-xs text-gray-500">
                      ₹{f.product.price.toLocaleString('en-IN')}/{f.product.unit} · {f.product.farmer?.name}
                    </p>
                  </div>
                  <Link to={`/marketplace/${f.product.id}`} className="text-xs text-green-700 hover:underline">View</Link>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Market intelligence */}
      <div className="mt-6 card p-5 bg-amber-50 border-amber-200">
        <h3 className="font-semibold text-amber-800 mb-1">Market Intelligence</h3>
        <p className="text-sm text-amber-700 mb-3">Check mandi prices before placing large orders to ensure you're getting fair value.</p>
        <div className="flex gap-3 flex-wrap">
          <Link to="/mandi-prices" className="btn-accent text-sm">Check Mandi Prices</Link>
          <Link to="/mandi-compare" className="btn-ghost text-sm">Compare Markets</Link>
          <Link to="/marketplace" className="btn-secondary text-sm">Browse Marketplace</Link>
        </div>
      </div>
    </div>
  );
}
