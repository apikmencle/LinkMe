import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  return Math.floor(diff / 86400) + ' hari lalu';
}

export default function Overview() {
  const { session } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState('');

  useEffect(() => {
    setHost(window.location.origin);
    if (session) fetchLinks();
  }, [session]);

  async function fetchLinks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setLinks(data || []);
    setLoading(false);
  }

  const totalLinks = links.length;
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const avgClicks = totalLinks ? Math.round((totalClicks / totalLinks) * 10) / 10 : 0;
  const recent = links.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Ringkasan</h1>
        <p>Sekilas performa semua tautanmu.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total Tautan</span>
          <span className="stat-value">{loading ? '—' : totalLinks}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Klik</span>
          <span className="stat-value">{loading ? '—' : totalClicks}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Rata-rata Klik / Tautan</span>
          <span className="stat-value">{loading ? '—' : avgClicks}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Tautan Terbaru</h2>
          <Link href="/dashboard/links" className="muted">Kelola semua →</Link>
        </div>

        {loading ? (
          <div className="empty-state">Memuat...</div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            Belum ada tautan. <Link href="/dashboard/links">Buat yang pertama</Link>.
          </div>
        ) : (
          <div className="link-table">
            {recent.map((l) => (
              <div className="link-row" key={l.id}>
                <div className="link-main">
                  <div className="link-code">{host.replace(/^https?:\/\//, '')}/{l.code}</div>
                  <div className="link-orig">{l.url}</div>
                  <div className="link-meta">Dibuat {timeAgo(l.created_at)}</div>
                </div>
                <div className="link-clicks">
                  <b>{l.clicks}</b>
                  <span>klik</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
