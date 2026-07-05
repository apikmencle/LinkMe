import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from '../context/AuthContext';

// Dipakai di halaman "Situs Saya" dan semua halaman Traffic Blog supaya
// daftar situs + situs yang sedang dipilih konsisten di seluruh dashboard.
export function useSites() {
  const { session } = useAuth();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setSites(data || []);
      setSelectedSiteId((prev) => {
        if (prev && (data || []).some((s) => s.id === prev)) return prev;
        return data && data.length ? data[0].id : '';
      });
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  return { sites, loading, selectedSiteId, setSelectedSiteId, reload: load };
}
