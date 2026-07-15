import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useIsAdmin } from '../../lib/useIsAdmin';
import { supabase } from '../../lib/supabaseClient';

async function authedFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Terjadi kesalahan.');
  return json;
}

export default function AdminHome() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { isAdmin, checked } = useIsAdmin();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('sites');

  useEffect(() => {
    if (checked && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [checked, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
  }, [isAdmin]);

  async function loadAll() {
    setLoading(true);
    setErr('');
    try {
      const [statsRes, usersRes, sitesRes] = await Promise.all([
        authedFetch('/api/admin/stats'),
        authedFetch('/api/admin/users'),
        authedFetch('/api/admin/sites'),
      ]);
      setStats(statsRes);
      setUsers(usersRes.users);
      setSites(sitesRes.sites);
    } catch (e) {
      setErr(e.message);
    }
    setLoading(false);
  }

  async function toggleSite(site) {
    try {
      await authedFetch('/api/admin/sites', {
        method: 'PATCH',
        body: JSON.stringify({ site_id: site.id, is_active: !site.is_active }),
      });
      setSites((prev) =>
        prev.map((s) => (s.id === site.id ? { ...s, is_active: !s.is_active } : s))
      );
    } catch (e) {
      setErr(e.message);
    }
  }

  if (authLoading || !checked || (checked && !isAdmin)) {
    return (
      <DashboardLayout>
        <div className="page-loading">Memuat...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Admin Platform</h1>
        <p>Ringkasan seluruh user dan situs yang terdaftar di LinkMe.</p>
      </div>

      {err && <div className="auth-err">{err}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Total User</span>
          <span className="stat-value">{loading ? '\u2014' : stats?.total_users}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Situs</span>
          <span className="stat-value">
            {loading ? '\u2014' : `${stats?.active_sites} aktif / ${stats?.total_sites}`}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Tautan</span>
          <span className="stat-value">{loading ? '\u2014' : stats?.total_links}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Traffic Event</span>
          <span className="stat-value">
            {loading ? '\u2014' : `+${stats?.traffic_today} hari ini`}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{tab === 'sites' ? 'Semua Situs' : 'Semua User'}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`icon-btn ${tab === 'sites' ? 'active' : ''}`}
              onClick={() => setTab('sites')}
            >
              Situs
            </button>
            <button
              className={`icon-btn ${tab === 'users' ? 'active' : ''}`}
              onClick={() => setTab('users')}
            >
              User
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Memuat...</div>
        ) : tab === 'sites' ? (
          sites.length === 0 ? (
            <div className="empty-state">Belum ada situs terdaftar.</div>
          ) : (
            <div className="link-table">
              {sites.map((s) => (
                <div className="link-row" key={s.id}>
                  <div className="link-main">
                    <div className="link-code">{s.name}</div>
                    <div className="link-orig">{s.domain || '(domain belum diisi)'}</div>
                    <div className="link-meta">Pemilik: {s.owner_email}</div>
                  </div>
                  <div className="link-actions">
                    <span className={`role-badge ${s.is_active ? 'owner' : ''}`}>
                      {s.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button className="icon-btn" onClick={() => toggleSite(s)}>
                      {s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : users.length === 0 ? (
          <div className="empty-state">Belum ada user terdaftar.</div>
        ) : (
          <div className="link-table">
            {users.map((u) => (
              <div className="link-row" key={u.id}>
                <div className="link-main">
                  <div className="link-code">{u.email}</div>
                  <div className="link-meta">
                    Terdaftar {new Date(u.created_at).toLocaleDateString('id-ID')}
                  </div>
                </div>
                {u.is_admin && <span className="role-badge owner">Admin</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
            }
