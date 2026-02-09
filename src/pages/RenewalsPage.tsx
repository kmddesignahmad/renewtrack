import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useLang } from '../lib/LangContext';
import StatusBadge from '../components/StatusBadge';
import type { TranslationKey } from '../lib/i18n';

export default function RenewalsPage() {
  const { t } = useLang();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const load = () => {
    api.getRenewals().then(setSubs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRenew = async (subId: number) => {
    if (!confirm(t('renew_confirm'))) return;
    setRenewing(subId);
    try {
      await api.renewSubscription(subId);
      load();
    } catch (ex: any) { alert(ex.message); }
    finally { setRenewing(null); }
  };

  const handleNotice = async (subId: number) => {
    try {
      const result = await api.createNotice(subId);
      window.open(`/notice/${result.uuid}`, '_blank');
    } catch (ex: any) { alert(ex.message); }
  };

  // Filters
  let filtered = [...subs];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((s) =>
      s.customer_name?.toLowerCase().includes(q) ||
      s.domain_or_service?.toLowerCase().includes(q) ||
      s.service_name?.toLowerCase().includes(q) ||
      s.phone_primary?.includes(q) ||
      s.customer_email?.toLowerCase().includes(q)
    );
  }

  if (filterYear) {
    filtered = filtered.filter((s) => s.end_date?.startsWith(filterYear));
  }

  if (filterMonth) {
    const m = String(parseInt(filterMonth)).padStart(2, '0');
    filtered = filtered.filter((s) => {
      const parts = s.end_date?.split('-');
      return parts && parts[1] === m;
    });
  }

  const years = [...new Set(subs.map((s) => s.end_date?.split('-')[0]).filter(Boolean))].sort();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('renewals_title')}</h1>
      <p className="text-sm text-gray-500 mb-4">{t('renewals_desc')}</p>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="input max-w-xs"
            placeholder={t('search_renewals')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input w-auto" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">{t('all_years')}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input w-auto" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">{t('all_months')}</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                {i + 1} - {t((`month_${i + 1}`) as TranslationKey)}
              </option>
            ))}
          </select>
          {(search || filterYear || filterMonth) && (
            <button className="btn-secondary btn-sm text-red-500" onClick={() => { setSearch(''); setFilterYear(''); setFilterMonth(''); }}>
              {t('clear_filters')}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="card px-5 py-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🎉</div>
          {t('no_renewals')}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{s.customer_name}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">{s.service_name}</span>
                    <span className="text-gray-400 mx-2">·</span>
                    <span className="font-mono text-xs">{s.domain_or_service}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>{t('end')}: <strong className="text-gray-700">{s.end_date}</strong></span>
                    <span>{t('price')}: <strong className="text-gray-700">{s.price} {s.currency}</strong></span>
                    {s.phone_primary && <span>{t('phone')}: {s.phone_primary}</span>}
                    {s.customer_email && <span>{t('email')}: {s.customer_email}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="btn-primary btn-sm" onClick={() => handleRenew(s.id)} disabled={renewing === s.id}>
                    {renewing === s.id ? t('renewing') : `🔄 ${t('renew')}`}
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => handleNotice(s.id)}>
                    📄 {t('notice')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
