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
};

const NAV_GROUPS = [
  {
    label: 'Menu',
    items: [
      { href: '/dashboard', label: 'Ringkasan', icon: 'overview' },
      { href: '/dashboard/links', label: 'Kelola Tautan', icon: 'links' },
      { href: '/dashboard/analytics', label: 'Analitik', icon: 'analytics' },
    ],
  },
  {
    label: 'Traffic Blog',
    items: [
      { href: '/dashboard/traffic', label: 'Ringkasan', icon: 'traffic' },
      { href: '/dashboard/traffic/insight', label: 'Link Insight', icon: 'insight' },
      { href: '/dashboard/traffic/realtime', label: 'Real Time', icon: 'realtime' },
    ],
  },
];

// Dipakai Header.js untuk menentukan judul halaman aktif
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
          {NAV_GROUPS.map((group) => (
            <div className="sidebar-group" key={group.label}>
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
    
