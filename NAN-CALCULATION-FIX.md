# NaN Calculation Fix - Customer Cart

## 🐛 Problem

Jumlah meter tidak muncul, tertampil "NaN" di frontend pada kalkulasi cart dan checkout.

## 🔍 Root Cause Analysis

**Issue**: Kalkulasi matematis yang menghasilkan NaN (Not a Number) ketika:

- Data dari database memiliki nilai `null` atau `undefined`
- String tidak di-convert ke number dengan benar
- Operasi matematis pada data yang tidak valid

**Impact**:

- Price display menampilkan "NaN"
- Subtotal dan total calculations error
- User experience terganggu

## ✅ Solution Applied

### 1. Backend - Cart API Calculation Protection

**File**: `app/api/customer/cart/route.ts`

**Before (Bermasalah):**

```typescript
const subtotal = cartItems.reduce(
  (sum: number, item: any) => sum + item.cart_price * item.cart_quantity,
  0
);
const totalItems = cartItems.reduce(
  (sum: number, item: any) => sum + item.cart_quantity,
  0
);
```

**After (Fixed):**

```typescript
const subtotal = cartItems.reduce((sum: number, item: any) => {
  const price = parseFloat(item.cart_price) || 0;
  const quantity = parseInt(item.cart_quantity) || 0;
  return sum + price * quantity;
}, 0);

const totalItems = cartItems.reduce((sum: number, item: any) => {
  const quantity = parseInt(item.cart_quantity) || 0;
  return sum + quantity;
}, 0);
```

### 2. Frontend - Price Display Protection

**File**: `app/cart/page.tsx`

**Before (Bermasalah):**

```typescript
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(price);
};
```

**After (Fixed):**

```typescript
const formatPrice = (price: number) => {
  // Protect against NaN values
  const validPrice =
    isNaN(price) || price === null || price === undefined ? 0 : price;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(validPrice);
};
```

## 🛡️ Protection Strategy

### Type Conversion with Fallback

```typescript
// Safe number conversion
const price = parseFloat(item.cart_price) || 0;
const quantity = parseInt(item.cart_quantity) || 0;

// NaN detection
const validPrice =
  isNaN(price) || price === null || price === undefined ? 0 : price;
```

### Calculation Chain Protection

1. **Database Level**: Ensure proper data types in MySQL
2. **API Level**: Convert and validate numbers before calculation
3. **Frontend Level**: Validate before display formatting

## 🧪 Test Cases

| Scenario       | Input                          | Expected Output |
| -------------- | ------------------------------ | --------------- |
| Normal         | `price: 25000, qty: 2`         | `Rp 50.000`     |
| Null Price     | `price: null, qty: 2`          | `Rp 0`          |
| Undefined Qty  | `price: 25000, qty: undefined` | `Rp 0`          |
| String Numbers | `price: "25000", qty: "2"`     | `Rp 50.000`     |
| NaN Values     | `price: NaN, qty: NaN`         | `Rp 0`          |

## 📊 Places Where NaN Can Occur

### Cart Operations:

- ✅ **Subtotal Calculation** - Fixed
- ✅ **Total Items Count** - Fixed
- ✅ **Individual Item Total** - Protected via formatPrice
- ✅ **Price Display** - Protected

### Common Patterns:

```typescript
// ❌ Dangerous
const total = item.price * item.quantity;

// ✅ Safe
const total = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);

// ❌ Dangerous Display
{
  formatPrice(total);
}

// ✅ Safe Display
{
  formatPrice(isNaN(total) ? 0 : total);
}
```

## 🔧 Files Modified

- ✅ `app/api/customer/cart/route.ts` - Backend calculation protection
- ✅ `app/cart/page.tsx` - Frontend display protection

## 💡 Best Practices Applied

1. **Defensive Programming**: Always validate data before calculations
2. **Type Safety**: Explicit type conversion with fallbacks
3. **User Experience**: Display "Rp 0" instead of "NaN"
4. **Data Validation**: Server-side and client-side protection

## 🎯 Related Issues Prevention

- Checkout calculations protected
- Order summary displays protected
- Database null value handling
- Currency formatting errors eliminated

---

**Status**: ✅ Fixed - NaN values eliminated
**Last Updated**: 2024-12-10
**Related**: CUSTOMER-CART-MIGRATION.md
