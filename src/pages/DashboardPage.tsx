import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!data) return <div className="text-center py-12 text-red-400">Failed to load dashboard</div>;

  const cards = [
    { label: 'Total Customers', value: data.total_customers, color: 'bg-brand-500', icon: '👥' },
    { label: 'Active Subscriptions', value: data.active_subscriptions, color: 'bg-emerald-500', icon: '✅' },
    { label: 'Due Soon (30 days)', value: data.due_soon, color: 'bg-amber-500', icon: '⏰' },
    { label: 'Expired', value: data.expired, color: 'bg-red-500', icon: '❌' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                {c.icon}
              </div>
              <span className="text-sm font-medium text-gray-500">{c.label}</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Renewals</h2>
        </div>
        {data.recent_renewals.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No recent renewals</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.recent_renewals.map((r: any) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{r.customer_name}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-gray-600">{r.domain_or_service}</span>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>{r.old_end_date} → {r.new_end_date}</div>
                  <div className="text-gray-400">{r.renewed_at?.split('T')[0]}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
