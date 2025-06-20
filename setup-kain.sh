#!/bin/bash

# 🧵 Setup Data Dummy Stok Kain
# Script untuk import data kain ke database MySQL

echo "🧵 =================================================="
echo "   SETUP DATA DUMMY APLIKASI STOK KAIN"
echo "=================================================="
echo ""

# Variabel database
DB_NAME="stok_barang"
DB_USER="root"

# Cek apakah database.sql ada
if [ ! -f "database.sql" ]; then
    echo "❌ File database.sql tidak ditemukan!"
    echo "   Pastikan file database.sql ada di folder ini"
    exit 1
fi

# Cek apakah dummy-data-kain.sql ada
if [ ! -f "dummy-data-kain.sql" ]; then
    echo "❌ File dummy-data-kain.sql tidak ditemukan!"
    echo "   Pastikan file dummy-data-kain.sql ada di folder ini"
    exit 1
fi

echo "📋 Mempersiapkan import data..."
echo ""

# Import schema database
echo "1️⃣ Import schema database..."
mysql -u $DB_USER -p $DB_NAME < database.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema database berhasil diimport"
else
    echo "❌ Gagal import schema database"
    exit 1
fi

echo ""

# Import data dummy kain
echo "2️⃣ Import data dummy kain..."
mysql -u $DB_USER -p $DB_NAME < dummy-data-kain.sql

if [ $? -eq 0 ]; then
    echo "✅ Data dummy kain berhasil diimport"
else
    echo "❌ Gagal import data dummy kain"
    exit 1
fi

echo ""
echo "🎉 SETUP SELESAI!"
echo ""
echo "📊 Data yang telah diimport:"
echo "   • 10 Kategori kain (Katun, Sutra, Polyester, dll)"
echo "   • 10 Lokasi gudang"
echo "   • 28 Jenis kain dengan harga realistis"
echo "   • 8 Sample transaksi stok"
echo "   • Beberapa kain dengan stok menipis untuk testing alert"
echo ""
echo "🚀 Jalankan aplikasi:"
echo "   npm run dev"
echo ""
echo "🌐 Buka browser:"
echo "   http://localhost:3000"
echo ""
echo "Happy testing! 🧵✨" 