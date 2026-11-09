export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: 'FARMER' | 'BUYER' | 'TRANSPORT' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  farmerProfile?: FarmerProfile;
  buyerProfile?: BuyerProfile;
  transportProfile?: TransportProfile;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  village?: string;
  district: string;
  state: string;
  pincode?: string;
  farmSize?: number;
  farmSizeUnit?: string;
  preferredMarkets?: string;
  bio?: string;
  latitude?: number;
  longitude?: number;
}

export interface BuyerProfile {
  id: string;
  userId: string;
  companyName?: string;
  district: string;
  state: string;
  buyerType: string;
  gstin?: string;
  latitude?: number;
  longitude?: number;
}

export interface TransportProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  isVerified: boolean;
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
  district: string;
  state: string;
  serviceArea?: string;
  vehicles?: Vehicle[];
  user?: Pick<User, 'id' | 'name' | 'email' | 'mobile'>;
}

export interface Vehicle {
  id: string;
  transportProfileId: string;
  type: string; // MINI_TRUCK | TEMPO | TRACTOR | PICKUP | REFRIGERATED
  registrationNumber: string;
  capacityKg: number;
  isRefrigerated: boolean;
  isActive: boolean;
}

export interface Delivery {
  id: string;
  orderId: string;
  transportProfileId?: string;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  distanceKm?: number;
  estimatedDuration?: number;
  transportCost?: number;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  transportProfile?: TransportProfile;
  order?: Order;
}

export interface Market {
  id: string;
  name: string;
  state: string;
  district: string;
  address?: string;
  apmc?: string;
  eNamStatus: boolean;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  _count?: { prices: number };
}

export interface Commodity {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  unit: string;
  imageUrl?: string;
  description?: string;
  varieties?: CommodityVariety[];
  _count?: { prices: number };
}

export interface CommodityVariety {
  id: string;
  commodityId: string;
  name: string;
  normalizedName: string;
}

export interface MarketPrice {
  id: string;
  marketId: string;
  commodityId: string;
  varietyId?: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivals?: number;
  unit: string;
  priceDate: string;
  source: string;
  sourceUrl?: string;
  retrievedAt: string;
  commodity?: Pick<Commodity, 'id' | 'name' | 'category' | 'unit'>;
  market?: Pick<Market, 'id' | 'name' | 'state' | 'district'>;
  variety?: Pick<CommodityVariety, 'id' | 'name'>;
}

export interface Product {
  id: string;
  farmerId: string;
  commodityId: string;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  images?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  isDemo: boolean;
  isActive: boolean;
  createdAt: string;
  commodity?: Pick<Commodity, 'id' | 'name' | 'category' | 'unit'>;
  farmer?: { id: string; name: string; farmerProfile?: Pick<FarmerProfile, 'village' | 'district' | 'state'> };
  _count?: { favorites: number };
}

export interface Order {
  id: string;
  buyerId: string;
  farmerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  produceAmount?: number;
  transportCost?: number;
  platformFee?: number;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  buyer?: { id: string; name: string; email: string };
  farmer?: { id: string; name: string; email: string };
  items?: OrderItem[];
  delivery?: Delivery;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unit: string;
  price: number;
  product?: { id: string; title: string; commodity?: { name: string } };
}

export interface PriceAlert {
  id: string;
  userId: string;
  commodityId: string;
  marketId?: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  isActive: boolean;
  lastTriggered?: string;
  commodity?: Pick<Commodity, 'id' | 'name'>;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: string;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationMeta;
  meta?: {
    source?: string;
    sourceUrl?: string;
    lastSynchronized?: string;
    apiConfigured?: boolean;
    note?: string;
  };
}

export interface DataFreshnessMeta {
  source: string;
  sourceUrl?: string;
  lastSynchronized: string | null;
  apiConfigured: boolean;
  note?: string | null;
}

export interface DeliveryEstimate {
  distanceKm: number;
  estimatedDuration: number;
  transportCost: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    refrigerationSurcharge: number;
  };
  vehicleType: string;
  note?: string;
}
