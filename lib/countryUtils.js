// Mengubah kode negara ISO (misal "MX", "ID") jadi emoji bendera.
export function countryFlagEmoji(code) {
  if (!code || typeof code !== 'string') return '\u{1F310}';
  const cc = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '\u{1F310}';
  const codePoints = [...cc].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Mengubah kode negara jadi nama lengkap berbahasa Indonesia (pakai API bawaan browser).
export function countryName(code) {
  if (!code || code === 'Unknown') return 'Tidak diketahui';
  try {
    const dn = new Intl.DisplayNames(['id'], { type: 'region' });
    return dn.of(code.trim().toUpperCase()) || code;
  } catch {
    return code;
  }
}
