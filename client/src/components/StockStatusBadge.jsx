import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function StockStatusBadge({ isLowStock, quantity, threshold }) {
  if (isLowStock) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span>Low Stock ({quantity} / th: {threshold})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
      <span>In Stock</span>
    </span>
  );
}

