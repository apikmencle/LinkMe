import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import TrafficFilterBar from '../../../components/TrafficFilterBar';
import { fetchTrafficStats } from '../../../lib/trafficApi';

export default function TrafficOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchPath, setSearchPath] = useState('');

  useEffect(() => { load(); }, []);

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

  const maxDaily = stats?.daily?.length ? Math.max(...stats.daily.map((d) => d.count), 1) : 1;

  return (
    <DashboardLayout>
      <div className="page-header page-header-row">
        <div>
          <h1>Ringkasan Traffic</h1>
          <p>Total kunjungan dan tren harian blog kamu.</p>
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
    </DashboardLayout>
  );
}
