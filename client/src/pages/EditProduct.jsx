import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../services/api';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function EditProduct() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);
      } catch (err) {
        setServerError(err.message || 'Product not found or access denied.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleUpdate = async (formData) => {
    setServerError('');
    setIsLoading(true);
    try {
      await api.put(`/products/${id}`, formData);
      addToast(`Product "${formData.name}" updated successfully!`);
      navigate('/products');
    } catch (err) {
      setServerError(err.message || 'Failed to update product.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading product details...</p>
      </div>
    );
  }

  if (serverError && !product) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="font-semibold">{serverError}</p>
        </div>
        <div className="mt-4">
          <Link
            to="/products"
            className="text-sm font-semibold text-red-800 underline hover:no-underline"
          >
            &larr; Return to products
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Product</h1>
          <p className="text-sm text-slate-500">
            Updating <span className="font-medium text-slate-700">{product.name}</span> ({product.sku})
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
          initialData={product}
          onSubmit={handleUpdate}
          onCancel={() => navigate('/products')}
          isLoading={isLoading}
          orgDefaultThreshold={user?.organization?.defaultLowStockThreshold ?? 5}
        />
      </div>
    </div>
  );
}

