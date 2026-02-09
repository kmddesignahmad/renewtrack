import { useState } from 'react';
import { api } from '../lib/api';
import { useLang } from '../lib/LangContext';
import type { TranslationKey } from '../lib/i18n';

export default function ReportsPage() {
  const { t } = useLang();
  const [password, setPassword] = useState('');
  const [verified, setVerified] = useState(false);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setErr(t('all_fields_required')); return; }
    setLoading(true); setErr('');
    try {
      const result = await api.getReports(password);
      setData(result);
      setVerified(true);
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  };

  // Password gate
  if (!verified) {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <div className="card p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="text-xl font-bold text-gray-900">{t('reports_title')}</h1>
            <p className="text-sm text-gray-500 mt-2">{t('reports_password_prompt')}</p>
          </div>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="label">{t('password')}</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {err && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{err}</div>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? t('reports_verifying') : t('reports_verify')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const s = data?.summary || {};
  const monthNames = Array.from({ length: 12 }, (_, i) => t((`month_${i + 1}`) as TranslationKey));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('reports_title')}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: t('total_customers'), value: s.total_customers, color: 'text-brand-600' },
          { label: t('total_subscriptions'), value: s.total_subscriptions, color: 'text-gray-900' },
          { label: t('active_subscriptions'), value: s.active_subscriptions, color: 'text-emerald-600' },
          { label: t('due_soon'), value: s.due_soon, color: 'text-amber-600' },
          { label: t('expired'), value: s.expired, color: 'text-red-600' },
          { label: t('total_revenue'), value: `${s.total_revenue} JOD`, color: 'text-brand-700' },
        ].map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Breakdown */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{t('monthly_breakdown')} ({data?.current_year})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-2">{t('month_col')}</th>
                  <th className="px-4 py-2">{t('count')}</th>
                  <th className="px-4 py-2">{t('revenue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.monthly || []).map((m: any) => (
                  <tr key={m.month} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-gray-900">{monthNames[parseInt(m.month) - 1]}</td>
                    <td className="px-4 py-2 text-gray-600">{m.count}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">{m.revenue} JOD</td>
                  </tr>
                ))}
                {(data?.monthly || []).length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">{t('no_data')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Yearly Breakdown */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{t('yearly_breakdown')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-2">{t('year_col')}</th>
                  <th className="px-4 py-2">{t('count')}</th>
                  <th className="px-4 py-2">{t('revenue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.yearly || []).map((y: any) => (
                  <tr key={y.year} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 text-gray-900 font-medium">{y.year}</td>
                    <td className="px-4 py-2 text-gray-600">{y.count}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">{y.revenue} JOD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{t('top_customers')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-2">{t('name')}</th>
                  <th className="px-4 py-2">{t('sub_count')}</th>
                  <th className="px-4 py-2">{t('revenue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.top_customers || []).map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-2 text-gray-600">{c.sub_count}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">{c.total_revenue} JOD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{t('service_breakdown')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-2">{t('service')}</th>
                  <th className="px-4 py-2">{t('count')}</th>
                  <th className="px-4 py-2">{t('revenue')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.service_breakdown || []).map((s: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-2 text-gray-600">{s.count}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">{s.revenue} JOD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Renewals */}
      <div className="card mt-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('recent_renewals_report')}</h2>
        </div>
        {(data?.recent_renewals || []).length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">{t('no_recent_renewals')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-2">{t('customer')}</th>
                  <th className="px-4 py-2">{t('domain_service')}</th>
                  <th className="px-4 py-2">Old End</th>
                  <th className="px-4 py-2">New End</th>
                  <th className="px-4 py-2">Renewed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.recent_renewals || []).map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2 font-medium text-gray-900">{r.customer_name}</td>
                    <td className="px-4 py-2 text-gray-600 font-mono text-xs">{r.domain_or_service}</td>
                    <td className="px-4 py-2 text-red-500">{r.old_end_date}</td>
                    <td className="px-4 py-2 text-emerald-600">{r.new_end_date}</td>
                    <td className="px-4 py-2 text-gray-500">{r.renewed_at?.split('T')[0]}</td>
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
