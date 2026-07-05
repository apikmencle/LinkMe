// URL Cloudflare Worker yang menangani tracking traffic blog (D1 database).
// Endpoint ini punya CORS terbuka (Access-Control-Allow-Origin: *),
// jadi aman dipanggil langsung dari browser tanpa perlu proxy.
export const TRAFFIC_API_URL = 'https://analytics-worker.apikmencle.workers.dev';

export async function fetchTrafficStats({ startDate, endDate, searchPath } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (searchPath) params.set('searchPath', searchPath);

  const query = params.toString();
  const res = await fetch(`${TRAFFIC_API_URL}/api/stats${query ? `?${query}` : ''}`);

  if (!res.ok) {
    throw new Error('Gagal mengambil data traffic');
  }

  return res.json();
}

export async function fetchRealtimeStats() {
  const res = await fetch(`${TRAFFIC_API_URL}/api/realtime`);

  if (!res.ok) {
    throw new Error('Gagal mengambil data real-time');
  }

  return res.json();
}
