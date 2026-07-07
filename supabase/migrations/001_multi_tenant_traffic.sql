-- ============================================================
-- Migrasi: Traffic Analytics Multi-Tenant (menggantikan Cloudflare D1)
-- Jalankan di Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- 1. TABEL SITES
-- Setiap baris = satu blog/landing page yang dipantau oleh seorang user.
-- site_key adalah ID publik yang ditempel di script tracking (boleh dilihat
-- siapa saja yang melihat source halaman blog, makanya dipisah dari `id`
-- supaya bisa di-rotate/regenerate tanpa mengubah relasi data lama).
create table sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  domain text,
  site_key uuid not null unique default gen_random_uuid(),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_sites_user_id on sites(user_id);
create unique index idx_sites_site_key on sites(site_key);

alter table sites enable row level security;

create policy "Users can view their own sites"
on sites for select
using (auth.uid() = user_id);

create policy "Users can insert their own sites"
on sites for insert
with check (auth.uid() = user_id);

create policy "Users can update their own sites"
on sites for update
using (auth.uid() = user_id);

create policy "Users can delete their own sites"
on sites for delete
using (auth.uid() = user_id);

-- 2. TABEL TRAFFIC_EVENTS
-- Pengganti `traffic_logs` di D1. Setiap baris terhubung ke satu site.
-- ip_hash dipakai untuk deteksi unique visitor tanpa menyimpan IP mentah
-- (lebih aman untuk privasi pengunjung blog user).
create table traffic_events (
  id bigint generated always as identity primary key,
  site_id uuid not null references sites(id) on delete cascade,
  path text not null default '/',
  referrer_source text default 'Direct',
  country text default 'Unknown',
  city text default 'Unknown',
  device text default 'Unknown',
  browser text default 'Unknown',
  lang text default 'EN',
  ip_hash text,
  created_at timestamptz not null default now()
);

create index idx_traffic_site_created on traffic_events(site_id, created_at desc);
create index idx_traffic_site_path on traffic_events(site_id, path);
create index idx_traffic_dedupe on traffic_events(site_id, ip_hash, path, created_at);

alter table traffic_events enable row level security;

-- Hanya pemilik site yang boleh MEMBACA data traffic-nya sendiri.
create policy "Users can view traffic of their own sites"
on traffic_events for select
using (
  site_id in (select id from sites where user_id = auth.uid())
);

-- Sengaja TIDAK ADA policy insert/update/delete untuk role 'anon' atau
-- 'authenticated'. Semua penulisan data traffic (dari script tracking di
-- blog/landing page user) dilakukan lewat API route server-side (pakai
-- service_role key), supaya bisa divalidasi site_key-nya dulu sebelum
-- data masuk. Ini lebih aman dibanding endpoint Worker lama yang terbuka
-- tanpa autentikasi sama sekali.
