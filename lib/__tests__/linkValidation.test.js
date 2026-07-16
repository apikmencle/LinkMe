import { describe, it, expect } from 'vitest';
import { genCode, isValidUrl, isValidAlias } from '../linkValidation';

describe('isValidUrl', () => {
  it('menerima URL http dan https', () => {
    expect(isValidUrl('http://contoh.com')).toBe(true);
    expect(isValidUrl('https://contoh.com/artikel?x=1')).toBe(true);
  });

  it('menolak protokol selain http/https (mis. javascript:)', () => {
    // Penting: ini mencegah XSS lewat link "pendek" yang sebenarnya
    // menjalankan javascript: saat diklik.
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('ftp://contoh.com')).toBe(false);
    expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('menolak string yang bukan URL sama sekali', () => {
    expect(isValidUrl('bukan url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('contoh.com')).toBe(false); // tanpa skema, URL() akan reject
  });
});

describe('isValidAlias', () => {
  it('menerima huruf, angka, - dan _ dengan panjang 2-24 karakter', () => {
    expect(isValidAlias('promo-lebaran')).toBe(true);
    expect(isValidAlias('a1')).toBe(true);
    expect(isValidAlias('A_b-9')).toBe(true);
    expect(isValidAlias('x'.repeat(24))).toBe(true);
  });

  it('menolak yang lebih pendek dari 2 atau lebih panjang dari 24 karakter', () => {
    expect(isValidAlias('a')).toBe(false);
    expect(isValidAlias('x'.repeat(25))).toBe(false);
  });

  it('menolak karakter di luar huruf/angka/-/_', () => {
    expect(isValidAlias('promo lebaran')).toBe(false); // spasi
    expect(isValidAlias('promo/lebaran')).toBe(false); // slash
    expect(isValidAlias('promo.lebaran')).toBe(false); // titik
    expect(isValidAlias('promo<script>')).toBe(false);
  });
});

describe('genCode', () => {
  it('menghasilkan kode dengan panjang default 6 karakter', () => {
    expect(genCode()).toHaveLength(6);
  });

  it('menghasilkan kode dengan panjang sesuai parameter', () => {
    expect(genCode(10)).toHaveLength(10);
  });

  it('tidak pernah memakai karakter ambigu (0/O, 1/I/l)', () => {
    // Charset sengaja membuang karakter yang gampang ketuker saat dibaca
    // manusia (mis. pengguna mengetik ulang kode dari cetakan/tangkapan
    // layar) - test ini menjaga supaya charset tidak sengaja diubah
    // kembali memasukkan karakter itu.
    const sample = Array.from({ length: 200 }, () => genCode(12)).join('');
    expect(sample).not.toMatch(/[0O1Il]/);
  });

  it('cuma memakai karakter alfanumerik', () => {
    expect(genCode(50)).toMatch(/^[a-zA-Z0-9]+$/);
  });
});
