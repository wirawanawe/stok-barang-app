import { NextRequest, NextResponse } from "next/server";
import { db, executeQuery } from "@/lib/db";

// GET - Ambil semua items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.id, i.code, i.name, i.description, i.quantity, i.unit, i.price, 
        i.min_stock, i.max_stock, i.created_at, i.updated_at,
        c.name as category_name,
        l.name as location_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE i.is_active = 1
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (i.name LIKE ? OR i.code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ` AND i.category_id = ?`;
      params.push(category);
    }

    query += ` ORDER BY i.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM items i WHERE i.is_active = 1`;
    const countParams: any[] = [];

    if (search) {
      countQuery += ` AND (i.name LIKE ? OR i.code LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      countQuery += ` AND i.category_id = ?`;
      countParams.push(category);
    }

    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult.success
      ? (countResult.data as any[])[0].total
      : 0;

    return NextResponse.json({
      data: result.data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Tambah item baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      description,
      category_id,
      location_id,
      quantity,
      unit,
      price,
      min_stock,
      max_stock,
    } = body;

    // Validasi data required
    if (!code || !name || !unit) {
      return NextResponse.json(
        { error: "Code, name, and unit are required" },
        { status: 400 }
      );
    }

    // Cek apakah code sudah ada
    const checkResult = await executeQuery(
      "SELECT id FROM items WHERE code = ?",
      [code]
    );

    if (checkResult.success && (checkResult.data as any[]).length > 0) {
      return NextResponse.json(
        { error: "Item code already exists" },
        { status: 400 }
      );
    }

    // Insert item baru
    const insertQuery = `
      INSERT INTO items (
        code, name, description, category_id, location_id, 
        quantity, unit, price, min_stock, max_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      code,
      name,
      description || null,
      category_id || null,
      location_id || null,
      quantity || 0,
      unit,
      price || 0,
      min_stock || 0,
      max_stock || 1000,
    ];

    const result = await executeQuery(insertQuery, insertParams);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to create item" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Item created successfully", data: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
