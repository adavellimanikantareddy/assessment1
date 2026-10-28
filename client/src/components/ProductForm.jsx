import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function ProductForm({
  initialData = null,
  onSubmit,
  onCancel,
  isLoading = false,
  orgDefaultThreshold = 5,
}) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    quantityOnHand: 0,
    costPrice: '',
    sellingPrice: '',
    lowStockThreshold: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        description: initialData.description || '',
        quantityOnHand: initialData.quantityOnHand !== undefined ? initialData.quantityOnHand : 0,
        costPrice: initialData.costPrice !== null && initialData.costPrice !== undefined ? initialData.costPrice : '',
        sellingPrice: initialData.sellingPrice !== null && initialData.sellingPrice !== undefined ? initialData.sellingPrice : '',
        lowStockThreshold:
          initialData.lowStockThreshold !== null && initialData.lowStockThreshold !== undefined
            ? initialData.lowStockThreshold
            : '',
      });
    }
  }, [initialData]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Product name is required.';
    }
    if (!formData.sku.trim()) {
      errs.sku = 'SKU is required.';
    }

    const qty = Number(formData.quantityOnHand);
    if (isNaN(qty) || !Number.isInteger(qty) || qty < 0) {
      errs.quantityOnHand = 'Quantity must be a non-negative whole number (0 or higher).';
    }

    if (formData.costPrice !== '' && formData.costPrice !== null) {
      const cp = Number(formData.costPrice);
      if (isNaN(cp) || cp < 0) {
        errs.costPrice = 'Cost price must be a non-negative number.';
      }
    }

    if (formData.sellingPrice !== '' && formData.sellingPrice !== null) {
      const sp = Number(formData.sellingPrice);
      if (isNaN(sp) || sp < 0) {
        errs.sellingPrice = 'Selling price must be a non-negative number.';
      }
    }

    if (formData.lowStockThreshold !== '' && formData.lowStockThreshold !== null) {
      const lst = Number(formData.lowStockThreshold);
      if (isNaN(lst) || !Number.isInteger(lst) || lst < 0) {
        errs.lowStockThreshold = 'Low-stock threshold must be a non-negative whole number.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      description: formData.description.trim() || null,
      quantityOnHand: parseInt(formData.quantityOnHand, 10) || 0,
      costPrice: formData.costPrice !== '' ? parseFloat(formData.costPrice) : null,
      sellingPrice: formData.sellingPrice !== '' ? parseFloat(formData.sellingPrice) : null,
      lowStockThreshold: formData.lowStockThreshold !== '' ? parseInt(formData.lowStockThreshold, 10) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name and SKU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Wireless Mouse M185"
            className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
              errors.name ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
            } focus:outline-none focus:ring-2`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            SKU (Stock Keeping Unit) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="e.g. WM-185-BLK"
            className={`w-full px-3.5 py-2 text-sm font-mono rounded-lg border ${
              errors.sku ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
            } focus:outline-none focus:ring-2 uppercase`}
          />
          {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
        <textarea
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief details about product specifications or storage notes..."
          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Quantity, Cost Price, Selling Price */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Quantity on Hand <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            name="quantityOnHand"
            value={formData.quantityOnHand}
            onChange={handleChange}
            className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
              errors.quantityOnHand ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
            } focus:outline-none focus:ring-2`}
          />
          {errors.quantityOnHand && <p className="mt-1 text-xs text-red-600">{errors.quantityOnHand}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="costPrice"
            value={formData.costPrice}
            onChange={handleChange}
            placeholder="0.00"
            className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
              errors.costPrice ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
            } focus:outline-none focus:ring-2`}
          />
          {errors.costPrice && <p className="mt-1 text-xs text-red-600">{errors.costPrice}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="sellingPrice"
            value={formData.sellingPrice}
            onChange={handleChange}
            placeholder="0.00"
            className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
              errors.sellingPrice ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
            } focus:outline-none focus:ring-2`}
          />
          {errors.sellingPrice && <p className="mt-1 text-xs text-red-600">{errors.sellingPrice}</p>}
        </div>
      </div>

      {/* Custom Low Stock Threshold */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Custom Low-Stock Threshold (Optional)
        </label>
        <input
          type="number"
          min="0"
          step="1"
          name="lowStockThreshold"
          value={formData.lowStockThreshold}
          onChange={handleChange}
          placeholder={`Default: ${orgDefaultThreshold} (leave blank to inherit org default)`}
          className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
            errors.lowStockThreshold ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
          } focus:outline-none focus:ring-2`}
        />
        <p className="mt-1 text-xs text-slate-500">
          Leave blank to use the organization default ({orgDefaultThreshold}). If specified, alerts trigger when stock is &le; this number.
        </p>
        {errors.lowStockThreshold && <p className="mt-1 text-xs text-red-600">{errors.lowStockThreshold}</p>}
      </div>

      {/* Action buttons */}
      <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {initialData ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}

