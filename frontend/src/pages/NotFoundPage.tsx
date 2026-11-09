import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex gap-3">
        <Link to="/" className="btn-primary">
          <Home className="w-4 h-4" /> Go Home
        </Link>
        <button onClick={() => window.history.back()} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    </div>
  );
}
