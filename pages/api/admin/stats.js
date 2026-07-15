import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method tidak diizinkan.' });
  }

  const auth = await requireAdmin(req);
  if (auth.error) return res.status(auth.status).json({ error: auth.error });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { count: totalUsers },
    { count: totalSites },
    { count: activeSites },
    { count: totalLinks },
    { count: totalTrafficEvents },
    { count: trafficToday },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('sites').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('sites').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('links').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('traffic_events').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('traffic_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),
  ]);

  return res.status(200).json({
    total_users: totalUsers || 0,
    total_sites: totalSites || 0,
    active_sites: activeSites || 0,
    total_links: totalLinks || 0,
    total_traffic_events: totalTrafficEvents || 0,
    traffic_today: trafficToday || 0,
  });
}
