import { Link } from 'react-router-dom';
import { MapPin, Package, Heart } from 'lucide-react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onFavorite?: (id: string) => void;
}

export default function ProductCard({ product, onFavorite }: ProductCardProps) {
  const isDemo = product.isDemo;

  return (
    <div className="card p-4 flex flex-col hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {isDemo && <span className="badge badge-demo">DEMO</span>}
            <span className="badge badge-gray">{product.commodity?.category}</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
            {product.title}
          </h3>
        </div>
        {onFavorite && (
          <button
            onClick={() => onFavorite(product.id)}
            className="p-1 ml-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
            title="Save to favorites"
          >
            <Heart className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Commodity */}
      <p className="text-xs text-gray-500 mb-2">{product.commodity?.name}</p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-xl font-bold text-green-700">
          ₹{product.price.toLocaleString('en-IN')}
        </span>
        <span className="text-xs text-gray-500">/{product.unit}</span>
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
        {product.quantity > 0 ? (
          <div className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-green-700" />
            <span className="font-semibold text-gray-800">{product.quantity.toLocaleString('en-IN')} {product.unit}</span> available
          </div>
        ) : (
          <span className="badge badge-red text-xs font-semibold">Out of Stock</span>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{product.location}</span>
      </div>

      {/* Farmer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          by <span className="font-medium text-gray-700">{product.farmer?.name?.replace(' [DEMO]', '')}</span>
        </span>
        <Link
          to={`/marketplace/${product.id}`}
          className="text-xs font-medium text-green-700 hover:text-green-800"
        >
          View details →
        </Link>
      </div>
    </div>
  );
}
