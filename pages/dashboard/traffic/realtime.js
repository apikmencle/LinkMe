import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import TrafficFilterBar from '../../../components/TrafficFilterBar';
import { fetchTrafficStats } from '../../../lib/trafficApi';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchPath, setSearchPath] = useState('');

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ startDate, endDate, searchPath }), 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(filters = {}) {
    setLoading(true);
    setError('');
    try {
      setStats(await fetchTrafficStats(filters));
    } catch (e) {
      setError('Gagal memuat data. Cek koneksi ke Worker atau coba lagi.');
    }
    setLoading(false);
  }

  function handleReset() {
    setStartDate(''); setEndDate(''); setSearchPath('');
    load();
  }

  return (
    <DashboardLayout>
      <div className="page-header page-header-row">
        <div>
          <h1>Real Time</h1>
          <p>Log kunjungan detail, diperbarui otomatis setiap 30 detik.</p>
        </div>
        <span className="live-badge"><span className="live-dot" />Live</span>
      </div>

      <TrafficFilterBar
        startDate={startDate} endDate={endDate} searchPath={searchPath}
        onStartDateChange={setStartDate} onEndDateChange={setEndDate} onSearchPathChange={setSearchPath}
        onApply={(e) => { e.preventDefault(); load({ startDate, endDate, searchPath }); }}
        onReset={handleReset}
      />

      {error && <div className="auth-err">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Log Kunjungan Terbaru</h2>
          <span className="muted">{stats?.recent_logs?.length ?? 0} kunjungan</span>
        </div>
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
