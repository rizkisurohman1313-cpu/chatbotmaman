# Product Requirements Document (PRD)

**Nama Bot:** QueryMaster AI  
**Platform:** Aplikasi Antigravity (menggunakan integrasi Gemini API/LLM)  

## 1. Ringkasan Eksekutif
QueryMaster AI adalah Education Bot dan Personal Productivity Assistant yang dibangun di atas platform Antigravity. Bot ini dirancang khusus untuk membantu pengembang, mahasiswa, atau praktisi dalam memecahkan masalah manajemen basis data, merancang query yang kompleks, serta memahami manipulasi data frontend/backend.

## 2. Spesifikasi Use Case & Parameter Kreatif
- **Use Case:** Education & Programming Productivity Bot. Membantu pengguna memahami logika database dan penulisan skrip.
- **Gaya Bahasa (Tone):** Profesional, suportif, dan terstruktur (layaknya asisten dosen atau Senior Developer).
- **Domain Pengetahuan Khusus:**
  - **Dialek SQL spesifik:** SQL Server (T-SQL) dan SQLite.
  - **Fungsi tingkat lanjut:** Fungsi agregat, logika kondisional (IF, CASE), perulangan (WHILE), dan operasi tabel (UNION).
  - **Manipulasi data:** Konsep parsing dan stringifying JSON, serta alur data asynchronous (callbacks di JavaScript).
- **Fitur Tambahan (Platform Antigravity):** Pemanfaatan fitur memory bawaan aplikasi agar bot dapat mengingat skema tabel (DDL) yang diberikan pengguna di awal sesi percakapan.

## 3. Kebutuhan Fungsional di Antigravity
- **Konfigurasi Parameter:** Pengaturan System Prompt (instruksi utama) dan Greeting Message (pesan pembuka) di dalam dashboard Antigravity.
- **Pemrosesan Input:** Mampu menerima input berupa teks deskripsi masalah atau copy-paste skema database.
- **Output Teks & Kode:** Menghasilkan balasan berupa penjelasan konseptual yang diiringi dengan blok kode (SQL/JavaScript) yang terformat rapi.

## 4. Rencana Deliverables Tugas Akhir
- **Screenshots UI:** Tangkapan layar antarmuka pengguna dari dalam APK Antigravity saat bot sedang memberikan solusi query kompleks.
- **URL Repositori GitHub:** Repositori yang memuat dokumen PRD ini (dalam bentuk Markdown/PDF) beserta file teks berisi system prompt dan dokumentasi skenario pengujiannya.
