# Fitur Export Excel & PDF

Fitur export telah ditambahkan ke aplikasi stok barang untuk memungkinkan download data dalam format Excel dan PDF.

## Fitur yang Tersedia

### 1. Export Laporan (Reports)

- **Lokasi**: Dashboard → Reports
- **Data yang dapat diekspor**: Riwayat transaksi stok (stock logs)
- **Filter yang didukung**:
  - Jenis transaksi (Stok Masuk, Stok Keluar, Penyesuaian)
  - Rentang tanggal (tanggal mulai dan tanggal akhir)

### 2. Export Data Stok Barang (Items)

- **Lokasi**: Dashboard → Items
- **Data yang dapat diekspor**: Data barang dengan informasi stok
- **Filter yang didukung**:
  - Pencarian nama/kode barang
  - Filter kategori

### 3. Export Data Customer

- **Lokasi**: Dashboard → Customers
- **Data yang dapat diekspor**: Data customer yang terdaftar
- **Filter yang didukung**:
  - Pencarian nama/email/kode customer
  - Status customer (Aktif/Nonaktif/Semua)

## Cara Menggunakan

### Export ke Excel

1. Buka halaman yang ingin diekspor (Reports/Items/Customers)
2. Atur filter sesuai kebutuhan (opsional)
3. Klik tombol **Excel** dengan ikon download
4. File Excel akan otomatis terdownload dengan nama yang berisi tanggal

### Export ke PDF

1. Buka halaman yang ingin diekspor (Reports/Items/Customers)
2. Atur filter sesuai kebutuhan (opsional)
3. Klik tombol **PDF** dengan ikon file
4. File PDF akan otomatis terdownload dengan nama yang berisi tanggal

## Format File yang Dihasilkan

### Excel Files

- **Laporan**: `laporan-stok-YYYY-MM-DD.xlsx`
- **Stok Barang**: `stok-barang-YYYY-MM-DD.xlsx`
- **Customer**: `data-customer-YYYY-MM-DD.xlsx`

### PDF Files

- **Laporan**: `laporan-stok-YYYY-MM-DD.pdf`
- **Stok Barang**: `data-stok-barang-YYYY-MM-DD.pdf`
- **Customer**: `data-customer-YYYY-MM-DD.pdf`

## Kolom Data yang Diekspor

### Export Laporan (Excel)

- No
- Tanggal Transaksi
- Kode Barang
- Nama Barang
- Kategori
- Lokasi
- Jenis Transaksi
- Jumlah
- Stok Sebelum
- Stok Sesudah
- No. Referensi
- Catatan
- User

### Export Stok Barang (Excel)

- No
- Kode Barang
- Nama Barang
- Deskripsi
- Kategori
- Lokasi
- Stok Saat Ini
- Satuan
- Harga
- Stok Minimum
- Stok Maksimum
- Status Stok
- Tanggal Dibuat
- Terakhir Update

### Export Customer (Excel)

- No
- Kode Customer
- Username
- Nama Lengkap
- Email
- No. Telepon
- Alamat
- Kota
- Kode Pos
- Status
- Tanggal Daftar
- Terakhir Update

## Teknologi yang Digunakan

- **Excel Export**: Library `xlsx` untuk generate file Excel
- **PDF Export**: Library `jspdf` dan `jspdf-autotable` untuk generate PDF
- **Authentication**: Export customer memerlukan token authorization admin

## API Endpoints

- `GET /api/export/reports?format=excel&type=&start_date=&end_date=`
- `GET /api/export/items?format=excel&search=&category=`
- `GET /api/export/customers?format=excel&search=&status=`

## Catatan Penting

1. **Permissions**: Export customer hanya dapat dilakukan oleh admin
2. **Filter Aktif**: Export akan menggunakan filter yang sedang aktif di halaman
3. **Performance**: Export data besar mungkin membutuhkan waktu beberapa detik
4. **Browser Compatibility**: Fitur download otomatis didukung oleh browser modern
5. **File Size**: Tidak ada batasan jumlah data yang diekspor, namun perhatikan performa untuk data sangat besar

## Troubleshooting

### Error "Gagal mengekspor ke Excel/PDF"

- Pastikan koneksi internet stabil
- Coba refresh halaman dan export ulang
- Periksa console browser untuk error detail

### File tidak terdownload

- Pastikan browser mengizinkan download
- Periksa pengaturan popup blocker
- Coba gunakan browser yang berbeda

### Export customer gagal

- Pastikan login sebagai admin
- Periksa token authentication masih valid
- Logout dan login ulang jika perlu

## Update Log

- **v1.0.0**: Fitur export Excel dan PDF untuk Reports, Items, dan Customers
- Support filter dan search pada semua halaman
- Auto-generated filename dengan timestamp
- Responsive design untuk tombol export
