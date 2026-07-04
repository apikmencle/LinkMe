import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { fetchTrafficStats } from '../../lib/trafficApi';

function timeAgo(isoDate) {
  // created_at dari D1 disimpan UTC, tampilkan sebagai waktu relatif sederhana
  const diff = Math.floor((Date.now() - new Date(isoDate + 'Z').getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  return Math.floor(diff / 86400) + ' hari lalu';
}

export default function TrafficBlog() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchPath, setSearchPath] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load(filters = {}) {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTrafficStats(filters);
      setStats(data);
    } catch (e) {
      setError('Gagal memuat data. Cek koneksi ke Worker atau coba lagi.');
    }
    setLoading(false);
  }

  function handleFilter(e) {
    e.preventDefault();
    load({ startDate, endDate, searchPath });
  }

  function handleReset() {
    setStartDate('');
    setEndDate('');
    setSearchPath('');
    load();
  }

  const maxDaily = stats?.daily?.length ? Math.max(...stats.daily.map((d) => d.count), 1) : 1;
  const maxCountry = stats?.countries?.length ? Math.max(...stats.countries.map((c) => c.total), 1) : 1;

  return (
    <DashboardLayout>
      <div className="page-header page-header-row">
        <div>
          <h1>Traffic Blog</h1>
          <p>Monitoring kunjungan landing page blog kamu (Cloudflare D1).</p>
        </div>
        <span className="live-badge"><span className="live-dot" />Live</span>
      </div>

      <form className="card filter-bar" onSubmit={handleFilter}>
        <div className="field">
          <label>Dari Tanggal</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Sampai Tanggal</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Cari Path</label>
          <input type="text" value={searchPath} onChange={(e) => setSearchPath(e.target.value)} placeholder="/2026/02/BioMe-001.html" />
        </div>
        <div className="filter-actions">
          <button className="btn-primary" type="submit">Terapkan</button>
          <button className="btn-ghost" type="button" onClick={handleReset}>Hari Ini</button>
        </div>
      </form>

      {error && <div className="auth-err">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Unique Visitors</span>
          <span className="stat-value">{loading ? '—' : (stats?.total_visits ?? 0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Klik</span>
          <span className="stat-value">{loading ? '—' : (stats?.total_clicks ?? 0)}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Tren Kunjungan Harian</h2></div>
        {loading ? (
          <div className="empty-state">Memuat...</div>
        ) : !stats?.daily?.length ? (
          <div className="empty-state">Belum ada data untuk rentang ini.</div>
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

      <div className="two-col">
        <div className="card">
          <div className="card-header"><h2>Halaman Teratas</h2></div>
          {loading ? (
            <div className="empty-state">Memuat...</div>
          ) : !stats?.pages?.length ? (
            <div className="empty-state">Belum ada data.</div>
          ) : (
            <div className="simple-list">
              {stats.pages.map((p, i) => (
                <div className="simple-list-row" key={i}>
                  <span className="simple-list-label">{p.path}</span>
                  <span className="simple-list-value">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h2>Negara Teratas</h2></div>
          {loading ? (
            <div className="empty-state">Memuat...</div>
          ) : !stats?.countries?.length ? (
            <div className="empty-state">Belum ada data.</div>
          ) : (
            <div className="simple-list">
              {stats.countries.map((c, i) => (
                <div className="simple-list-row" key={i}>
                  <span className="simple-list-label">{c.country || 'Unknown'}</span>
                  <span className="simple-list-value">{c.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h2>Log Kunjungan Terbaru</h2></div>
        {loading ? (
          <div className="empty-state">Memuat...</div>
        ) : !stats?.recent_logs?.length ? (
          <div className="empty-state">Belum ada kunjungan tercatat.</div>
        ) : (
          <div className="traffic-log-list">
            {stats.recent_logs.map((log, i) => (
              <div className="traffic-log-item" key={i}>
                <div className="traffic-log-top">
                  <span className="traffic-log-path">{log.path}</span>
                  <span className="traffic-log-time">{timeAgo(log.created_at)}</span>
                </div>
                <div className="traffic-log-meta">
                  <span>{log.city}, {log.country}</span>
                  <span>{log.device}</span>
                  <span>{log.browser}</span>
                  <span>{log.lang}</span>
                </div>
                <div className="traffic-log-source">Source: <b>{log.ua}</b></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
