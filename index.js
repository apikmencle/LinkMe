import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

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
        <p>LinkMe memendekkan URL kamu, mencatat setiap klik, dan menyimpannya rapi di satu dasbor.</p>
        <div className="landing-cta">
          <Link href="/register" className="btn-primary btn-lg">Mulai Gratis</Link>
          <Link href="/login" className="btn-ghost btn-lg">Sudah punya akun</Link>
        </div>
      </section>
    </div>
  );
}
