# Customer Items Parameter Debug Fix

## 🐛 Problem

Customer items API gagal dengan error:

```
Incorrect arguments to mysqld_stmt_execute
```

## 🔍 Root Cause Analysis

Error ini terjadi ketika jumlah parameter yang dikirim tidak sesuai dengan jumlah placeholder (?) dalam SQL query, atau ada masalah dengan tipe data parameter.

## ✅ Solution Applied

### 1. Changed from pool.execute() to pool.query()

**Issue**: MySQL2 pool.execute() method has known issues with parameter binding
**Solution**: Use pool.query() method instead of pool.execute() for connection pools

```typescript
// Before (Problematic)
const [results] = await connection.execute(query, params);

// After (Fixed)
const [results] = await pool.query(query, params);
```

### 2. Fixed Count Query Parameter Logic

**Before (Bermasalah):**

```typescript
// Count query menggunakan WHERE clause yang tidak konsisten
const countQuery = `
  SELECT COUNT(*) as total
  FROM items i
  LEFT JOIN categories c ON i.category_id = c.id
  WHERE ${whereConditions
    .slice(0, -1)
    .join(" AND ")} AND i.is_active = 1 AND i.quantity > 0
`;

const countResult = await executeQuery(countQuery, queryParams.slice(0, -2));
```

**After (Fixed):**

```typescript
// Count query menggunakan WHERE clause yang sama dengan main query
const countQuery = `
  SELECT COUNT(*) as total
  FROM items i
  LEFT JOIN categories c ON i.category_id = c.id
  WHERE ${whereClause}
`;

const countResult = await executeQuery(countQuery, queryParams);
```

### 2. Added Debug Logging

```typescript
const finalParams = [...queryParams, limit, offset];

// Debug logging for parameter issues
console.log("Items Query:", itemsQuery);
console.log("Query Parameters:", finalParams);
console.log("Placeholders count:", (itemsQuery.match(/\?/g) || []).length);
console.log("Parameters count:", finalParams.length);
```

### 3. Parameter Flow Analysis

```typescript
// Base conditions (no parameters)
let whereConditions = ["i.is_active = 1", "i.quantity > 0"];
let queryParams: any[] = [];

// Add category filter (adds 1 parameter)
if (category) {
  whereConditions.push("c.id = ?");
  queryParams.push(category);
}

// Add search filter (adds 3 parameters)
if (search) {
  whereConditions.push(
    "(i.name LIKE ? OR i.description LIKE ? OR i.code LIKE ?)"
  );
  queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
}

// Main query: queryParams + limit + offset
// Count query: queryParams only (no limit/offset)
```

## 🎯 Debug Information

When debugging parameter mismatches, check:

1. **Placeholder Count**: Number of `?` in query
2. **Parameter Count**: Length of parameter array
3. **Parameter Types**: Ensure correct MySQL2 types
4. **WHERE Clause Consistency**: Same conditions for main and count queries

## 📊 Expected Parameter Scenarios

| Scenario      | Category | Search | Parameters                                          | Placeholders |
| ------------- | -------- | ------ | --------------------------------------------------- | ------------ |
| Basic         | ❌       | ❌     | `[limit, offset]`                                   | 2            |
| With Category | ✅       | ❌     | `[category, limit, offset]`                         | 3            |
| With Search   | ❌       | ✅     | `[search, search, search, limit, offset]`           | 5            |
| Both          | ✅       | ✅     | `[category, search, search, search, limit, offset]` | 6            |

## 🔧 Files Modified

- ✅ `app/api/customer/items/route.ts` - Fixed parameter handling and added debug logging
- ✅ `lib/db.ts` - Changed from pool.execute() to pool.query() method

## 💡 Key Learning: MySQL2 Pool vs Connection

**Pool.execute() Issues:**

- Connection pools may have parameter binding issues with prepared statements
- Error: "Incorrect arguments to mysqld_stmt_execute" commonly occurs

**Pool.query() Solution:**

- Works reliably with parameterized queries
- Handles parameter types correctly
- Recommended for connection pool usage

## 🧪 Debug Process

1. Check console logs for parameter count mismatches
2. Verify WHERE clause consistency between main and count queries
3. Ensure parameter types are compatible with MySQL2
4. Remove debug logging after issues are resolved

---

**Status**: ✅ Fixed with Debug Logging
**Last Updated**: 2024-12-10
**Related**: CUSTOMER-ITEMS-COLUMN-FIX.md
