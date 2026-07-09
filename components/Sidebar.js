import Link from 'next/link';
import { useRouter } from 'next/router';

const ICONS = {
  overview: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  links: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12h6" />
      <path d="M10 6H6a5 5 0 0 0 0 10h4" />
      <path d="M14 6h4a5 5 0 0 1 0 10h-4" />
    </svg>
  ),
  analytics: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
    </svg>
  ),
  traffic: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
      <path d="M3 12h18" />
    </svg>
  ),
  insight: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  realtime: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h4l2-7 4 14 3-9 2 5h5" />
    </svg>
  ),
  settings: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  faq: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  sites: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z" />
    </svg>
  ),
  dashboard: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
};

const NAV_GROUPS = [
  {
    label: 'Trafik',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { href: '/dashboard/sites', label: 'Situs Saya', icon: 'sites' },
      { href: '/dashboard/traffic/insight', label: 'Insight Halaman', icon: 'insight' },
      { href: '/dashboard/traffic/realtime', label: 'Real-Time', icon: 'realtime' },
    ],
  },
  {
    label: 'Tautan',
    items: [
      { href: '/dashboard/links', label: 'Kelola Tautan', icon: 'links' },
      { href: '/dashboard/analytics', label: 'Analitik Tautan', icon: 'analytics' },
    ],
  },
  {
    label: 'Akun',
    items: [
      { href: '/dashboard/settings', label: 'Pengaturan', icon: 'settings' },
      { href: '/dashboard/faq', label: 'FAQ', icon: 'faq' },
    ],
  },
];

// Dipakai Header.js untuk menentukan judul halaman aktif. Judul selalu cuma
// nama halaman itu sendiri - tanpa prefix nama kelompok menu.
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) =>
  g.items.map((item) => ({ ...item, group: g.label }))
);

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">
            <span className="brand-bracket">⟨</span>
            <span className="brand-dot" />
            <span className="brand-bracket">⟩</span>
          </span>
          <span className="sidebar-brand-name">LinkMe</span>
        </div>

        <div className="sidebar-scroll">
          {NAV_GROUPS.map((group, i) => (
            <div className="sidebar-group" key={group.label}>
              {i > 0 && <div className="sidebar-divider" role="separator" aria-label={group.label} />}
              <div className="sidebar-section-label">{group.label}</div>
              <nav className="sidebar-nav">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`sidebar-link ${router.pathname === item.href ? 'active' : ''}`}
                  >
                    <span className="sidebar-icon">{ICONS[item.icon]}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">LinkMe &copy; {new Date().getFullYear()}</div>
      </aside>
    </>
  );
    }
    
