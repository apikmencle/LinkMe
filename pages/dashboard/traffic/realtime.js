import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import SiteSelector from '../../../components/SiteSelector';
import { fetchRealtimeLogs } from '../../../lib/trafficApi';
import { countryFlagEmoji, countryName } from '../../../lib/countryUtils';
import { formatPageLabel } from '../../../lib/pathUtils';
import { DeviceIcon, BrowserIcon, LanguageIcon } from '../../../components/TrafficIcons';
import { useSites } from '../../../lib/useSites';

function timeAgo(isoDate) {
  const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  return Math.floor(diff / 86400) + ' hari lalu';
}

export default function RealTime() {
  const { sites, loading: sitesLoading, selectedSiteId, setSelectedSiteId } = useSites();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedSiteId) return;
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [selectedSiteId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setLogs(await fetchRealtimeLogs({ siteId: selectedSiteId }));
    } catch (e) {
      setError('Gagal memuat data. Coba lagi.');
    }
    setLoading(false);
  }

  return (
    <DashboardLayout>
      <div className="page-header page-header-row">
        <div>
          <h1>Real-Time</h1>
          <p>Log kunjungan hari ini, diperbarui otomatis setiap 30 detik.</p>
        </div>
        <div className="header-actions">
          <span className="live-badge"><span className="live-dot" />Live</span>
          <button className="btn-ghost" onClick={load}>Muat Ulang</button>
        </div>
      </div>

      {!sitesLoading && <SiteSelector sites={sites} selectedSiteId={selectedSiteId} onChange={setSelectedSiteId} />}

      {selectedSiteId && (
        <>
          {error && <div className="auth-err">{error}</div>}

          <div className="card">
            <div className="card-header">
              <h2>Log Kunjungan Terbaru</h2>
              <span className="muted">{logs.length} kunjungan</span>
            </div>
            {loading ? (
              <div className="empty-state">Memuat...</div>
            ) : !logs.length ? (
              <div className="empty-state">Belum ada kunjungan tercatat hari ini.</div>
            ) : (
              <div className="traffic-log-list">
                {logs.map((log, i) => (
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
        </>
      )}
    </DashboardLayout>
  );
}
