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
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Ringkasan', icon: 'overview' },
  { href: '/dashboard/links', label: 'Kelola Tautan', icon: 'links' },
  { href: '/dashboard/analytics', label: 'Analitik', icon: 'analytics' },
];

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-bracket">⟨</span>
          <span className="brand-dot" />
          <span className="brand-bracket">⟩</span>
          <span className="sidebar-brand-name">LinkMe</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
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

        <div className="sidebar-footer">LinkMe &copy; {new Date().getFullYear()}</div>
      </aside>
    </>
  );
}
