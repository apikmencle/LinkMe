import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useIsAdmin() {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!session) {
      setIsAdmin(false);
      setChecked(true);
      return;
    }
    let cancelled = false;
    supabase.rpc('am_i_admin').then(({ data, error }) => {
      if (cancelled) return;
      setIsAdmin(!error && data === true);
      setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  return { isAdmin, checked };
}
