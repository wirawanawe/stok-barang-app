# Customer Name Field Fix

## 🐛 Problem

Setelah memperbaiki `customer_code`, muncul error baru:

```
Field 'name' doesn't have a default value
```

## 🔍 Root Cause Analysis

Tabel `customers` memiliki struktur B2B yang kompleks dengan multiple name fields:

- `name` VARCHAR(200) NOT NULL - Required field
- `full_name` VARCHAR(255) NULL - Field yang kami tambahkan
- `company_name` VARCHAR(200) NULL - Optional field

## ✅ Solution Applied

### 1. Updated INSERT Statement

**Before:**

```sql
INSERT INTO customers (customer_code, email, password, full_name, phone, address, city, postal_code)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

**After:**

```sql
INSERT INTO customers (customer_code, name, email, password, full_name, phone, address, city, postal_code)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
```

### 2. Field Mapping Strategy

```typescript
// Use full_name for both name and full_name fields
[
  customerCode,
  full_name, // Maps to 'name' field (required)
  email,
  hashedPassword,
  full_name, // Maps to 'full_name' field (for consistency)
  phone || null,
  address || null,
  city || null,
  postal_code || null,
];
```

### 3. Updated SELECT Queries

All customer routes now include both `name` and `full_name` fields:

```sql
SELECT id, customer_code, name, email, full_name, phone, address, city, postal_code, is_active
FROM customers
WHERE email = ?
```

## 🎯 Field Usage Strategy

- **`name`**: Primary name field (populated with `full_name` value)
- **`full_name`**: E-commerce friendly field (same value as `name`)
- **`customer_code`**: Auto-generated unique identifier

## ✅ Files Updated

- ✅ `app/api/customer/auth/register/route.ts` - Added `name` field to INSERT
- ✅ `app/api/customer/auth/login/route.ts` - Include `name` in SELECT
- ✅ `app/api/customer/auth/me/route.ts` - Include `name` in SELECT

## 🧪 Expected Result

Customer registration should work with both required fields populated:

- `customer_code`: Auto-generated (e.g., `CUST12345678AB`)
- `name`: User's full name
- `full_name`: Same as name (for e-commerce consistency)

---

**Status**: ✅ Fixed
**Last Updated**: 2024-12-10
**Related**: CUSTOMER-CODE-FIX.md
