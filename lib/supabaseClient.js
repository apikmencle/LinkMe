import { createClient } from '@supabase/supabase-js';

// Dipakai di browser (login, register, dan kelola link).
// Aman dipakai di client karena hanya anon key + dilindungi Row Level Security.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
