-- ============================================================
-- Migrasi 10: Fungsi export_traffic_events (dipakai fitur "Export CSV"
-- di halaman Insight Halaman)
-- Jalankan SETELAH 001-009, di Supabase Dashboard > SQL Editor.
--
-- SECURITY INVOKER (sama seperti get_traffic_stats di migrasi 002) -
-- RLS tabel traffic_events tetap berlaku walau dipanggil lewat RPC dari
-- browser, jadi user cuma bisa export data situsnya sendiri.
--
-- Beda sengaja dari get_traffic_stats: kalau p_start/p_end tidak diisi,
-- get_traffic_stats fallback ke "hari ini saja" (karena itu dipakai
-- dashboard real-time). Di sini, tidak diisi = tidak difilter tanggal
-- sama sekali (ambil yang terbaru, dibatasi LIMIT) - karena tujuan
-- export biasanya "kasih semua data yang ada", bukan cuma hari ini.
-- ============================================================

create or replace function export_traffic_events(
  p_site_id uuid,
  p_start date default null,
  p_end date default null,
  p_search_path text default null
)
returns table (
  event_time timestamptz,
  path text,
  referrer_source text,
  country text,
  city text,
  device text,
  browser text,
  lang text
)
language sql
security invoker
stable
as $$
  select created_at, path, referrer_source, country, city, device, browser, lang
  from traffic_events
  where site_id = p_site_id
    and (
      p_start is null or p_end is null or
      (created_at at time zone 'Asia/Jakarta')::date between p_start and p_end
    )
    and (
      p_search_path is null or p_search_path = '' or
      path = p_search_path or path = '/' || p_search_path
    )
  order by created_at desc
  limit 5000;
$$;

-- Dibatasi 5000 baris terbaru per export supaya tidak membebani browser
-- (generate + download CSV jutaan baris bisa bikin tab hang). Kalau
-- nanti butuh export lebih besar, baiknya diarahkan ke pendekatan lain
-- (mis. export terjadwal lewat email) - bukan sekadar naikkan angka ini.

grant execute on function export_traffic_events(uuid, date, date, text) to authenticated;
