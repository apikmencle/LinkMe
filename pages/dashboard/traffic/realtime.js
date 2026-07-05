import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { fetchTrafficStats } from '../../../lib/trafficApi';
import { countryFlagEmoji, countryName } from '../../../lib/countryUtils';
import { formatPageLabel } from '../../../lib/pathUtils';
import { DeviceIcon, BrowserIcon, LanguageIcon } from '../../../components/TrafficIcons';

function timeAgo(isoDate) {
  const diff = Math.floor((Date.now() - new Date(isoDate + 'Z').getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  return Math.floor(diff / 86400) + ' hari lalu';
}

export default function RealTime() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setStats(await fetchTrafficStats());
    } catch (e) {
      setError('Gagal memuat data. Cek koneksi ke Worker atau coba lagi.');
    }
    setLoading(false);
  }

  return (
    <DashboardLayout>
      <div className="page-header page-header-row">
        <div>
          <h1>Real Time</h1>
          <p>Log kunjungan hari ini, diperbarui otomatis setiap 30 detik.</p>
        </div>
        <div className="header-actions">
          <span className="live-badge"><span className="live-dot" />Live</span>
          <button className="btn-ghost" onClick={load}>Muat Ulang</button>
        </div>
      </div>

      {error && <div className="auth-err">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Log Kunjungan Terbaru</h2>
          <span className="muted">{stats?.recent_logs?.length ?? 0} kunjungan</span>
        </div>
        {loading ? (
          <div className="empty-state">Memuat...</div>
        ) : !stats?.recent_logs?.length ? (
          <div className="empty-state">Belum ada kunjungan tercatat hari ini.</div>
        ) : (
          <div className="traffic-log-list">
            {stats.recent_logs.map((log, i) => (
              <div className="traffic-log-item" key={i}>
                <div className="traffic-log-top">
                  <div>
                    <div className="traffic-log-path">{formatPageLabel(log.path)}</div>
                    <div className="traffic-log-fullpath">{log.path}</div>
                  </div>
                  <span className="traffic-log-time">{timeAgo(log.created_at)}</span>
                </div>
                <div className="traffic-log-meta">
                  <span className="meta-chip">
                    <span className="country-flag">{countryFlagEmoji(log.country)}</span>
                    {log.city}, {countryName(log.country)}
                  </span>
                  <span className="meta-chip"><DeviceIcon device={log.device} />{log.device}</span>
                  <span className="meta-chip"><BrowserIcon browser={log.browser} />{log.browser}</span>
                  <span className="meta-chip"><LanguageIcon />{log.lang}</span>
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
