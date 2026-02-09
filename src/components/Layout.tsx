import { NavLink, useNavigate } from 'react-router-dom';
import { clearToken } from '../lib/api';
import { useLang } from '../lib/LangContext';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { t, dir } = useLang();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/', label: t('nav_dashboard'), icon: '📊' },
    { to: '/customers', label: t('nav_customers'), icon: '👥' },
    { to: '/services', label: t('nav_services'), icon: '⚙️' },
    { to: '/subscriptions', label: t('nav_subscriptions'), icon: '📋' },
    { to: '/renewals', label: t('nav_renewals'), icon: '🔄' },
    { to: '/reports', label: t('nav_reports'), icon: '📊' },
    { to: '/settings', label: t('nav_settings'), icon: '🛠️' },
  ];

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex" dir={dir}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} z-30 w-64 bg-brand-900 text-white flex flex-col transition-transform duration-200 ${
          sidebarOpen
            ? 'translate-x-0'
            : dir === 'rtl'
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight">{t('app_name')}</h1>
          <p className="text-xs text-brand-300 mt-1">{t('app_subtitle')}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-brand-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="text-base">🚪</span>
            {t('logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <span className="text-sm text-gray-500">{t('admin')}</span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
