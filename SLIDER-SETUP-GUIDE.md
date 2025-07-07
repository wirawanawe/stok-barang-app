# Panduan Setup Slider Full-Screen

## Fitur Baru: Slider Gambar Full-Screen

Sistem sekarang mendukung slider gambar full-screen di halaman utama yang dapat dikelola dari dashboard admin.

## Cara Menggunakan

### 1. Akses Pengaturan Slider

1. Login sebagai admin ke dashboard
2. Buka menu **Dashboard** → **Pengaturan Website**
3. Scroll ke bagian **Pengaturan Slider**

### 2. Upload Gambar Slider

Untuk setiap slide (1-3):

1. **Upload Gambar**:

   - Klik tombol "Pilih Gambar"
   - Pilih gambar dengan format JPG, PNG, atau WebP
   - Maksimal ukuran file: 10MB
   - Rekomendasi ukuran: 1920x1080px (landscape)

2. **Isi Konten Slider**:
   - **Judul**: Judul utama yang akan ditampilkan
   - **Sub Judul**: Teks pendukung di bawah judul
   - **Deskripsi**: Penjelasan detail tentang slide
   - **Teks Tombol**: Teks yang akan muncul di tombol CTA

### 3. Simpan Pengaturan

1. Klik tombol **Simpan Pengaturan** di bagian bawah
2. Tunggu proses upload dan penyimpanan selesai
3. Buka halaman utama untuk melihat hasilnya

## Fitur Slider

### Tampilan Full-Screen

- Slider menggunakan seluruh tinggi layar
- Gambar akan otomatis menyesuaikan ukuran layar
- Overlay gelap otomatis untuk keterbacaan teks

### Navigasi

- **Auto-play**: Slide berganti otomatis setiap 5 detik
- **Tombol Panah**: Navigasi manual kiri/kanan
- **Indikator**: Titik-titik di bagian bawah untuk navigasi langsung
- **Responsif**: Tampilan menyesuaikan dengan ukuran layar

### Fallback

- Jika tidak ada gambar, akan menggunakan background gradient
- Teks tetap dapat ditampilkan tanpa gambar

## Tips Gambar Slider

### Ukuran Optimal

- **Desktop**: 1920x1080px atau 1920x1200px
- **Ratio**: 16:9 atau 16:10 untuk hasil terbaik
- **Format**: JPG untuk foto, PNG untuk grafis dengan transparansi

### Komposisi Gambar

- Hindari teks penting di tengah gambar (akan tertutup overlay teks)
- Gunakan gambar dengan kontras yang baik
- Pertimbangkan area aman untuk teks di bagian tengah

### Optimasi

- Kompres gambar untuk loading yang lebih cepat
- Gunakan format WebP jika memungkinkan untuk ukuran file lebih kecil
- Test di berbagai ukuran layar

## Troubleshooting

### Gambar Tidak Muncul

1. Pastikan format file didukung (JPG, PNG, WebP)
2. Cek ukuran file tidak melebihi 10MB
3. Pastikan koneksi internet stabil saat upload

### Teks Tidak Terbaca

1. Pilih gambar dengan area gelap/terang yang konsisten
2. Sistem otomatis menambahkan overlay gelap 40%
3. Gunakan kontras warna yang baik

### Slider Tidak Berganti

1. Refresh halaman browser
2. Cek console browser untuk error JavaScript
3. Pastikan semua pengaturan tersimpan dengan benar

## Database

Pengaturan slider disimpan di tabel `website_settings` dengan key:

- `slider_image_1`, `slider_image_2`, `slider_image_3`: URL gambar
- `slider_title_1`, `slider_title_2`, `slider_title_3`: Judul slide
- `slider_subtitle_1`, `slider_subtitle_2`, `slider_subtitle_3`: Sub judul
- `slider_description_1`, `slider_description_2`, `slider_description_3`: Deskripsi
- `slider_cta_1`, `slider_cta_2`, `slider_cta_3`: Teks tombol CTA

## File Upload

Gambar slider disimpan di direktori:

```
public/uploads/slider/
```

Format nama file: `slider-[timestamp].[extension]`

## Update Database

Jika melakukan setup fresh, jalankan:

```sql
-- Sudah dijalankan otomatis saat setup
-- File: update-slider-settings.sql
```
