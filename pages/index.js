import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Seo from '../components/Seo';

const FEATURES = [
  {
    title: 'Kelola Tautan',
    desc: 'Pendekkan URL panjang jadi tautan ringkas, dengan opsi kode kustom sesuai keinginanmu.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12h6" /><path d="M10 6H6a5 5 0 0 0 0 10h4" /><path d="M14 6h4a5 5 0 0 1 0 10h-4" />
      </svg>
    ),
  },
  {
    title: 'Analitik Lengkap',
    desc: 'Pantau performa tiap tautan: jumlah klik, ranking, dan tren dalam satu dasbor.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20V10" /><path d="M12 20V4" /><path d="M20 20v-7" />
      </svg>
    ),
  },
  {
    title: 'Notifikasi Otomatis',
    desc: 'Dapat kabar setiap tautanmu mencapai milestone klik tertentu, tanpa perlu cek manual.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    title: 'Traffic Blog',
    desc: 'Hubungkan data kunjungan blog eksternal kamu dan pantau lewat dasbor yang sama, real-time.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" /><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /><path d="M3 12h18" />
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
          <span className="compress-long">https://contoh.com/artikel/yang-sangat-panjang-sekali-dan-susah-diingat</span>
          <span className="compress-arrow">→</span>
          <span className="compress-short">linkme.app/x7Qw2</span>
        </div>
        <h1>Tautan panjang, dibereskan.</h1>
        <p>LinkMe memendekkan URL kamu, mencatat setiap klik, dan menyimpannya rapi di satu dasbor — lengkap dengan analitik dan integrasi traffic blog.</p>
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
      
