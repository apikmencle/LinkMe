/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Berlaku untuk semua route (halaman & API)
        source: '/:path*',
        headers: [
          // Cegah situs lain menyematkan LinkMe di dalam <iframe> (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Cegah browser "menebak" tipe file yang salah dari yang di-declare server
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Batasi info referrer yang dikirim ke situs lain saat user klik keluar
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Nonaktifkan akses ke API sensor browser yang tidak dipakai LinkMe
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
