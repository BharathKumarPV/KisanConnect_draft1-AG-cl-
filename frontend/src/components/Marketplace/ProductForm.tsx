import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { commoditiesApi } from '../../api/commodities';
import type { Commodity, Product } from '../../types';
import type { ProductPayload } from '../../api/marketplace';

const UNITS = ['Quintal', 'KG', 'Tonne', 'Box', 'Dozen', 'Piece'];

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: ProductPayload) => Promise<void>;
  isLoading?: boolean;
}

function validate(formData: { commodityId: string; title: string; quantity: string; unit: string; price: string; location: string; description: string }): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!formData.commodityId) errs.commodityId = 'Select a commodity';
  if (formData.title.trim().length < 3) errs.title = 'Title must be at least 3 characters';
  if (!formData.quantity || isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0)
    errs.quantity = 'Enter a positive number';
  if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0)
    errs.price = 'Enter a positive number';
  if (formData.location.trim().length < 2) errs.location = 'Enter location';
  return errs;
}

export default function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const navigate = useNavigate();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    commodityId: initialData?.commodityId ?? '',
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    quantity: initialData?.quantity?.toString() ?? '',
    unit: initialData?.unit ?? 'Quintal',
    price: initialData?.price?.toString() ?? '',
    location: initialData?.location ?? '',
  });

  useEffect(() => {
    commoditiesApi.list({ limit: 200 }).then(({ data }) => setCommodities(data.data)).catch(console.error);
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: ProductPayload = {
      commodityId: formData.commodityId,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      price: parseFloat(formData.price),
      location: formData.location.trim(),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Commodity *</label>
        <select
          value={formData.commodityId}
          onChange={(e) => handleChange('commodityId', e.target.value)}
          className="select"
        >
          <option value="">Select commodity...</option>
          {commodities.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
          ))}
        </select>
        {errors.commodityId && <p className="text-red-500 text-xs mt-1">{errors.commodityId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g. Fresh Red Onion from Nashik, Grade A"
          className="input"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          placeholder="Describe quality, grade, packaging..."
          className="input resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            min="0"
            step="0.01"
            className="input"
          />
          {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
          <select
            value={formData.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            className="select"
          >
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Price per {formData.unit} (₹) *</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          min="0"
          step="0.01"
          placeholder="e.g. 1500"
          className="input"
        />
        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location (District, State) *</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="e.g. Nashik, Maharashtra"
          className="input"
        />
        {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Saving...' : (initialData?.id ? 'Update Listing' : 'Create Listing')}
        </button>
        <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
