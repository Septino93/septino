CF CRM V2.1 — PHASE 2 (SMART SIMULATION SYNC)

URUTAN PEMASANGAN:
1. Supabase > SQL Editor > jalankan CF-CRM-V2.1-PHASE2-SETUP.sql satu kali.
2. Upload/replace seluruh isi ZIP Website Personal ke repository Website Personal.
3. Upload/replace seluruh isi ZIP CRM ke repository Cerdas Finansial CRM.
4. Tunggu kedua deployment Vercel selesai.
5. Lakukan simulasi baru > Daftar Konsultasi.
6. Di CRM: Client > buka client > Mulai Analisis.

CATATAN:
- Tidak ada tabel atau kolom database yang diubah.
- RPC v1 register_consultation tetap tersedia.
- Pendaftaran lama tetap berjalan.
- Hasil simulasi lama sebelum Phase 2 tidak dapat muncul otomatis karena memang belum pernah disimpan.
- Snapshot baru disimpan pada activity_logs.metadata.
