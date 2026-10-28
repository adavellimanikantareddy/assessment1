import React from 'react';

export default function DashboardSummaryCard({ title, value, icon: Icon, color = 'indigo', subtitle }) {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      badge: 'text-indigo-700 bg-indigo-50/50',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      badge: 'text-emerald-700 bg-emerald-50/50',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      badge: 'text-amber-700 bg-amber-50/50',
    },
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentTheme.bg} ${currentTheme.text}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

