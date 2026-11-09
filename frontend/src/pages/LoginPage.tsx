import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Login failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setIsLoading(true);
    try {
      await login(demoEmail, demoPassword);
      navigate(from, { replace: true });
    } catch {
      setError('Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-green-700 rounded-xl flex items-center justify-center">
              <Sprout className="w-7 h-7 text-white" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-center text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Sign in to your KisanConnect account</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
              />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-2">Demo accounts (click to sign in)</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Admin', email: 'admin@kisanconnect.in', password: 'admin123' },
                { label: 'Farmer', email: 'farmer@demo.in', password: 'farmer123' },
                { label: 'Buyer', email: 'buyer@demo.in', password: 'buyer123' },
              ].map(({ label, email: e, password: p }) => (
                <button
                  key={label}
                  onClick={() => quickLogin(e, p)}
                  className="text-xs px-2 py-1.5 rounded border border-gray-300 hover:bg-gray-50 text-gray-600"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-center text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-700 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
