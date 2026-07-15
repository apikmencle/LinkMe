import { supabaseAdmin } from './supabaseAdmin';

export async function requireAdmin(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return { error: 'Sesi tidak valid, silakan login ulang.', status: 401 };
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return { error: 'Sesi tidak valid, silakan login ulang.', status: 401 };
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileErr || !profile?.is_admin) {
    return { error: 'Kamu tidak punya akses admin.', status: 403 };
  }

  return { user: userData.user };
}
