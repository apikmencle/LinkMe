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

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Body bisa datang dalam 2 bentuk:
    // 1. Objek yang sudah di-parse Next.js (kalau Content-Type: application/json,
    //    misal saat fallback pakai fetch())
    // 2. String mentah (kalau Content-Type: text/plain, dipakai sendBeacon
    //    supaya menghindari CORS preflight - lihat catatan di public/t.js)
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = {};
      }
    }

    const { site_key, path, referrer } = payload || {};

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

    // Catatan: sengaja TIDAK ADA pengecekan "sudah pernah tercatat hari ini"
    // di sini. Sebelumnya ada dedup per ip_hash+path+hari (dibawa dari logika
    // worker lama), tapi ini berbahaya di Indonesia karena banyak provider
    // seluler memakai CGNAT - ratusan pengunjung berbeda bisa berbagi satu
    // IP publik. Kalau dedup dilakukan saat insert, pengunjung asli kedua dst
    // yang kebetulan berbagi IP dengan pengunjung sebelumnya akan HILANG
    // (event-nya tidak pernah tersimpan). Sekarang setiap kunjungan selalu
    // disimpan sebagai baris baru; "unique visitor" dihitung belakangan lewat
    // COUNT(DISTINCT ip_hash) di get_traffic_stats(), bukan dengan membuang
    // data mentahnya.
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

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
