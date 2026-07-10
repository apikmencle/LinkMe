import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import TrafficFilterBar from '../../../components/TrafficFilterBar';
import { fetchTrafficStats } from '../../../lib/trafficApi';
import { countryFlagEmoji, countryName } from '../../../lib/countryUtils';
import { formatPageLabel } from '../../../lib/pathUtils';
import { useSitesContext } from '../../../context/SitesContext';

export default function LinkInsight() {
  const { sites, loading: sitesLoading, selectedSiteId } = useSitesContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchPath, setSearchPath] = useState('');

  useEffect(() => {
    if (selectedSiteId) load();
  }, [selectedSiteId]);

  async function load(filters = {}) {
    setLoading(true);
    setError('');
    try {
      setStats(await fetchTrafficStats({ siteId: selectedSiteId, ...filters }));
    } catch (e) {
      setError('Gagal memuat data. Coba lagi.');
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
        <h1>Insight Halaman</h1>
        <p>Halaman mana yang paling ramai, dan dari negara mana pengunjungnya.</p>
      </div>

      {!sitesLoading && sites.length === 0 && (
        <div className="card">
          <div className="empty-state">
            Kamu belum punya situs terdaftar.{' '}
            <a href="/dashboard/sites">Tambah situs pertama</a> lalu pasang
            snippet-nya di blog/landing page kamu untuk mulai melihat data traffic.
          </div>
        </div>
      )}

      {selectedSiteId && (
        <>
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
                    <div className="simple-list-row" key={i} title={p.path}>
                      <span className="simple-list-label">{formatPageLabel(p.path)}</span>
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
                      <span className="simple-list-label country-label">
                        <span className="country-flag">{countryFlagEmoji(c.country)}</span>
                        {countryName(c.country)}
                      </span>
                      <span className="simple-list-value">{c.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
              }
