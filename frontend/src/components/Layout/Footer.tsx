import { Link } from 'react-router-dom';
import { Sprout, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">KisanConnect</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              India's agriculture market intelligence platform. Track mandi prices, compare markets,
              and connect farmers with buyers directly.
            </p>
            <p className="text-xs text-gray-500">
              Mandi price data sourced from{' '}
              <a
                href="https://data.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline inline-flex items-center gap-0.5"
              >
                data.gov.in <ExternalLink className="w-3 h-3" />
              </a>{' '}
              (AGMARKNET). Prices are indicative; verify before transacting.
            </p>
          </div>

          {/* Market Intelligence */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Market Intelligence</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/mandi-prices" className="hover:text-white transition-colors">Mandi Prices</Link></li>
              <li><Link to="/commodities" className="hover:text-white transition-colors">Commodities</Link></li>
              <li><Link to="/price-trends" className="hover:text-white transition-colors">Price Trends</Link></li>
              <li><Link to="/mandi-compare" className="hover:text-white transition-colors">Market Compare</Link></li>
              <li><Link to="/mandi-map" className="hover:text-white transition-colors">Market Map</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register as Farmer</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register as Buyer</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs">
            © {new Date().getFullYear()} KisanConnect. Data sourced from Government of India open data portals.
          </p>
          <p className="text-xs text-gray-600">
            Demo credentials — Admin: admin@kisanconnect.in | Farmer: farmer@demo.in | Buyer: buyer@demo.in
          </p>
        </div>
      </div>
    </footer>
  );
}
