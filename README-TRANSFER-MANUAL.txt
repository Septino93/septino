TRANSFER MANUAL V1.1 - TANPA QRIS

1. Isi data rekening di config.js pada manualPayment:

manualPayment: {
  bankName: "ISI NAMA BANK",
  accountNumber: "ISI NOMOR REKENING",
  accountHolder: "ISI NAMA PEMILIK REKENING",
  paymentDeadlineHours: 24
},

2. Upload seluruh isi folder website ke repository website.

3. Supabase Storage memerlukan bucket private bernama client-documents.
   Jika bucket belum ada, jalankan file SETUP-CLIENT-DOCUMENTS.sql di Supabase SQL Editor.

4. Pastikan Vercel website memiliki environment variables:
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY

5. Setelah deploy, lakukan satu booking uji dan upload bukti pembayaran.

Alur: Booking berbayar -> pembayaran-transfer.html -> upload bukti -> activity_logs event payment_proof_uploaded.
