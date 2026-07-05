import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  return Math.floor(diff / 86400) + ' hari lalu';
}

function buildSnippet(host, siteKey) {
  return `<script async src="${host}/t.js" data-site="${siteKey}"></script>`;
}

export default function Sites() {
  const { session } = useAuth();
  const [sites, setSites] = useState([]);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [host, setHost] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [expandedId, setExpandedId] = useState('');

  useEffect(() => {
    setHost(window.location.origin);
    if (session) fetchSites();
  }, [session]);

  async function fetchSites() {
    setFetching(true);
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setSites(data || []);
    setFetching(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setErr('');

    if (!name.trim()) {
      setErr('Nama situs wajib diisi.');
      return;
    }

    setCreating(true);
    const { data, error } = await supabase
      .from('sites')
      .insert({ name: name.trim(), domain: domain.trim() || null, user_id: session.user.id })
      .select()
      .single();

    setCreating(false);
    if (error) {
      setErr('Gagal menambah situs. Coba lagi.');
      return;
    }

    setName('');
    setDomain('');
    setSites((prev) => [data, ...prev]);
    setExpandedId(data.id);
  }

  async function handleToggleActive(site) {
    const { error } = await supabase
      .from('sites')
      .update({ is_active: !site.is_active })
      .eq('id', site.id);
    if (!error) fetchSites();
  }

  async function handleDelete(id) {
    await supabase.from('sites').delete().eq('id', id);
    fetchSites();
  }

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1500);
    });
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Situs Saya</h1>
        <p>Daftarkan blog atau landing page yang ingin kamu analisis trafficnya.</p>
      </div>

      <div className="card create-card">
        <form onSubmit={handleCreate} className="create-form">
          <div className="field">
            <label>Nama situs</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Blog Utama"
            />
          </div>
          <div className="field">
            <label>Domain (opsional)</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="blog-saya.com"
            />
          </div>
          <button className="btn-primary" disabled={creating}>
            {creating ? 'Menambah...' : 'Tambah Situs →'}
          </button>
        </form>
        {err && <div className="auth-err">{err}</div>}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Semua situs</h2>
          <span className="muted">{sites.length} situs</span>
        </div>

        {fetching ? (
          <div className="empty-state">Memuat...</div>
        ) : sites.length === 0 ? (
          <div className="empty-state">
            Belum ada situs. Tambah yang pertama lewat form di atas, lalu pasang
            snippet-nya di blog/landing page kamu.
          </div>
        ) : (
          <div className="link-table">
            {sites.map((s) => (
              <div className="link-row" key={s.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                  <div className="link-main">
                    <div className="link-code">
                      {s.name}{' '}
                      <span className={`live-badge`} style={{ opacity: s.is_active ? 1 : 0.5 }}>
                        <span className="live-dot" style={{ background: s.is_active ? '#22c55e' : '#9ca3af' }} />
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <div className="link-orig">{s.domain || 'Domain belum diisi'}</div>
                    <div className="link-meta">Dibuat {timeAgo(s.created_at)}</div>
                  </div>
                  <div className="link-actions">
                    <button className="icon-btn" onClick={() => setExpandedId(expandedId === s.id ? '' : s.id)}>
                      {expandedId === s.id ? 'Tutup Kode' : 'Lihat Kode'}
                    </button>
                    <button className="icon-btn" onClick={() => handleToggleActive(s)}>
                      {s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(s.id)}>Hapus</button>
                  </div>
                </div>

                {expandedId === s.id && (
                  <div style={{ marginTop: '12px', width: '100%' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--muted, #888)' }}>
                      Tempel kode ini sebelum tag &lt;/body&gt; di setiap halaman blog/landing page kamu:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <code style={{
                        display: 'block', flex: 1, padding: '10px 12px', borderRadius: '8px',
                        background: 'rgba(127,127,127,0.12)', fontSize: '13px', overflowX: 'auto', whiteSpace: 'nowrap',
                      }}>
                        {buildSnippet(host, s.site_key)}
                      </code>
                      <button
                        className="btn-primary"
                        type="button"
                        onClick={() => handleCopy(s.id, buildSnippet(host, s.site_key))}
                      >
                        {copiedId === s.id ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
