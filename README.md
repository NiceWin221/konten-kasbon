# Kasbon - Web App Pencatat Utang Piutang

Aplikasi "Kasbon" adalah web app sederhana untuk mencatat utang piutang pribadi. Memudahkan pencatatan siapa berhutang berapa atau kita berhutang ke siapa, dilengkapi dengan rekapitulasi net (selisih) dan fitur penandaan lunas. 

Dibuat untuk memenuhi Hiring Task Junior Fullstack Developer.

## 🚀 Demo
https://konten-kasbon.vercel.app/

---

## 🛠️ Setup & Instalasi Lokal

### 1. Persyaratan
- Node.js (v20+ direkomendasikan)
- Akun [Supabase](https://supabase.com/)

### 2. Environment Variables
Buat file `.env.local` di *root* folder proyek dan salin kredensial dari *Project Settings* Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```
*(Catatan: Anda tidak memerlukan Service Role Key atau bypass key di aplikasi Next.js ini karena keamanan dijaga lewat pola RLS).*

### 3. Migrasi Database (Supabase)
Jalankan file SQL migrasi di fitur *SQL Editor* Supabase Anda (atau via Supabase CLI jika menggunakannya). File skema dapat ditemukan di:
`supabase/migrations/001_create_debts.sql`

Skrip migrasi ini akan membuat tabel `debts`, mengatur relasi ke tabel `auth.users`, serta membuat kebijakan *Row Level Security* (RLS) ketat yang memastikan data terenkapsulasi secara aman per user.

### 4. Menjalankan Aplikasi Lokal
Jalankan perintah berikut di terminal:
```bash
npm install
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 💡 Approach (Keputusan Teknis yang Membanggakan)

Keputusan teknis yang paling saya banggakan dalam proyek ini adalah **Saya menggunakan Next.js Route Handler sebagai API layer untuk fitur debt, sehingga validation dan business logic terpusat di server sebelum data diteruskan ke Supabase.**.

---

## ⚖️ Trade-off & Future Polish

Jika memiliki satu hari tambahan, saya ingin mengembangkan sistem utang 2 arah antar-user. User tetap dapat memasukkan nama secara manual seperti saat ini, atau memilih user Kasbon sebagai target. Jika memilih user lain, permintaan utang akan muncul di akun tersebut untuk diterima atau ditolak. Jika diterima, catatan utang kedua user akan saling terhubung sehingga status pelunasan dapat disinkronkan, dengan kemungkinan pengembangan fitur bukti pembayaran dan konfirmasi pelunasan.

---

## ⏱️ Time Spent
- **Total waktu:** 4 Jam
- Fokus dihabiskan ke: Setup & arsitektur Supabase, implementasi Auth (Client), Backend Next.js API, UI/UX (Tailwind v4), dan perapian *handling error/type*.
