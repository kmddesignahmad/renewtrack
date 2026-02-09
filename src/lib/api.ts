const API_BASE = '/api';

function getToken(): string | null {
  // Read token from cookie
  const match = document.cookie.match(/(?:^|; )rt_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token: string) {
  // Set cookie that expires in 24 hours
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `rt_token=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Strict`;
}

export function clearToken() {
  document.cookie = 'rt_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  initAdmin: () => request('/auth/init', { method: 'POST' }),
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  changePassword: (current_password: string, new_password: string) =>
    request('/auth/password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }),

  // Dashboard
  getDashboard: () => request<{
    total_customers: number;
    active_subscriptions: number;
    due_soon: number;
    expired: number;
    recent_renewals: any[];
  }>('/dashboard'),

  // Customers
  getCustomers: () => request<any[]>('/customers'),
  createCustomer: (data: any) =>
    request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: number, data: any) =>
    request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: number) =>
    request(`/customers/${id}`, { method: 'DELETE' }),

  // Services
  getServices: () => request<any[]>('/services'),
  createService: (data: any) =>
    request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id: number, data: any) =>
    request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id: number) =>
    request(`/services/${id}`, { method: 'DELETE' }),

  // Subscriptions
  getSubscriptions: () => request<any[]>('/subscriptions'),
  createSubscription: (data: any) =>
    request('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscription: (id: number, data: any) =>
    request(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubscription: (id: number) =>
    request(`/subscriptions/${id}`, { method: 'DELETE' }),

  // Renewals
  getRenewals: () => request<any[]>('/renewals'),
  renewSubscription: (subscription_id: number) =>
    request('/renewals', { method: 'POST', body: JSON.stringify({ subscription_id }) }),

  // Notices
  createNotice: (subscription_id: number) =>
    request<{ uuid: string; url: string }>('/notices', {
      method: 'POST',
      body: JSON.stringify({ subscription_id }),
    }),
  getNotice: (uuid: string) =>
    request<any>(`/notices/${uuid}`),

  // Notifications
  getNotifications: () => request<{ notifications: any[]; stored: any[]; unread_count: number }>('/notifications'),
  sendEmailDigest: () => request('/notifications/email', { method: 'POST' }),

  // Reports
  getReports: (password: string) =>
    request<any>('/reports', { method: 'POST', body: JSON.stringify({ password }) }),
};
