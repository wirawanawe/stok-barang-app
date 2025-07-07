# Customer Code Field Fix

## 🐛 Problem

Customer registration gagal dengan error:

```
Field 'customer_code' doesn't have a default value
```

## 🔍 Root Cause

Tabel `customers` memiliki kolom `customer_code` yang:

- NOT NULL (required)
- UNIQUE (must be unique)
- Tidak ada default value
- Tidak disertakan dalam INSERT statement

## ✅ Solution Applied

### 1. Customer Registration (`app/api/customer/auth/register/route.ts`)

**Added customer_code generation:**

```typescript
// Generate unique customer_code
const customerCode =
  "CUST" +
  Date.now().toString().slice(-8) +
  Math.random().toString(36).substring(2, 4).toUpperCase();

// Insert with customer_code
const insertResult = await executeQuery(
  "INSERT INTO customers (customer_code, email, password, full_name, phone, address, city, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  [
    customerCode,
    email,
    hashedPassword,
    full_name,
    phone,
    address,
    city,
    postal_code,
  ]
);
```

### 2. Customer Login (`app/api/customer/auth/login/route.ts`)

**Added customer_code to SELECT:**

```typescript
const customerResult = await executeQuery(
  "SELECT id, customer_code, email, password, full_name, phone, address, city, postal_code, is_active FROM customers WHERE email = ?",
  [email]
);
```

### 3. Customer Profile (`app/api/customer/auth/me/route.ts`)

**Added customer_code to SELECT:**

```typescript
const customerResult = await executeQuery(
  "SELECT id, customer_code, email, full_name, phone, address, city, postal_code, is_active FROM customers WHERE id = ?",
  [decoded.customerId]
);
```

## 🎯 Customer Code Format

Generated format: `CUST{timestamp}{random}`

- Example: `CUST12345678AB`
- `CUST` prefix untuk identifier
- 8 digit timestamp (last 8 digits)
- 2 karakter random uppercase

## ✅ Files Modified

- ✅ `app/api/customer/auth/register/route.ts` - Added customer_code generation
- ✅ `app/api/customer/auth/login/route.ts` - Include customer_code in response
- ✅ `app/api/customer/auth/me/route.ts` - Include customer_code in response

## 🧪 Expected Result

Customer registration seharusnya berhasil dengan customer_code yang unique dan auto-generated.

---

**Status**: ✅ Fixed
**Last Updated**: 2024-12-10
