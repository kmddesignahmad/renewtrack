import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLang } from '../lib/LangContext';

export default function DashboardPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">{t('loading')}</div>;
  if (!data) return <div className="text-center py-12 text-red-400">Failed to load</div>;

  const cards = [
    { label: t('total_customers'), value: data.total_customers, color: 'bg-brand-500', icon: '👥', onClick: () => navigate('/customers') },
    { label: t('active_subscriptions'), value: data.active_subscriptions, color: 'bg-emerald-500', icon: '✅', onClick: () => navigate('/subscriptions?status=active') },
    { label: t('due_soon'), value: data.due_soon, color: 'bg-amber-500', icon: '⏰', onClick: () => navigate('/subscriptions?status=due_soon') },
    { label: t('expired'), value: data.expired, color: 'bg-red-500', icon: '❌', onClick: () => navigate('/subscriptions?status=expired') },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard_title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div
            key={c.label}
            onClick={c.onClick}
            className="card p-5 cursor-pointer hover:shadow-md hover:border-brand-300 transition-all duration-150 active:scale-[0.98]"
          >
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
          <h2 className="font-semibold text-gray-900">{t('recent_renewals')}</h2>
        </div>
        {data.recent_renewals.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">{t('no_recent_renewals')}</div>
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
