-- ============================================================
-- Migrasi 9: Rate Limiting (generik, dipakai lintas fitur)
-- Jalankan SETELAH 001-008, di Supabase Dashboard > SQL Editor.
--
-- Pola ini beda dari rate limit di /api/collect.js (yang cek langsung
-- ke tabel traffic_events, karena memang cuma dipakai di satu tempat).
-- Di sini dibuat generik lewat tabel rate_limit_log + satu fungsi,
-- supaya bisa dipakai berulang untuk fitur lain di masa depan tanpa
-- bikin tabel/logic baru tiap kali (mis. nanti rate limit reset
-- password, rate limit ganti username, dst).
-- ============================================================

create table if not exists rate_limit_log (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_log_key_created
  on rate_limit_log(key, created_at desc);

-- RLS diaktifkan tapi SENGAJA TIDAK ADA policy sama sekali - baik anon
-- maupun authenticated tidak bisa baca/tulis tabel ini langsung. Satu-
-- satunya jalan masuk adalah lewat fungsi check_and_log_rate_limit()
-- di bawah (SECURITY DEFINER, jalan dengan hak pemilik fungsi, bukan
-- hak pemanggil - jadi RLS di tabel ini tidak menghalanginya).
alter table rate_limit_log enable row level security;

-- p_key: identifier unik per "hal yang mau dibatasi", mis.
--   'create_link:<user_id>' atau 'invite_member:<user_id>'
-- p_window_seconds: lebar jendela waktu
-- p_max: jumlah maksimum aksi yang boleh terjadi dalam jendela itu
-- Return TRUE kalau boleh lanjut (dan langsung mencatat aksi ini),
-- FALSE kalau sudah kena limit (TIDAK mencatat apa-apa, supaya user
-- yang di-throttle tidak makin memperpanjang periode block-nya sendiri
-- kalau dia coba berkali-kali).
create or replace function check_and_log_rate_limit(
  p_key text,
  p_window_seconds int,
  p_max int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  delete from rate_limit_log
  where key = p_key
    and created_at < now() - (p_window_seconds || ' seconds')::interval;

  select count(*) into v_count
  from rate_limit_log
  where key = p_key
    and created_at >= now() - (p_window_seconds || ' seconds')::interval;

  if v_count >= p_max then
    return false;
  end if;

  insert into rate_limit_log (key) values (p_key);
  return true;
end;
$$;

-- Di-grant ke authenticated karena dipanggil langsung dari client saat
-- membuat link (pages/dashboard/links.js). Undangan anggota memanggil
-- fungsi ini lewat supabaseAdmin (service_role) di server, yang selalu
-- boleh eksekusi fungsi apapun terlepas dari grant ini.
grant execute on function check_and_log_rate_limit(text, int, int) to authenticated;
