import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Boxes,
  AlertTriangle,
  Plus,
  ArrowRight,
  Edit2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import DashboardSummaryCard from '../components/DashboardSummaryCard';
import StockStatusBadge from '../components/StockStatusBadge';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-64 bg-slate-200 rounded-xl mt-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-semibold">{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const { totalProducts, totalUnits, lowStockCount, lowStockProducts, defaultLowStockThreshold } = data;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time overview of inventory levels and low-stock warnings for{' '}
            <span className="font-semibold text-slate-700">{user?.organization?.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardSummaryCard
          title="Total Products"
          value={totalProducts}
          icon={Package}
          color="indigo"
          subtitle="Distinct SKU items tracked"
        />
        <DashboardSummaryCard
          title="Total Units in Stock"
          value={totalUnits.toLocaleString()}
          icon={Boxes}
          color="emerald"
          subtitle="Aggregate inventory count"
        />
        <DashboardSummaryCard
          title="Low Stock Items"
          value={lowStockCount}
          icon={AlertTriangle}
          color={lowStockCount > 0 ? 'amber' : 'emerald'}
          subtitle={`At or below effective threshold`}
        />
      </div>

      {/* Low-Stock Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-base font-semibold text-slate-900">Low-Stock Alerts</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
              {lowStockCount} item{lowStockCount !== 1 ? 's' : ''}
            </span>
          </div>
          <Link
            to="/products"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View all products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {totalProducts === 0 ? (
          /* Empty state when NO products exist in the organization */
          <div className="py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No products in inventory</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Get started by adding your first product to track stock levels and receive low-stock alerts.
            </p>
            <div className="mt-6">
              <Link
                to="/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Product</span>
              </Link>
            </div>
          </div>
        ) : lowStockProducts.length === 0 ? (
          /* Empty state when all products have sufficient stock */
          <div className="py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">All Stock Levels Healthy</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              None of your {totalProducts} products are currently below their low-stock thresholds.
            </p>
          </div>
        ) : (
          /* Low-Stock Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Product Name</th>
                  <th scope="col" className="px-6 py-3.5">SKU</th>
                  <th scope="col" className="px-6 py-3.5">Quantity on Hand</th>
                  <th scope="col" className="px-6 py-3.5">Low-Stock Threshold</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div>
                        <span>{product.name}</span>
                        {product.description && (
                          <p className="text-xs text-slate-400 truncate max-w-xs">{product.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 font-semibold">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{product.quantityOnHand}</span>
                        <StockStatusBadge
                          isLowStock={true}
                          quantity={product.quantityOnHand}
                          threshold={product.effectiveThreshold}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="font-medium text-slate-900">{product.effectiveThreshold}</span>
                      {product.lowStockThreshold === null ? (
                        <span className="ml-1 text-xs text-slate-400">(org default)</span>
                      ) : (
                        <span className="ml-1 text-xs text-indigo-600 font-medium">(custom)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Update Stock</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

