import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../lib/api';
import { useLang } from '../lib/LangContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await api.initAdmin().catch(() => {});
      const { token } = await api.login(username, password);
      setToken(token);
      navigate('/');
    } catch (ex: any) {
      setErr(ex.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('app_name')}</h1>
          <p className="text-brand-200 text-sm mt-2">{t('app_subtitle')}</p>
        </div>
        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <div>
            <label className="label">{t('username')}</label>
            <input type="text" className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" required autoFocus />
          </div>
          <div>
            <label className="label">{t('password')}</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {err && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">{err}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t('signing_in') : t('sign_in')}
          </button>
        </form>
        <p className="text-center text-brand-300 text-xs mt-6">Digital Creative Vision For Information Technology</p>
      </div>
    </div>
  );
}
