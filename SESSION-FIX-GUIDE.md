# Panduan Memperbaiki Masalah Session Login/Logout

## 🐛 Masalah yang Dilaporkan

Admin tidak bisa login kembali setelah logout karena gagal membuat session login.

## 🔍 Root Cause Analysis

1. **Database Constraint Issue**: Tabel `user_sessions` memiliki `UNIQUE KEY unique_user_session (user_id)` yang hanya mengizinkan satu record per user
2. **Session Management Logic**: Saat logout, session hanya di-set `is_active = false` tanpa dihapus
3. **Conflict saat Login**: Ketika login lagi, constraint unique mencegah pembuatan session baru karena masih ada record lama

## ✅ Solusi yang Diterapkan

### 1. Perbaikan Database Schema

```sql
-- Hapus constraint yang bermasalah
ALTER TABLE user_sessions DROP INDEX unique_user_session;

-- Bersihkan data lama
UPDATE user_sessions
SET is_active = false
WHERE expires_at <= NOW() OR is_active = false;
```

### 2. Perbaikan Kode Session Management

**File: `lib/auth.ts`**

#### Perubahan di `createUserSession()`:

```typescript
// SEBELUM (bermasalah):
await executeQuery(
  "UPDATE user_sessions SET is_active = false WHERE user_id = ?",
  [userId]
);

// SESUDAH (diperbaiki):
await executeQuery("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
```

#### Perubahan di `removeUserSession()`:

```typescript
// SEBELUM (bermasalah):
await executeQuery(
  "UPDATE user_sessions SET is_active = false WHERE session_token = ?",
  [sessionToken]
);

// SESUDAH (diperbaiki):
await executeQuery("DELETE FROM user_sessions WHERE session_token = ?", [
  sessionToken,
]);
```

#### Perubahan di `removeAllUserSessions()`:

```typescript
// SEBELUM (bermasalah):
await executeQuery(
  "UPDATE user_sessions SET is_active = false WHERE user_id = ?",
  [userId]
);

// SESUDAH (diperbaiki):
await executeQuery("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
```

## 🔧 Cara Menerapkan Fix

### Step 1: Backup Database

```bash
mysqldump -u root -p stok_barang > backup_before_session_fix.sql
```

### Step 2: Jalankan Script Fix

```bash
mysql -u root -p stok_barang < fix-session-constraint.sql
```

### Step 3: Update Kode

Kode sudah diupdate di `lib/auth.ts`. Pastikan perubahan tersimpan.

### Step 4: Restart Aplikasi

```bash
npm run dev
```

## 🧪 Cara Testing Manual

### Test 1: Login Admin

1. Buka browser dan akses `http://localhost:3000/dashboard/login`
2. Login dengan credentials admin
3. Cek apakah berhasil masuk dashboard

### Test 2: Logout

1. Klik tombol logout
2. Pastikan diarahkan ke halaman login

### Test 3: Login Lagi

1. **Test Utama**: Coba login lagi dengan credentials yang sama
2. **Expected Result**: Harus berhasil masuk tanpa error "gagal membuat session"

### Test 4: Cek Database

```sql
-- Cek structure table
SHOW INDEXES FROM user_sessions;

-- Cek data session
SELECT * FROM user_sessions;

-- Pastikan tidak ada constraint unique_user_session
```

## 🎯 Keuntungan Solusi Ini

1. **Sederhana & Reliable**: Menghapus session fisik lebih sederhana dari pada mengelola status aktif/non-aktif
2. **No Constraint Conflicts**: Tidak ada lagi konflik unique constraint
3. **Clean Data**: Database tetap bersih karena session lama dihapus
4. **Better Performance**: Query lebih cepat karena tidak perlu filter `is_active`

## 🔄 Migration Strategy untuk Production

### Option 1: Zero Downtime

```sql
-- 1. Backup dulu
mysqldump -u root -p stok_barang > production_backup.sql

-- 2. Run fix script saat traffic rendah
mysql -u root -p stok_barang < fix-session-constraint.sql

-- 3. Deploy kode baru
-- 4. Monitor logs untuk error
```

### Option 2: Maintenance Window

1. Set maintenance mode
2. Run database fix
3. Deploy new code
4. Test thoroughly
5. Remove maintenance mode

## 📊 Monitoring & Logging

Setelah fix diterapkan, monitor hal berikut:

1. **Login Success Rate**: Pastikan tidak ada error "gagal membuat session"
2. **Session Count**: Monitor jumlah session aktif
3. **Database Performance**: Pastikan query session tidak lambat
4. **Error Logs**: Watch for any session-related errors

## 🚨 Rollback Plan

Jika terjadi masalah, rollback dengan:

```sql
-- 1. Restore database
mysql -u root -p stok_barang < backup_before_session_fix.sql

-- 2. Revert code changes
git checkout HEAD~1 -- lib/auth.ts

-- 3. Restart aplikasi
```

## ✅ Verification Checklist

- [ ] Database constraint `unique_user_session` telah dihapus
- [ ] Kode session management telah diupdate
- [ ] Admin bisa login → logout → login lagi tanpa error
- [ ] Session lama terhapus otomatis saat login baru
- [ ] No error logs related to session creation
- [ ] Performance query session normal

---

**Status**: ✅ Fix Ready to Deploy  
**Last Updated**: $(date)  
**Tested On**: Development Environment
