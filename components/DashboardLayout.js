import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Sidebar, { NAV_ITEMS } from './Sidebar';
import Header from './Header';
import Seo from './Seo';
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

  const activeItem = NAV_ITEMS.find((item) => item.href === router.pathname);
  const seoTitle = activeItem ? `${activeItem.label} \u00b7 LinkMe` : 'Dasbor \u00b7 LinkMe';

  if (loading || !session) {
    return (
      <>
        <Seo title="Memuat" noindex />
        <div className="page-loading">Memuat...</div>
      </>
    );
  }

  return (
    <div className="dashboard-shell">
      <Seo title={seoTitle} noindex />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
