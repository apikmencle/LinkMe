import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import PasswordInput from '../components/PasswordInput';
import Seo from '../components/Seo';
import Turnstile from '../components/Turnstile';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [err, setErr] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');

    if (!captchaToken) {
      setErr('Selesaikan verifikasi keamanan di bawah dulu.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });
    setLoading(false);

    if (error) {
      setErr('Email atau kata sandi salah.');
      turnstileRef.current?.reset();
      setCaptchaToken('');
      return;
    }

    router.push('/dashboard');
  }

  async function handleGoogleLogin() {
    setErr('');
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setErr('Gagal login dengan Google. Coba lagi.');
      setGoogleLoading(false);
    }
    // Kalau sukses, browser akan diarahkan ke Google, jadi tidak perlu setGoogleLoading(false) di sini.
  }

  return (
    <div className="auth-page">
      <Seo title="Masuk" description="Masuk ke akun LinkMe kamu untuk mengelola tautan dan melihat analitik." />
      <div className="auth-card">
        <div className="brand-mark">
          <span className="brand-bracket">âŸ¨</span>
          <span className="brand-dot" />
          <span className="brand-bracket">âŸ©</span>
        </div>
        <h1>Masuk</h1>
        <p className="auth-sub">Senang lihatmu lagi.</p>

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 16.1 3 9.2 7.4 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 36.4 26.9 37 24 37c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.1 40.5 16 45 24 45z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.4C41.5 35.7 45 30.4 45 24c0-1.4-.1-2.7-.4-3.5z" />
          </svg>
          {googleLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
        </button>

        <div className="auth-divider"><span>atau</span></div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@email.com" />
          </div>
          <div className="field">
            <label>Kata Sandi</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              required
            />
          </div>
          <div className="field">
            <Turnstile
              ref={turnstileRef}
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken('')}
            />
          </div>
          {err && <div className="auth-err">{err}</div>}
          <button className="btn-primary btn-block" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="auth-switch">
          Belum punya akun? <Link href="/register">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
                }
