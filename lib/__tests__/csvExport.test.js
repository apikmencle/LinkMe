import { describe, it, expect } from 'vitest';
import { toCsv } from '../csvExport';

describe('toCsv', () => {
  it('menggabungkan baris sederhana dengan koma dan CRLF', () => {
    const csv = toCsv([
      ['Kode', 'URL', 'Klik'],
      ['abc123', 'https://contoh.com', 5],
    ]);
    expect(csv).toBe('Kode,URL,Klik\r\nabc123,https://contoh.com,5');
  });

  it('membungkus sel yang mengandung koma dengan tanda kutip', () => {
    const csv = toCsv([['Jakarta, Indonesia']]);
    expect(csv).toBe('"Jakarta, Indonesia"');
  });

  it('menggandakan tanda kutip di dalam sel yang mengandung tanda kutip', () => {
    const csv = toCsv([['Bilang "halo" dong']]);
    expect(csv).toBe('"Bilang ""halo"" dong"');
  });

  it('membungkus sel yang mengandung baris baru', () => {
    const csv = toCsv([['baris satu\nbaris dua']]);
    expect(csv).toBe('"baris satu\nbaris dua"');
  });

  it('mengubah null/undefined jadi sel kosong (bukan literal "null")', () => {
    const csv = toCsv([[null, undefined, 'ada isi']]);
    expect(csv).toBe(',,ada isi');
  });

  it('tidak membungkus angka atau teks polos tanpa karakter spesial', () => {
    const csv = toCsv([['biasa saja', 42]]);
    expect(csv).toBe('biasa saja,42');
  });
});
