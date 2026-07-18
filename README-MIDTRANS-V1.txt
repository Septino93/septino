MIDTRANS INTEGRATION V1 — SANDBOX
=================================

FITUR
- Financial Check Up: Rp499.000
- Review Polis: Rp499.000
- Konsultasi lanjutan: Rp99.000 setelah kredit gratis habis
- Popup Midtrans Snap Sandbox
- Bayar ulang dari halaman Cek Status Konsultasi
- Webhook memperbarui payment_status dan consultation_status di CRM
- Log transaksi masuk ke activity_logs

ENVIRONMENT VARIABLES VERCEL (WAJIB)
1. MIDTRANS_CLIENT_KEY       = Client Key Sandbox
2. MIDTRANS_SERVER_KEY       = Server Key Sandbox
3. SUPABASE_URL              = URL project Supabase
4. SUPABASE_SERVICE_ROLE_KEY = Secret service_role Supabase
5. PUBLIC_SITE_URL           = opsional, contoh https://septino.vercel.app

PENTING
- MIDTRANS_SERVER_KEY dan SUPABASE_SERVICE_ROLE_KEY jangan dimasukkan ke GitHub.
- Setelah menambah/mengubah environment variables, lakukan Redeploy.

MIDTRANS SANDBOX
Settings > Configuration / Payment Notification URL:
https://septino.vercel.app/api/midtrans-notification

LANGKAH UJI
1. Upload seluruh isi folder ini ke root repository GitHub.
2. Pastikan folder api berada langsung di root repository.
3. Tambahkan 4 environment variables wajib di Vercel.
4. Redeploy Production.
5. Buka Financial Check Up atau Review Polis, isi form lalu klik Bayar.
6. Pilih metode pembayaran Sandbox.
7. Gunakan simulator Midtrans untuk menyelesaikan transaksi.
8. Buka Cek Status Konsultasi; status harus berubah menjadi Lunas dan Menunggu Penjadwalan.

CATATAN
- Integrasi ini masih Sandbox. Jangan mengganti ke Production sebelum seluruh alur diuji.
- Jika muncul error Environment Variable SUPABASE_..., berarti dua variabel Supabase belum ditambahkan.
