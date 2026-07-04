import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export default function Analytics() {
  const { session } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState('');

  useEffect(() => {
    setHost(window.location.origin);
    if (session) fetchLinks();
  }, [session]);

  async function fetchLinks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('clicks', { ascending: false });
    if (!error) setLinks(data || []);
    setLoading(false);
  }

  const maxClicks = links.length ? Math.max(...links.map((l) => l.clicks), 1) : 1;

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Analitik</h1>
        <p>Tautan mana yang paling banyak diklik.</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Peringkat Tautan</h2>
          <span className="muted">Diurutkan dari klik terbanyak</span>
        </div>

        {loading ? (
          <div className="empty-state">Memuat...</div>
        ) : links.length === 0 ? (
          <div className="empty-state">Belum ada data untuk dianalisis.</div>
        ) : (
          <div className="rank-list">
            {links.map((l, i) => (
              <div className="rank-row" key={l.id}>
                <div className="rank-num">{i + 1}</div>
                <div className="rank-info">
                  <div className="link-code">{host.replace(/^https?:\/\//, '')}/{l.code}</div>
                  <div className="link-orig">{l.url}</div>
                  <div className="rank-bar-track">
                    <div
                      className="rank-bar-fill"
                      style={{ width: `${Math.max((l.clicks / maxClicks) * 100, l.clicks > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
                <div className="link-clicks">
                  <b>{l.clicks}</b>
                  <span>klik</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
