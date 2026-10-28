import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../services/api';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CreateProduct() {
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleCreate = async (formData) => {
    setServerError('');
    setIsLoading(true);
    try {
      await api.post('/products', formData);
      addToast(`Product "${formData.name}" created successfully!`);
      navigate('/products');
    } catch (err) {
      setServerError(err.message || 'Failed to create product.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Link
          to="/products"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Product</h1>
          <p className="text-sm text-slate-500">
            Create an inventory item and set its quantity and stock thresholds.
          </p>
        </div>
      </div>

      {serverError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700 animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <ProductForm
          onSubmit={handleCreate}
          onCancel={() => navigate('/products')}
          isLoading={isLoading}
          orgDefaultThreshold={user?.organization?.defaultLowStockThreshold ?? 5}
        />
      </div>
    </div>
  );
}

