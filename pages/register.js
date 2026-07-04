import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import PasswordInput from '../components/PasswordInput';

function isValidUsername(str) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(str);
}

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');

    if (!isValidUsername(username)) {
      setErr('Username 3-20 karakter, hanya huruf, angka, dan garis bawah (_).');
      return;
    }
    if (password.length < 6) {
      setErr('Kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
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
              <label>Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="namamu"
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@email.com" />
            </div>
            <div className="field">
              <label>Kata Sandi</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
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

