// Menggambar kartu Real-Time (Tampilan/Pengguna Aktif per halaman) jadi
// gambar PNG yang bisa dibagikan - mirip fitur "Share" di Google
// Analytics. Sengaja pakai Canvas API bawaan browser, BUKAN library
// screenshot DOM pihak ketiga (mis. html2canvas): tidak nambah ukuran
// bundle, dan hasilnya konsisten di semua device (html2canvas kadang
// salah render flexbox/gradient CSS, terutama di HP lawas).
//
// Cuma jalan di browser (butuh document.createElement('canvas')).
export async function buildRealtimeCardImage({ title, caption, number, rows, siteName }) {
  const WIDTH = 800;
  const ROW_H = 56;
  const MAX_ROWS = 8;
  const visibleRows = (rows || []).slice(0, MAX_ROWS);
  const extra = (rows || []).length - visibleRows.length;

  const HEADER_H = 300;
  const FOOTER_H = 70;
  const listH = visibleRows.length === 0
    ? ROW_H
    : visibleRows.length * ROW_H + (extra > 0 ? ROW_H : 0);
  const HEIGHT = HEADER_H + listH + FOOTER_H;

  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * dpr;
  canvas.height = HEIGHT * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const PAD = 48;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Brand mark
  ctx.fillStyle = '#0f766e';
  ctx.font = '700 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('\u27E8\u2022\u27E9 LinkMe', PAD, 56);

  // Badge "REAL-TIME"
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(PAD + 6, 88, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText('REAL-TIME', PAD + 20, 93);

  // Judul & caption
  ctx.fillStyle = '#111827';
  ctx.font = '700 28px system-ui, sans-serif';
  ctx.fillText(title, PAD, 140);

  ctx.fillStyle = '#6b7280';
  ctx.font = '400 16px system-ui, sans-serif';
  ctx.fillText(caption, PAD, 172);

  // Angka besar
  ctx.fillStyle = '#111827';
  ctx.font = '800 62px system-ui, sans-serif';
  ctx.fillText(String(number), PAD, 250);

  // Garis pembatas
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, HEADER_H - 20);
  ctx.lineTo(WIDTH - PAD, HEADER_H - 20);
  ctx.stroke();

  // Daftar per halaman
  let y = HEADER_H + 10;
  if (visibleRows.length === 0) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '400 16px system-ui, sans-serif';
    ctx.fillText('Belum ada data 30 menit terakhir.', PAD, y + 24);
    y += ROW_H;
  } else {
    visibleRows.forEach((r) => {
      ctx.fillStyle = '#374151';
      ctx.font = '500 18px system-ui, sans-serif';
      ctx.fillText(truncate(r.label, 42), PAD, y + 28);

      ctx.fillStyle = '#111827';
      ctx.font = '700 18px system-ui, sans-serif';
      const valStr = String(r.value);
      const valW = ctx.measureText(valStr).width;
      ctx.fillText(valStr, WIDTH - PAD - valW, y + 28);

      ctx.strokeStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.moveTo(PAD, y + ROW_H - 8);
      ctx.lineTo(WIDTH - PAD, y + ROW_H - 8);
      ctx.stroke();

      y += ROW_H;
    });
    if (extra > 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 15px system-ui, sans-serif';
      ctx.fillText(`+${extra} halaman lainnya`, PAD, y + 24);
      y += ROW_H;
    }
  }

  // Footer: nama situs + waktu generate
  ctx.fillStyle = '#9ca3af';
  ctx.font = '400 14px system-ui, sans-serif';
  const stamp = `${siteName || ''} \u00b7 ${new Date().toLocaleString('id-ID')}`;
  ctx.fillText(stamp, PAD, HEIGHT - 28);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function truncate(str, max) {
  if (!str || str.length <= max) return str || '';
  return str.slice(0, max - 1) + '\u2026';
        }
