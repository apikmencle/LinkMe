import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import SiteSelector from '../../../components/SiteSelector';
import { fetchTrafficStats, fetchRealtimeStats } from '../../../lib/trafficApi';
import { formatPageLabel } from '../../../lib/pathUtils';
import { useSites } from '../../../lib/useSites';

export default function TrafficOverview() {
  const { sites, loading: sitesLoading, selectedSiteId, setSelectedSiteId } = useSites();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [realtime, setRealtime] = useState(null);
  const [realtimeLoading, setRealtimeLoading] = useState(true);

  useEffect(() => {
    if (!selectedSiteId) return;
    load();
    loadRealtime();
    const interval = setInterval(loadRealtime, 30000);
    return () => clearInterval(interval);
  }, [selectedSiteId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setStats(await fetchTrafficStats({ siteId: selectedSiteId }));
    } catch (e) {
      setError('Gagal memuat data. Coba lagi.');
    }
    setLoading(false);
  }

  async function loadRealtime() {
    try {
      setRealtime(await fetchRealtimeStats({ siteId: selectedSiteId }));
    } catch (e) {
      // diamkan saja kalau realtime gagal, data harian tetap tampil
    }
    setRealtimeLoading(false);
  }

  const maxDaily = stats?.daily?.length ? Math.max(...stats.daily.map((d) => d.count), 1) : 1;

  return (
    <DashboardLayout>
      <div className="page-header page-header-row">
        <div>
          <h1>Ringkasan Traffic</h1>
          <p>Aktivitas real-time dan tren harian situs kamu.</p>
        </div>
        <span className="live-badge"><span className="live-dot" />Live</span>
      </div>

      {!sitesLoading && <SiteSelector sites={sites} selectedSiteId={selectedSiteId} onChange={setSelectedSiteId} />}

      {selectedSiteId && (
        <>
          <div className="two-col">
            <div className="card realtime-card">
              <div className="realtime-header"><span className="realtime-dot" />Real-Time</div>
              <h3 className="realtime-title">Tampilan dari Judul Halaman</h3>
              <p className="realtime-caption">Tampilan dalam 30 menit terakhir</p>
              <div className="realtime-number">{realtimeLoading ? '—' : (realtime?.total_views ?? 0)}</div>
              <div className="realtime-divider" />
              <div className="realtime-list">
                {realtimeLoading ? (
                  <div className="empty-state">Memuat...</div>
                ) : !realtime?.views_by_page?.length ? (
                  <div className="empty-state">Belum ada tampilan 30 menit terakhir.</div>
                ) : (
                  realtime.views_by_page.map((p, i) => (
                    <div className="realtime-row" key={i} title={p.path}>
                      <span>{formatPageLabel(p.path)}</span>
                      <span>{p.views}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card realtime-card">
              <div className="realtime-header"><span className="realtime-dot" />Real-Time</div>
              <h3 className="realtime-title">Pengguna Aktif dari Judul Halaman</h3>
              <p className="realtime-caption">Pengguna aktif dalam 30 menit terakhir</p>
              <div className="realtime-number">{realtimeLoading ? '—' : (realtime?.active_users ?? 0)}</div>
              <div className="realtime-divider" />
              <div className="realtime-list">
                {realtimeLoading ? (
                  <div className="empty-state">Memuat...</div>
                ) : !realtime?.users_by_page?.length ? (
                  <div className="empty-state">Belum ada pengguna aktif 30 menit terakhir.</div>
                ) : (
                  realtime.users_by_page.map((p, i) => (
                    <div className="realtime-row" key={i} title={p.path}>
                      <span>{formatPageLabel(p.path)}</span>
                      <span>{p.users}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {error && <div className="auth-err">{error}</div>}

          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-label">Unique Visitors (Hari Ini)</span>
              <span className="stat-value">{loading ? '—' : (stats?.total_visits ?? 0)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Klik (Hari Ini)</span>
              <span className="stat-value">{loading ? '—' : (stats?.total_clicks ?? 0)}</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2>Tren Kunjungan Harian</h2></div>
            {loading ? (
              <div className="empty-state">Memuat...</div>
            ) : !stats?.daily?.length ? (
              <div className="empty-state">Belum ada data untuk hari ini.</div>
            ) : (
              <div className="rank-list">
                {stats.daily.map((d) => (
                  <div className="rank-row" key={d.date}>
                    <div className="rank-info">
                      <div className="link-code">{d.date}</div>
                      <div className="rank-bar-track">
                        <div className="rank-bar-fill" style={{ width: `${(d.count / maxDaily) * 100}%` }} />
                      </div>
                    </div>
                    <div className="link-clicks"><b>{d.count}</b><span>visitor</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
                  }
                                                 
