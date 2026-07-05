import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import PasswordInput from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

function isValidUsername(str) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(str);
}

export default function Settings() {
  const { session } = useAuth();
  const currentUsername = session?.user?.user_metadata?.username || '';
  const email = session?.user?.email || '';

  const [username, setUsername] = useState(currentUsername);
  const [usernameMsg, setUsernameMsg] = useState('');
  const [usernameErr, setUsernameErr] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleUsernameSubmit(e) {
    e.preventDefault();
    setUsernameMsg('');
    setUsernameErr('');

    if (!isValidUsername(username)) {
      setUsernameErr('Username 3-20 karakter, hanya huruf, angka, dan garis bawah (_).');
      return;
    }

    setSavingUsername(true);
    const { error } = await supabase.auth.updateUser({ data: { username } });
    setSavingUsername(false);

    if (error) {
      setUsernameErr('Gagal menyimpan: ' + error.message);
      return;
    }
    setUsernameMsg('Username berhasil diperbarui.');
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');

    if (newPassword.length < 6) {
      setPasswordErr('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordErr('Gagal mengubah kata sandi: ' + error.message);
      return;
    }
    setPasswordMsg('Kata sandi berhasil diubah.');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Pengaturan</h1>
        <p>Kelola informasi akun dan keamanan kamu.</p>
      </div>

      <div className="card">
        <div className="card-header"><h2>Profil</h2></div>
        <form onSubmit={handleUsernameSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} disabled />
          </div>
          <div className="field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="namamu"
            />
          </div>
          {usernameErr && <div className="auth-err">{usernameErr}</div>}
          {usernameMsg && <div className="auth-success-msg">{usernameMsg}</div>}
          <button className="btn-primary" disabled={savingUsername}>
            {savingUsername ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header"><h2>Ubah Kata Sandi</h2></div>
        <form onSubmit={handlePasswordSubmit}>
          <div className="field">
            <label>Kata Sandi Baru</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div className="field">
            <label>Konfirmasi Kata Sandi Baru</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
            />
          </div>
          {passwordErr && <div className="auth-err">{passwordErr}</div>}
          {passwordMsg && <div className="auth-success-msg">{passwordMsg}</div>}
          <button className="btn-primary" disabled={savingPassword}>
            {savingPassword ? 'Menyimpan...' : 'Ubah Kata Sandi'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
