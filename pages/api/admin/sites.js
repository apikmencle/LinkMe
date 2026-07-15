import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';

const PAGE_SIZE = 50;

export default async function handler(req, res) {
  const auth = await requireAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  if (req.method === 'GET') {
    const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: sites, error, count } = await supabaseAdmin
      .from('sites')
      .select('id, name, domain, user_id, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return res.status(500).json({ error: 'Gagal memuat daftar situs.' });
    }

    const ownerIds = [...new Set((sites || []).map((s) => s.user_id))];
    const { data: owners } = ownerIds.length
      ? await supabaseAdmin.from('profiles').select('id, email').in('id', ownerIds)
      : { data: [] };
    const ownerMap = Object.fromEntries((owners || []).map((o) => [o.id, o.email]));

    return res.status(200).json({
      sites: (sites || []).map((s) => ({ ...s, owner_email: ownerMap[s.user_id] || '(tidak diketahui)' })),
      total: count || 0,
      page,
      has_more: (sites || []).length === PAGE_SIZE,
    });
  }

  if (req.method === 'PATCH') {
    const { site_id, is_active } = req.body || {};
    if (!site_id || typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'site_id dan is_active (boolean) wajib diisi.' });
    }

    const { error } = await supabaseAdmin.from('sites').update({ is_active }).eq('id', site_id);
    if (error) {
      return res.status(500).json({ error: 'Gagal memperbarui status situs.' });
    }

    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ error: 'Method tidak diizinkan.' });
}
