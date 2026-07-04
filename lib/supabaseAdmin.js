import { createClient } from '@supabase/supabase-js';

// HANYA dipakai di server (getServerSideProps), tidak pernah di browser.
// service_role key bisa baca/tulis semua data, melewati Row Level Security —
// dibutuhkan supaya redirect link bisa jalan untuk siapa saja tanpa perlu login.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);
