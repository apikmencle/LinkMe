import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  if (loading || !session) {
    return <div className="page-loading">Memuat...</div>;
  }

  return (
    <div className="dashboard-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
