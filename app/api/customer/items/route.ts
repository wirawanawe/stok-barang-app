import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "name"; // name, price, newest
    const sortOrder = searchParams.get("sortOrder") || "asc"; // asc, desc

    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = ["i.is_active = 1", "i.quantity > 0"];
    let queryParams: any[] = [];

    if (category) {
      whereConditions.push("c.id = ?");
      queryParams.push(category);
    }

    if (search) {
      whereConditions.push(
        "(i.name LIKE ? OR i.description LIKE ? OR i.code LIKE ?)"
      );
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.join(" AND ");

    // Build order clause
    let orderClause = "";
    switch (sortBy) {
      case "price":
        orderClause = `ORDER BY i.price ${sortOrder.toUpperCase()}`;
        break;
      case "newest":
        orderClause = `ORDER BY i.created_at ${sortOrder.toUpperCase()}`;
        break;
      default:
        orderClause = `ORDER BY i.name ${sortOrder.toUpperCase()}`;
    }

    // Get items with pagination
    const itemsQuery = `
      SELECT 
        i.id,
        i.code,
        i.name,
        i.description,
        i.quantity,
        i.unit,
        i.price as online_price,
        i.min_stock as min_order_qty,
        i.max_stock,
        c.name as category_name,
        l.name as location_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    // Ensure parameters are correct types for MySQL2
    const finalParams = [
      ...queryParams,
      parseInt(limit.toString()), // Ensure integer
      parseInt(offset.toString()), // Ensure integer
    ];

    const itemsResult = await executeQuery(itemsQuery, finalParams);

    if (!itemsResult.success) {
      throw new Error("Failed to fetch items");
    }

    const items = itemsResult.data;

    // Get total count for pagination (use same WHERE clause as main query)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, queryParams);
    const total =
      countResult.success &&
      Array.isArray(countResult.data) &&
      countResult.data.length > 0
        ? (countResult.data[0] as any).total || 0
        : 0;

    // Get categories for filtering
    const categoriesResult = await executeQuery(`
      SELECT DISTINCT c.id, c.name
      FROM categories c
      INNER JOIN items i ON c.id = i.category_id
      WHERE i.is_active = 1 AND i.quantity > 0
      ORDER BY c.name
    `);

    const categories = categoriesResult.success ? categoriesResult.data : [];

    return NextResponse.json({
      success: true,
      data: {
        items,
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Customer items API error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
