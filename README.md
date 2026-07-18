# Septino Personal Website

Isi paket:
- index.html
- kelas.html
- books.html
- style.css
- kelas.css
- books.css
- script.js
- assets/

Link aktif:
- Konsultasi Asuransi -> WhatsApp
- Kelas CorelDRAW -> kelas.kursusdigital.id
- Buku CorelDRAW -> Toko Buku Jejak

Kelas Canva ditampilkan sebagai Segera Hadir.

Update:
- Poster kelas CorelDRAW ditambahkan.
- Harga pada halaman kelas dihapus.

Update:
- Ditambahkan halaman konsultasi.html.
- Tombol Konsultasi Asuransi di halaman utama menuju halaman konsultasi.
- Layanan: Asuransi Kesehatan, Penyakit Kritis, Review Polis, Jiwa, dan Dana Pendidikan.
- Setiap layanan langsung membuka WhatsApp dengan pesan sesuai pilihan.

Update:
- Ditambahkan fitur Simulasi Kebutuhan Asuransi di halaman utama.
- Ditambahkan halaman simulasi.html.
- Kalkulator Asuransi Jiwa.
- Kalkulator Penyakit Kritis.
- Kalkulator Asuransi Kesehatan.

Update rumus Asuransi Jiwa:
- Mengikuti Cerdas Finansial V2.
- UP Jiwa Ideal = Pengeluaran Tahunan ÷ Nett Bunga.
- Deposito default PPh 20%.
- Obligasi default PPh 10%.
- Menampilkan UP saat ini, kekurangan UP, dan rasio terpenuhi.

Perbaikan:
- Input nominal sekarang menerima angka 0.
- Angka 0 tidak lagi otomatis berubah menjadi kolom kosong.
- Format ribuan tetap berjalan untuk semua nominal.

Update:
- Tombol bawah diganti menjadi Konsultasi Premi Asuransi Jiwa.
- Tombol langsung membuka WhatsApp.
- Pesan WhatsApp otomatis membawa hasil simulasi:
  pengeluaran bulanan, pengeluaran tahunan, instrumen, bunga, PPh,
  nett bunga, UP ideal, UP saat ini, kekurangan UP, dan rasio terpenuhi.

Update Penyakit Kritis:
- Rumus mengikuti Cerdas Finansial V2.
- UP Ideal = Penghasilan Bulanan × 12 × Multiplier.
- Multiplier tersedia 3–7 tahun, default 5 tahun.
- Menampilkan UP saat ini, kekurangan, rasio terpenuhi, dan status.
- Tombol WhatsApp berubah otomatis saat tab Penyakit Kritis aktif.
- Hasil simulasi Penyakit Kritis ikut terkirim ke WhatsApp.

Update Analisis:
- Kotak rumus Asuransi Jiwa dihapus.
- Kotak rumus Penyakit Kritis dihapus.
- Diganti menjadi Analisis Financial Planner.
- Penjelasan berubah otomatis berdasarkan hasil simulasi.
- Analisis menyesuaikan kondisi: belum punya perlindungan, masih kurang, atau sudah ideal.

Update Analisis V2:
- Isi Analisis Financial Planner dibuat menjadi 3 paragraf.
- Menampilkan kebutuhan ideal, perlindungan saat ini, arti hasil, dan saran.
- Analisis Asuransi Jiwa dan Penyakit Kritis menyesuaikan hasil simulasi.
- Ikon lampu dirapikan, disejajarkan, dan dibuat lebih proporsional.

Update:
- Ikon pada Analisis Financial Planner dihapus.
- Ditambahkan status kekurangan UP Jiwa di bawah analisis.
- Status menyesuaikan hasil: masih kurang, hampir ideal, atau sudah ideal.

Update:
- Index menggunakan Financial & Insurance Planner.
- Judul analisis menjadi Analisis Financial & Insurance Planner.
- Analisis Jiwa menjelaskan alasan penggunaan nett bunga.
- Analisis Penyakit Kritis menjelaskan alasan penggunaan multiplier tahunan.

Stable Rebuild:
- simulasi.js dibangun ulang dari nol.
- Semua handler tombol dibuat ulang dan diekspos untuk onclick HTML.
- Input nominal menerima angka 0.
- Tab Jiwa, Penyakit Kritis, dan Kesehatan kembali berfungsi.
- Kalkulasi, analisis, banner status, dan WhatsApp dibuat dalam modul yang terpisah.

Dana Pendidikan V2:
- Ditambahkan tab Dana Pendidikan.
- Target dana = biaya saat ini × (1 + inflasi)^sisa waktu.
- Kekurangan dana = target dana - dana yang sudah tersedia.
- Setoran bulanan mengikuti rumus future value annuity Cerdas Finansial V2.
- Strategi tersedia: konservatif 2%, moderat 4%, agresif 6%.
- Hasil simulasi dapat dikirim ke WhatsApp.

Pension Limit - mengikuti Cerdas Finansial V2:
- Input Usia Ayah, Usia Ibu, dan Usia Pensiun.
- Periode maksimum = minimum dari:
  1. Usia Pensiun - Usia Ayah
  2. Usia Pensiun - Usia Ibu
  3. Usia Masuk Pendidikan - Usia Anak
- Pilihan periode 3, 5, 8, 10 tahun hanya muncul jika tidak melewati batas.
- Pilihan sampai anak masuk pendidikan dan custom mengikuti batas maksimum.
- Setoran bulanan dihitung berdasarkan periode yang sudah dibatasi tersebut.

Health Protection Questionnaire V2:
- Kalkulator kesehatan diganti menjadi kuisioner.
- Struktur mengikuti Cerdas Finansial V2:
  Data tertanggung, BPJS, asuransi swasta, coverage area, kamar,
  cashless, deductible, co-payment, riwayat penyakit, dan riwayat penolakan.
- Status analisis:
  Prioritas Tinggi, Sesuai Kebutuhan, atau Proteksi Lengkap.
- Tidak menghitung premi, annual limit, atau biaya medis.
- Ringkasan dan hasil dapat dikirim ke WhatsApp.

Health Questionnaire V3:
- Tombol Lihat Analisis Perlindungan Kesehatan dihapus.
- Analisis tetap dihitung otomatis.
- Semua input, select, dan textarea pada kuisioner langsung memperbarui hasil.
- Judul hasil diganti menjadi Ringkasan Analisis Perlindungan.

WhatsApp Health Final:
- Pesan WhatsApp dibuat lebih ringkas.
- Mengirim data utama, perlindungan saat ini, hasil analisis, dan catatan planner.
- Bagian pertanyaan tambahan dan review polis dihapus.
- Riwayat penyakit dan penolakan hanya ditampilkan jika ada.

Health Review Logic:
- Ditambahkan Catatan Penting di bawah Analisis Financial & Insurance Planner.
- Pengguna tanpa Asuransi Swasta melihat tombol Konsultasi Premi Asuransi Kesehatan.
- Pengguna dengan Asuransi Swasta melihat tombol Review Polis Asuransi Kesehatan.
- Isi pesan WhatsApp menyesuaikan otomatis dengan kondisi pengguna.

Dana Pensiun V2:
- Biaya hidup saat pensiun = biaya hidup saat ini × (1 + inflasi)^tahun menuju pensiun.
- Pengeluaran tahunan saat pensiun = biaya bulanan saat pensiun × 12.
- Dana dibutuhkan = pengeluaran tahunan saat pensiun ÷ 4%.
- Dana terproyeksi = dana saat ini + setoran bulanan × jumlah bulan menuju pensiun.
- Gap = dana dibutuhkan - dana terproyeksi.
- Setoran rekomendasi = gap ÷ jumlah bulan menuju pensiun.
- Readiness Score = dana terproyeksi ÷ dana dibutuhkan × 100.
- Status: Belum Siap, Perlu Ditingkatkan, Hampir Ideal, dan Ideal.

Dana Pensiun V3:
- Ditambahkan pilihan periode pengumpulan dana: 3, 5, 8, 10 tahun.
- Ditambahkan Custom / Tentukan Sendiri.
- Ditambahkan pilihan Sampai Usia Pensiun.
- Semua pilihan dibatasi maksimal sampai usia pensiun.
- Dana terproyeksi dan setoran rekomendasi memakai periode pengumpulan yang dipilih.

Dana Pensiun V4:
- Withdrawal Rate menjadi pilihan 2,0% sampai 6,0%.
- Default 4,0%.
- Nilai dianggap setelah pajak dan biaya.
- Dana dibutuhkan, gap, setoran rekomendasi, readiness score, analisis, dan WhatsApp mengikuti pilihan pengguna.

Final Naming Update:
- Menu utama menjadi Simulasi Perencanaan Keuangan.
- Subjudul menjadi Hitung kebutuhan perlindungan dan tujuan keuangan Anda.
- Semua penyebutan Cerdas Finansial V2 pada tampilan pengguna dihapus.
- Subjudul setiap modul diganti menjadi penjelasan manfaat yang lebih natural.

Family Data Update:
- Asuransi Jiwa: tambah Nama Tertanggung dan Usia.
- Penyakit Kritis: tambah Nama Tertanggung dan Usia.
- Dana Pendidikan: tambah Nama Ayah dan Nama Ibu.
- Dana Pensiun: tambah Status Pernikahan.
- Jika Menikah, muncul Nama Istri dan Usia Istri.
- Biaya hidup pensiun diganti menjadi Biaya Hidup Keluarga.
- Semua data baru ikut masuk ke pesan WhatsApp.

PDF Export & Share:
- Dana Pendidikan: label menjadi Usia Pensiun yang Diinginkan.
- Semua modul memiliki tombol Export PDF.
- PDF dibuat di browser menggunakan jsPDF.
- Saat tombol konsultasi ditekan, sistem mencoba Web Share API dengan lampiran PDF.
- Jika berbagi file tidak didukung, PDF diunduh lalu WhatsApp dibuka.
- Browser tidak dapat memaksa file dilampirkan otomatis ke WhatsApp Web melalui wa.me.

Required Fields:
- Semua pertanyaan utama di setiap modul wajib diisi.
- Nilai 0 tetap valid untuk UP saat ini, dana tersedia, dana pensiun,
  dan setoran bulanan.
- Validasi kondisional berlaku untuk data istri, periode custom,
  deductible, co-payment, riwayat penyakit, dan riwayat penolakan.
- Field belum lengkap diberi tanda merah dan pesan Wajib diisi.
- Hitung, Export PDF, dan WhatsApp tidak berjalan sebelum data lengkap.

Age & PDF Fix:
- Semua field usia menolak nilai 0 melalui batas minimum HTML.
- Validasi usia tetap dijalankan saat proses hitung.
- PDF Dana Pendidikan dan Dana Pensiun memindahkan bagian Analisis
  Financial & Insurance Planner ke halaman 2 agar tidak menimpa footer.

PDF Page Fix:
- Analisis Dana Pendidikan dan Dana Pensiun selalu dimulai pada halaman baru.
- Analisis menggunakan lebar penuh, bukan format kolom label/nilai.
- Jika analisis panjang, otomatis lanjut ke halaman berikutnya.
- Footer tidak lagi tertimpa oleh isi analisis.

All Analysis on Page 2:
- Analisis Financial & Insurance Planner pada semua modul dipindahkan ke halaman baru.
- Berlaku untuk Asuransi Jiwa, Penyakit Kritis, Asuransi Kesehatan, Dana Pendidikan, dan Dana Pensiun.
- Analisis menggunakan layout lebar penuh dan otomatis lanjut halaman bila teks panjang.

Consultation Guidance Logic:
- Jika hasil Asuransi Jiwa masih kurang, analisis menampilkan arahan konsultasi.
- Jika Penyakit Kritis masih kurang, analisis menampilkan arahan konsultasi.
- Kesehatan menampilkan arahan konsultasi jika Prioritas Tinggi atau masih perlu evaluasi.
- Dana Pendidikan dan Dana Pensiun menampilkan arahan konsultasi jika masih terdapat kekurangan.
- Jika hasil sudah ideal atau Proteksi Lengkap, arahan konsultasi tidak ditampilkan.

Personal Consultation CTA:
- Semua analisis yang belum ideal menampilkan ajakan menghubungi Septino.
- Kontak dapat dilakukan melalui tombol Konsultasi atau WhatsApp 0811-6946-999.
- Hasil yang sudah ideal juga menampilkan opsi review lanjutan tanpa membahas kekurangan.
- CTA ikut masuk ke Analisis Financial & Insurance Planner dan PDF.

Consultation & Course Update:
- Menu utama menjadi Konsultasi Perencanaan Keuangan.
- Halaman konsultasi dibagi menjadi Proteksi dan Perencanaan Keuangan.
- Proteksi: Asuransi Jiwa, Penyakit Kritis, Kesehatan, Review Polis.
- Perencanaan Keuangan: Financial Check Up, Dana Pendidikan, Dana Darurat, Dana Pensiun.
- Benefit CorelDRAW ditambah Bonus e-book dan Group konsultasi.

Consultation CTA & Icon Fix:
- CTA Belum Yakin Memilih dikembalikan.
- Kalimat penjelasan di bawah judul CTA dihapus.
- Lucide Icons dimuat dan diinisialisasi pada halaman konsultasi.
- Ikon kategori, kartu layanan, dan tombol WhatsApp dipastikan tampil.

Footer & Course Highlight:
- Footer halaman kelas menggunakan CTA Belum Yakin Memilih.
- Kalimat Saya akan membantu menentukan jenis perlindungan dihapus.
- Copyright tetap berada di bawah CTA.
- Bonus e-book dan Group konsultasi dibuat lebih eye-catching dengan badge.

Dana Darurat:
- Tambah modul Dana Darurat pada halaman simulasi.
- Input: Nama, Usia, Status Pernikahan, Nama dan Usia Istri jika menikah.
- Input keuangan: Pengeluaran Keluarga dan Dana Darurat yang sudah dimiliki.
- Multiplier: Belum Menikah 3 bulan, Menikah 6 bulan.
- Hasil: Dana Ideal, Dana Saat Ini, Kekurangan, dan Rasio Terpenuhi.
- Mendukung validasi wajib, analisis, Export PDF halaman 1-2, dan WhatsApp.

Tabs & Dana Darurat:
- Tab menjadi dua baris, masing-masing tiga tombol.
- Proteksi: Asuransi Jiwa, Penyakit Kritis, Kesehatan.
- Perencanaan Keuangan: Dana Darurat, Dana Pendidikan, Dana Pensiun.
- Jumlah Anak muncul saat status Menikah.
- Multiplier Dana Darurat: 6 bulan belum menikah, 9 bulan menikah tanpa anak, 12 bulan menikah dengan anak.

Mobile Safe Optimization:
- Dibuat ulang dari versi stabil.
- Tidak mengubah struktur HTML, ID field, atau logika JavaScript.
- Optimasi dilakukan melalui CSS responsif.
- Mendukung layar 320-430px, safe area iPhone, tombol sentuh, form satu kolom,
  tab 3 tombol per baris, dan pencegahan horizontal overflow.

Final Health Naming:
- Label tab Kesehatan menjadi Asuransi Kesehatan.
- Judul modul, halaman konsultasi, PDF, nama file, dan pesan WhatsApp diseragamkan.

Consultation Final Layout:
- Konsultasi Dana Darurat dihapus dari halaman konsultasi.
- Dana Darurat tetap tersedia di halaman simulasi.
- Perencanaan Keuangan menjadi: Financial Check Up, Dana Pendidikan, Dana Pensiun, Belum Yakin Memilih.
- CTA Belum Yakin dipindahkan menjadi kartu di samping Dana Pensiun.
- CTA besar di bagian bawah halaman dihapus.

Dana Darurat WhatsApp Fix:
- Tombol konsultasi global disembunyikan saat tab Dana Darurat aktif.
- Tombol tetap tampil pada modul lain.
- Fungsi WhatsApp tidak berjalan bila tab Dana Darurat aktif.

Review Polis Detail Page:
- Kartu Review Polis di halaman konsultasi membuka review-polis.html.
- Halaman detail menampilkan harga Rp499.000.
- Khusus nasabah Septino tidak dipungut biaya.
- Review profesional maksimal 2 polis.
- Durasi 60 menit, online atau offline.
- Tombol Pesan Sekarang terhubung ke WhatsApp.
- Layout responsif untuk desktop dan mobile.

All Service Detail Pages:
- Tambah halaman Asuransi Jiwa.
- Tambah halaman Penyakit Kritis.
- Tambah halaman Asuransi Kesehatan.
- Tambah halaman Dana Pendidikan.
- Tambah halaman Dana Pensiun.
- Tambah halaman Financial Check Up.
- Semua kartu konsultasi terkait membuka halaman detail.
- Setiap halaman memiliki harga, benefit, catatan, dan tombol WhatsApp.

Mobile Service Pages:
- Semua halaman detail layanan diubah menjadi mobile-first.
- Lebar maksimum 480px agar konsisten seperti aplikasi.
- Hero besar dan gambar desktop dihapus.
- Semua konten menjadi satu kolom.
- Harga, benefit, ringkasan, dan CTA dibuat lebih ringkas.
- Tombol Pesan Sekarang mudah dijangkau di ponsel.
- Tetap nyaman dilihat pada tablet dan desktop.

## Integrasi Booking (versi ini)
- Semua tombol Pesan Sekarang diarahkan ke `booking.html`.
- Booking otomatis mencari client berdasarkan WhatsApp, lalu email.
- Client baru mendapat 2 consultation credit.
- Review Polis dan Financial Check Up otomatis dibuat sebagai booking berbayar.
- Jika `bookingApiUrl` pada `config.js` masih kosong, data disimpan sebagai bridge lokal pada browser untuk pengujian.
- Untuk sinkronisasi online ke Cerdas Finansial CRM, isi `bookingApiUrl` dengan endpoint backend CRM/Supabase.
