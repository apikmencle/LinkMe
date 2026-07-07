-- ============================================================
-- Migrasi 2: Fungsi query statistik traffic (pengganti logika di worker.js)
-- Jalankan SETELAH 001_multi_tenant_traffic.sql
-- ============================================================

-- Catatan: fungsi ini "SECURITY INVOKER" (bukan DEFINER), artinya saat
-- dipanggil lewat supabase.rpc() dari browser dengan sesi user yang login,
-- RLS tabel traffic_events & sites tetap berlaku. Jadi walau user iseng
-- kirim site_id milik orang lain, hasilnya tetap kosong (bukan error),
-- karena baris yang bukan miliknya memang tidak akan terlihat oleh RLS.

create or replace function get_traffic_stats(
  p_site_id uuid,
  p_start date default null,
  p_end date default null,
  p_search_path text default null
)
returns json
language sql
security invoker
stable
as $$
  with scoped as (
    select *
    from traffic_events
    where site_id = p_site_id
      and (
        case
          when p_start is not null and p_end is not null then
            (created_at at time zone 'Asia/Jakarta')::date between p_start and p_end
          else
            (created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date
        end
      )
      and (
        p_search_path is null or p_search_path = '' or
        path = p_search_path or path = '/' || p_search_path
      )
  )
  select json_build_object(
    'total_visits', (select count(distinct ip_hash) from scoped),
    'total_clicks', (select count(*) from scoped),
    'daily', coalesce((
      select json_agg(row_to_json(d) order by d.date)
      from (
        select (created_at at time zone 'Asia/Jakarta')::date as date,
               count(distinct ip_hash) as count
        from scoped
        group by 1
      ) d
    ), '[]'::json),
    'pages', coalesce((
      select json_agg(row_to_json(p) order by p.count desc)
      from (
        select path, count(*) as count
        from scoped
        group by path
        order by count desc
        limit 15
      ) p
    ), '[]'::json),
    'countries', coalesce((
      select json_agg(row_to_json(c) order by c.total desc)
      from (
        select country, count(distinct ip_hash) as total
        from scoped
        group by country
        order by total desc
        limit 10
      ) c
    ), '[]'::json),
    'recent_logs', coalesce((
      select json_agg(row_to_json(r) order by r.created_at desc)
      from (
        select path, country, city, device, browser, referrer_source as ua, lang, created_at
        from scoped
        order by created_at desc
        limit 100
      ) r
    ), '[]'::json)
  );
$$;

create or replace function get_traffic_realtime(p_site_id uuid)
returns json
language sql
security invoker
stable
as $$
  with scoped as (
    select *
    from traffic_events
    where site_id = p_site_id
      and created_at >= now() - interval '30 minutes'
  )
  select json_build_object(
    'total_views', (select count(*) from scoped),
    'active_users', (select count(distinct ip_hash) from scoped),
    'views_by_page', coalesce((
      select json_agg(row_to_json(v) order by v.views desc)
      from (
        select path, count(*) as views
        from scoped
        group by path
        order by views desc
        limit 10
      ) v
    ), '[]'::json),
    'users_by_page', coalesce((
      select json_agg(row_to_json(u) order by u.users desc)
      from (
        select path, count(distinct ip_hash) as users
        from scoped
        group by path
        order by users desc
        limit 10
      ) u
    ), '[]'::json)
  );
$$;

-- Untuk log real-time butuh juga path lengkap + waktu per kunjungan (dipakai
-- di halaman Real Time). Tambahkan sebagai fungsi terpisah supaya query di
-- atas tetap ringan untuk ringkasan.
create or replace function get_traffic_realtime_logs(p_site_id uuid)
returns setof traffic_events
language sql
security invoker
stable
as $$
  select *
  from traffic_events
  where site_id = p_site_id
    and (created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date
  order by created_at desc
  limit 100;
$$;

grant execute on function get_traffic_stats(uuid, date, date, text) to authenticated;
grant execute on function get_traffic_realtime(uuid) to authenticated;
grant execute on function get_traffic_realtime_logs(uuid) to authenticated;
