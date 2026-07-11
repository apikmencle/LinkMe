-- ============================================================
-- Migrasi 4: Multi-user per situs (anggota tim)
-- Jalankan SETELAH 001, 002, 003, di Supabase Dashboard > SQL Editor.
-- ============================================================

-- 1. PROFILES
-- Salinan ringan dari auth.users(id, email), disinkron otomatis lewat
-- trigger. Dibutuhkan supaya server bisa mencari akun berdasarkan email
-- saat proses undang anggota, tanpa harus memanggil Admin API berulang
-- kali. Tidak ada policy SELECT untuk role 'authenticated' - tabel ini
-- cuma dibaca lewat service_role di server, supaya email antar user tidak
-- bisa di-scan lewat client.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute procedure handle_new_user();

-- Backfill akun yang sudah terdaftar sebelum migrasi ini dijalankan.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do update set email = excluded.email;


-- 2. SITE_MEMBERS
-- Relasi many-to-many: satu situs bisa punya banyak anggota, satu user
-- bisa jadi anggota di banyak situs. user_id sengaja mengacu ke
-- profiles(id) (bukan langsung auth.users(id)) supaya PostgREST bisa
-- otomatis JOIN site_members -> profiles saat mengambil daftar anggota
-- + emailnya di API.
create table if not exists site_members (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (site_id, user_id)
);

create index if not exists idx_site_members_site on site_members(site_id);
create index if not exists idx_site_members_user on site_members(user_id);

alter table site_members enable row level security;

create policy "Members can view co-members of their sites"
on site_members for select
using (
  user_id = auth.uid()
  or site_id in (select site_id from site_members where user_id = auth.uid())
);

-- Pemilik situs boleh mendaftarkan dirinya sendiri sebagai 'owner' saat
-- situs baru dibuat (dipanggil langsung dari client tepat setelah insert
-- ke tabel `sites`). Penambahan anggota LAIN (role 'member') sengaja
-- tidak diizinkan lewat client - itu wajib lewat API undangan di server
-- (pakai service_role), supaya validasi kepemilikan & email selalu jalan.
create policy "Site creator can register themselves as owner"
on site_members for insert
with check (
  role = 'owner'
  and user_id = auth.uid()
  and site_id in (select id from sites where user_id = auth.uid())
);

create policy "Owners can remove members, members can leave"
on site_members for delete
using (
  user_id = auth.uid()
  or site_id in (
    select site_id from site_members
    where user_id = auth.uid() and role = 'owner'
  )
);

-- Backfill: jadikan pemilik tiap situs yang sudah ada sebagai 'owner'.
insert into site_members (site_id, user_id, role)
select id, user_id, 'owner' from sites
on conflict (site_id, user_id) do nothing;


-- 3. Perbarui RLS di `sites` & `traffic_events` supaya ANGGOTA (bukan
--    cuma pemilik) juga bisa melihat data. Insert/update/delete situs
--    tetap khusus pemilik (policy lama, tidak diubah).
drop policy if exists "Users can view their own sites" on sites;
create policy "Members can view sites they belong to"
on sites for select
using (
  id in (select site_id from site_members where user_id = auth.uid())
);

drop policy if exists "Users can view traffic of their own sites" on traffic_events;
create policy "Members can view traffic of sites they belong to"
on traffic_events for select
using (
  site_id in (select site_id from site_members where user_id = auth.uid())
);
