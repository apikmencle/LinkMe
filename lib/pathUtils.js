// Mengubah path lengkap jadi label yang bersih untuk ditampilkan.
// Contoh: "/2026/02/BioMe-001.html" -> "BioMe-001"
//         "/my-bio" -> "my-bio"
//         "/" -> "Beranda"
export function formatPageLabel(path) {
  if (!path || path === '/') return 'Beranda';
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return 'Beranda';
  const last = segments[segments.length - 1].replace(/\.(html?|php|aspx?)$/i, '');
  return last || path;
}
