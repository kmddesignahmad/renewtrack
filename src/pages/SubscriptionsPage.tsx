import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Inline customer creation
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const emptyForm = {
    customer_id: '',
    service_type_id: '',
    domain_or_service: '',
    start_date: today,
    end_date: '',
    price: '',
    currency: 'JOD',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      const [s, c, sv] = await Promise.all([
        api.getSubscriptions(),
        api.getCustomers(),
        api.getServices(),
      ]);
      setSubs(s);
      setCustomers(c);
      setServices(sv.filter((x: any) => x.is_active));
    } catch (ex) {
      console.error(ex);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowNewCustomer(false);
    setErr('');
    setModalOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      customer_id: s.customer_id,
      service_type_id: s.service_type_id,
      domain_or_service: s.domain_or_service,
      start_date: s.start_date,
      end_date: s.end_date,
      price: s.price || '',
      currency: s.currency || 'JOD',
      notes: s.notes || '',
    });
    setShowNewCustomer(false);
    setErr('');
    setModalOpen(true);
  };

  const handleCreateInlineCustomer = async () => {
    if (!newCustName.trim()) return;
    try {
      const c: any = await api.createCustomer({ name: newCustName, phone_primary: newCustPhone });
      setCustomers((prev) => [...prev, c]);
      setForm((f) => ({ ...f, customer_id: c.id }));
      setShowNewCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
    } catch (ex: any) {
      setErr(ex.message);
    }
  };

  const handleSave = async () => {
    if (!form.customer_id) { setErr('Select a customer'); return; }
    if (!form.service_type_id) { setErr('Select a service'); return; }
    if (!form.domain_or_service.trim()) { setErr('Domain/service name is required'); return; }
    if (!form.end_date) { setErr('End date is required'); return; }

    setSaving(true); setErr('');
    const payload = {
      ...form,
      customer_id: Number(form.customer_id),
      service_type_id: Number(form.service_type_id),
      price: form.price ? Number(form.price) : 0,
    };

    try {
      if (editing) {
        await api.updateSubscription(editing.id, payload);
      } else {
        await api.createSubscription(payload);
      }
      setModalOpen(false);
      load();
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subscription?')) return;
    try {
      await api.deleteSubscription(id);
      load();
    } catch (ex: any) {
      alert(ex.message);
    }
  };

  // Apply filters
  let filtered = [...subs];
  if (filterYear) filtered = filtered.filter((s) => s.end_date?.startsWith(filterYear));
  if (filterMonth) {
    const m = String(parseInt(filterMonth)).padStart(2, '0');
    filtered = filtered.filter((s) => {
      const parts = s.end_date?.split('-');
      return parts && parts[1] === m;
    });
  }
  if (filterStatus) filtered = filtered.filter((s) => s.status === filterStatus);
  filtered.sort((a, b) => {
    const d = a.end_date?.localeCompare(b.end_date || '') || 0;
    return sortDir === 'asc' ? d : -d;
  });

  // Get unique years from data
  const years = [...new Set(subs.map((s) => s.end_date?.split('-')[0]).filter(Boolean))].sort();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <button className="btn-primary" onClick={openNew}>+ Add Subscription</button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <select className="input w-auto" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input w-auto" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {months.map((m, i) => <option key={i} value={String(i + 1)}>{i + 1} - {m}</option>)}
          </select>
          <select className="input w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="due_soon">Due Soon</option>
            <option value="expired">Expired</option>
          </select>
          <button
            className="btn-secondary btn-sm"
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          >
            Sort: {sortDir === 'asc' ? 'Oldest First' : 'Newest First'}
          </button>
          {(filterYear || filterMonth || filterStatus) && (
            <button className="btn-secondary btn-sm text-red-500" onClick={() => { setFilterYear(''); setFilterMonth(''); setFilterStatus(''); }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card px-5 py-12 text-center text-gray-400">No subscriptions found</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Domain / Service</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.service_name}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.domain_or_service}</td>
                    <td className="px-4 py-3 text-gray-500">{s.start_date}</td>
                    <td className="px-4 py-3 text-gray-500">{s.end_date}</td>
                    <td className="px-4 py-3 text-gray-700">{s.price} {s.currency}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button className="btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subscription' : 'New Subscription'} wide>
        <div className="space-y-4">
          {/* Customer selection */}
          <div>
            <label className="label">Customer *</label>
            {showNewCustomer ? (
              <div className="flex gap-2">
                <input className="input" placeholder="Customer name" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} />
                <input className="input w-40" placeholder="Phone" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} />
                <button className="btn-primary btn-sm whitespace-nowrap" onClick={handleCreateInlineCustomer}>Add</button>
                <button className="btn-secondary btn-sm" onClick={() => setShowNewCustomer(false)}>Cancel</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select className="input" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                  <option value="">Select customer...</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn-secondary btn-sm whitespace-nowrap" onClick={() => setShowNewCustomer(true)}>+ New</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Service Type *</label>
              <select className="input" value={form.service_type_id} onChange={(e) => setForm({ ...form, service_type_id: e.target.value })}>
                <option value="">Select service...</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Domain / Service Name *</label>
              <input className="input" value={form.domain_or_service} onChange={(e) => setForm({ ...form, domain_or_service: e.target.value })} placeholder="e.g. example.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input className="input" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Price</label>
              <input className="input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="JOD">JOD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {err && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{err}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
