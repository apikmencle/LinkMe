import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/Seo';

const FEATURES = [
  {
    title: 'Analisis Traffic',
    desc: 'Pantau kunjungan blog atau landing page kamu secara real-time, lengkap dengan tren harian dan ringkasan visitor.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /><path d="M3 12h18" />
      </svg>
    ),
  },
  {
    title: 'Real-Time',
    desc: 'Lihat siapa yang sedang membuka halamanmu detik ini juga — diperbarui otomatis tiap 30 detik.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    title: 'Insight Halaman',
    desc: 'Cari tahu halaman mana yang paling ramai, dan dari negara mana pengunjungmu berasal.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20V10" /><path d="M12 20V4" /><path d="M20 20v-7" />
      </svg>
    ),
  },
  {
    title: 'Kelola Tautan',
    desc: 'Sebagai pelengkap: pendekkan URL panjang jadi tautan ringkas, dengan opsi kode kustom.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12h6" /><path d="M10 6H6a5 5 0 0 0 0 10h4" /><path d="M14 6h4a5 5 0 0 1 0 10h-4" />
      </svg>
    ),
  },
];

export default function Home() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      router.replace('/dashboard');
    }
  }, [loading, session, router]);

  return (
    <div className="landing">
      <Seo />
      <nav className="landing-nav">
        <div className="brand-mark">
          <span className="brand-bracket">⟨</span>
          <span className="brand-dot" />
          <span className="brand-bracket">⟩</span>
          <span className="sidebar-brand-name">LinkMe</span>
        </div>
        <div className="landing-nav-actions">
          <Link href="/login" className="btn-ghost">Masuk</Link>
          <Link href="/register" className="btn-primary">Daftar Gratis</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="compress-demo">
          <span className="live-badge"><span className="live-dot" />Live</span>
          <span className="compress-arrow">•</span>
          <span className="compress-short">128 pengunjung aktif sekarang</span>
        </div>
        <h1>Tahu persis siapa yang mengunjungi blogmu.</h1>
        <p>LinkMe menganalisis traffic blog atau landing page kamu secara real-time — tren harian, halaman terpopuler, asal pengunjung, semua dalam satu dasbor. Butuh pendekkan tautan juga? Itu tinggal fitur pelengkap.</p>
        <div className="landing-cta">
          <Link href="/register" className="btn-primary btn-lg">Mulai Gratis</Link>
          <Link href="/login" className="btn-ghost btn-lg">Sudah punya akun</Link>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="brand-mark">
          <span className="brand-bracket">⟨</span>
          <span className="brand-dot" />
          <span className="brand-bracket">⟩</span>
          <span className="sidebar-brand-name">LinkMe</span>
        </div>
        <div className="landing-footer-links">
          <Link href="/login">Masuk</Link>
          <Link href="/register">Daftar</Link>
        </div>
        <div className="landing-footer-copy">&copy; {new Date().getFullYear()} LinkMe. Semua hak dilindungi.</div>
      </footer>
    </div>
  );
      }
    
