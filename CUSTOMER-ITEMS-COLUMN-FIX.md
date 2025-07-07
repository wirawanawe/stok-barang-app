# Customer Items Column Mapping Fix

## 🐛 Problem

Customer items API gagal dengan error:

```
Unknown column 'i.online_price' in 'field list'
Unknown column 'i.is_available_online' in 'field list'
Unknown column 'i.min_order_qty' in 'field list'
```

## 🔍 Root Cause

Query menggunakan kolom e-commerce yang tidak ada di tabel `items` yang existing. Tabel menggunakan struktur inventory management, bukan e-commerce.

### Expected vs Actual Schema

**Expected (E-commerce):**

- `online_price` → **Not exist**
- `is_available_online` → **Not exist**
- `min_order_qty` → **Not exist**

**Actual (Inventory):**

- `price` ✅
- `is_active` ✅
- `min_stock` ✅
- `max_stock` ✅

## ✅ Solution Applied

### 1. Field Mapping

**Before:**

```sql
SELECT
  i.online_price,
  i.min_order_qty
WHERE i.is_available_online = 1
ORDER BY i.online_price
```

**After:**

```sql
SELECT
  i.price,          -- Maps to online_price
  i.min_stock,      -- Maps to min_order_qty
  i.max_stock       -- Additional stock info
WHERE i.is_active = 1  -- Maps to is_available_online
ORDER BY i.price      -- Maps to online_price
```

### 2. Updated Query Conditions

```typescript
// Before
let whereConditions = ["i.is_available_online = 1", "i.quantity > 0"];

// After
let whereConditions = ["i.is_active = 1", "i.quantity > 0"];
```

### 3. Updated Sort Logic

```typescript
// Before
case "price":
  orderClause = `ORDER BY i.online_price ${sortOrder.toUpperCase()}`;

// After
case "price":
  orderClause = `ORDER BY i.price ${sortOrder.toUpperCase()}`;
```

### 4. Complete Field Mapping

| E-commerce Field      | Inventory Field | Purpose              |
| --------------------- | --------------- | -------------------- |
| `online_price`        | `price`         | Product price        |
| `is_available_online` | `is_active`     | Product availability |
| `min_order_qty`       | `min_stock`     | Minimum quantity     |
| N/A                   | `max_stock`     | Maximum stock info   |

## 🎯 API Response Structure

Customer akan receive:

```json
{
  "id": 1,
  "code": "BRG001",
  "name": "Product Name",
  "description": "...",
  "quantity": 100,
  "unit": "pcs",
  "price": 15000, // Was online_price
  "min_stock": 5, // Was min_order_qty
  "max_stock": 1000, // Additional info
  "category_name": "...",
  "location_name": "..."
}
```

## 🔧 Files Modified

- ✅ `app/api/customer/items/route.ts` - Updated all queries with correct column names

## 🧪 Expected Result

Customer items API should work with correct field mapping:

- List active items (is_active = 1)
- Show actual price (not online_price)
- Include stock information (min_stock, max_stock)
- Proper sorting by price

---

**Status**: ✅ Fixed
**Last Updated**: 2024-12-10
**Related**: CUSTOMER-ITEMS-FIX.md
