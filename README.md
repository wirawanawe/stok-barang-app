# 📦 Sistem Manajemen Stok Barang

Aplikasi web untuk mengelola stok barang dengan fitur lengkap CRUD, tracking, dan laporan. Dibangun dengan **Next.js 15**, **TypeScript**, **Tailwind CSS**, dan **MySQL2**.

## ✨ Fitur Utama

- 📊 **Dashboard** - Ringkasan stok dan statistik
- 📦 **Manajemen Barang** - CRUD barang dengan kategori dan lokasi
- 🔍 **Pencarian & Filter** - Cari barang berdasarkan nama/kode
- ⚠️ **Peringatan Stok** - Notifikasi untuk stok menipis
- 📈 **Laporan** - Analisis data stok dan transaksi
- 🏷️ **Kategori & Lokasi** - Organisasi barang yang rapi
- 📱 **Responsive Design** - Tampilan optimal di semua device

## 🛠️ Teknologi

| Komponen    | Teknologi                            |
| ----------- | ------------------------------------ |
| Frontend    | Next.js 15, TypeScript, Tailwind CSS |
| Backend API | Next.js API Routes                   |
| Database    | MySQL2                               |
| Icons       | Lucide React                         |
| Styling     | Tailwind CSS                         |

## 🚀 Cara Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd stok-barang-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database MySQL

**Buat Database:**

```sql
CREATE DATABASE stok_barang;
```

**Import Schema:**

```bash
mysql -u root -p stok_barang < database.sql
```

### 4. Konfigurasi Environment

Salin file `.env.local` dan sesuaikan dengan konfigurasi database Anda:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stok_barang

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-jwt-secret-key
```

### 5. Jalankan Aplikasi

**Development Mode:**

```bash
npm run dev
```

**Production Mode:**

```bash
npm run build
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📁 Struktur Proyek

```
stok-barang-app/
├── app/
│   ├── api/
│   │   ├── items/          # API endpoint barang
│   │   ├── categories/     # API endpoint kategori
│   │   └── locations/      # API endpoint lokasi
│   ├── items/
│   │   ├── page.tsx        # Halaman daftar barang
│   │   └── new/
│   │       └── page.tsx    # Halaman tambah barang
│   ├── layout.tsx          # Layout utama
│   └── page.tsx           # Dashboard
├── lib/
│   └── db.ts              # Konfigurasi database
├── database.sql           # Schema database
├── .env.local            # Environment variables
└── README.md
```

## 🗄️ Schema Database

### Tabel Utama:

- **users** - Data admin/pengguna
- **items** - Data barang
- **categories** - Kategori barang
- **locations** - Lokasi penyimpanan
- **stock_logs** - Log transaksi stok

### Relasi:

- items → categories (many-to-one)
- items → locations (many-to-one)
- stock_logs → items (many-to-one)
- stock_logs → users (many-to-one)

## 🎯 Cara Penggunaan

### 1. Akses Dashboard

- Buka `http://localhost:3000`
- Lihat ringkasan stok dan statistik

### 2. Kelola Barang

- Klik "Kelola Barang" atau pergi ke `/items`
- Tambah barang baru dengan tombol "Tambah Barang"
- Edit/hapus barang yang sudah ada

### 3. Pencarian & Filter

- Gunakan search box untuk mencari barang
- Filter berdasarkan kategori
- Paginasi untuk navigasi data

### 4. Monitoring Stok

- Peringatan otomatis untuk stok menipis
- Status stok: Normal / Stok Menipis
- Atur batas minimum dan maksimum stok

## 🧪 Data Default

Setelah import database, tersedia data default:

- **Admin User**: username: `admin`, password: `admin123`
- **Kategori**: Elektronik, Furniture, ATK, Konsumsi, Lainnya
- **Lokasi**: Gudang A, Gudang B, Ruang Server, Kantor, Workshop
- **Sample Items**: 4 contoh barang

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di Vercel dashboard
```

### Railway/Render

1. Push code ke GitHub
2. Connect repository ke Railway/Render
3. Set environment variables
4. Deploy MySQL database
5. Update DB connection string

## 🔧 Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Check TypeScript

```bash
npm run type-check
```

### Lint Code

```bash
npm run lint
```

## 📋 Roadmap

- [ ] Autentikasi admin
- [ ] Log aktivitas stok (masuk/keluar)
- [ ] Laporan dan grafik
- [ ] Export data (Excel/PDF)
- [ ] Notifikasi email stok menipis
- [ ] Barcode scanner
- [ ] Multi-user support

## 🤝 Kontribusi

1. Fork project
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

## 📄 Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Kontak

- **Developer**: [Your Name]
- **Email**: [your.email@example.com]
- **Project Link**: [https://github.com/yourusername/stok-barang-app]

---

⭐ Jangan lupa star project ini jika bermanfaat!
