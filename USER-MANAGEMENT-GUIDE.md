# 👥 User Management - CRUD Users

Sistem manajemen user lengkap dengan operasi Create, Read, Update, Delete (CRUD) untuk mengelola akun pengguna.

## 🔧 **Fitur yang Diimplementasikan**

### ✅ **Backend API (Server-Side)**

#### 1. **API Endpoints**

- `GET /api/users` - List users dengan pagination & filter
- `POST /api/users` - Create user baru
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (soft delete)

#### 2. **Security Features**

- ✅ **Admin Only Access** - Hanya admin yang bisa akses
- ✅ **Input Validation** - Validasi semua field
- ✅ **Password Hashing** - bcrypt untuk password security
- ✅ **Duplicate Check** - Cek username/email unik
- ✅ **Self-Protection** - Admin tidak bisa hapus dirinya sendiri
- ✅ **Soft Delete** - Deactivate user alih-alih hard delete

#### 3. **Query Features**

- ✅ **Search** - Berdasarkan username, email, nama
- ✅ **Filter** - Status aktif/tidak aktif
- ✅ **Pagination** - Limit 10 per halaman
- ✅ **Sorting** - Berdasarkan tanggal dibuat (terbaru)

### ✅ **Frontend UI (Client-Side)**

#### 1. **User Interface**

- ✅ **Data Table** - Table responsive dengan informasi lengkap
- ✅ **Search Bar** - Real-time search functionality
- ✅ **Status Filter** - Filter berdasarkan status user
- ✅ **Pagination** - Navigation halaman
- ✅ **Modal Forms** - Create/Edit user dalam modal

#### 2. **Form Features**

- ✅ **Create User** - Tambah user baru
- ✅ **Edit User** - Update data user
- ✅ **Password Toggle** - Show/hide password
- ✅ **Role Selection** - Admin/User role
- ✅ **Status Toggle** - Aktif/Tidak aktif
- ✅ **Form Validation** - Client & server validation

#### 3. **User Experience**

- ✅ **Loading States** - Indicator saat loading
- ✅ **Error Handling** - Error messages yang informatif
- ✅ **Success Notifications** - Konfirmasi aksi berhasil
- ✅ **Confirmation Dialogs** - Konfirmasi sebelum delete
- ✅ **Responsive Design** - Mobile-friendly

## 📍 **Cara Menggunakan**

### 1. **Akses Halaman Users**

```
http://localhost:3000/settings/users
```

### 2. **Login sebagai Admin**

- Username: `admin`
- Password: `admin123`
- Role: `admin` (required untuk akses)

### 3. **Operasi CRUD**

#### **Create User:**

1. Klik tombol "Tambah User"
2. Isi form:
   - Username (required, unique)
   - Email (required, unique)
   - Password (required)
   - Nama Lengkap (required)
   - Role (admin/user)
   - Status Aktif (checkbox)
3. Klik "Simpan"

#### **Edit User:**

1. Klik icon edit (✏️) di row user
2. Update field yang diinginkan
3. Password opsional (kosongkan jika tidak ingin ubah)
4. Klik "Update"

#### **Delete User:**

1. Klik icon delete (🗑️) di row user
2. Konfirmasi penghapusan
3. User akan di-deactivate (soft delete)

#### **Search & Filter:**

- **Search:** Ketik di search bar (username/email/nama)
- **Filter Status:** Pilih "Aktif" atau "Tidak Aktif"
- **Pagination:** Navigate dengan tombol Previous/Next

## 🛡️ **Security Implementation**

### 1. **Access Control**

```typescript
// Middleware protection
const adminOnlyRoutes = ["/api/users"];

// API route validation
const userRole = request.headers.get("x-user-role");
if (userRole !== "admin") {
  return NextResponse.json(
    { message: "Akses ditolak. Hanya admin yang diizinkan." },
    { status: 403 }
  );
}
```

### 2. **Password Security**

```typescript
// Hash password dengan bcrypt
const hashedPassword = await hashPassword(password);

// Simpan hashed password ke database
INSERT INTO users (password) VALUES (hashedPassword)
```

### 3. **Input Validation**

```typescript
// Server-side validation
if (!username || !email || !password || !full_name) {
  return NextResponse.json(
    { message: "Semua field wajib diisi" },
    { status: 400 }
  );
}

// Check duplicate
SELECT id FROM users WHERE username = ? OR email = ?
```

### 4. **Self-Protection**

```typescript
// Prevent admin self-deletion
if (currentUserId === userId) {
  return NextResponse.json(
    { message: "Tidak dapat menghapus akun sendiri" },
    { status: 400 }
  );
}
```

## 📊 **Database Schema**

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🎯 **API Response Format**

### **Success Response:**

```json
{
  "success": true,
  "message": "User berhasil dibuat",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "role": "user",
    "is_active": true
  }
}
```

### **List Response:**

```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### **Error Response:**

```json
{
  "success": false,
  "message": "Username atau email sudah digunakan"
}
```

## 🔧 **Customization**

### 1. **Ubah Items Per Page**

```typescript
// Di file: app/api/users/route.ts
const limit = parseInt(searchParams.get("limit") || "20"); // Default 20
```

### 2. **Tambah Field Baru**

```typescript
// 1. Update database schema
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

// 2. Update TypeScript interface
interface User {
  // ... existing fields
  phone?: string;
}

// 3. Update form di frontend
```

### 3. **Custom Validation Rules**

```typescript
// Di API route
if (password && password.length < 8) {
  return NextResponse.json(
    { message: "Password minimal 8 karakter" },
    { status: 400 }
  );
}
```

## 🚀 **Next Steps**

### Fitur yang bisa ditambahkan:

1. **User Activity Logs** - Track login/logout
2. **Bulk Operations** - Multiple user actions
3. **Advanced Filtering** - By date, role, etc.
4. **Export Users** - CSV/Excel export
5. **User Avatar Upload** - Profile pictures
6. **Email Verification** - Verify email address
7. **Password Reset** - Forgot password functionality

## ✅ **Testing Checklist**

- [ ] Login sebagai admin
- [ ] Buka halaman `/settings/users`
- [ ] Test search functionality
- [ ] Test filter by status
- [ ] Create new user
- [ ] Edit existing user
- [ ] Change user password
- [ ] Toggle user status
- [ ] Try to delete user (soft delete)
- [ ] Test pagination
- [ ] Test form validation
- [ ] Test error handling

---

**🎉 User Management CRUD sekarang sudah aktif dan siap digunakan!**
