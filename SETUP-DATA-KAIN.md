# 📦 Setup Data Dummy Stok Kain

## Instruksi Import Data

### 1. Pastikan Database Sudah Ready

```bash
# Pastikan MySQL sudah running
mysql -u root -p

# Import schema database utama dulu
mysql -u root -p stok_barang < database.sql
```

### 2. Import Data Dummy Kain

```bash
# Import data dummy khusus kain
mysql -u root -p stok_barang < dummy-data-kain.sql
```

## 📊 Data Yang Diinsert

### 🏷️ **Kategori Kain (10 kategori):**

- **Katun** - Kain katun alami dan campuran
- **Polyester** - Kain sintetis polyester
- **Sutra** - Kain sutra premium
- **Linen** - Kain linen dan rami
- **Denim** - Kain denim dan jeans
- **Wool** - Kain wool untuk musim dingin
- **Chiffon** - Kain chiffon tipis dan elegan
- **Satin** - Kain satin mengkilap
- **Jersey** - Kain jersey untuk kaos
- **Batik** - Kain batik tradisional Indonesia

### 🏢 **Lokasi Gudang (10 lokasi):**

- **Gudang A1** - Katun dan linen
- **Gudang A2** - Polyester dan sintetis
- **Gudang B1** - Kain premium (sutra, wool, satin)
- **Gudang B2** - Kain casual (jersey, denim)
- **Gudang C** - Kain motif dan batik
- **Showroom** - Display dan sample
- **Quality Control** - Area inspeksi
- **Cutting Room** - Ruang potong
- **Storage Dingin** - Penyimpanan sensitif
- **Ekspor Area** - Area ekspor

### 🧵 **Jenis Kain (28 items):**

#### Katun (5 items):

- KTN001: Katun Combed 30s - Rp 25.000/meter
- KTN002: Katun Canvas - Rp 35.000/meter
- KTN003: Katun Drill - Rp 28.000/meter
- KTN004: Katun Voile - Rp 22.000/meter
- KTN005: Katun Linen Look - Rp 32.000/meter

#### Polyester (5 items):

- PLY001: Polyester Satin - Rp 18.000/meter
- PLY002: Polyester Crepe - Rp 24.000/meter
- PLY003: Polyester Spandex - Rp 30.000/meter
- PLY004: Polyester Chiffon - Rp 20.000/meter
- PLY005: Polyester Gabardine - Rp 26.000/meter

#### Sutra (4 items):

- SLK001: Sutra Organza - Rp 85.000/meter
- SLK002: Sutra Dupioni - Rp 95.000/meter
- SLK003: Sutra Satin - Rp 120.000/meter ⚠️ Stok Menipis
- SLK004: Sutra Crepe de Chine - Rp 75.000/meter

#### Wool (3 items):

- WOL001: Wool Cashmere - Rp 180.000/meter ⚠️ Stok Menipis
- WOL002: Wool Flannel - Rp 95.000/meter
- WOL003: Wool Crepe - Rp 125.000/meter

#### Dan kategori lainnya...

### 📈 **Sample Transaksi (8 log):**

- ✅ Restok katun combed dari supplier
- ✅ Pengambilan untuk order customer
- ✅ Import sutra dari Thailand
- ✅ Sample untuk fashion week
- ✅ Order premium Jakarta
- Dan transaksi lainnya...

## 🎯 **Fitur Testing:**

### ✅ **Dashboard:**

- Total 28 jenis kain
- 6 item dengan stok menipis
- Total nilai stok: ~Rp 1.2 Miliar

### ✅ **Pencarian & Filter:**

- Cari: "katun", "sutra", "denim"
- Filter kategori: Katun, Polyester, dll
- Pagination untuk 28 items

### ✅ **Transaksi:**

- Test stok masuk kain baru
- Test stok keluar untuk order
- Validasi stok tidak minus

### ✅ **Laporan:**

- Riwayat 8 transaksi sample
- Filter by jenis transaksi
- Detail before/after stok

## 💡 **Skenario Testing:**

1. **Login Dashboard** - Lihat ringkasan stok kain
2. **Tambah Kain Baru** - Input kain import terbaru
3. **Edit Harga** - Update harga sesuai pasar
4. **Transaksi Masuk** - Restok kain laris
5. **Transaksi Keluar** - Order customer besar
6. **Lihat Laporan** - Analisis pergerakan stok
7. **Filter & Search** - Cari kain spesifik

## 🚨 **Alert Testing:**

Data sudah include kain dengan stok menipis:

- **Sutra Satin** (5 meter) - Perlu restok urgent
- **Wool Cashmere** (5 meter) - Premium stock low
- **Sutra Dupioni** (8 meter) - Import needed
- **Batik Tulis Solo** (8 meter) - Handmade exclusive

---

**Happy Testing! 🧵✨**
