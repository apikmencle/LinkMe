import { describe, it, expect } from 'vitest';
import { countryFlagEmoji, countryName } from '../countryUtils';

describe('countryFlagEmoji', () => {
  it('mengubah kode 2 huruf jadi emoji bendera', () => {
    expect(countryFlagEmoji('ID')).toBe('\u{1F1EE}\u{1F1E9}');
    expect(countryFlagEmoji('id')).toBe('\u{1F1EE}\u{1F1E9}'); // huruf kecil tetap diproses
    expect(countryFlagEmoji('US')).toBe('\u{1F1FA}\u{1F1F8}');
  });

  it('mengembalikan emoji globe untuk input tidak valid', () => {
    expect(countryFlagEmoji(null)).toBe('\u{1F310}');
    expect(countryFlagEmoji(undefined)).toBe('\u{1F310}');
    expect(countryFlagEmoji('')).toBe('\u{1F310}');
    expect(countryFlagEmoji('Unknown')).toBe('\u{1F310}');
    expect(countryFlagEmoji('XYZ')).toBe('\u{1F310}'); // 3 huruf, bukan kode ISO 2 huruf
    expect(countryFlagEmoji('1D')).toBe('\u{1F310}'); // ada angka
  });
});

describe('countryName', () => {
  it('mengubah kode negara jadi nama berbahasa Indonesia', () => {
    expect(countryName('ID')).toBe('Indonesia');
  });

  it('mengembalikan "Tidak diketahui" untuk kode kosong/Unknown', () => {
    expect(countryName(null)).toBe('Tidak diketahui');
    expect(countryName('')).toBe('Tidak diketahui');
    expect(countryName('Unknown')).toBe('Tidak diketahui');
  });
});
