import { useState } from 'react';
import { api } from '../lib/api';
import { useLang } from '../lib/LangContext';

export default function SettingsPage() {
  const { t, lang, setLang } = useLang();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!currentPw || !newPw) { setErr(t('all_fields_required')); return; }
    if (newPw !== confirmPw) { setErr(t('passwords_not_match')); return; }
    if (newPw.length < 4) { setErr(t('password_min')); return; }

    setSaving(true);
    try {
      await api.changePassword(currentPw, newPw);
      setMsg(t('password_changed'));
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (ex: any) {
      setErr(ex.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('settings_title')}</h1>

      {/* Language Settings */}
      <div className="card max-w-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('language_settings')}</h2>
        </div>
        <div className="p-6">
          <label className="label">{t('select_language')}</label>
          <div className="flex gap-3">
            <button
              onClick={() => setLang('en')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                lang === 'en' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setLang('ar')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                lang === 'ar' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              🇯🇴 العربية
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card max-w-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('change_password')}</h2>
        </div>
        <form onSubmit={handleChange} className="p-6 space-y-4">
          <div>
            <label className="label">{t('current_password')}</label>
            <input className="input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('new_password')}</label>
            <input className="input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('confirm_password')}</label>
            <input className="input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          {err && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{err}</div>}
          {msg && <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg">{msg}</div>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('changing') : t('change_password')}
          </button>
        </form>
      </div>

      {/* Company Info */}
      <div className="card max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('company_info')}</h2>
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
