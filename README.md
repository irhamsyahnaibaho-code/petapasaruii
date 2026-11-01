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

## Mengubah atau menambah data

1. Buka folder `data` di repo, klik file CSV yang mau diubah, lalu klik ikon pensil.
2. Edit baris yang ada, atau tambah baris baru di paling bawah dengan kolom yang sama persis.
3. Klik Commit changes. Situs diperbarui dalam satu sampai dua menit.

Tips:
- Kolom `id` harus unik di tiap file (misalnya `ORG-076` untuk baris organisasi berikutnya).
- Isi `status_ig` dengan salah satu dari: `Terverifikasi`, `Belum terverifikasi`, `Belum ditemukan`.
- Sel yang berisi koma harus diberi tanda kutip ganda. Lebih aman mengedit di Google Sheets atau Excel, lalu simpan sebagai CSV UTF-8.
- Link (`ig_url`, `sumber_url`) harus diawali `https://`.

## Menyembunyikan bagian internal

Buka `app.js`. Di bagian paling atas ada dua pengaturan:

- `tampilkanPeluang: false` menyembunyikan kolom "Peluang untuk Dopa" di tabel acara GOR.
- `tampilkanCelah: false` menyembunyikan bagian "Yang masih kosong".

## Melihat di komputer sendiri

Situs ini membaca file CSV, jadi tidak jalan kalau `index.html` diklik dua kali. Dari folder ini jalankan `python3 -m http.server`, lalu buka `http://localhost:8000`.

## Warna dan font

- Biru `#0F35BD` dan kuning `#FFB300`, diambil dari logo Dopamilk (ubah di bagian `:root` pada `style.css`)
- Font judul Fredoka dan teks Nunito, dimuat dari Google Fonts
