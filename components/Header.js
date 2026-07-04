import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from './Sidebar';

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  return Math.floor(diff / 86400) + ' hari lalu';
}

export default function Header({ onMenuClick }) {
  const router = useRouter();
  const { session } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const activeItem = NAV_ITEMS.find((item) => item.href === router.pathname);
  const pageTitle = activeItem
    ? (activeItem.group === 'Menu' ? activeItem.label : `${activeItem.group} · ${activeItem.label}`)
    : 'Dasbor';

  useEffect(() => {
    if (session) fetchUnreadCount();
  }, [session]);

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
    if (next) fetchNotifications();
  }

  function toggleUserMenu() {
    setUserMenuOpen(!userMenuOpen);
    setNotifOpen(false);
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
        <div className="notif-wrap">
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
                <button onClick={markAllRead}>Tandai semua dibaca</button>
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
                      <div className="notif-message">{n.message}</div>
                      <div className="notif-time">{timeAgo(n.created_at)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="topbar-user" onClick={toggleUserMenu}>
          <div className="avatar">{initial}</div>
          <span className="topbar-email">{displayName}</span>
          {userMenuOpen && (
            <div className="user-menu">
              <button onClick={handleLogout}>Keluar</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
    }
    
