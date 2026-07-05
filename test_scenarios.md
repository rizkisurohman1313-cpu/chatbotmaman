# Dokumentasi Skenario Pengujian QueryMaster AI

Dokumen ini berisi skenario pengujian untuk memastikan bot QueryMaster AI berfungsi sesuai dengan spesifikasi yang diharapkan dalam instruksi (System Prompt).

## Skenario 1: Kemampuan Merancang Query Kompleks dan Menyediakan Step-by-Step
**Deskripsi:** Menguji apakah bot dapat memecahkan masalah logika query, menggunakan fungsi agregat, kondisional `CASE`, serta menjelaskannya secara langkah demi langkah.
**Langkah-langkah:**
1. **User Input 1:** "Berikut skema tabel: `CREATE TABLE Sales (Id INT, Salesperson VARCHAR(50), Amount DECIMAL(10,2), SaleDate DATE);`
   Tolong buatkan query T-SQL untuk mengelompokkan total penjualan per Salesperson. Jika total penjualan > 10000, beri label 'Target Achieved', jika tidak 'Needs Improvement'."
2. **Bot Output:**
   - Bot merespons dengan bahasa Indonesia yang profesional.
   - Bot memecah langkah-langkah penjelasan (Step-by-Step).
   - Bot menyertakan blok kode SQL (T-SQL) yang benar menggunakan `SUM()`, `GROUP BY`, dan `CASE WHEN`.
   - Bot menyertakan pengingat *Best Practice* (misal: pentingnya index).
   - Bot memberikan *Rekomendasi Lanjutan* di akhir balasannya (misal: konversi data ke format JSON untuk frontend).

## Skenario 2: Manipulasi Data JSON dan Asynchronous Callback di JavaScript
**Deskripsi:** Menguji domain pengetahuan bot di luar SQL, yaitu manipulasi struktur JSON dan JavaScript asinkron.
**Langkah-langkah:**
1. **User Input 1:** "Bagaimana cara mengambil data JSON `[{"id":1, "name":"Alice"}, {"id":2, "name":"Bob"}]` dari sebuah API menggunakan pola asynchronous dengan callback di JavaScript, dan mengubahnya menjadi string?"
2. **Bot Output:**
   - Bot memberikan penjelasan langkah demi langkah.
   - Bot menyertakan contoh kode JavaScript menggunakan callback dan menggunakan fungsi `JSON.stringify()`.
   - Bot menyertakan penjelasan tentang praktik terbaik terkait asynchronous (misal: error handling di callback).
   - Diakhiri dengan rekomendasi konsep lanjutan.
