# Super Admin Implementation Guide

## Overview

Fitur Super Admin memungkinkan kontrol penuh terhadap sistem dengan kemampuan untuk:

- Mengatur fitur mana yang aktif/non-aktif
- Mengontrol akses halaman berdasarkan role
- Menyembunyikan keberadaan role super admin dari user dan admin biasa
- Mengelola konfigurasi sistem

## 🔐 Keamanan Super Admin

### Role Hierarchy

1. **Super Admin** - Akses penuh ke semua fitur dan kontrol sistem
2. **Admin** - Akses ke fitur administrasi standar
3. **User** - Akses terbatas ke fitur dasar

### Hidden Role System

- Role super admin disembunyikan dari user dan admin biasa
- Di UI, super admin ditampilkan sebagai "admin" untuk user lain
- Menu super admin hanya muncul untuk super admin

## 📋 Langkah-langkah Implementasi

### 1. Database Migration

Jalankan migration script untuk menambahkan tabel dan data yang diperlukan:

```bash
mysql -u [username] -p [database_name] < database-super-admin.sql
```

#### Tabel yang ditambahkan:

- **feature_toggles** - Mengatur fitur yang aktif/non-aktif
- **page_access** - Mengontrol akses halaman berdasarkan role
- **system_config** - Konfigurasi sistem global

#### User Super Admin Default:

- **Username**: `superadmin`
- **Password**: `SuperAdmin123!`
- **Email**: `superadmin@system.com`

⚠️ **PENTING**: Segera ganti password default setelah instalasi!

### 2. Struktur File Baru

```
app/
├── api/super-admin/
│   ├── features/route.ts      # API untuk feature toggles
│   └── pages/route.ts         # API untuk page access control
├── api/public/
│   ├── features/route.ts      # Public API untuk features
│   └── pages/route.ts         # Public API untuk pages
└── dashboard/super-admin/
    └── features/page.tsx      # UI untuk manage features

lib/
├── feature-context.tsx        # Context untuk feature management
└── auth-context.tsx          # Updated dengan super admin support

components/
└── Sidebar.tsx               # Updated dengan super admin menu
```

### 3. Fitur Super Admin Menu

Menu super admin hanya muncul untuk role `super_admin`:

- **Feature Toggles** - Enable/disable fitur sistem
- **Page Access Control** - Kontrol akses halaman
- **System Configuration** - Pengaturan sistem
- **User Roles** - Manajemen role user

## 🎛️ Feature Toggle System

### Kategori Features:

- **Core** - Fitur inti (Dashboard, Items, dll)
- **Admin** - Fitur administrasi
- **eCommerce** - Fitur toko online
- **Export** - Fitur ekspor data
- **Advanced** - Fitur lanjutan

### Penggunaan dalam Komponen:

```typescript
import { useFeatures } from "@/lib/feature-context";

function MyComponent() {
  const { isFeatureEnabled, hasPageAccess } = useFeatures();

  if (!isFeatureEnabled("reports")) {
    return <div>Feature tidak tersedia</div>;
  }

  return <div>Content...</div>;
}
```

## 🔒 Page Access Control

### Role Requirements:

- **super_admin** - Akses ke semua halaman
- **admin** - Akses ke halaman admin dan user
- **user** - Akses hanya ke halaman user

### Filtering di Sidebar:

```typescript
const visibleMenuItems = menuItems.filter((item) => {
  const featureEnabled = isFeatureEnabled(item.featureKey);
  const pageAccessible = hasPageAccess(item.pageKey);
  return featureEnabled && pageAccessible;
});
```

## 🛡️ Keamanan API

### Super Admin Verification:

```typescript
async function verifySuperAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  const user = await getUserById(decoded.userId);

  if (user.role !== "super_admin") {
    throw new Error("Access denied - Super admin required");
  }

  return { user };
}
```

### Endpoint Protection:

- `/api/super-admin/*` - Hanya super admin
- `/api/public/*` - Semua user yang terautentikasi
- Fallback ke fitur default jika database error

## 🎨 UI Guidelines

### Visual Hierarchy:

- **Purple gradient** untuk menu super admin
- **Shield icon** untuk identitas super admin
- **Hidden indicators** untuk super admin status

### Responsive Design:

- Mobile-friendly interface
- Collapsible menus
- Touch-friendly controls

## 📊 Monitoring & Logs

### Tracking Changes:

- Semua perubahan feature toggle dicatat
- Page access modifications dilog
- Super admin actions dimonitor

### Security Measures:

- Rate limiting pada API super admin
- Session validation untuk setiap request
- Audit trail untuk aktivitas sensitif

## 🔧 Configuration

### Environment Variables:

```env
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=stok_barang
```

### Default Configurations:

- `hide_super_admin=true` - Sembunyikan role dari user lain
- `maintenance_mode=false` - Mode maintenance
- `session_timeout=86400` - Timeout session (24 jam)

## 🚀 Deployment

### Production Checklist:

- [ ] Ganti password super admin default
- [ ] Set environment variables yang aman
- [ ] Test semua fitur toggle
- [ ] Verify page access controls
- [ ] Monitor sistem logs

### Backup Strategy:

- Backup database secara berkala
- Export konfigurasi feature toggles
- Dokumentasi setup custom

## 🆘 Troubleshooting

### Common Issues:

**1. Super admin menu tidak muncul**

- Cek role user di database
- Verify JWT token
- Refresh browser cache

**2. Feature tidak ter-disable**

- Cek database connection
- Verify feature key
- Check browser console errors

**3. Akses ditolak**

- Verify super admin role
- Check session validity
- Review API logs

### Debug Commands:

```sql
-- Check user roles
SELECT id, username, role FROM users;

-- Check feature toggles
SELECT feature_key, is_enabled FROM feature_toggles;

-- Check page access
SELECT page_key, is_enabled, required_role FROM page_access;
```

## 📖 Best Practices

### Security:

1. Selalu gunakan HTTPS di production
2. Implementasi rate limiting
3. Monitor super admin activities
4. Regular security audits

### Performance:

1. Cache feature toggles di client
2. Lazy load super admin components
3. Optimize database queries
4. Use connection pooling

### Maintenance:

1. Regular backup database
2. Monitor error logs
3. Keep documentation updated
4. Test feature toggles regularly

## 🔄 Future Enhancements

### Planned Features:

- [ ] Scheduled feature toggles
- [ ] Role-based feature access
- [ ] Advanced audit logging
- [ ] System health monitoring
- [ ] Automated backups

### Extensibility:

- Plugin system untuk custom features
- API untuk third-party integrations
- Advanced user management
- Multi-tenant support

---

## 🚧 Under Maintenance Page System

### Fitur Halaman Under Maintenance

**Design yang Indah:**

- ✨ Modern gradient background (blue to indigo)
- 🔧 Professional maintenance icon dengan animasi
- 🎭 Floating animation elements (bounce, pulse, ping)
- 📱 Responsive design untuk semua device
- 🇮🇩 User-friendly messages dalam Bahasa Indonesia

**Komponen Features:**

- **Loading state** dengan smooth spinner
- **Action buttons** - "Kembali ke Beranda" dan "Muat Ulang"
- **Contact support** - Email dan telepon
- **Progress indicators** - Visual cues untuk maintenance
- **Background animations** - Subtle animated elements

### FeatureGuard Component

```typescript
import { FeatureGuard } from "@/lib/feature-context";

// Proteksi halaman dengan feature control
<FeatureGuard featureKey="homepage" pageKey="homepage" userRole="user">
  <YourPageContent />
</FeatureGuard>;
```

**Parameters:**

- `featureKey` - Key fitur yang dicek (opsional)
- `pageKey` - Key halaman untuk access control (opsional)
- `userRole` - Role user untuk validasi (default: "user")
- `fallback` - Custom maintenance page (opsional)

### Homepage Protection

**Implementasi Homepage Control:**

- Homepage (`/`) sekarang dilindungi dengan FeatureGuard
- Mengecek feature `homepage` dan page access `homepage`
- Fallback system - homepage enabled by default jika tidak ada di database
- Super admin bisa disable homepage melalui feature control

**Error Handling yang Robust:**

- ✅ Fixed "useAuth must be used within an AuthProvider" errors
- ✅ Fallback systems di FeatureProvider dan Sidebar
- ✅ Graceful degradation saat AuthProvider tidak tersedia
- ✅ Semua halaman load dengan Status 200

### Testing Under Maintenance

**Cara Test Manual:**

1. Login sebagai super admin
2. Masuk ke "System Control" → "Features"
3. Disable feature yang diinginkan (misal: `customer_portal`)
4. Kunjungi halaman terkait (`/shop`) - akan muncul under maintenance
5. Re-enable feature untuk mengembalikan normal

**Halaman yang Bisa Dikontrol:**

- `/` (Homepage) - via `homepage` feature
- `/shop` - via `customer_portal` feature
- `/cart` - via `shopping_cart` feature
- `/checkout` - via `checkout` feature
- `/order-confirmation` - via `order_confirmation` feature

### Status Update

**✅ Fitur Berhasil Diimplementasikan:**

- 🎨 Beautiful under maintenance page dengan modern design
- 🏠 Homepage protection dengan FeatureGuard
- 🛡️ Enhanced error handling dan fallback systems
- 🔧 Robust FeatureProvider yang bekerja tanpa AuthProvider
- 📱 Responsive maintenance page untuk semua device
- ⚡ All pages load correctly (Status 200)
- 🔄 Smooth loading states dan transitions

---

**⚠️ PERINGATAN KEAMANAN**
Fitur super admin memberikan akses penuh ke sistem. Pastikan:

- Hanya orang yang terpercaya yang memiliki akses
- Password yang kuat dan unik
- Monitor aktivitas secara berkala
- Backup data secara rutin

---

**🎉 IMPLEMENTASI SELESAI**
Sistem super admin dengan halaman under maintenance yang indah telah berhasil diimplementasikan dan siap digunakan!
