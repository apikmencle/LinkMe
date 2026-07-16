import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import TrafficFilterBar from '../../../components/TrafficFilterBar';
import { fetchTrafficStats } from '../../../lib/trafficApi';
import { countryFlagEmoji, countryName } from '../../../lib/countryUtils';
import { formatPageLabel } from '../../../lib/pathUtils';
import { useSitesContext } from '../../../context/SitesContext';
import { supabase } from '../../../lib/supabaseClient';
import { toCsv, downloadCsv } from '../../../lib/csvExport';

export default function LinkInsight() {
  const { sites, loading: sitesLoading, selectedSiteId } = useSitesContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchPath, setSearchPath] = useState('');
  const [exporting, setExporting] = useState(false);

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

  // Export mengikuti filter tanggal/path yang SEDANG AKTIF di layar (bukan
  // filter yang mungkin baru diketik tapi belum di-"Terapkan") - supaya
  // hasil export selalu konsisten dengan apa yang sedang dilihat user.
  // Beda dari fetchTrafficStats (yang mengembalikan angka agregat), ini
  // ambil baris mentah lewat RPC export_traffic_events (migrasi 010).
  async function handleExport() {
    if (!selectedSiteId) return;
    setExporting(true);
    const { data, error } = await supabase.rpc('export_traffic_events', {
      p_site_id: selectedSiteId,
      p_start: startDate || null,
      p_end: endDate || null,
      p_search_path: searchPath || null,
    });
    setExporting(false);
    if (error || !data) {
      setError('Gagal export data. Coba lagi.');
      return;
    }
    const rows = [
      ['Waktu', 'Halaman', 'Sumber', 'Negara', 'Kota', 'Perangkat', 'Browser', 'Bahasa'],
      ...data.map((r) => [
        new Date(r.event_time).toLocaleString('id-ID'),
        r.path,
        r.referrer_source,
        countryName(r.country),
        r.city,
        r.device,
        r.browser,
        r.lang,
      ]),
    ];
    downloadCsv(`linkme-traffic-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="icon-btn" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Menyiapkan...' : 'Export CSV'}
            </button>
          </div>

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
