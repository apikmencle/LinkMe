-- ============================================================
-- Migrasi 6: Fungsi increment_link_clicks (atomik: baca + tulis
-- dalam satu statement SQL, aman dari race condition kalau dua
-- orang klik link yang sama di waktu bersamaan)
-- Jalankan SETELAH 005_links_table.sql
--
-- "drop function if exists" dulu supaya aman dijalankan ulang, karena
-- Postgres tidak mengizinkan "create or replace function" mengubah
-- struktur/tipe kolom hasil (RETURNS TABLE) dari fungsi yang sudah ada.
-- ============================================================

drop function if exists increment_link_clicks(text);

-- SECURITY DEFINER supaya bisa dipanggil oleh siapa saja yang membuka
-- link pendek (termasuk pengunjung anonim yang belum login), melewati
-- RLS tabel `links` yang normalnya membatasi hanya pemilik yang bisa
-- lihat/ubah baris miliknya.
create or replace function increment_link_clicks(p_code text)
returns table (
  new_clicks integer,
  owner_id uuid,
  target_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update links
  set clicks = clicks + 1
  where code = p_code
  returning links.clicks, links.user_id, links.url;
end;
$$;

-- Batasi siapa yang boleh mengeksekusi fungsi ini: anon (pengunjung belum
-- login) dan authenticated, tapi TIDAK bisa akses tabel links langsung
-- untuk mengubah clicks -- hanya lewat fungsi ini.
grant execute on function increment_link_clicks(text) to anon, authenticated;
