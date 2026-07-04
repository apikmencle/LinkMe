import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Semua Tautan', icon: '\u2317' },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="sidebar">
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
            className={`sidebar-link ${router.pathname === item.href ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">LinkMe &copy; {new Date().getFullYear()}</div>
    </aside>
  );
}
