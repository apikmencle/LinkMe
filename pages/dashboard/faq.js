import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

const FAQ_ITEMS = [
  {
    q: 'Apa itu LinkMe?',
    a: 'LinkMe adalah alat untuk memendekkan tautan panjang jadi lebih ringkas dan mudah dibagikan, sekaligus mencatat berapa kali tautan itu diklik.',
  },
  {
    q: 'Bagaimana cara membuat tautan pendek?',
    a: 'Buka menu "Kelola Tautan", tempel tautan panjang kamu di kolom yang tersedia, lalu klik "Pendekkan". Kamu juga bisa membuat kode kustom sendiri, misalnya "linkme.app/promo-lebaran".',
  },
  {
    q: 'Apakah saya bisa memilih kode tautan sendiri?',
    a: 'Bisa. Saat membuat tautan, isi kolom "Kode kustom" dengan kata yang kamu inginkan (3-24 karakter, hanya huruf, angka, - dan _). Kalau dikosongkan, sistem akan membuatkan kode acak untukmu.',
  },
  {
    q: 'Apakah tautan yang saya buat bisa dilihat orang lain?',
    a: 'Tidak. Setiap akun hanya bisa melihat dan mengelola tautannya sendiri di menu "Kelola Tautan". Tautan pendeknya sendiri tetap bisa diakses publik begitu dibagikan, tapi daftar & statistiknya bersifat pribadi.',
  },
  {
    q: 'Apa bedanya menu "Analitik Tautan" dengan "Ringkasan Traffic"?',
    a: '"Analitik Tautan" menampilkan performa tautan-tautan pendek yang kamu buat di LinkMe. Sementara "Ringkasan Traffic" menampilkan data kunjungan dari situs/blog yang kamu daftarkan lewat menu "Situs Saya" — dua sumber data yang berbeda, ditampilkan dalam satu dasbor.',
  },
  {
    q: 'Kenapa saya mendapat notifikasi milestone klik?',
    a: 'LinkMe otomatis mengirim notifikasi setiap sebuah tautan mencapai jumlah klik tertentu (10, 50, 100, 500, 1000), supaya kamu tahu tautan mana yang sedang ramai.',
  },
  {
    q: 'Bagaimana cara mengganti kata sandi atau username?',
    a: 'Buka menu "Pengaturan". Di sana kamu bisa memperbarui username dan mengganti kata sandi akunmu kapan saja.',
  },
  {
    q: 'Apakah data "Real-Time" di Ringkasan Traffic benar-benar langsung?',
    a: 'Data pada halaman Real-Time diperbarui otomatis setiap 30 detik, dan menampilkan aktivitas dalam 30 menit terakhir — sehingga cukup dekat dengan waktu nyata untuk memantau kunjungan yang sedang berlangsung.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  function toggle(i) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>FAQ</h1>
        <p>Pertanyaan yang sering ditanyakan seputar LinkMe.</p>
      </div>

      <div className="card">
        <div className="faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <div className="faq-item" key={i}>
              <button className="faq-question" onClick={() => toggle(i)}>
                <span>{item.q}</span>
                <span className={`faq-chevron ${openIndex === i ? 'open' : ''}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>
              {openIndex === i && <div className="faq-answer">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

