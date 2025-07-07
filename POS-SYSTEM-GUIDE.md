# 🛒 POS System Guide - Sistem Point of Sale

## 📋 Overview

Sistem POS (Point of Sale) telah berhasil diimplementasikan untuk menggantikan halaman transaksi stok sederhana menjadi sistem penjualan yang lebih komprehensif. Sistem ini memungkinkan kasir untuk melakukan penjualan langsung dengan interface yang user-friendly.

## 🚀 Fitur Utama

### ✅ Yang Sudah Diimplementasikan

1. **Interface POS Modern**

   - Grid produk dengan search functionality
   - Keranjang belanja interaktif
   - Kalkulator pembayaran otomatis
   - Support untuk multiple payment methods

2. **Manajemen Produk**

   - Pencarian produk by name/code
   - Informasi stok real-time
   - Validasi stok otomatis
   - Kategori produk

3. **Sistem Pembayaran**

   - Cash, Card, Bank Transfer
   - Perhitungan kembalian otomatis
   - Validasi jumlah pembayaran

4. **Manajemen Pelanggan**

   - Pilihan walk-in customer
   - Integrasi dengan database customer
   - Search customer by name/email/phone

5. **Receipt & Reporting**

   - Auto-generate receipt untuk print
   - Logging transaksi ke database
   - Update stok otomatis
   - Stock logs integration

6. **Database Schema**
   - `pos_transactions` - data transaksi utama
   - `pos_transaction_items` - detail item per transaksi
   - Views untuk reporting (daily sales, popular items)
   - Stored procedures untuk backup dan analytics

## 🖥️ Cara Menggunakan

### 1. Akses POS System

1. Login ke dashboard admin
2. Klik menu **"POS / Transaksi"** di sidebar
3. Halaman POS akan terbuka dengan layout 3 kolom:
   - **Kiri**: Grid produk
   - **Kanan**: Keranjang & pembayaran

### 2. Menambah Produk ke Keranjang

1. **Cari Produk**: Gunakan search box untuk mencari produk
2. **Klik Produk**: Klik card produk untuk menambah ke keranjang
3. **Adjust Quantity**: Gunakan tombol +/- di keranjang untuk ubah jumlah
4. **Remove Item**: Klik tombol trash untuk hapus item

### 3. Memilih Customer (Opsional)

1. Klik tombol **"Pilih pelanggan"**
2. Pilih **"Walk-in Customer"** untuk pelanggan tanpa data
3. Atau search dan pilih customer terdaftar
4. Customer terpilih akan tampil di keranjang

### 4. Proses Pembayaran

1. Klik tombol **"Bayar"** di keranjang
2. Modal pembayaran akan terbuka
3. Pilih metode pembayaran:
   - **Tunai**: Masukkan jumlah yang dibayar (kembalian dihitung otomatis)
   - **Kartu**: Langsung proceed
   - **Transfer Bank**: Langsung proceed
4. Klik **"Bayar"** untuk konfirmasi

### 5. Receipt & Completion

1. Setelah pembayaran berhasil:
   - Receipt otomatis terbuka di window baru
   - Stok produk terupdate otomatis
   - Transaksi tercatat di database
   - Keranjang otomatis clear

## 📊 Database Structure

### pos_transactions

```sql
- id: Primary key
- transaction_number: Unique transaction ID (POS-timestamp)
- customer_id: Link ke customer (nullable)
- user_id: Kasir yang melakukan transaksi
- payment_method: cash/card/bank_transfer
- total_amount: Total pembayaran
- paid_amount: Jumlah yang dibayar
- change_amount: Kembalian
- status: pending/completed/cancelled
- created_at: Timestamp transaksi
```

### pos_transaction_items

```sql
- id: Primary key
- transaction_id: Link ke pos_transactions
- item_id: Link ke items
- quantity: Jumlah item
- unit_price: Harga per unit
- total_price: Total harga item
```

## 🔧 Technical Details

### API Endpoints

1. **POST** `/api/pos/transactions`

   - Create new POS transaction
   - Validasi stok
   - Update inventory
   - Generate receipt

2. **GET** `/api/pos/transactions`
   - Retrieve transaction history
   - Pagination support
   - Filter by date/customer

### Key Features

- **Real-time Stock Validation**: Sistem check stok sebelum transaksi
- **Automatic Stock Updates**: Stok berkurang otomatis setelah penjualan
- **Transaction Logging**: Semua transaksi tercatat di stock_logs
- **Error Handling**: Comprehensive error messages
- **Responsive Design**: Works on desktop dan tablet

## 📈 Reporting Views

### Daily Sales Summary

```sql
SELECT * FROM pos_transaction_summary
WHERE transaction_date = CURDATE();
```

### Popular Items

```sql
SELECT * FROM pos_popular_items
LIMIT 10;
```

### Sales by Payment Method

```sql
SELECT payment_method, COUNT(*), SUM(total_amount)
FROM pos_transactions
WHERE DATE(created_at) = CURDATE()
GROUP BY payment_method;
```

## 🛠️ Setup & Installation

### 1. Database Setup

```bash
mysql -u root -p stok_barang < database-pos.sql
```

### 2. Required Tables

- Ensure `items` table has `price` column
- Ensure `customers` table exists
- Ensure `users` table exists for cashier info

### 3. Permissions

- Kasir need access to `/dashboard/transactions`
- Feature toggle: `transactions` must be enabled

## 🎯 Best Practices

### Untuk Kasir

1. **Check Stok**: Selalu check stok sebelum promise ke customer
2. **Verify Customer**: Pastikan data customer benar jika diperlukan
3. **Double Check**: Review keranjang sebelum bayar
4. **Print Receipt**: Selalu print receipt untuk customer

### Untuk Admin

1. **Monitor Stok**: Regular check low stock items
2. **Backup Data**: Regular backup transaksi data
3. **Review Reports**: Daily review sales performance
4. **Update Prices**: Keep product prices up to date

## 🚨 Troubleshooting

### Common Issues

1. **"Stok tidak mencukupi"**

   - Check current stock di items page
   - Update stock jika perlu
   - Refresh halaman POS

2. **"Authentication required"**

   - User belum login
   - Session expired
   - Login ulang

3. **"Item not found"**

   - Produk mungkin dihapus/nonaktif
   - Check di items management
   - Refresh product list

4. **Receipt tidak muncul**
   - Browser block popup
   - Allow popup untuk domain
   - Atau download manual

## 📞 Support

### Database Maintenance

- Daily: Check `pos_transaction_summary`
- Weekly: Run backup procedures
- Monthly: Analyze `pos_popular_items`

### Performance Optimization

- Index pada `created_at` untuk faster queries
- Regular cleanup old transaction data
- Monitor database size

---

## 🎉 Migration Summary

**Before**: Simple stock in/out transaction page
**After**: Complete POS system dengan:

- ✅ Product selection interface
- ✅ Shopping cart functionality
- ✅ Customer management
- ✅ Multiple payment methods
- ✅ Receipt generation
- ✅ Inventory integration
- ✅ Comprehensive reporting
- ✅ Database schema untuk analytics

Sistem POS ini menggantikan halaman transaksi sederhana dan memberikan pengalaman yang lebih profesional untuk operasi retail.
