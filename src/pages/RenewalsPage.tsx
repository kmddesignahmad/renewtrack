import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import StatusBadge from '../components/StatusBadge';

export default function RenewalsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState<number | null>(null);

  const load = () => {
    api.getRenewals().then(setSubs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRenew = async (subId: number) => {
    if (!confirm('Renew this subscription for 365 days?')) return;
    setRenewing(subId);
    try {
      await api.renewSubscription(subId);
      load();
    } catch (ex: any) {
      alert(ex.message);
    } finally {
      setRenewing(null);
    }
  };

  const handleNotice = async (subId: number) => {
    try {
      const result = await api.createNotice(subId);
      window.open(`/notice/${result.uuid}`, '_blank');
    } catch (ex: any) {
      alert(ex.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Renewals</h1>
      <p className="text-sm text-gray-500 mb-4">Subscriptions that are due soon, expired, or marked for review.</p>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : subs.length === 0 ? (
        <div className="card px-5 py-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🎉</div>
          No subscriptions need renewal right now
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
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
                    <span>End: <strong className="text-gray-700">{s.end_date}</strong></span>
                    <span>Price: <strong className="text-gray-700">{s.price} {s.currency}</strong></span>
                    {s.phone_primary && <span>Phone: {s.phone_primary}</span>}
                    {s.customer_email && <span>Email: {s.customer_email}</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => handleRenew(s.id)}
                    disabled={renewing === s.id}
                  >
                    {renewing === s.id ? 'Renewing...' : '🔄 Renew'}
                  </button>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => handleNotice(s.id)}
                  >
                    📄 Notice
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
