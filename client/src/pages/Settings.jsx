import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, AlertCircle, Building2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setThreshold(res.data.settings.defaultLowStockThreshold);
      } catch (err) {
        setError(err.message || 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setError('');

    const val = Number(threshold);
    if (isNaN(val) || !Number.isInteger(val) || val < 0) {
      setValidationError('Default threshold must be a non-negative whole number (0 or higher).');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/settings', {
        defaultLowStockThreshold: val,
      });
      setThreshold(res.data.settings.defaultLowStockThreshold);
      await refreshUser();
      addToast('Organization default threshold updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your organization preferences and inventory alert defaults.
        </p>
      </div>

      {/* Organization Details Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Organization Profile</h2>
            <p className="text-xs text-slate-500">Verified tenant environment</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Organization Name
            </span>
            <p className="mt-1 font-semibold text-slate-800">{user?.organization?.name}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Account Owner
            </span>
            <p className="mt-1 font-semibold text-slate-800">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Low-Stock Threshold Settings Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Inventory Alert Rules</h2>
            <p className="text-xs text-slate-500">Configure automated warning thresholds</p>
          </div>
        </div>

        {error && (
          <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Default Low-Stock Threshold
            </label>
            <p className="text-xs text-slate-500 mb-3">
              When a product does not specify its own custom threshold, StockFlow flags it as "Low Stock"
              whenever its quantity on hand is less than or equal to (&le;) this number.
            </p>
            <div className="max-w-xs">
              <input
                type="number"
                min="0"
                step="1"
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  validationError ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
                } focus:outline-none focus:ring-2`}
              />
              {validationError && (
                <p className="mt-1 text-xs text-red-600">{validationError}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

