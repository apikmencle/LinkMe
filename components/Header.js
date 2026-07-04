import { useRouter } from 'next/router';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const email = session?.user?.email || '';
  const initial = email.charAt(0).toUpperCase() || '?';

  return (
    <header className="topbar">
      <div className="topbar-title">Dasbor</div>
      <div className="topbar-user" onClick={() => setOpen(!open)}>
        <div className="avatar">{initial}</div>
        <span className="topbar-email">{email}</span>
        {open && (
          <div className="user-menu">
            <button onClick={handleLogout}>Keluar</button>
          </div>
        )}
      </div>
    </header>
  );
}
