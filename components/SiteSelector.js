import Link from 'next/link';

export default function SiteSelector({ sites, selectedSiteId, onChange }) {
  if (!sites.length) {
    return (
      <div className="card">
        <div className="empty-state">
          Kamu belum punya situs terdaftar.{' '}
          <Link href="/dashboard/sites">Tambah situs pertama</Link> lalu pasang
          snippet-nya di blog/landing page kamu untuk mulai melihat data traffic.
        </div>
      </div>
    );
  }

  return (
    <div className="card site-selector-bar">
      <div className="site-selector-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z" />
        </svg>
        Situs
      </div>
      <select
        className="site-selector-select"
        value={selectedSiteId}
        onChange={(e) => onChange(e.target.value)}
      >
        {sites.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <Link href="/dashboard/sites" className="site-selector-manage">Kelola Situs</Link>
    </div>
  );
}

