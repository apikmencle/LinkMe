import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useSitesContext } from '../context/SitesContext';
import { NAV_ITEMS } from './Sidebar';

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  return Math.floor(diff / 86400) + ' hari lalu';
}

function NotifIcon({ message }) {
  if (message.includes('dihapus')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      </svg>
    );
  }
  if (message.includes('klik')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 21h8" /><path d="M12 17v4" />
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
        <path d="M7 6H4a3 3 0 0 0 3 5" /><path d="M17 6h3a3 3 0 0 1-3 5" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12h6" /><path d="M10 6H6a5 5 0 0 0 0 10h4" /><path d="M14 6h4a5 5 0 0 1 0 10h-4" />
    </svg>
  );
}

export default function Header({ onMenuClick }) {
  const router = useRouter();
  const { session } = useAuth();
  const { sites, loading: sitesLoading, selectedSiteId, setSelectedSiteId } = useSitesContext();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef(null);
  const userRef = useRef(null);
  const siteRef = useRef(null);

  const activeItem = NAV_ITEMS.find((item) => item.href === router.pathname);
  const pageTitle = activeItem ? activeItem.label : 'Dasbor';
  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  useEffect(() => {
    if (session) fetchUnreadCount();
  }, [session]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
      if (siteRef.current && !siteRef.current.contains(e.target)) setSiteMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchUnreadCount() {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false);
    setUnreadCount(count || 0);
  }

  async function fetchNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error) setNotifications(data || []);
  }

  function toggleNotif() {
    const next = !notifOpen;
    setNotifOpen(next);
    setUserMenuOpen(false);
    setSiteMenuOpen(false);
    if (next) fetchNotifications();
  }

  function toggleSiteMenu() {
    const next = !siteMenuOpen;
    setSiteMenuOpen(next);
    setNotifOpen(false);
    setUserMenuOpen(false);
  }

  function toggleUserMenu() {
    setUserMenuOpen(!userMenuOpen);
    setNotifOpen(false);
    setSiteMenuOpen(false);
  }

  async function markOneRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const username = session?.user?.user_metadata?.username;
  const email = session?.user?.email || '';
  const displayName = username || email;
  const initial = (username || email).charAt(0).toUpperCase() || '?';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={onMenuClick} aria-label="Buka menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M3 12h18" />
            <path d="M3 18h18" />
          </svg>
        </button>
        <div className="topbar-title">{pageTitle}</div>
      </div>

      <div className="topbar-right">
        {sites.length > 0 && (
          <div className="site-switcher" ref={siteRef}>
            <button className="site-switcher-trigger" onClick={toggleSiteMenu}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z" />
              </svg>
              <span className="site-switcher-name">{sitesLoading ? '...' : (selectedSite?.name || 'Pilih Situs')}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="site-switcher-chevron">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {siteMenuOpen && (
              <div className="site-switcher-menu">
                <div className="site-switcher-menu-label">Situs</div>
                {sites.map((s) => (
                  <button
                    key={s.id}
                    className={`site-switcher-item ${s.id === selectedSiteId ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSiteId(s.id);
                      setSiteMenuOpen(false);
                    }}
                  >
                    {s.name}
                    {s.id === selectedSiteId && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
                <div className="user-menu-divider" />
                <Link href="/dashboard/sites" className="site-switcher-manage" onClick={() => setSiteMenuOpen(false)}>
                  Kelola Situs
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="notif-wrap" ref={notifRef}>
          <button className="notif-btn" onClick={toggleNotif} aria-label="Notifikasi">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <span>Notifikasi</span>
                {unreadCount > 0 && <button onClick={markAllRead}>Tandai semua dibaca</button>}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">Belum ada notifikasi.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.read ? '' : 'unread'}`}
                      onClick={() => !n.read && markOneRead(n.id)}
                    >
                      <div className="notif-icon"><NotifIcon message={n.message} /></div>
                      <div className="notif-body">
                        <div className="notif-message">{n.message}</div>
                        <div className="notif-time">{timeAgo(n.created_at)}</div>
                      </div>
                      {!n.read && <span className="notif-dot" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="topbar-user" ref={userRef}>
          <button className="topbar-user-trigger" onClick={toggleUserMenu}>
            <div className="avatar">{initial}</div>
            <span className="topbar-email">{displayName}</span>
          </button>
          {userMenuOpen && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="avatar avatar-lg">{initial}</div>
                <div className="user-menu-info">
                  <div className="user-menu-name">{displayName}</div>
                  {username && <div className="user-menu-email">{email}</div>}
                </div>
              </div>
              <div className="user-menu-divider" />
              <Link href="/dashboard/settings" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Pengaturan
              </Link>
              <button className="user-menu-item danger" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
