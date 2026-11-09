import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.tsx';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ProtectedRoute from './components/Auth/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MandiPricesPage from './pages/MandiPricesPage';
import MandiDetailPage from './pages/MandiDetailPage';
import CommoditiesPage from './pages/CommoditiesPage';
import CommodityDetailPage from './pages/CommodityDetailPage';
import MarketplacePage from './pages/MarketplacePage';
import ProductDetailPage from './pages/ProductDetailPage';
import PriceTrendsPage from './pages/PriceTrendsPage';
import MandiComparePage from './pages/MandiComparePage';
import MandiMapPage from './pages/MandiMapPage';
import FarmerDashboardPage from './pages/FarmerDashboardPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import TransportDashboardPage from './pages/TransportDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/mandi-prices" element={<MandiPricesPage />} />
            <Route path="/mandi-prices/:id" element={<MandiDetailPage />} />
            <Route path="/commodities" element={<CommoditiesPage />} />
            <Route path="/commodities/:id" element={<CommodityDetailPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/marketplace/:id" element={<ProductDetailPage />} />
            <Route path="/price-trends" element={<PriceTrendsPage />} />
            <Route path="/mandi-compare" element={<MandiComparePage />} />
            <Route path="/mandi-map" element={<MandiMapPage />} />
            <Route
              path="/farmer-dashboard"
              element={
                <ProtectedRoute roles={['FARMER', 'ADMIN']}>
                  <FarmerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer-dashboard"
              element={
                <ProtectedRoute roles={['BUYER', 'ADMIN']}>
                  <BuyerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transport-dashboard"
              element={
                <ProtectedRoute roles={['TRANSPORT', 'ADMIN']}>
                  <TransportDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
