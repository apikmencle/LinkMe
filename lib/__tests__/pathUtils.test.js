import { describe, it, expect } from 'vitest';
import { formatPageLabel } from '../pathUtils';

describe('formatPageLabel', () => {
  it('mengembalikan "Beranda" untuk path kosong atau "/"', () => {
    expect(formatPageLabel('/')).toBe('Beranda');
    expect(formatPageLabel('')).toBe('Beranda');
    expect(formatPageLabel(null)).toBe('Beranda');
  });

  it('mengambil segmen terakhir dan membuang ekstensi file umum', () => {
    expect(formatPageLabel('/2026/02/BioMe-001.html')).toBe('BioMe-001');
    expect(formatPageLabel('/blog/artikel.php')).toBe('artikel');
    expect(formatPageLabel('/halaman.aspx')).toBe('halaman');
  });

  it('membiarkan path tanpa ekstensi apa adanya', () => {
    expect(formatPageLabel('/my-bio')).toBe('my-bio');
  });

  it('mengabaikan trailing slash', () => {
    expect(formatPageLabel('/blog/artikel/')).toBe('artikel');
  });
});
