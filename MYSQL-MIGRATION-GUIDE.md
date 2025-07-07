# 🚀 Panduan Migrasi dari SQLite ke MySQL2

Aplikasi ini telah berhasil diubah dari SQLite ke MySQL2. Berikut adalah panduan lengkap untuk setup dan migrasi.

## 📋 Persiapan

### 1. **Install MySQL Server**

#### Windows:

```bash
# Download dari https://dev.mysql.com/downloads/mysql/
# Atau menggunakan XAMPP/WAMPP
```

#### macOS:

```bash
brew install mysql
brew services start mysql
```

#### Ubuntu/Linux:

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. **Setup MySQL Database**

```sql
-- Login ke MySQL
mysql -u root -p

-- Buat database
CREATE DATABASE stok_barang;

-- Buat user khusus (opsional)
CREATE USER 'stokbarang_user'@'localhost' IDENTIFIED BY 'password_kuat';
GRANT ALL PRIVILEGES ON stok_barang.* TO 'stokbarang_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. **Environment Variables**

Buat file `.env.local` di root project:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=stok_barang

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
NODE_ENV=development
```

## 🗄️ Database Setup

### 1. **Import Schema MySQL**

```bash
# Import schema utama
mysql -u root -p stok_barang < database-mysql.sql

# Atau jika menggunakan phpmyadmin, import file database-mysql.sql
```

### 2. **Verifikasi Database**

```sql
USE stok_barang;
SHOW TABLES;

-- Pastikan tabel berikut ada:
-- users, user_sessions, categories, locations, items, stock_logs
-- customers, customer_sessions, carts, orders, order_items
```

### 3. **Buat Admin User**

```bash
# Otomatis
npm run create-admin

# Atau interaktif
npm run create-admin-interactive
```

## 🔄 Perubahan Utama

### **Database Configuration (lib/db.ts)**

```typescript
// SEBELUM (SQLite)
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

// SESUDAH (MySQL2)
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "stok_barang",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
```

### **SQL Syntax Changes**

| SQLite                              | MySQL                            |
| ----------------------------------- | -------------------------------- |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `INT AUTO_INCREMENT PRIMARY KEY` |
| `INSERT OR IGNORE`                  | `INSERT IGNORE`                  |
| `PRAGMA table_info`                 | `DESCRIBE table_name`            |
| `BOOLEAN DEFAULT 1`                 | `BOOLEAN DEFAULT true`           |
| `TEXT CHECK (column IN (...))`      | `ENUM('value1', 'value2')`       |

### **Dependency Changes**

```json
// Dihapus dari package.json
{
  "sqlite": "^5.1.1",
  "sqlite3": "^5.1.7"
}

// Tetap ada
{
  "mysql2": "^3.14.1"
}
```

## 🏃‍♂️ Menjalankan Aplikasi

### 1. **Install Dependencies**

```bash
npm install
# SQLite dependencies akan dihapus otomatis
```

### 2. **Start Development Server**

```bash
npm run dev
```

### 3. **Verifikasi Koneksi**

- Buka browser ke `http://localhost:3000`
- Login dengan:
  - Username: `admin`
  - Password: `admin123`

## 🔍 Troubleshooting

### **Error: ER_ACCESS_DENIED_ERROR**

```bash
# Periksa username/password MySQL
mysql -u root -p

# Reset password MySQL (jika perlu)
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### **Error: ER_BAD_DB_ERROR**

```sql
-- Database belum dibuat
CREATE DATABASE stok_barang;
```

### **Error: Connection Timeout**

```env
# Tambah di .env.local
DB_HOST=127.0.0.1
# Atau
DB_HOST=localhost
```

### **Error: Too Many Connections**

```sql
-- Tingkatkan connection limit di MySQL
SET GLOBAL max_connections = 200;
```

## 📊 Performance Tips

### **1. Index Optimization**

```sql
-- Sudah ada di schema, tapi bisa ditambah sesuai kebutuhan
CREATE INDEX idx_items_created_at ON items(created_at);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### **2. Connection Pooling**

Database connection sudah menggunakan pooling:

```typescript
const dbConfig = {
  // ...
  waitForConnections: true,
  connectionLimit: 10, // Sesuaikan dengan kebutuhan
  queueLimit: 0,
};
```

### **3. Query Optimization**

```sql
-- Aktifkan query cache (MySQL 5.7 ke bawah)
SET GLOBAL query_cache_type = ON;
SET GLOBAL query_cache_size = 268435456; -- 256MB
```

## 🚀 Production Deployment

### **1. Environment Variables**

```env
# Production
NODE_ENV=production
DB_HOST=your-production-mysql-host
DB_USER=your-production-user
DB_PASSWORD=strong-production-password
JWT_SECRET=very-strong-jwt-secret-256-bit
```

### **2. Security Hardening**

```sql
-- Hapus test database
DROP DATABASE test;

-- Hapus anonymous users
DELETE FROM mysql.user WHERE User='';

-- Disable remote root
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

FLUSH PRIVILEGES;
```

### **3. Backup Strategy**

```bash
# Daily backup
mysqldump -u root -p stok_barang > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
mysqldump -u root -p"$DB_PASSWORD" stok_barang | gzip > /backups/stok_barang_$(date +%Y%m%d_%H%M%S).sql.gz
```

## ✅ Checklist Migrasi

- [ ] MySQL Server terinstall dan berjalan
- [ ] Database `stok_barang` dibuat
- [ ] File `.env.local` dikonfigurasi
- [ ] Schema database diimport (`database-mysql.sql`)
- [ ] Admin user dibuat
- [ ] Dependencies diupdate (`npm install`)
- [ ] Aplikasi berjalan tanpa error
- [ ] Login admin berhasil
- [ ] Data sample tersedia
- [ ] Semua fitur CRUD berfungsi

## 🆘 Support

Jika mengalami masalah:

1. Periksa log MySQL: `tail -f /var/log/mysql/error.log`
2. Periksa log aplikasi di terminal
3. Verifikasi koneksi database
4. Pastikan semua environment variables benar

## 📚 Referensi

- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [MySQL Installation Guide](https://dev.mysql.com/doc/refman/8.0/en/installing.html)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

🎉 **Selamat! Aplikasi telah berhasil dimigrasi ke MySQL2!**
