# Customer Routes Fix - SQLite to MySQL2 Migration

## 🐛 Problem

Customer routes menggunakan SQLite methods (`db.get()`, `db.run()`) yang tidak kompatibel dengan MySQL2.

**Error Example:**

```
Customer registration error: TypeError: db.get is not a function
    at POST (app/api/customer/auth/register/route.ts:41:38)
```

## ✅ Solution Applied

### 1. Import Changes

**Before:**

```typescript
import { openDb } from "@/lib/db";
```

**After:**

```typescript
import { executeQuery } from "@/lib/db";
```

### 2. Database Connection Changes

**Before:**

```typescript
const db = await openDb();
```

**After:**

```typescript
// Removed - executeQuery handles connection internally
```

### 3. Query Method Changes

#### SELECT Queries (db.get → executeQuery)

**Before:**

```typescript
const customer = await db.get("SELECT * FROM customers WHERE email = ?", [
  email,
]);

if (!customer) {
  // handle not found
}
```

**After:**

```typescript
const customerResult = await executeQuery(
  "SELECT * FROM customers WHERE email = ?",
  [email]
);

if (
  !customerResult.success ||
  !Array.isArray(customerResult.data) ||
  customerResult.data.length === 0
) {
  // handle not found
}

const customer = customerResult.data[0] as any;
```

#### INSERT/UPDATE/DELETE Queries (db.run → executeQuery)

**Before:**

```typescript
const result = await db.run("INSERT INTO customers (...) VALUES (...)", [
  params,
]);

if (!result.lastID) {
  // handle error
}
```

**After:**

```typescript
const insertResult = await executeQuery(
  "INSERT INTO customers (...) VALUES (...)",
  [params]
);

if (!insertResult.success) {
  // handle error
}
```

### 4. DateTime Functions

**Before (SQLite):**

```sql
expires_at > datetime('now')
```

**After (MySQL):**

```sql
expires_at > NOW()
```

### 5. Date Handling

**Before:**

```typescript
expiresAt.toISOString();
```

**After:**

```typescript
expiresAt; // MySQL2 handles Date objects directly
```

## 📋 Files Fixed

### ✅ Completed

1. **`app/api/customer/auth/register/route.ts`**

   - ✅ Import updated
   - ✅ db.get() → executeQuery()
   - ✅ db.run() → executeQuery()
   - ✅ Result parsing updated

2. **`app/api/customer/auth/login/route.ts`**

   - ✅ Import updated
   - ✅ db.get() → executeQuery()
   - ✅ db.run() → executeQuery()
   - ✅ Result parsing updated

3. **`app/api/customer/auth/me/route.ts`**

   - ✅ Import updated
   - ✅ db.get() → executeQuery()
   - ✅ DateTime function updated (datetime('now') → NOW())

4. **`app/api/customer/auth/logout/route.ts`**
   - ✅ Import updated
   - ✅ db.run() → executeQuery()

### ✅ Recently Fixed

5. **`app/api/customer/items/route.ts`**
   - ✅ Import updated
   - ✅ db.all() → executeQuery()
   - ✅ db.get() → executeQuery()
   - ✅ Result parsing updated

### 🔄 Still Need Manual Fix

6. **`app/api/customer/cart/route.ts`**

   - ⚠️ Multiple db.get() and db.run() calls
   - ⚠️ Complex cart operations

7. **`app/api/customer/checkout/route.ts`**

   - ⚠️ Transaction handling (BEGIN/COMMIT/ROLLBACK)
   - ⚠️ Multiple db operations

## 🧪 Testing Checklist

### Customer Authentication

- [ ] Customer registration works
- [ ] Customer login works
- [ ] Customer logout works
- [ ] Customer profile (me) works

### Customer Shopping

- [x] View items/products ✅ (items API fixed)
- [ ] Add to cart
- [ ] Update cart
- [ ] Remove from cart
- [ ] Checkout process

## 🔄 Next Steps

1. **Fix remaining routes** (cart, checkout, items)
2. **Test customer registration flow**
3. **Test customer shopping flow**
4. **Update any remaining SQLite-specific queries**

## 📊 Migration Pattern

For future reference, here's the standard migration pattern:

```typescript
// 1. Change import
import { executeQuery } from "@/lib/db";

// 2. Replace db.get()
const result = await executeQuery(query, params);
if (
  !result.success ||
  !Array.isArray(result.data) ||
  result.data.length === 0
) {
  // handle not found
}
const row = result.data[0] as any;

// 3. Replace db.run()
const result = await executeQuery(query, params);
if (!result.success) {
  // handle error
}

// 4. Update SQLite-specific SQL to MySQL
// datetime('now') → NOW()
// INSERT OR IGNORE → INSERT IGNORE
// etc.
```

## 🔄 Database Structure Fix (NEW)

### ❌ Problem Found

Tabel `customers` di database menggunakan struktur lama (B2B customers) tanpa kolom `password` dan `full_name` yang diperlukan untuk e-commerce authentication.

**Error yang muncul:**

```
Unknown column 'password' in 'field list'
```

### ✅ Solution Applied

1. **Added missing columns**:

   - `password VARCHAR(255)` - untuk authentication
   - `full_name VARCHAR(255)` - nama lengkap customer
   - `is_active BOOLEAN DEFAULT true` - status aktif

2. **Created customer_sessions table** untuk session management

3. **Updated existing data** dengan default password dan mapping dari kolom `name` ke `full_name`

## ✅ Status

- [x] Authentication routes fixed
- [x] **Database structure fixed** (kolom password & full_name ditambahkan)
- [x] **Customer registration should work now**
- [x] Basic CRUD patterns established
- [ ] Shopping cart routes (in progress)
- [ ] Complex transaction handling (in progress)

## 🧪 Ready to Test

Customer authentication routes seharusnya sudah berfungsi:

- Customer registration ✅
- Customer login ✅
- Customer logout ✅
- Customer profile (me) ✅

---

**Last Updated**: 2024-12-10  
**Priority**: ✅ Authentication Fixed - Ready for Testing
