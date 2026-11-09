import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, ShoppingCart, User, Navigation } from 'lucide-react';
import { marketplaceApi } from '../api/marketplace';
import { ordersApi } from '../api/orders';
import { useAuth } from '../hooks/useAuth';
import PriceTransparency from '../components/Marketplace/PriceTransparency';
import PriceBreakdown from '../components/Marketplace/PriceBreakdown';
import LoadingSkeleton from '../components/UI/LoadingSkeleton';
import type { Product, MarketPrice } from '../types';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [latestMarketPrice, setLatestMarketPrice] = useState<MarketPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [qty, setQty] = useState(1);
  const [orderedQty, setOrderedQty] = useState(0);

  // Delivery location state
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState<number | undefined>();
  const [deliveryLng, setDeliveryLng] = useState<number | undefined>();
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    marketplaceApi.getProduct(id)
      .then(({ data }) => {
        setProduct(data.product);
        setLatestMarketPrice(data.latestMarketPrice);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeliveryLat(pos.coords.latitude);
        setDeliveryLng(pos.coords.longitude);
        setDeliveryAddress(`My location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const handleOrder = async () => {
    if (!product) return;
    setOrderLoading(true);
    setOrderError('');
    try {
      await ordersApi.create({
        items: [{ productId: product.id, quantity: qty, unit: product.unit }],
        deliveryAddress: deliveryAddress || undefined,
        deliveryLat,
        deliveryLng,
      });
      const purchased = qty;
      const newStock = Math.max(0, product.quantity - purchased);
      setOrderedQty(purchased);
      setProduct((prev) => (prev ? { ...prev, quantity: newStock } : null));
      setQty(Math.min(1, newStock));
      setOrderSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to place order.';
      setOrderError(msg);
    } finally {
      setOrderLoading(false);
    }
  };

  if (isLoading) return <div className="page-container"><LoadingSkeleton type="text" rows={8} /></div>;
  if (!product) return <div className="page-container"><p className="text-gray-500">Product not found.</p></div>;

  const isOwnProduct = user?.id === product.farmerId;
  const canOrder = isAuthenticated && user?.role === 'BUYER' && !isOwnProduct;

  return (
    <div className="page-container max-w-4xl">
      <Link to="/marketplace" className="btn-ghost text-sm mb-6 inline-flex">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left */}
        <div>
          {/* Image placeholder */}
          <div className="w-full h-56 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4">
            <Package className="w-16 h-16 text-green-400" />
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                <span className="font-medium">{product.farmer?.name?.replace(' [DEMO]', '')}</span>
                {product.farmer?.farmerProfile && (
                  <span className="text-gray-400"> · {product.farmer.farmerProfile.district}, {product.farmer.farmerProfile.state}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              {product.location}
            </div>
            {product.latitude && product.longitude && (
              <p className="text-xs text-gray-400 mt-1 ml-5">
                📍 {product.latitude.toFixed(4)}, {product.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {product.isDemo && <span className="badge badge-demo">DEMO</span>}
              <span className="badge badge-gray">{product.commodity?.category}</span>
              <span className="badge badge-green">{product.commodity?.name}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{product.title}</h1>
            {product.description && <p className="text-sm text-gray-600">{product.description}</p>}
          </div>

          <div className="card p-4">
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-3xl font-bold text-green-700">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-gray-500">/ {product.unit}</span>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{product.quantity.toLocaleString('en-IN')} {product.unit}</span> available
            </p>
          </div>

          {/* Price Transparency (mandi vs asking) */}
          <PriceTransparency
            productPrice={product.price}
            productUnit={product.unit}
            latestMarketPrice={latestMarketPrice}
          />

          {/* Order section */}
          {canOrder && !orderSuccess && (
            <div className="card p-4 space-y-4">
              <h3 className="font-semibold text-sm">Place Order</h3>

              {/* Quantity */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Quantity ({product.unit})</label>
                <input
                  type="number"
                  min={1}
                  max={product.quantity}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input w-24"
                />
              </div>

              {/* Delivery location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter delivery address (optional)"
                    className="input flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    title="Use my current location"
                    className="btn-secondary text-sm px-2.5"
                  >
                    {locating ? '…' : <Navigation className="w-4 h-4" />}
                  </button>
                </div>
                {deliveryLat && deliveryLng && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location captured — transport cost estimated below
                  </p>
                )}
              </div>

              {/* Full price breakdown */}
              <PriceBreakdown
                productPrice={product.price}
                productUnit={product.unit}
                quantity={qty}
                latestMarketPrice={latestMarketPrice}
                pickupLat={product.latitude}
                pickupLng={product.longitude}
                deliveryLat={deliveryLat}
                deliveryLng={deliveryLng}
              />

              {orderError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3">
                  <p className="font-semibold mb-0.5">{orderError}</p>
                  {(orderError.toLowerCase().includes('token') || orderError.toLowerCase().includes('auth')) && (
                    <p className="mt-1">
                      Your session may have expired.{' '}
                      <Link to="/login" className="underline font-bold text-red-800">
                        Please click here to sign in again.
                      </Link>
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={handleOrder}
                disabled={orderLoading || product.quantity <= 0}
                className="btn-primary w-full disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                {orderLoading
                  ? 'Placing Order...'
                  : product.quantity <= 0
                  ? 'Out of Stock'
                  : 'Place Order'}
              </button>
              <p className="text-xs text-gray-400 text-center">Order goes to farmer for review. Delivery assigned on acceptance.</p>
            </div>
          )}

          {orderSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-sm text-green-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✅</span>
                <span className="font-bold text-base">Order Placed Successfully!</span>
              </div>
              <p className="text-sm text-green-700 leading-relaxed">
                You ordered <strong>{orderedQty} {product.unit}</strong> of {product.title}.
              </p>
              <div className="bg-white/80 border border-green-200 rounded-lg p-3 text-xs text-gray-700">
                <span>Updated Available Stock: </span>
                <strong className="text-green-800 text-sm">{product.quantity.toLocaleString('en-IN')} {product.unit}</strong>
              </div>
              <div className="flex gap-2 pt-1">
                <Link to="/buyer-dashboard" className="btn-primary text-xs py-2 px-3">
                  Track in My Orders
                </Link>
                <Link to="/marketplace" className="btn-secondary text-xs py-2 px-3">
                  Back to Marketplace
                </Link>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <Link to="/login" className="btn-primary w-full justify-center">
              Sign in to place an order
            </Link>
          )}

          {isAuthenticated && user?.role === 'FARMER' && isOwnProduct && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              This is your listing. You cannot order your own produce.
            </div>
          )}

          {isAuthenticated && user?.role !== 'BUYER' && !isOwnProduct && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              You are signed in as a {user?.role.toLowerCase()}. To purchase produce, please sign in with a Buyer account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
