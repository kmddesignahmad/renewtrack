import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useLang } from '../lib/LangContext';
import Modal from '../components/Modal';

interface Service { id: number; name: string; is_active: number; }

export default function ServicesPage() {
  const { t } = useLang();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => { api.getServices().then(setServices).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openNew = () => { setEditing(null); setName(''); setErr(''); setModalOpen(true); };
  const openEdit = (s: Service) => { setEditing(s); setName(s.name); setErr(''); setModalOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) { setErr(t('service_name_required')); return; }
    setSaving(true); setErr('');
    try {
      if (editing) await api.updateService(editing.id, { name });
      else await api.createService({ name });
      setModalOpen(false); load();
    } catch (ex: any) { setErr(ex.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (s: Service) => {
    try { await api.updateService(s.id, { is_active: s.is_active ? 0 : 1 }); load(); }
    catch (ex: any) { alert(ex.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete_service_confirm'))) return;
    try { await api.deleteService(id); load(); } catch (ex: any) { alert(ex.message); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('services_title')}</h1>
        <button className="btn-primary" onClick={openNew}>{t('add_service')}</button>
      </div>
      {loading ? (
        <div className="text-center py-12 text-gray-400">{t('loading')}</div>
      ) : services.length === 0 ? (
        <div className="card px-5 py-12 text-center text-gray-400">{t('no_services')}</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">{t('name')}</th>
                <th className="px-5 py-3">{t('status')}</th>
                <th className="px-5 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {services.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${s.is_active ? 'badge-active' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? t('active') : t('disabled')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button className="btn-secondary btn-sm" onClick={() => openEdit(s)}>{t('edit')}</button>
                    <button className="btn-secondary btn-sm" onClick={() => toggleActive(s)}>{s.is_active ? t('disable') : t('enable')}</button>
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(s.id)}>{t('delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('edit_service') : t('new_service')}>
        <div className="space-y-4">
          <div><label className="label">{t('service_name')} *</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
          {err && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{err}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>{t('cancel')}</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? t('saving') : editing ? t('update') : t('create')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
