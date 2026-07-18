WEBSITE PERSONAL SEPTINO — TERHUBUNG KE CERDAS FINANSIAL CRM

Yang diubah:
- Form Daftar Konsultasi menyimpan langsung ke Supabase.
- Client baru otomatis muncul pada menu Client CRM.
- Konsultasi baru otomatis muncul pada menu Konsultasi CRM.
- Halaman Status Konsultasi membaca status terbaru dari Supabase.
- Tampilan HTML/CSS dan menu tidak diubah.

LANGKAH WAJIB SEKALI SAJA
1. Buka Supabase > SQL Editor.
2. Buka file SUPABASE-WEBSITE-INTEGRATION.sql.
3. Salin seluruh isinya, kemudian klik Run.
4. Upload folder Website Personal ini ke hosting/Vercel.
5. CRM tetap memakai project Supabase yang sama.

PENGUJIAN
1. Buka halaman Daftar Konsultasi pada Website Personal.
2. Isi nama, email, dan WhatsApp.
3. Setelah berhasil, catat Nomor Konsultasi.
4. Login CRM dan buka menu Client serta Konsultasi.
5. Data pendaftaran harus langsung muncul.
6. Ubah status pada CRM.
7. Periksa Nomor Konsultasi pada halaman Status Konsultasi Website Personal.

Catatan: Midtrans belum diaktifkan. Integrasi ini hanya menyatukan Website Personal,
Supabase, dan CRM tanpa mengubah desain.
