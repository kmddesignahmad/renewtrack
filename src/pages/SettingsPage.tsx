import { useState } from 'react';
import { api } from '../lib/api';

export default function SettingsPage() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(''); setErr('');

    if (!currentPw || !newPw) { setErr('All fields are required'); return; }
    if (newPw !== confirmPw) { setErr('New passwords do not match'); return; }
    if (newPw.length < 4) { setErr('Password must be at least 4 characters'); return; }

    setSaving(true);
    try {
      await api.changePassword(currentPw, newPw);
      setMsg('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="card max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handleChange} className="p-6 space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input className="input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input className="input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input className="input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>

          {err && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{err}</div>}
          {msg && <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg">{msg}</div>}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      <div className="card max-w-lg mt-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Company Info</h2>
        </div>
        <div className="p-6 text-sm text-gray-600 space-y-1">
          <p className="font-medium text-gray-900">Digital Creative Vision For Information Technology</p>
          <p>Jordan – Amman</p>
          <p>Mobile: 00962796370060</p>
          <p>Email: info@dcv.jo</p>
          <p>Website: <a href="https://dcv.jo" target="_blank" className="text-brand-500 underline">dcv.jo</a></p>
        </div>
      </div>
    </div>
  );
}
