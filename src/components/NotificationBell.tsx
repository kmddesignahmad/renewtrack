import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useLang } from '../lib/LangContext';

export default function NotificationBell() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const load = () => {
    api.getNotifications().then((data) => {
      setNotifs(data.notifications || []);
      setUnread(data.unread_count || 0);
    }).catch(console.error);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sendEmail = async () => {
    setSending(true); setEmailMsg('');
    try {
      await api.sendEmailDigest();
      setEmailMsg(t('email_sent'));
      setTimeout(() => setEmailMsg(''), 3000);
    } catch (ex: any) {
      setEmailMsg(ex.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">{t('notifications')} {unread > 0 && `(${unread})`}</h3>
            <button
              onClick={sendEmail}
              disabled={sending}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
            >
              {sending ? t('email_sending') : `📧 ${t('send_email')}`}
            </button>
          </div>

          {emailMsg && (
            <div className={`px-4 py-2 text-xs ${emailMsg.includes('success') || emailMsg.includes('نجاح') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {emailMsg}
            </div>
          )}

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">{t('no_notifications')}</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifs.map((n: any) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors ${n.type === 'expired' ? 'border-l-3 border-l-red-400' : 'border-l-3 border-l-amber-400'}`}
                    style={{ borderLeftWidth: 3 }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-base mt-0.5">
                        {n.type === 'expired' ? '🔴' : '🟡'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {n.customer_name} - {n.domain}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-xs mt-1">
                          {n.type === 'expired' ? (
                            <span className="text-red-600 font-medium">
                              {t('expired_label')} ({Math.abs(n.days_left)} {t('days_ago')})
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">
                              {t('due_in')} {n.days_left} {t('days_left')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
