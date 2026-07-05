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
    <div className="field" style={{ maxWidth: '320px', marginBottom: '16px' }}>
      <label>Situs</label>
      <select value={selectedSiteId} onChange={(e) => onChange(e.target.value)}>
        {sites.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}
