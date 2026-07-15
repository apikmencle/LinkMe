-- ============================================================
-- Migrasi 7: Admin Platform
-- Jalankan SETELAH 001-006, di Supabase Dashboard > SQL Editor.
-- ============================================================

alter table profiles
  add column if not exists is_admin boolean not null default false;

create or replace function am_i_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

grant execute on function am_i_admin() to authenticated;

-- WAJIB DIJALANKAN MANUAL SEKALI (ganti email-nya):
-- update profiles set is_admin = true where email = 'emailmu@contoh.com';
