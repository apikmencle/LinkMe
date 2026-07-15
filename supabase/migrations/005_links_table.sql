-- ============================================================
-- Migrasi 5: Tabel LINKS (pemendek tautan)
-- Jalankan di Supabase Dashboard -> SQL Editor -> New query -> Run
--
-- File ini AMAN dijalankan berkali-kali (idempotent):
-- - "create table if not exists" tidak akan error kalau tabel sudah ada
-- - policy di-drop dulu sebelum dibuat ulang, supaya tidak kena error
--   42710 "policy already exists" kalau migrasi ini pernah dijalankan
--   sebagian sebelumnya
-- ============================================================

create table if not exists links (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  url text not null,
  clicks integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_links_user_id on links(user_id);
create unique index if not exists idx_links_code on links(code);

alter table links enable row level security;

-- Pemilik link boleh melihat, membuat, dan menghapus link miliknya sendiri
-- lewat browser (pakai supabase client biasa di dashboard/links.js).
drop policy if exists "Users can view their own links" on links;
create policy "Users can view their own links"
on links for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own links" on links;
create policy "Users can insert their own links"
on links for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own links" on links;
create policy "Users can delete their own links"
on links for delete
using (auth.uid() = user_id);

-- Sengaja TIDAK ADA policy update untuk role biasa: kolom `clicks` hanya
-- boleh berubah lewat fungsi increment_link_clicks (security definer) di
-- migrasi 006, supaya user tidak bisa iseng ubah jumlah klik dari browser.
