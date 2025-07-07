# Customer Items Route Fix

## 🐛 Problem

Customer items API gagal dengan error:

```
ReferenceError: db is not defined
    at GET (app/api/customer/items/route.ts:70:18)
```

## 🔍 Root Cause

Route masih menggunakan SQLite methods (`db.all`, `db.get`) setelah import diubah ke `executeQuery` tapi tidak ada definisi variabel `db`.

## ✅ Solution Applied

### 1. Fixed Items Query

**Before:**

```typescript
const items = await db.all(itemsQuery, [...queryParams, limit, offset]);
```

**After:**

```typescript
const itemsResult = await executeQuery(itemsQuery, [
  ...queryParams,
  limit,
  offset,
]);

if (!itemsResult.success) {
  throw new Error("Failed to fetch items");
}

const items = itemsResult.data;
```

### 2. Fixed Count Query

**Before:**

```typescript
const countResult = await db.get(countQuery, queryParams.slice(0, -2));
const total = countResult?.total || 0;
```

**After:**

```typescript
const countResult = await executeQuery(countQuery, queryParams.slice(0, -2));
const total =
  countResult.success &&
  Array.isArray(countResult.data) &&
  countResult.data.length > 0
    ? (countResult.data[0] as any).total || 0
    : 0;
```

### 3. Fixed Categories Query

**Before:**

```typescript
const categories = await db.all(`SELECT DISTINCT c.id, c.name ...`);
```

**After:**

```typescript
const categoriesResult = await executeQuery(`SELECT DISTINCT c.id, c.name ...`);
const categories = categoriesResult.success ? categoriesResult.data : [];
```

## 🎯 API Features

Customer items API provides:

- **Pagination**: page, limit, offset
- **Search**: by name, description, code
- **Category filtering**: by category ID
- **Sorting**: by name, price, newest (asc/desc)
- **Available items only**: `is_available_online = 1` and `quantity > 0`

## 📋 API Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `category` - Category ID filter (optional)
- `search` - Search term (optional)
- `sortBy` - Sort field: name, price, newest (default: name)
- `sortOrder` - Sort order: asc, desc (default: asc)

## 🔧 Files Modified

- ✅ `app/api/customer/items/route.ts` - Fixed all SQLite methods

## 🧪 Expected Result

Customer items API should work for product browsing:

- List available items with pagination
- Search and filter functionality
- Category listing for filters
- Proper error handling

---

**Status**: ✅ Fixed
**Last Updated**: 2024-12-10
**Related**: CUSTOMER-ROUTES-FIX.md
