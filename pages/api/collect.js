import crypto from 'crypto';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

// Endpoint publik yang dipanggil oleh snippet (public/t.js) yang dipasang
// di blog/landing page milik user. Karena dipanggil dari domain manapun,
// endpoint ini TIDAK memakai sesi login - sebagai gantinya setiap request
// wajib menyertakan `site_key` yang valid & aktif di tabel `sites`.
// Insert ke `traffic_events` memakai service_role key (melewati RLS),
// tapi hanya dilakukan setelah site_key diverifikasi.

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Parser User-Agent sederhana (tanpa dependency tambahan) - cukup untuk
// kategori device & browser yang ditampilkan di dashboard.
function parseDevice(ua = '') {
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function parseBrowser(ua = '') {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return 'Opera';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Lainnya';
}

function cleanReferrer(raw) {
  if (!raw) return 'Direct';
  try {
    const u = new URL(raw.startsWith('http') ? raw : `http://${raw}`);
    return u.hostname;
  } catch {
    return raw;
  }
}

function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT || 'linkme-default-salt';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

// Rentang "hari ini" menurut WIB (Asia/Jakarta), dikonversi ke UTC untuk
// query ke Postgres (yang menyimpan created_at dalam UTC).
function todayRangeUtcFromJakarta() {
  const now = new Date();
  const jakartaNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const y = jakartaNow.getUTCFullYear();
  const m = jakartaNow.getUTCMonth();
  const d = jakartaNow.getUTCDate();
  const startUtc = new Date(Date.UTC(y, m, d, -7, 0, 0));
  const endUtc = new Date(Date.UTC(y, m, d + 1, -7, 0, 0));
  return { startUtc: startUtc.toISOString(), endUtc: endUtc.toISOString() };
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { site_key, path, referrer } = req.body || {};

    if (!site_key) {
      return res.status(400).json({ error: 'site_key wajib diisi' });
    }

    const { data: site, error: siteErr } = await supabaseAdmin
      .from('sites')
      .select('id, is_active')
      .eq('site_key', site_key)
      .single();

    if (siteErr || !site) {
      return res.status(404).json({ error: 'Situs tidak ditemukan' });
    }
    if (!site.is_active) {
      return res.status(403).json({ error: 'Tracking untuk situs ini sedang dinonaktifkan' });
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || 'unknown')
      .split(',')[0]
      .trim();

    const country = req.headers['x-vercel-ip-country'] || 'Unknown';
    const city = req.headers['x-vercel-ip-city']
      ? decodeURIComponent(req.headers['x-vercel-ip-city'])
      : 'Unknown';

    const ua = req.headers['user-agent'] || '';
    const device = parseDevice(ua);
    const browser = parseBrowser(ua);
    const source = cleanReferrer(referrer || req.headers['referer']);
    const langHeader = req.headers['accept-language'] || 'EN';
    const lang = langHeader.split(',')[0].split('-')[0].toUpperCase();

    const trackPath = path || '/';
    const ipHash = hashIp(ip);

    const { startUtc, endUtc } = todayRangeUtcFromJakarta();

    const { data: existing } = await supabaseAdmin
      .from('traffic_events')
      .select('id')
      .eq('site_id', site.id)
      .eq('ip_hash', ipHash)
      .eq('path', trackPath)
      .gte('created_at', startUtc)
      .lt('created_at', endUtc)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from('traffic_events').insert({
        site_id: site.id,
        path: trackPath,
        referrer_source: source,
        country,
        city,
        device,
        browser,
        lang,
        ip_hash: ipHash,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  }

