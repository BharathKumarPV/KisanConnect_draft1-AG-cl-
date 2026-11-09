import { useState, useEffect, useCallback } from 'react';
import {
  Truck, Package, IndianRupee, ToggleLeft, ToggleRight,
  MapPin, Clock, CheckCircle, ArrowRight, Plus, AlertTriangle,
} from 'lucide-react';
import { transportApi } from '../api/transport';
import { useAuth } from '../hooks/useAuth';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import type { TransportProfile, Delivery, Vehicle } from '../types';

const VEHICLE_TYPES = [
  { value: 'MINI_TRUCK', label: 'Mini Truck', capacity: 1500 },
  { value: 'TEMPO', label: 'Tempo', capacity: 750 },
  { value: 'TRACTOR', label: 'Tractor', capacity: 2000 },
  { value: 'PICKUP', label: 'Pickup Van', capacity: 500 },
  { value: 'REFRIGERATED', label: 'Refrigerated Vehicle', capacity: 1000 },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-indigo-100 text-indigo-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const NEXT_STATUS: Record<string, string> = {
  ACCEPTED: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: 'DELIVERED',
};

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export default function TransportDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TransportProfile | null>(null);
  const [available, setAvailable] = useState<Delivery[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [earnings, setEarnings] = useState({ totalEarnings: 0, monthlyEarnings: 0, deliveryCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ type: 'MINI_TRUCK', registrationNumber: '', capacityKg: '1500', isRefrigerated: false });
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'mine' | 'vehicles'>('available');

  const loadAll = useCallback(async () => {
    try {
      const [profileRes, availRes, mineRes, vehiclesRes, earningsRes] = await Promise.all([
        transportApi.getProfile().catch(() => null),
        transportApi.getAvailableDeliveries().catch(() => null),
        transportApi.getMyDeliveries().catch(() => null),
        transportApi.listVehicles().catch(() => null),
        transportApi.getEarnings().catch(() => null),
      ]);
      if (profileRes) setProfile(profileRes.data.profile);
      if (availRes) setAvailable(availRes.data.data);
      if (mineRes) setMyDeliveries(mineRes.data.data);
      if (vehiclesRes) setVehicles(vehiclesRes.data.vehicles);
      if (earningsRes) setEarnings(earningsRes.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    setTogglingAvail(true);
    try {
      const res = await transportApi.updateAvailability(!profile.isAvailable);
      setProfile(res.data.profile);
    } catch {
      setError('Failed to update availability.');
    } finally {
      setTogglingAvail(false);
    }
  };

  const handleAccept = async (deliveryId: string) => {
    const firstVehicle = vehicles.find(v => v.isActive);
    if (!firstVehicle) {
      setError('Please add a vehicle first before accepting deliveries.');
      setActiveTab('vehicles');
      return;
    }
    setAcceptingId(deliveryId);
    try {
      await transportApi.acceptDelivery(deliveryId, firstVehicle.id);
      await loadAll();
      setActiveTab('mine');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to accept delivery.';
      setError(msg);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleUpdateStatus = async (deliveryId: string, newStatus: string) => {
    setUpdatingId(deliveryId);
    try {
      await transportApi.updateDeliveryStatus(deliveryId, newStatus);
      await loadAll();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to update status.';
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleLoading(true);
    try {
      await transportApi.addVehicle({
        type: vehicleForm.type,
        registrationNumber: vehicleForm.registrationNumber,
        capacityKg: parseInt(vehicleForm.capacityKg) || 1000,
        isRefrigerated: vehicleForm.isRefrigerated,
      });
      setShowAddVehicle(false);
      setVehicleForm({ type: 'MINI_TRUCK', registrationNumber: '', capacityKg: '1500', isRefrigerated: false });
      await loadAll();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to add vehicle.';
      setError(msg);
    } finally {
      setVehicleLoading(false);
    }
  };

  if (isLoading) return <div className="page-container"><LoadingSkeleton type="card" rows={4} /></div>;

  if (!profile) {
    return (
      <div className="page-container max-w-lg">
        <div className="card p-8 text-center">
          <Truck className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Complete Your Transport Profile</h2>
          <p className="text-sm text-gray-500 mb-4">Your transport profile isn't set up yet. Please contact support or re-register as a transport provider.</p>
          <p className="text-xs text-gray-400">If you just registered, please log out and log in again.</p>
        </div>
      </div>
    );
  }

  const pendingCount = myDeliveries.filter(d => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Transport Dashboard
          </h1>
          <p className="text-sm text-gray-500">Welcome, {user?.name.replace(' [DEMO]', '')} 🚛</p>
        </div>
        <button
          onClick={handleToggleAvailability}
          disabled={togglingAvail}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            profile.isAvailable
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {profile.isAvailable
            ? <ToggleRight className="w-5 h-5" />
            : <ToggleLeft className="w-5 h-5" />}
          {profile.isAvailable ? 'Available for Deliveries' : 'Set as Unavailable'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Deliveries', value: earnings.deliveryCount, icon: Package, color: 'text-blue-600' },
          { label: 'Active Jobs', value: pendingCount, icon: Truck, color: 'text-amber-600' },
          { label: 'Monthly Earnings', value: formatCurrency(earnings.monthlyEarnings), icon: IndianRupee, color: 'text-green-700' },
          { label: 'Total Earnings', value: formatCurrency(earnings.totalEarnings), icon: IndianRupee, color: 'text-purple-600' },
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['available', 'mine', 'vehicles'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'available' && `Available Jobs (${available.length})`}
            {tab === 'mine' && `My Deliveries (${myDeliveries.length})`}
            {tab === 'vehicles' && `Vehicles (${vehicles.length})`}
          </button>
        ))}
      </div>

      {/* Available Deliveries */}
      {activeTab === 'available' && (
        <div>
          {available.length === 0 ? (
            <div className="card p-8 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No available deliveries right now</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon — new jobs appear when buyers place orders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {available.map((delivery) => (
                <div key={delivery.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">PICKUP</p>
                          <p className="text-sm font-semibold text-gray-800">{delivery.pickupAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-11">
                        <div className="w-px h-6 bg-gray-200" />
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        {delivery.distanceKm && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {formatDist(delivery.distanceKm)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">DELIVERY</p>
                          <p className="text-sm font-semibold text-gray-800">{delivery.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      {delivery.transportCost && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Your Earnings</p>
                          <p className="text-xl font-bold text-green-700">{formatCurrency(delivery.transportCost)}</p>
                        </div>
                      )}
                      {delivery.estimatedDuration && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          ~{Math.round(delivery.estimatedDuration)} min
                        </div>
                      )}
                      <button
                        onClick={() => handleAccept(delivery.id)}
                        disabled={acceptingId === delivery.id}
                        className="btn-primary text-sm"
                      >
                        {acceptingId === delivery.id ? 'Accepting...' : 'Accept Job'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Deliveries */}
      {activeTab === 'mine' && (
        <div>
          {myDeliveries.length === 0 ? (
            <div className="card p-8 text-center">
              <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No deliveries yet</p>
              <p className="text-sm text-gray-400 mt-1">Accept a job from the Available Jobs tab to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myDeliveries.map((delivery) => (
                <div key={delivery.id} className="card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[delivery.status] || 'bg-gray-100 text-gray-600'}`}>
                          {delivery.status.replace('_', ' ')}
                        </span>
                        {delivery.distanceKm && (
                          <span className="text-xs text-gray-500">{formatDist(delivery.distanceKm)}</span>
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        <p><span className="text-gray-500">From:</span> <span className="font-medium">{delivery.pickupAddress}</span></p>
                        <p><span className="text-gray-500">To:</span> <span className="font-medium">{delivery.deliveryAddress}</span></p>
                      </div>
                      {delivery.transportCost && (
                        <p className="text-sm font-semibold text-green-700 mt-2">
                          {formatCurrency(delivery.transportCost)} earnings
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {NEXT_STATUS[delivery.status] && (
                        <button
                          onClick={() => handleUpdateStatus(delivery.id, NEXT_STATUS[delivery.status])}
                          disabled={updatingId === delivery.id}
                          className="btn-primary text-sm flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {updatingId === delivery.id ? 'Updating...' : `Mark ${NEXT_STATUS[delivery.status].replace('_', ' ')}`}
                        </button>
                      )}
                      {delivery.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus(delivery.id, 'CANCELLED')}
                          disabled={updatingId === delivery.id}
                          className="text-xs text-red-600 hover:text-red-700 py-1"
                        >
                          Cancel
                        </button>
                      )}
                      {delivery.status === 'DELIVERED' && (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vehicles */}
      {activeTab === 'vehicles' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">My Vehicles</h2>
            <button onClick={() => setShowAddVehicle(!showAddVehicle)} className="btn-secondary text-sm">
              <Plus className="w-4 h-4" />
              {showAddVehicle ? 'Cancel' : 'Add Vehicle'}
            </button>
          </div>

          {showAddVehicle && (
            <form onSubmit={handleAddVehicle} className="card p-4 mb-4 border-2 border-blue-200 bg-blue-50">
              <h3 className="font-semibold text-sm mb-3 text-blue-800">Add New Vehicle</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleForm.type}
                    onChange={(e) => {
                      const vt = VEHICLE_TYPES.find(v => v.value === e.target.value);
                      setVehicleForm(prev => ({ ...prev, type: e.target.value, capacityKg: String(vt?.capacity || 1000) }));
                    }}
                    className="select text-sm"
                  >
                    {VEHICLE_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MH12AB1234"
                    value={vehicleForm.registrationNumber}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    className="input text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Capacity (kg)</label>
                  <input
                    type="number"
                    value={vehicleForm.capacityKg}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, capacityKg: e.target.value }))}
                    className="input text-sm"
                    min="100" max="20000"
                  />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <input
                    type="checkbox"
                    id="isRefrigerated"
                    checked={vehicleForm.isRefrigerated}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, isRefrigerated: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isRefrigerated" className="text-sm text-gray-700">Refrigerated vehicle</label>
                </div>
              </div>
              <button type="submit" disabled={vehicleLoading} className="btn-primary text-sm mt-4">
                {vehicleLoading ? 'Adding...' : 'Add Vehicle'}
              </button>
            </form>
          )}

          {vehicles.length === 0 ? (
            <div className="card p-8 text-center">
              <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No vehicles added yet</p>
              <p className="text-sm text-gray-400 mt-1">Add your vehicle to start accepting delivery jobs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className={`card p-4 ${!vehicle.isActive ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-sm">{vehicle.registrationNumber}</span>
                    </div>
                    {vehicle.isRefrigerated && (
                      <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">❄ Refrigerated</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {VEHICLE_TYPES.find(v => v.value === vehicle.type)?.label || vehicle.type}
                    {' · '}{vehicle.capacityKg.toLocaleString('en-IN')} kg capacity
                  </p>
                  <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${vehicle.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {vehicle.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
