MIDTRANS SNAP SANDBOX — WEBSITE PERSONAL SEPTINO

FITUR
- Layanan gratis tetap mendaftar dan dilanjutkan melalui WhatsApp.
- Review Polis dan Financial Check Up: Rp499.000.
- Konsultasi lanjutan setelah kredit gratis habis: Rp99.000.
- Konsultasi berbayar membuka Midtrans Snap Sandbox.
- Webhook Midtrans mengubah status pembayaran di Supabase/CRM.

LANGKAH SETUP VERCEL
1. Upload isi folder website ke repository GitHub seperti biasa.
2. Vercel > Project Website Personal > Settings > Environment Variables.
3. Tambahkan untuk Production, Preview, dan Development:
   MIDTRANS_CLIENT_KEY       = Client Key SANDBOX
   MIDTRANS_SERVER_KEY       = Server Key SANDBOX
   SUPABASE_URL              = URL project Supabase yang sama dengan CRM
   SUPABASE_SERVICE_ROLE_KEY = Project Settings > API Keys > service_role (RAHASIA)
4. Redeploy website.

LANGKAH SETUP MIDTRANS SANDBOX
1. Dashboard Sandbox Midtrans > Settings > Snap Preferences / Configuration.
2. Isi Payment Notification URL:
   https://DOMAIN-WEBSITE-ANDA.vercel.app/api/midtrans-notification
3. Simpan.

PENGUJIAN
1. Pilih Financial Check Up atau Review Polis.
2. Isi nama, email, dan WhatsApp.
3. Klik Bayar Rp499.000.
4. Pilih metode pembayaran Sandbox pada popup Snap.
5. Gunakan simulator Midtrans untuk menyelesaikan pembayaran.
6. Periksa CRM > Bayar: status harus berubah menjadi Lunas.
7. Periksa CRM > Konsultasi: status menjadi Menunggu Penjadwalan.

CATATAN KEAMANAN
- Jangan menaruh MIDTRANS_SERVER_KEY atau SUPABASE_SERVICE_ROLE_KEY di config.js.
- Jangan mengunggah file .env berisi key sebenarnya ke GitHub.
- Integrasi ini masih SANDBOX. Jangan mengganti endpoint ke Production sebelum seluruh uji berhasil.
