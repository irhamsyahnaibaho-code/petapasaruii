# Peta Pasar Kampus UII · Dopamilk

Situs statis berisi data organisasi, mahasiswa, dan acara di UII untuk keputusan marketing Dopamilk. Tidak butuh server atau instalasi apa pun.

## Isi folder

- `index.html`, `style.css`, `app.js`: tampilan dan logikanya
- `data/*.csv`: semua datanya. Inilah yang diedit tim
- `assets/`: logo dan ikon Dopamilk

## Menayangkan di GitHub Pages

1. Buat repo baru di GitHub, misalnya `peta-pasar-uii`.
2. Unggah seluruh isi folder ini ke repo (tombol Add file → Upload files, seret semua, lalu Commit).
3. Buka Settings → Pages. Di bagian Build and deployment, pilih Deploy from a branch, branch `main`, folder `/ (root)`, lalu Save.
4. Tunggu sekitar satu sampai dua menit. Alamatnya: `https://NAMA-GITHUB.github.io/peta-pasar-uii/`

Catatan akses: repo publik berarti situsnya bisa dibuka siapa saja yang punya link. Hosting dengan kata sandi (misalnya GitHub Pages dari repo privat, Cloudflare Pages dengan Access, atau Netlify) umumnya butuh paket berbayar atau pengaturan tambahan, jadi cek ketentuan terbarunya di masing-masing layanan.

## Mengubah atau menambah data (lewat Google Sheets)

Situs membaca data dari spreadsheet "Data Peta Pasar UII" di Google Sheets. Tim cukup mengedit di sana, tanpa membuka GitHub.

1. Buka spreadsheet, pilih tab yang mau diubah (`organisasi`, `mahasiswa`, `acara_gor`, atau `celah`).
2. Ubah isi sel, atau tambah baris baru di bawah baris terakhir dengan kolom yang sama.
3. Tunggu sekitar 5 menit. Lalu buka situs dan tekan Ctrl + F5.

Aturan:
- Jangan mengubah, menghapus, atau memindah baris judul (baris 1) dan urutan kolom.
- Kolom `id` harus unik di tiap tab (misalnya `ORG-076` setelah `ORG-075`).
- Isi `status_ig` dengan salah satu dari: `Terverifikasi`, `Belum terverifikasi`, `Belum ditemukan`.
- Link (`ig_url`, `sumber_url`) harus diawali `https://`.
- Jangan menghapus tab atau mengganti namanya.
- Kalau mengetik tanggal, tulis sebagai teks biasa, misalnya `2 Sep 2025`. Kolom `tanggal_mulai` ditulis `2025-09-02`. Kalau Sheets mengubahnya jadi format tanggal otomatis, klik sel itu lalu Format → Angka → Teks biasa sebelum mengetik.

Siapa yang boleh mengedit diatur lewat tombol Share di Google Sheets. Isi tab yang dipublikasikan bisa dibaca siapa pun yang punya linknya.

Cadangan: kalau Google Sheets tidak bisa dibaca, situs memakai file di folder `data/` (CSV). File itu tidak ikut berubah saat Sheets diedit, jadi perbarui juga kalau perlu.

## Menyembunyikan bagian internal

Buka `app.js`. Di bagian paling atas ada dua pengaturan:

- `tampilkanPeluang: false` menyembunyikan kolom "Peluang untuk Dopa" di tabel acara GOR.
- `tampilkanCelah: false` menyembunyikan bagian "Yang masih kosong".

## Melihat di komputer sendiri

Situs ini membaca file CSV, jadi tidak jalan kalau `index.html` diklik dua kali. Dari folder ini jalankan `python3 -m http.server`, lalu buka `http://localhost:8000`.

## Warna dan font

- Biru `#0F35BD` dan kuning `#FFB300`, diambil dari logo Dopamilk (ubah di bagian `:root` pada `style.css`)
- Font judul Fredoka dan teks Nunito, dimuat dari Google Fonts
