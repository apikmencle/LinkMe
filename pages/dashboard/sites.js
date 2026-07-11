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
  const [roleMap, setRoleMap] = useState({});
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [host, setHost] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [membersOpenId, setMembersOpenId] = useState('');
  const [membersBySite, setMembersBySite] = useState({});
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersErr, setMembersErr] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    setHost(window.location.origin);
    if (session) fetchSites();
  }, [session]);

  async function fetchSites() {
    setFetching(true);
    const [{ data: siteData, error: siteErr }, { data: memberRows }] = await Promise.all([
      supabase.from('sites').select('*').order('created_at', { ascending: false }),
      supabase.from('site_members').select('site_id, role').eq('user_id', session.user.id),
    ]);
    if (!siteErr) setSites(siteData || []);
    const map = {};
    (memberRows || []).forEach((r) => { map[r.site_id] = r.role; });
    setRoleMap(map);
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

    if (error) {
      setCreating(false);
      setErr('Gagal menambah situs. Coba lagi.');
      return;
    }

    // Daftarkan pembuat situs sebagai 'owner' di site_members, supaya
    // dia (dan sistem role/anggota) langsung konsisten sejak awal.
    await supabase.from('site_members').insert({
      site_id: data.id,
      user_id: session.user.id,
      role: 'owner',
    });

    setCreating(false);
    setName('');
    setDomain('');
    setSites((prev) => [data, ...prev]);
    setRoleMap((prev) => ({ ...prev, [data.id]: 'owner' }));
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

  async function handleLeave(siteId) {
    await supabase
      .from('site_members')
      .delete()
      .eq('site_id', siteId)
      .eq('user_id', session.user.id);
    fetchSites();
    if (membersOpenId === siteId) setMembersOpenId('');
  }

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1500);
    });
  }

  async function toggleMembers(siteId) {
    const next = membersOpenId === siteId ? '' : siteId;
    setMembersOpenId(next);
    setMembersErr('');
    setInviteEmail('');
    if (next) await loadMembers(siteId);
  }

  async function loadMembers(siteId) {
    setMembersLoading(true);
    setMembersErr('');
    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const res = await fetch(`/api/sites/members?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${freshSession.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuat anggota.');
      setMembersBySite((prev) => ({ ...prev, [siteId]: json.members }));
    } catch (e) {
      setMembersErr(e.message);
    }
    setMembersLoading(false);
  }

  async function handleInvite(e, siteId) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setMembersErr('');
    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const res = await fetch('/api/sites/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${freshSession.access_token}`,
        },
        body: JSON.stringify({ site_id: siteId, email: inviteEmail.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengundang anggota.');
      setInviteEmail('');
      await loadMembers(siteId);
    } catch (e) {
      setMembersErr(e.message);
    }
    setInviting(false);
  }

  async function handleRemoveMember(memberId, siteId) {
    const { error } = await supabase.from('site_members').delete().eq('id', memberId);
    if (!error) loadMembers(siteId);
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
            {creating ? 'Menambah...' : 'Tambah Situs â†’'}
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
            {sites.map((s) => {
              const myRole = roleMap[s.id] || 'member';
              const isOwner = myRole === 'owner';
              return (
                <div className="link-row" key={s.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                    <div className="link-main">
                      <div className="link-code">
                        {s.name}{' '}
                        <span className="live-badge" style={{ opacity: s.is_active ? 1 : 0.5 }}>
                          <span className="live-dot" style={{ background: s.is_active ? '#22c55e' : '#9ca3af' }} />
                          {s.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>{' '}
                        <span className={`role-badge ${isOwner ? 'owner' : ''}`}>
                          {isOwner ? 'Pemilik' : 'Anggota'}
                        </span>
                      </div>
                      <div className="link-orig">{s.domain || 'Domain belum diisi'}</div>
                      <div className="link-meta">Dibuat {timeAgo(s.created_at)}</div>
                    </div>
                    <div className="link-actions">
                      <button className="icon-btn" onClick={() => setExpandedId(expandedId === s.id ? '' : s.id)}>
                        {expandedId === s.id ? 'Tutup Kode' : 'Lihat Kode'}
                      </button>
                      <button className="icon-btn" onClick={() => toggleMembers(s.id)}>
                        {membersOpenId === s.id ? 'Tutup Anggota' : 'Anggota'}
                      </button>
                      {isOwner ? (
                        <>
                          <button className="icon-btn" onClick={() => handleToggleActive(s)}>
                            {s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button className="icon-btn danger" onClick={() => handleDelete(s.id)}>Hapus</button>
                        </>
                      ) : (
                        <button className="icon-btn danger" onClick={() => handleLeave(s.id)}>Keluar</button>
                      )}
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

                  {membersOpenId === s.id && (
                    <div className="members-panel">
                      {membersErr && <div className="auth-err">{membersErr}</div>}
                      {membersLoading ? (
                        <div className="empty-state">Memuat anggota...</div>
                      ) : (
                        <div className="member-list">
                          {(membersBySite[s.id] || []).map((m) => (
                            <div className="member-row" key={m.id}>
                              <div className="member-info">
                                <span className="member-email">{m.email}{m.is_me ? ' (kamu)' : ''}</span>
                                <span className={`role-badge ${m.role === 'owner' ? 'owner' : ''}`}>
                                  {m.role === 'owner' ? 'Pemilik' : 'Anggota'}
                                </span>
                              </div>
                              {isOwner && m.role !== 'owner' && (
                                <button className="icon-btn danger" onClick={() => handleRemoveMember(m.id, s.id)}>
                                  Hapus
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {isOwner && (
                        <form className="invite-form" onSubmit={(e) => handleInvite(e, s.id)}>
                          <input
                            type="email"
                            placeholder="Email anggota yang mau diundang"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                          <button className="btn-primary" disabled={inviting}>
                            {inviting ? 'Mengundang...' : 'Undang'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
                }
