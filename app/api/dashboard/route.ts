import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    // Get total items count
    const itemsCountResult = await executeQuery(
      "SELECT COUNT(*) as total FROM items WHERE is_active = true"
    );
    const totalItems = itemsCountResult.success
      ? (itemsCountResult.data as any[])[0].total
      : 0;

    // Get low stock items count
    const lowStockResult = await executeQuery(
      "SELECT COUNT(*) as total FROM items WHERE is_active = true AND quantity <= min_stock"
    );
    const lowStockItems = lowStockResult.success
      ? (lowStockResult.data as any[])[0].total
      : 0;

    // Get total value of stock
    const totalValueResult = await executeQuery(
      "SELECT SUM(quantity * price) as total_value FROM items WHERE is_active = true"
    );
    const totalValue = totalValueResult.success
      ? (totalValueResult.data as any[])[0].total_value || 0
      : 0;

    // Get recent items (last 5)
    const recentItemsResult = await executeQuery(`
      SELECT 
        i.*, 
        c.name as category_name,
        l.name as location_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE i.is_active = true
      ORDER BY i.created_at DESC
      LIMIT 5
    `);
    const recentItems = recentItemsResult.success ? recentItemsResult.data : [];

    // Get low stock items (items where quantity <= min_stock)
    const lowStockItemsResult = await executeQuery(`
      SELECT 
        i.*, 
        c.name as category_name,
        l.name as location_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE i.is_active = true AND i.quantity <= i.min_stock
      ORDER BY i.quantity ASC
      LIMIT 10
    `);
    const lowStockItemsList = lowStockItemsResult.success
      ? lowStockItemsResult.data
      : [];

    // Get categories with item counts
    const categoriesResult = await executeQuery(`
      SELECT 
        c.id,
        c.name,
        COUNT(i.id) as item_count
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id AND i.is_active = true
      GROUP BY c.id, c.name
      ORDER BY item_count DESC
    `);
    const categories = categoriesResult.success ? categoriesResult.data : [];

    return NextResponse.json({
      stats: {
        totalItems,
        lowStockItems,
        totalValue: Math.round(totalValue),
        recentTransactions: 0, // Will be implemented when stock_logs is ready
      },
      recentItems,
      lowStockItems: lowStockItemsList,
      categories,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
