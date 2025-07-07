# Customer Cart Route Migration Fix

## 🐛 Problem

Customer cart API gagal dengan error:

```
ReferenceError: db is not defined
```

## 🔍 Root Cause Analysis

Cart route masih menggunakan SQLite methods (`db.get()`, `db.all()`, `db.run()`) setelah migrasi ke MySQL2.

## ✅ Solution Applied

### 1. Fixed All SQLite Methods

**GET Method - Cart Items:**

```typescript
// Before (SQLite)
const cartItems = await db.all(`SELECT ... FROM carts c JOIN items i...`, [
  customer.customerId,
]);

// After (MySQL2)
const cartItemsResult = await executeQuery(
  `SELECT ... FROM carts c JOIN items i...`,
  [customer.customerId]
);
const cartItems = cartItemsResult.success
  ? (cartItemsResult.data as any[])
  : [];
```

**POST Method - Add to Cart:**

```typescript
// Before (SQLite)
const item = await db.get(`SELECT ... FROM items WHERE id = ?`, [item_id]);
const existingCart = await db.get(`SELECT ... FROM carts WHERE...`, [
  customer.customerId,
  item_id,
]);
await db.run(`UPDATE carts SET...`, [
  newQuantity,
  item.online_price,
  existingCart.id,
]);

// After (MySQL2)
const itemResult = await executeQuery(`SELECT ... FROM items WHERE id = ?`, [
  item_id,
]);
const item =
  itemResult.success && (itemResult.data as any[]).length > 0
    ? (itemResult.data as any[])[0]
    : null;
const existingCartResult = await executeQuery(
  `SELECT ... FROM carts WHERE...`,
  [customer.customerId, item_id]
);
const existingCart =
  existingCartResult.success && (existingCartResult.data as any[]).length > 0
    ? (existingCartResult.data as any[])[0]
    : null;
await executeQuery(`UPDATE carts SET...`, [
  newQuantity,
  item.online_price,
  existingCart.id,
]);
```

**PUT Method - Update Cart:**

```typescript
// Before (SQLite)
const cartItem = await db.get(`SELECT c.id, c.item_id, i.quantity...`, [
  cart_id,
  customer.customerId,
]);
await db.run(
  `UPDATE carts SET quantity = ?, updated_at = CURRENT_TIMESTAMP...`,
  [quantity, cart_id]
);

// After (MySQL2)
const cartItemResult = await executeQuery(
  `SELECT c.id, c.item_id, i.quantity...`,
  [cart_id, customer.customerId]
);
const cartItem =
  cartItemResult.success && (cartItemResult.data as any[]).length > 0
    ? (cartItemResult.data as any[])[0]
    : null;
await executeQuery(`UPDATE carts SET quantity = ?, updated_at = NOW()...`, [
  quantity,
  cart_id,
]);
```

**DELETE Method - Remove from Cart:**

```typescript
// Before (SQLite)
const result = await db.run(`DELETE FROM carts WHERE id = ? AND customer_id = ?`, [cart_id, customer.customerId]);
if (result.changes === 0) { ... }

// After (MySQL2)
const result = await executeQuery(`DELETE FROM carts WHERE id = ? AND customer_id = ?`, [cart_id, customer.customerId]);
if (!result.success || (result.data as any).affectedRows === 0) { ... }
```

### 2. Field Mapping E-commerce to Inventory Schema

| E-commerce Field      | Inventory Field            |
| --------------------- | -------------------------- |
| `online_price`        | `price`                    |
| `is_available_online` | `is_active`                |
| `min_order_qty`       | `min_stock`                |
| `CURRENT_TIMESTAMP`   | `NOW()`                    |
| `result.changes`      | `result.data.affectedRows` |

### 3. Added Type Safety

```typescript
// Proper type assertions for MySQL2 results
const cartItems = cartItemsResult.success
  ? (cartItemsResult.data as any[])
  : [];
const item =
  itemResult.success && (itemResult.data as any[]).length > 0
    ? (itemResult.data as any[])[0]
    : null;
```

## 📊 Conversion Summary

| Method | SQLite Calls                 | MySQL2 Calls        | Status   |
| ------ | ---------------------------- | ------------------- | -------- |
| GET    | 1x `db.all()`                | 1x `executeQuery()` | ✅ Fixed |
| POST   | 2x `db.get()`, 2x `db.run()` | 4x `executeQuery()` | ✅ Fixed |
| PUT    | 1x `db.get()`, 2x `db.run()` | 3x `executeQuery()` | ✅ Fixed |
| DELETE | 1x `db.run()`                | 1x `executeQuery()` | ✅ Fixed |

## 🔧 Files Modified

- ✅ `app/api/customer/cart/route.ts` - Complete SQLite to MySQL2 migration

## 🧪 Test Scenarios

1. **GET /api/customer/cart** - Retrieve customer's cart items
2. **POST /api/customer/cart** - Add item to cart (new & existing)
3. **PUT /api/customer/cart** - Update cart item quantity
4. **DELETE /api/customer/cart** - Remove item from cart

## 💡 Key Learnings

- **Result Handling**: MySQL2 returns structured results vs SQLite direct values
- **Type Safety**: Need explicit type assertions for MySQL2 results
- **Field Mapping**: Database schema differences require field mapping
- **DateTime Functions**: `CURRENT_TIMESTAMP` vs `NOW()`
- **Affected Rows**: `.changes` vs `.affectedRows`

---

**Status**: ✅ Complete Migration
**Last Updated**: 2024-12-10
**Related**: CUSTOMER-ROUTES-FIX.md, CUSTOMER-ITEMS-COLUMN-FIX.md
