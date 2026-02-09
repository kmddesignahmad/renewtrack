import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isLoggedIn } from './lib/api';
import { LangProvider } from './lib/LangContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ServicesPage from './pages/ServicesPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import RenewalsPage from './pages/RenewalsPage';
import SettingsPage from './pages/SettingsPage';
import NoticePage from './pages/NoticePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => { setAuthChecked(true); }, []);
  if (!authChecked) return null;

  return (
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/notice/:uuid" element={<NoticePage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/subscriptions" element={<SubscriptionsPage />} />
                    <Route path="/renewals" element={<RenewalsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </LangProvider>
  );
}
