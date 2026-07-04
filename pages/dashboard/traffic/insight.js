import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import TrafficFilterBar from '../../../components/TrafficFilterBar';
import { fetchTrafficStats } from '../../../lib/trafficApi';

export default function LinkInsight() {
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

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Link Insight</h1>
        <p>Halaman mana yang paling ramai, dan dari negara mana pengunjungnya.</p>
      </div>

      <TrafficFilterBar
        startDate={startDate} endDate={endDate} searchPath={searchPath}
        onStartDateChange={setStartDate} onEndDateChange={setEndDate} onSearchPathChange={setSearchPath}
        onApply={(e) => { e.preventDefault(); load({ startDate, endDate, searchPath }); }}
        onReset={handleReset}
      />

      {error && <div className="auth-err">{error}</div>}

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
    </DashboardLayout>
  );
}
