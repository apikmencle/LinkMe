import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

function genCode(len = 6) {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidAlias(str) {
  return /^[a-zA-Z0-9-_]{2,24}$/.test(str);
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  return Math.floor(diff / 86400) + ' hari lalu';
}

const PAGE_SIZE = 50;

export default function Dashboard() {
  const { session } = useAuth();
  const [links, setLinks] = useState([]);
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [host, setHost] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [stats, setStats] = useState({ total: 0, totalClicks: 0 });

  useEffect(() => {
    setHost(window.location.origin);
    if (session) {
      fetchFirstPage();
      fetchStats();
    }
  }, [session]);

  // Stat di kartu ringkasan dihitung terpisah dari daftar yang dipaginasi
  // di bawah, supaya tetap akurat mencerminkan SEMUA link user - bukan cuma
  // 50 yang sedang ditampilkan. Cuma ambil kolom `clicks` (bukan select *),
  // jadi tetap ringan walau jumlah link sudah banyak.
  async function fetchStats() {
    const [{ count }, { data: clicksData }] = await Promise.all([
      supabase.from('links').select('id', { count: 'exact', head: true }),
      supabase.from('links').select('clicks'),
    ]);
    const totalClicks = (clicksData || []).reduce((sum, l) => sum + l.clicks, 0);
    setStats({ total: count || 0, totalClicks });
  }

  async function fetchFirstPage() {
    setFetching(true);
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);
    if (!error) {
      setLinks(data || []);
      setHasMore((data || []).length === PAGE_SIZE);
    }
    setFetching(false);
  }

  async function fetchMore() {
    setLoadingMore(true);
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('created_at', { ascending: false })
      .range(links.length, links.length + PAGE_SIZE - 1);
    if (!error) {
      setLinks((prev) => [...prev, ...(data || [])]);
      setHasMore((data || []).length === PAGE_SIZE);
    }
    setLoadingMore(false);
  }

  function refreshAll() {
    fetchFirstPage();
    fetchStats();
  }

  async function notify(message) {
    await supabase.from('notifications').insert({
      user_id: session.user.id,
      message,
    });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setErr('');

    if (!url || !isValidUrl(url)) {
      setErr('Tautan tidak valid. Pastikan diawali http:// atau https://');
      return;
    }
    if (alias && !isValidAlias(alias)) {
      setErr('Kode kustom hanya boleh huruf, angka, - dan _, 2-24 karakter.');
      return;
    }

    setCreating(true);
    let code = alias.trim();
    let attempts = 0;
    let success = false;

    while (!success && attempts < 5) {
      if (!code) code = genCode();

      const { error } = await supabase
        .from('links')
        .insert({ code, url, user_id: session.user.id });

      if (!error) {
        success = true;
      } else if (error.code === '23505') {
        if (alias.trim()) {
          setErr('Kode itu sudah dipakai, coba yang lain.');
          break;
        }
        code = '';
        attempts += 1;
      } else {
        setErr('Gagal menyimpan link. Coba lagi.');
        break;
      }
    }

    setCreating(false);
    if (success) {
      notify(`Tautan baru berhasil dibuat: /${code}`);
      setUrl('');
      setAlias('');
      refreshAll();
    }
  }

  async function handleDelete(id, code) {
    await supabase.from('links').delete().eq('id', id);
    notify(`Tautan /${code} telah dihapus`);
    refreshAll();
  }

  async function handleVisit(link) {
    // Lewat API server-side (bukan rpc() langsung dari browser) supaya
    // kepemilikan link diverifikasi dulu sebelum klik dicatat - lihat
    // pages/api/links/visit.js untuk alasannya.
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    await fetch('/api/links/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentSession?.access_token}`,
      },
      body: JSON.stringify({ code: link.code }),
    });
    refreshAll();
    window.open(link.url, '_blank');
  }

  function handleCopy(code) {
    navigator.clipboard.writeText(`${host}/${code}`).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 1500);
    });
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Kelola Tautan</h1>
        <p>Buat, kelola, dan pantau semua tautan pendek di satu tempat.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total Tautan</span>
          <span className="stat-value">{fetching ? '\u2014' : stats.total}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Klik</span>
          <span className="stat-value">{fetching ? '\u2014' : stats.totalClicks}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Rata-rata Klik / Tautan</span>
          <span className="stat-value">
            {fetching || !stats.total
              ? '\u2014'
              : Math.round((stats.totalClicks / stats.total) * 10) / 10}
          </span>
        </div>
      </div>

      <div className="card create-card">
        <form onSubmit={handleCreate} className="create-form">
          <div className="field">
            <label>Tautan panjang</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://contoh.com/artikel/yang-panjang"
            />
          </div>
          <div className="field field-alias">
            <label>Kode kustom (opsional)</label>
            <div className="alias-input">
              <span className="alias-prefix">{host.replace(/^https?:\/\//, '')}/</span>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="promo-lebaran"
              />
            </div>
          </div>
          <button className="btn-primary" disabled={creating}>
            {creating ? 'Membuat...' : 'Pendekkan \u2192'}
          </button>
        </form>
        {err && <div className="auth-err">{err}</div>}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Semua tautan</h2>
          <span className="muted">{stats.total} tautan</span>
        </div>

        {fetching ? (
          <div className="empty-state">Memuat...</div>
        ) : links.length === 0 ? (
          <div className="empty-state">
            Belum ada tautan. Buat yang pertama lewat form di atas.
          </div>
        ) : (
          <>
            <div className="link-table">
              {links.map((l) => (
                <div className="link-row" key={l.id}>
                  <div className="link-main">
                    <div className="link-code">{host.replace(/^https?:\/\//, '')}/{l.code}</div>
                    <div className="link-orig">{l.url}</div>
                    <div className="link-meta">Dibuat {timeAgo(l.created_at)}</div>
                  </div>
                  <div className="link-clicks">
                    <b>{l.clicks}</b>
                    <span>klik</span>
                  </div>
                  <div className="link-actions">
                    <button className="icon-btn" onClick={() => handleCopy(l.code)}>
                      {copiedCode === l.code ? 'Tersalin' : 'Salin'}
                    </button>
                    <button className="icon-btn" onClick={() => handleVisit(l)}>Buka</button>
                    <button className="icon-btn danger" onClick={() => handleDelete(l.id, l.code)}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button className="btn-primary" onClick={fetchMore} disabled={loadingMore}>
                  {loadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
                }
