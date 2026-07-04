import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');

    if (password.length < 6) {
      setErr('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setErr(error.message === 'User already registered'
        ? 'Email ini sudah terdaftar. Coba masuk saja.'
        : 'Gagal mendaftar: ' + error.message);
      return;
    }

    if (data.session) {
      router.push('/dashboard');
    } else {
      setDone(true);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-mark">
          <span className="brand-bracket">⟨</span>
          <span className="brand-dot" />
          <span className="brand-bracket">⟩</span>
        </div>
        <h1>Buat akun</h1>
        <p className="auth-sub">Mulai pendekkan tautanmu dalam hitungan detik.</p>

        {done ? (
          <div className="auth-success">
            <p>Akun berhasil dibuat.</p>
            <p>Cek email kamu untuk konfirmasi, lalu masuk di halaman login.</p>
            <Link href="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
              Ke halaman masuk
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@email.com" />
            </div>
            <div className="field">
              <label>Kata Sandi</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" />
            </div>
            {err && <div className="auth-err">{err}</div>}
            <button className="btn-primary btn-block" disabled={loading}>
              {loading ? 'Memproses...' : 'Daftar'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Sudah punya akun? <Link href="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
