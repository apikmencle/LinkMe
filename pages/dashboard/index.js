import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import SiteSelector from '../../components/SiteSelector';
import { fetchTrafficStats, fetchRealtimeStats } from '../../lib/trafficApi';
import { formatPageLabel } from '../../lib/pathUtils';
import { useSites } from '../../lib/useSites';

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function buildAreaPath(daily, width, height, padding) {
  if (!daily.length) return { line: '', area: '' };
  const max = Math.max(...daily.map((d) => d.count), 1);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const stepX = daily.length > 1 ? innerW / (daily.length - 1) : 0;

  const points = daily.map((d, i) => {
    const x = padding + stepX * i;
    const y = padding + innerH - (d.count / max) * innerH;
    return [x, y];
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${(height - padding).toFixed(1)} L${points[0][0].toFixed(1)},${(height - padding).toFixed(1)} Z`;

  return { line, area, points };
}

export default function DashboardHome() {
  const { sites, loading: sitesLoading, selectedSiteId, setSelectedSiteId } = useSites();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [realtime, setRealtime] = useState(null);
  const [realtimeLoading, setRealtimeLoading] = useState(true);

  useEffect(() => {
    if (!selectedSiteId) return;
    load();
    loadTrend();
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

  async function loadTrend() {
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 13);
      const data = await fetchTrafficStats({
        siteId: selectedSiteId,
        startDate: toDateStr(start),
        endDate: toDateStr(end),
      });
      setTrend(data);
    } catch (e) {
      // diamkan, kartu lain tetap tampil
    }
  }

  async function loadRealtime() {
    try {
      setRealtime(await fetchRealtimeStats({ siteId: selectedSiteId }));
    } catch (e) {
      // diamkan saja kalau realtime gagal, data harian tetap tampil
    }
    setRealtimeLoading(false);
  }

  const chart = trend?.daily?.length ? buildAreaPath(trend.daily, 640, 220, 24) : null;

  return (
    <DashboardLayout>
      <div className="page-header page-header-row">
        <div>
          <h1>Dashboard</h1>
          <p>Ringkasan performa traffic situs kamu.</p>
        </div>
        <span className="live-badge"><span className="live-dot" />Live</span>
      </div>

      {!sitesLoading && <SiteSelector sites={sites} selectedSiteId={selectedSiteId} onChange={setSelectedSiteId} />}

      {selectedSiteId && (
        <>
          {error && <div className="auth-err">{error}</div>}

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18" />
                  <path d="M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z" />
                </svg>
              </div>
              <span className="summary-label">Situs Terpantau</span>
              <span className="summary-value">{sitesLoading ? '—' : sites.length}</span>
              <span className="summary-caption">Situs aktif terdaftar</span>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6.3 6.3l2 2M15.7 15.7l2 2M17.7 6.3l-2 2M8.3 15.7l-2 2" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="summary-label">Unique Visitors</span>
              <span className="summary-value">{loading ? '—' : (stats?.total_visits ?? 0)}</span>
              <span className="summary-caption">Hari ini</span>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 20V10" /><path d="M12 20V4" /><path d="M20 20v-7" />
                </svg>
              </div>
              <span className="summary-label">Total Klik</span>
              <span className="summary-value">{loading ? '—' : (stats?.total_clicks ?? 0)}</span>
              <span className="summary-caption">Hari ini</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Tren Kunjungan</h2>
              <span className="muted">14 Hari Terakhir</span>
            </div>
            {!chart ? (
              <div className="empty-state">Belum ada data untuk ditampilkan.</div>
            ) : (
              <svg className="trend-chart" viewBox="0 0 640 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={chart.area} fill="url(#trendFill)" stroke="none" />
                <path d={chart.line} fill="none" stroke="var(--accent-dark)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {chart.points.map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--bg)" stroke="var(--accent-dark)" strokeWidth="2" />
                ))}
              </svg>
            )}
            {chart && (
              <div className="trend-chart-labels">
                <span>{trend.daily[0].date}</span>
                <span>{trend.daily[trend.daily.length - 1].date}</span>
              </div>
            )}
          </div>

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
        </>
      )}
    </DashboardLayout>
  );
        }
        
