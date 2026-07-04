// Ikon generik (bukan logo resmi tiap browser, biar aman dari isu merek dagang),
// tapi tetap jelas bedanya secara visual lewat bentuk & warna.

export function DeviceIcon({ device }) {
  const d = (device || '').toLowerCase();
  if (d.includes('tablet')) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    );
  }
  if (d.includes('desktop') || d.includes('pc') || d.includes('windows') || d.includes('mac')) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="13" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}

const BROWSER_COLORS = {
  chrome: '#EA4335',
  firefox: '#FF7139',
  safari: '#0FB5EE',
  edge: '#0078D7',
  opera: '#FF1B2D',
  samsung: '#1428A0',
};

export function BrowserIcon({ browser }) {
  const key = Object.keys(BROWSER_COLORS).find((k) => (browser || '').toLowerCase().includes(k));
  const color = BROWSER_COLORS[key] || 'var(--text-muted)';
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18z" />
    </svg>
  );
}

export function LanguageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h9" />
      <path d="M7 3v2" />
      <path d="M6 12s2.5-2 4-6c1.5 4 4 6 4 6" />
      <path d="M13 21l4-9 4 9" />
      <path d="M14.5 18h5" />
    </svg>
  );
}
