import { supabaseAdmin } from '../../../lib/supabaseAdmin';

async function getRequester(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

async function getMyRole(siteId, userId) {
  const { data } = await supabaseAdmin
    .from('site_members')
    .select('role')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .maybeSingle();
  return data?.role || null;
}

export default async function handler(req, res) {
  const user = await getRequester(req);
  if (!user) {
    return res.status(401).json({ error: 'Sesi tidak valid, silakan login ulang.' });
  }

  if (req.method === 'GET') {
    const { site_id } = req.query;
    if (!site_id) return res.status(400).json({ error: 'site_id wajib diisi.' });

    const myRole = await getMyRole(site_id, user.id);
    if (!myRole) return res.status(403).json({ error: 'Kamu bukan anggota situs ini.' });

    const { data: members, error } = await supabaseAdmin
      .from('site_members')
      .select('id, role, user_id, created_at, profiles ( email )')
      .eq('site_id', site_id)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Gagal memuat daftar anggota.' });
    }

    return res.status(200).json({
      my_role: myRole,
      members: (members || []).map((m) => ({
        id: m.id,
        role: m.role,
        user_id: m.user_id,
        email: m.profiles?.email || '(email tidak diketahui)',
        created_at: m.created_at,
        is_me: m.user_id === user.id,
      })),
    });
  }

  if (req.method === 'POST') {
    const { site_id, email } = req.body || {};
    if (!site_id || !email) {
      return res.status(400).json({ error: 'site_id dan email wajib diisi.' });
    }

    const myRole = await getMyRole(site_id, user.id);
    if (myRole !== 'owner') {
      return res.status(403).json({ error: 'Hanya pemilik situs yang bisa mengundang anggota.' });
    }

    // Cek rate limit dulu - lihat migrasi 009_rate_limiting.sql. Maks 10
    // percobaan undang per menit per user (dihitung dari SEMUA percobaan,
    // termasuk yang gagal karena email tidak ditemukan/sudah anggota -
    // supaya endpoint ini juga tidak bisa disalahgunakan untuk enumerasi
    // email lewat spam request).
    const { data: allowed, error: rateLimitErr } = await supabaseAdmin.rpc('check_and_log_rate_limit', {
      p_key: `invite_member:${user.id}`,
      p_window_seconds: 60,
      p_max: 10,
    });
    if (rateLimitErr || allowed === false) {
      return res.status(429).json({ error: 'Terlalu banyak percobaan undangan. Coba lagi sebentar lagi.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email wajib diisi.' });
    }

    const { data: target } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (!target) {
      return res.status(404).json({
        error: 'Belum ada akun LinkMe dengan email ini. Minta orangnya daftar dulu di LinkMe, baru undang lagi.',
      });
    }

    if (target.id === user.id) {
      return res.status(400).json({ error: 'Kamu sudah jadi pemilik situs ini.' });
    }

    const { error: insertErr } = await supabaseAdmin
      .from('site_members')
      .insert({ site_id, user_id: target.id, role: 'member', invited_by: user.id });

    if (insertErr) {
      if (insertErr.code === '23505') {
        return res.status(409).json({ error: 'Orang ini sudah jadi anggota situs.' });
      }
      return res.status(500).json({ error: 'Gagal menambahkan anggota. Coba lagi.' });
    }

    return res.status(200).json({ ok: true, email: target.email });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method tidak diizinkan.' });
      }
