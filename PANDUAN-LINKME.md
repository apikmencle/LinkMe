# Panduan Deploy LinkMe (Dari Nol)

LinkMe adalah project **baru dan terpisah** dari `pendekin-app` kamu yang lama.
Project lama tetap jalan seperti biasa, tidak akan terganggu sama sekali.

Total waktu: ± 30-40 menit (lebih lama dikit dari sebelumnya karena ada sistem akun).

## Bagian 1 — Buat Project Baru di Supabase

1. Buka https://supabase.com/dashboard → **New Project**
2. Nama: `linkme` (atau bebas), pilih region terdekat (Singapore), buat password database
3. Tunggu ± 2 menit sampai selesai dibuat
4. Buka **SQL Editor** → **New query** → jalankan SQL ini lalu klik **Run**:

```sql
create table links (
  id bigint generated always as identity primary key,
  code text unique not null,
  url text not null,
  clicks integer default 0,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id)
);

alter table links enable row level security;

create policy "Users can view their own links"
on links for select
using (auth.uid() = user_id);

create policy "Users can insert their own links"
on links for insert
with check (auth.uid() = user_id);

create policy "Users can update their own links"
on links for update
using (auth.uid() = user_id);

create policy "Users can delete their own links"
on links for delete
using (auth.uid() = user_id);
```

5. (Opsional, buat testing lebih cepat) **Authentication** → **Providers** → **Email** → matikan **Confirm email**
6. Buka **Settings** → **API**, catat 3 nilai ini:
   - **Project URL**
   - **anon public** key
   - **service_role** key (klik Reveal)

## Bagian 2 — Buat Repo GitHub Baru

1. GitHub → **+** → **New repository**
2. Nama: `linkme-app` → **Create repository**
3. Upload semua file dari folder `linkme-app` (yang aku kasih) ke repo ini — kalau bisa pakai komputer, drag semua isi foldernya sekaligus biar struktur folder (`pages`, `lib`, `components`, `context`, `styles`) ke-upload dengan benar
4. Kalau cuma ada HP: pakai **Add file → Create new file**, ketik path lengkap tiap file (misal `pages/dashboard.js`) biar foldernya otomatis kebuat, lalu paste isinya satu-satu

## Bagian 3 — Deploy ke Vercel

1. https://vercel.com → **Add New** → **Project**
2. Pilih repo `linkme-app` → **Import**
3. Sebelum Deploy, buka **Environment Variables**, isi 4 baris ini:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_URL` | Project URL dari Supabase (sama seperti di atas) |
   | `SUPABASE_SERVICE_KEY` | service_role key |

   Ingat: **Key** = nama variabel (huruf kapital + underscore saja), **Value** = isinya. Jangan sampai ketuker seperti kejadian sebelumnya.

4. Klik **Deploy**, tunggu ± 1-2 menit

## Bagian 4 — Coba

1. Buka URL yang dikasih Vercel (`linkme-app-xxxx.vercel.app`)
2. Klik **Daftar Gratis**, buat akun
3. Masuk ke dasbor, coba buat link, cek redirect-nya jalan

## Kalau Ada Error

Sama seperti sebelumnya — screenshot Build Logs atau pesan error yang muncul, kirim ke chat ini, nanti kita telusuri bareng.
