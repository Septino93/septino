PERBAIKAN ERROR BOOKING

Penyebab error:
config.js sebelumnya memakai window.CF_CONFIG, sedangkan service.js dan booking.js membaca window.SEPTINO_APP_CONFIG.
Akibatnya Supabase dianggap belum dikonfigurasi dan proses booking gagal.

Versi ini menggunakan satu konfigurasi yang tersedia melalui kedua nama:
- window.CF_CONFIG
- window.SEPTINO_APP_CONFIG

Versi ini juga mendukung dua rekening aktif: BCA dan BNI.
