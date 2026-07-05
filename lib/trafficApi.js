import { supabase } from './supabaseClient';

// Menggantikan Cloudflare Worker + D1. Semua query lewat fungsi database
// (lihat supabase/migrations/002_traffic_stats_functions.sql) yang otomatis
// tunduk pada Row Level Security - jadi setiap user hanya bisa melihat data
// situsnya sendiri, walau siteId dikirim manual dari client.

export async function fetchTrafficStats({ siteId, startDate, endDate, searchPath } = {}) {
  if (!siteId) return null;

  const { data, error } = await supabase.rpc('get_traffic_stats', {
    p_site_id: siteId,
    p_start: startDate || null,
    p_end: endDate || null,
    p_search_path: searchPath || null,
  });

  if (error) throw new Error('Gagal mengambil data traffic');
  return data;
}

export async function fetchRealtimeStats({ siteId } = {}) {
  if (!siteId) return null;

  const { data, error } = await supabase.rpc('get_traffic_realtime', {
    p_site_id: siteId,
  });

  if (error) throw new Error('Gagal mengambil data real-time');
  return data;
}

export async function fetchRealtimeLogs({ siteId } = {}) {
  if (!siteId) return [];

  const { data, error } = await supabase.rpc('get_traffic_realtime_logs', {
    p_site_id: siteId,
  });

  if (error) throw new Error('Gagal mengambil log real-time');
  return (data || []).map((row) => ({ ...row, ua: row.referrer_source }));
}

