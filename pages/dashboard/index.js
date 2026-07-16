import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { fetchTrafficStats, fetchRealtimeStats } from '../../lib/trafficApi';
import { formatPageLabel } from '../../lib/pathUtils';
import { useSitesContext } from '../../context/SitesContext';
import { buildRealtimeCardImage } from '../../lib/shareCardImage';

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// "2026-07-03" -> "3 Jul"
function formatChartDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

// Membulatkan nilai maksimum grafik ke angka "rapi" (mis. 137 -> 150,
// 1450 -> 1500) supaya label sumbu Y enak dibaca, mirip kebanyakan
// dashboard analytics.
function niceMax(value) {
  if (value <= 0) return 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

function buildChart(daily, width, height, pad) {
  if (!daily || !daily.length) return null;

  const rawMax = Math.max(...daily.map((d) => d.count), 0);
  const max = niceMax(rawMax || 1);
  const gridLines = 4;

  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const stepX = daily.length > 1 ? innerW / (daily.length - 1) : 0;

  const points = daily.map((d, i) => {
    const x = pad.left + stepX * i;
    const y = pad.top + innerH - (d.count / max) * innerH;
    return [x, y];
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${(height - pad.bottom).toFixed(1)} L${points[0][0].toFixed(1)},${(height - pad.bottom).toFixed(1)} Z`;

  const yLabels = Array.from({ length: gridLines + 1 }, (_, i) => {
    const value = Math.round((max / gridLines) * (gridLines - i));
    const y = pad.top + (innerH / gridLines) * i;
    return { value, y };
  });

  return { line, area, points, yLabels, pad, width, height };
}

export default function DashboardHome() {
  const { sites, loading: sitesLoading, selectedSiteId } = useSitesContext();
  const [stats, setStats] = useState(null);
  const [allTime, setAllTime] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [realtime, setRealtime] = useState(null);
  const [realtimeLoading, setRealtimeLoading] = useState(true);
  const [activePoint, setActivePoint] = useState(null);
  const [sharing, setSharing] = useState(null); // 'views' | 'users' | null

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
      const today = toDateStr(new Date());
      const [todayStats, allTimeStats] = await Promise.all([
        fetchTrafficStats({ siteId: selectedSiteId }),
        fetchTrafficStats({ siteId: selectedSiteId, startDate: '2000-01-01', endDate: today }),
      ]);
      setStats(todayStats);
      setAllTime(allTimeStats);
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

  // kind: 'views' (kartu "Tampilan dari Judul Halaman") atau 'users'
  // (kartu "Pengguna Aktif dari Judul Halaman"). Data diambil dari state
  // `realtime` yang sama yang sudah dipakai buat render kartu di layar,
  // jadi gambar yang dibagikan selalu cocok persis dengan yang lagi
  // ditampilkan user.
  async function handleShareRealtime(kind) {
    setSharing(kind);
    const isViews = kind === 'views';
    const sourceRows = (isViews ? realtime?.views_by_page : realtime?.users_by_page) || [];
    const siteName = sites.find((s) => s.id === selectedSiteId)?.name || '';

    const blob = await buildRealtimeCardImage({
      title: isViews ? 'Tampilan dari Judul Halaman' : 'Pengguna Aktif dari Judul Halaman',
      caption: isViews ? 'Tampilan dalam 30 menit terakhir' : 'Pengguna aktif dalam 30 menit terakhir',
      number: isViews ? (realtime?.total_views ?? 0) : (realtime?.active_users ?? 0),
      rows: sourceRows.map((p) => ({
        label: formatPageLabel(p.path),
        value: isViews ? p.views : p.users,
      })),
      siteName,
    });

    setSharing(null);
    if (!blob) return;

    const filename = `linkme-realtime-${kind}-${new Date().toISOString().slice(0, 10)}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    // Web Share API (dengan dukungan file) - ini yang bikin tombolnya
    // munculkan menu "Bagikan ke WhatsApp/IG/dll" beneran di HP, bukan
    // cuma download. Kalau browser tidak dukung (mis. desktop tanpa
    // dukungan share file), fallback ke download PNG biasa.
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (e) {
        if (e?.name === 'AbortError') return; // user batal dari share sheet, tidak perlu fallback
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const chart = trend?.daily?.length
    ? buildChart(trend.daily, 640, 240, { top: 16, right: 12, bottom: 8, left: 40 })
    : null;

  useEffect(() => {
    if (!trend?.daily?.length) {
      setActivePoint(null);
      return;
    }
    let peakIndex = 0;
    trend.daily.forEach((d, i) => {
      if (d.count > trend.daily[peakIndex].count) peakIndex = i;
    });
    setActivePoint(peakIndex);
  }, [trend]);

  return (
    <DashboardLayout>
      <div className="page-header page-header-row">
        <div>
          <h1>Dashboard</h1>
          <p>Ringkasan performa traffic situs kamu.</p>
        </div>
        <span className="live-badge"><span className="live-dot" />Live</span>
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
          {error && <div className="auth-err">{error}</div>}

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18" />
                  <path d="M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z" />
                </svg>
              </div>
              <span className="summary-label">Situs Terpantau</span>
              <span className="summary-value">{sitesLoading ? '\u2014' : sites.length}</span>
              <span className="summary-caption">Situs aktif terdaftar</span>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6.3 6.3l2 2M15.7 15.7l2 2M17.7 6.3l-2 2M8.3 15.7l-2 2" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="summary-label">Unique Visitors</span>
              <span className="summary-value">{loading ? '\u2014' : (allTime?.total_visits ?? 0).toLocaleString('id-ID')}</span>
              <span className="summary-delta">
                {!loading && <>+{(stats?.total_visits ?? 0).toLocaleString('id-ID')} Hari Ini</>}
              </span>
            </div>

            <div className="summary-card">
              <div className="summary-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 3l14 8-6 2-2 6-6-16z" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <span className="summary-label">Total Klik</span>
              <span className="summary-value">{loading ? '\u2014' : (allTime?.total_clicks ?? 0).toLocaleString('id-ID')}</span>
              <span className="summary-delta">
                {!loading && <>+{(stats?.total_clicks ?? 0).toLocaleString('id-ID')} Hari Ini</>}
              </span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Tren Pertumbuhan Traffic</h2>
              <span className="range-badge">14 Hari Terakhir</span>
            </div>
            {!chart ? (
              <div className="empty-state">Belum ada data untuk ditampilkan.</div>
            ) : (
              <>
                <div className="trend-chart-wrap">
                  <svg className="trend-chart" viewBox={`0 0 ${chart.width} ${chart.height}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {chart.yLabels.map((g, i) => (
                      <line
                        key={i}
                        x1={chart.pad.left}
                        x2={chart.width - chart.pad.right}
                        y1={g.y}
                        y2={g.y}
                        stroke="var(--border)"
                        strokeWidth="1"
                      />
                    ))}
                    {chart.yLabels.map((g, i) => (
                      <text key={i} x={chart.pad.left - 10} y={g.y + 4} textAnchor="end" className="trend-axis-label">
                        {g.value}
                      </text>
                    ))}

                    {activePoint != null && chart.points[activePoint] && (
                      <line
                        x1={chart.points[activePoint][0]}
                        x2={chart.points[activePoint][0]}
                        y1={chart.pad.top}
                        y2={chart.height - chart.pad.bottom}
                        stroke="var(--accent-dark)"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.5"
                      />
                    )}

                    <path d={chart.area} fill="url(#trendFill)" stroke="none" />
                    <path d={chart.line} fill="none" stroke="var(--accent-dark)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

                    {chart.points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p[0]}
                        cy={p[1]}
                        r={activePoint === i ? 5 : 3.5}
                        fill={activePoint === i ? 'var(--accent-dark)' : 'var(--bg)'}
                        stroke="var(--accent-dark)"
                        strokeWidth="2"
                      />
                    ))}
                    {/* Target sentuh/klik lebih besar dari titik yang terlihat, supaya gampang di-tap di HP */}
                    {chart.points.map((p, i) => (
                      <circle
                        key={`hit-${i}`}
                        cx={p[0]}
                        cy={p[1]}
                        r="14"
                        fill="transparent"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActivePoint(i)}
                      />
                    ))}
                  </svg>

                  {activePoint != null && chart.points[activePoint] && (
                    <div
                      className={
                        'trend-tooltip ' +
                        (activePoint / (trend.daily.length - 1) < 0.22
                          ? 'align-start'
                          : activePoint / (trend.daily.length - 1) > 0.78
                          ? 'align-end'
                          : 'align-center')
                      }
                      style={{
                        left: `${(chart.points[activePoint][0] / chart.width) * 100}%`,
                        top: `${(chart.points[activePoint][1] / chart.height) * 100}%`,
                      }}
                    >
                      <div className="trend-tooltip-date">{formatChartDate(trend.daily[activePoint].date)}</div>
                      <div className="trend-tooltip-row">
                        <span className="trend-tooltip-swatch" />
                        Klik: {trend.daily[activePoint].count.toLocaleString('id-ID')}
                      </div>
                    </div>
                  )}
                </div>

                <div className="trend-chart-labels">
                  {trend.daily.map((d, i) => (
                    <span
                      key={i}
                      className={activePoint === i ? 'active' : ''}
                      onClick={() => setActivePoint(i)}
                    >
                      {formatChartDate(d.date)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="two-col">
            <div className="card realtime-card">
              <div className="realtime-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><span className="realtime-dot" />Real-Time</span>
                <button className="icon-btn" onClick={() => handleShareRealtime('views')} disabled={sharing === 'views'}>
                  {sharing === 'views' ? 'Menyiapkan...' : 'Bagikan'}
                </button>
              </div>
              <h3 className="realtime-title">Tampilan dari Judul Halaman</h3>
              <p className="realtime-caption">Tampilan dalam 30 menit terakhir</p>
              <div className="realtime-number">{realtimeLoading ? '\u2014' : (realtime?.total_views ?? 0)}</div>
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
              <div className="realtime-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><span className="realtime-dot" />Real-Time</span>
                <button className="icon-btn" onClick={() => handleShareRealtime('users')} disabled={sharing === 'users'}>
                  {sharing === 'users' ? 'Menyiapkan...' : 'Bagikan'}
                </button>
              </div>
              <h3 className="realtime-title">Pengguna Aktif dari Judul Halaman</h3>
              <p className="realtime-caption">Pengguna aktif dalam 30 menit terakhir</p>
              <div className="realtime-number">{realtimeLoading ? '\u2014' : (realtime?.active_users ?? 0)}</div>
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
