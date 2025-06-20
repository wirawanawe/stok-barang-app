# 🔐 Setup Autentikasi Admin

Sistem autentikasi ini menggunakan JWT (JSON Web Token) dengan password hashing menggunakan bcrypt dan jose library untuk Edge Runtime compatibility.

## 📋 Fitur

- ✅ Login dengan username/email dan password
- ✅ JWT token dengan expiry 7 hari
- ✅ Password hashing menggunakan bcrypt
- ✅ Middleware proteksi untuk halaman admin
- ✅ Session management dengan localStorage dan cookies
- ✅ Logout functionality
- ✅ Role-based access control (admin/user)

## 🛠️ Setup

### 1. Environment Variables

Buat file `.env.local` di root project:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=stok_barang

# JWT Configuration - GANTI INI DI PRODUCTION!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
```

### 2. Database Setup

Pastikan database sudah dibuat dan tabel `users` sudah ada. Cek file `database.sql` untuk struktur database.

### 3. Buat Admin User

Jalankan script untuk membuat user admin:

```bash
npm run create-admin
```

Script ini akan membuat user dengan kredensial:

- **Username:** admin
- **Password:** admin123
- **Email:** admin@stokbarang.com
- **Role:** admin

## 🔑 Login Credentials

### Default Admin:

- **Username:** admin
- **Password:** admin123

## 🛡️ Protected Routes

Routes yang dilindungi middleware:

- `/items` - Halaman kelola barang
- `/reports` - Halaman laporan
- `/settings` - Halaman pengaturan (admin only)
- `/transactions` - Halaman transaksi
- API routes untuk CRUD operations

## 📱 Cara Menggunakan

### 1. Login

- Kunjungi `/login`
- Gunakan kredensial admin default
- Setelah login berhasil, akan redirect ke dashboard

### 2. Logout

- Klik tombol logout di header
- Session akan dihapus dan redirect ke login page

### 3. Role Management

- Admin: Akses penuh ke semua fitur
- User: Akses terbatas (sesuai konfigurasi middleware)

## 🔧 Customization

### Menambah Protected Routes

Edit file `middleware.ts`:

```typescript
const protectedRoutes = [
  "/items",
  "/reports",
  "/settings", // Tambahkan route baru di sini
  // ... routes lainnya
];
```

### Menambah Admin-Only Routes

```typescript
const adminOnlyRoutes = [
  "/settings",
  "/admin-panel", // Tambahkan admin-only route di sini
  // ... routes lainnya
];
```

### Mengubah Token Expiry

Edit file `lib/auth.ts`:

```typescript
const JWT_EXPIRES_IN = "7d"; // Ubah sesuai kebutuhan
```

## 🚨 Security Notes

1. **JWT Secret:** Selalu gunakan secret key yang kuat (minimal 32 karakter) di production
2. **Password Hash:** Password di-hash menggunakan bcrypt dengan salt rounds 10
3. **HTTP-Only Cookies:** Token disimpan dalam HTTP-only cookies untuk keamanan
4. **Token Verification:** Setiap request ke protected route diverifikasi tokennya
5. **Database Queries:** Menggunakan prepared statements untuk mencegah SQL injection
6. **Edge Runtime:** Menggunakan jose library untuk compatibility dengan Next.js Edge Runtime

## 🐛 Troubleshooting

### 1. Token Invalid Error

- Cek apakah JWT_SECRET di .env.local sama dengan yang digunakan saat generate token
- Clear browser localStorage dan cookies

### 2. Database Connection Error

- Pastikan database MySQL running
- Cek konfigurasi database di .env.local
- Pastikan database `stok_barang` sudah dibuat

### 3. Admin User Not Found

- Jalankan ulang `npm run create-admin`
- Cek apakah tabel `users` sudah ada di database

### 4. Middleware Redirect Loop

- Pastikan route `/login` tidak ada di `protectedRoutes`
- Cek konfigurasi middleware matcher

## 📚 API Endpoints

### Authentication

- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Request Headers

Untuk API calls yang memerlukan autentikasi, tambahkan header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 🔄 Development vs Production

### Development:

- JWT secret bisa sederhana untuk testing
- HTTP cookies (tidak secure)
- Error messages lebih detail

### Production:

- WAJIB ganti JWT_SECRET dengan key yang kuat
- HTTPS cookies (secure: true)
- Error messages generic untuk keamanan
- Set NODE_ENV=production

---

**⚠️ PENTING:** Jangan commit file `.env.local` ke git! File ini sudah ada di `.gitignore`.
