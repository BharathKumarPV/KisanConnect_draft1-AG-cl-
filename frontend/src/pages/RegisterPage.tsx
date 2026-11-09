import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Truck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { RegisterPayload } from '../api/auth';
import { authApi } from '../api/auth';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi',
];

const VEHICLE_TYPES = [
  { value: 'MINI_TRUCK', label: 'Mini Truck' },
  { value: 'TEMPO', label: 'Tempo' },
  { value: 'TRACTOR', label: 'Tractor' },
  { value: 'PICKUP', label: 'Pickup Van' },
  { value: 'REFRIGERATED', label: 'Refrigerated Vehicle' },
];

type Role = 'FARMER' | 'BUYER' | 'TRANSPORT';

export default function RegisterPage() {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('FARMER');
  const [formData, setFormData] = useState({
    name: '', email: '', mobile: '', password: '', confirmPassword: '',
    district: '', state: '', village: '', companyName: '',
    licenseNumber: '', vehicleType: 'MINI_TRUCK',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email.includes('@')) errs.email = 'Valid email is required';
    if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!formData.district.trim()) errs.district = 'District is required';
    if (!formData.state) errs.state = 'State is required';
    if (role === 'TRANSPORT' && !formData.licenseNumber.trim()) errs.licenseNumber = 'License number is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setIsLoading(true);
    setError('');

    const payload: RegisterPayload = {
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile || undefined,
      password: formData.password,
      role,
      district: formData.district,
      state: formData.state,
      ...(role === 'FARMER' ? { village: formData.village } : {}),
      ...(role === 'BUYER' ? { companyName: formData.companyName } : {}),
      ...(role === 'TRANSPORT' ? {
        licenseNumber: formData.licenseNumber,
        vehicleType: formData.vehicleType,
      } : {}),
    };

    try {
      const { data } = await authApi.register(payload);
      setAuth(data.user, data.token);
      if (role === 'FARMER') navigate('/farmer-dashboard');
      else if (role === 'BUYER') navigate('/buyer-dashboard');
      else navigate('/transport-dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Registration failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { key: Role; emoji: string; label: string }[] = [
    { key: 'FARMER', emoji: '🌾', label: 'Farmer' },
    { key: 'BUYER', emoji: '🛒', label: 'Buyer' },
    { key: 'TRANSPORT', emoji: '🚛', label: 'Transport' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-green-700 rounded-xl flex items-center justify-center">
              <Sprout className="w-7 h-7 text-white" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Create Account</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Join KisanConnect as Farmer, Buyer or Transport Provider</p>

          {/* Role toggle */}
          <div className="flex rounded-lg border border-gray-300 p-1 mb-6">
            {roles.map(({ key, emoji, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  role === key
                    ? key === 'TRANSPORT' ? 'bg-blue-600 text-white' : 'bg-green-700 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>

          {role === 'TRANSPORT' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4 text-xs text-blue-700 flex items-start gap-2">
              <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Register as a transport provider to accept agricultural delivery jobs and earn per delivery.</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className="input" />
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="input" />
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input type="tel" value={formData.mobile} onChange={(e) => handleChange('mobile', e.target.value)} className="input" placeholder="10-digit mobile" />
            </div>

            {role === 'BUYER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} className="input" />
              </div>
            )}

            {role === 'FARMER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                <input type="text" value={formData.village} onChange={(e) => handleChange('village', e.target.value)} className="input" />
              </div>
            )}

            {role === 'TRANSPORT' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driving License Number *</label>
                  <input type="text" value={formData.licenseNumber} onChange={(e) => handleChange('licenseNumber', e.target.value)} className="input" placeholder="e.g. DL-0120110149646" />
                  {fieldErrors.licenseNumber && <p className="text-red-500 text-xs mt-1">{fieldErrors.licenseNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Vehicle Type</label>
                  <select value={formData.vehicleType} onChange={(e) => handleChange('vehicleType', e.target.value)} className="select">
                    {VEHICLE_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                <input type="text" value={formData.district} onChange={(e) => handleChange('district', e.target.value)} className="input" />
                {fieldErrors.district && <p className="text-red-500 text-xs mt-1">{fieldErrors.district}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <select value={formData.state} onChange={(e) => handleChange('state', e.target.value)} className="select">
                  <option value="">Select...</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {fieldErrors.state && <p className="text-red-500 text-xs mt-1">{fieldErrors.state}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} className="input" />
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input type="password" value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} className="input" />
              {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center mt-2">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-green-700 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
