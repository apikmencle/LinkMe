-- ============================================================
-- Migrasi 3: Ubah agregat 'daily' pada get_traffic_stats supaya
-- menghitung TOTAL KLIK per hari (count(*)), bukan pengunjung unik
-- per hari (count(distinct ip_hash)).
--
-- Alasan: grafik "Tren Pertumbuhan Traffic" di Dashboard menampilkan
-- tooltip berlabel "Klik: X" - datanya perlu konsisten dengan kartu
-- "Total Klik (Sepanjang Waktu)" di atasnya. Metrik pengunjung unik
-- tetap tersedia lewat 'total_visits' (dihitung untuk rentang yang
-- sama), jadi tidak ada data yang hilang.
--
-- Jalankan SETELAH 001 dan 002.
-- ============================================================

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
               count(*) as count
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

grant execute on function get_traffic_stats(uuid, date, date, text) to authenticated;
