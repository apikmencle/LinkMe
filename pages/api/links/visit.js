import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Dipanggil oleh tombol "Buka" di dashboard/links.js. Sengaja lewat server
// (bukan supabase.rpc() langsung dari browser) supaya increment_link_clicks
// - yang security definer dan melewati RLS - hanya bisa dipicu setelah kita
// verifikasi bahwa link tersebut memang milik user yang sedang login.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method tidak diizinkan.' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Sesi tidak valid, silakan login ulang.' });
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: 'Sesi tidak valid, silakan login ulang.' });
  }

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'code wajib diisi.' });
  }

  const { data: link, error: linkErr } = await supabaseAdmin
    .from('links')
    .select('id, user_id')
    .eq('code', code)
    .maybeSingle();

  if (linkErr || !link) {
    return res.status(404).json({ error: 'Tautan tidak ditemukan.' });
  }
  if (link.user_id !== userData.user.id) {
    return res.status(403).json({ error: 'Kamu bukan pemilik tautan ini.' });
  }

  const { data, error } = await supabaseAdmin.rpc('increment_link_clicks', {
    p_code: code,
  });

  if (error) {
    return res.status(500).json({ error: 'Gagal mencatat klik.' });
  }

  const row = Array.isArray(data) ? data[0] : data;
  return res.status(200).json({ ok: true, clicks: row?.new_clicks ?? null });
}
