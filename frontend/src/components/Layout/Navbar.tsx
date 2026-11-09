import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  MapPin,
  TrendingUp,
  Truck,
  Menu,
  X,
  Sprout,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const mainNav = [
  { to: '/mandi-prices', label: 'Mandi Prices', icon: BarChart3 },
  { to: '/commodities', label: 'Commodities', icon: TrendingUp },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { to: '/mandi-map', label: 'Market Map', icon: MapPin },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'FARMER') return '/farmer-dashboard';
    if (user.role === 'BUYER') return '/buyer-dashboard';
    if (user.role === 'TRANSPORT') return '/transport-dashboard';
    if (user.role === 'ADMIN') return '/admin-dashboard';
    return '/';
  };

  const roleBadgeClass = () => {
    if (!user) return 'badge-gray';
    if (user.role === 'FARMER') return 'badge-green';
    if (user.role === 'BUYER') return 'badge-amber';
    if (user.role === 'TRANSPORT') return 'badge-blue';
    return 'badge-blue';
  };

  const avatarBg = () => {
    if (!user) return 'bg-green-100';
    if (user.role === 'FARMER') return 'bg-green-100';
    if (user.role === 'BUYER') return 'bg-amber-100';
    if (user.role === 'TRANSPORT') return 'bg-blue-100';
    return 'bg-purple-100';
  };

  const avatarText = () => {
    if (!user) return 'text-green-700';
    if (user.role === 'FARMER') return 'text-green-700';
    if (user.role === 'BUYER') return 'text-amber-700';
    if (user.role === 'TRANSPORT') return 'text-blue-700';
    return 'text-purple-700';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-green-800">KisanConnect</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {mainNav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:text-green-700 hover:bg-gray-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
            {isAuthenticated && user?.role === 'TRANSPORT' && (
              <NavLink
                to="/transport-dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'
                  }`
                }
              >
                <Truck className="w-4 h-4" />
                My Deliveries
              </NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-7 h-7 ${avatarBg()} rounded-full flex items-center justify-center`}>
                    <span className={`${avatarText()} text-xs font-bold`}>{user.name[0].toUpperCase()}</span>
                  </div>
                  <span className="max-w-[120px] truncate">{user.name.replace(' [DEMO]', '')}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
                      <span className={`badge mt-1 ${roleBadgeClass()}`}>
                        {user.role}
                      </span>
                    </div>
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white pb-3">
          <div className="px-4 pt-2 space-y-1">
            {mainNav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-green-50 text-green-700' : 'text-gray-700'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
            {isAuthenticated && user?.role === 'TRANSPORT' && (
              <NavLink
                to="/transport-dashboard"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`
                }
              >
                <Truck className="w-4 h-4" />
                My Deliveries
              </NavLink>
            )}
          </div>

          <div className="px-4 pt-2 border-t border-gray-100 mt-2 space-y-1">
            {isAuthenticated && user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700">
                  <User className="w-4 h-4" /> Sign in
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-green-700 text-white">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </nav>
  );
}
