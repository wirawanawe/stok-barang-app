import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET - Ambil log transaksi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const item_id = searchParams.get("item_id");
    const type = searchParams.get("type"); // 'in', 'out', 'adjustment'

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        sl.*,
        i.name as item_name,
        i.code as item_code,
        u.full_name as user_name
      FROM stock_logs sl
      LEFT JOIN items i ON sl.item_id = i.id
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (item_id) {
      query += ` AND sl.item_id = ?`;
      params.push(item_id);
    }

    if (type) {
      query += ` AND sl.type = ?`;
      params.push(type);
    }

    query += ` ORDER BY sl.transaction_date DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await executeQuery(query, params);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to fetch stock logs" },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM stock_logs sl WHERE 1=1`;
    const countParams: any[] = [];

    if (item_id) {
      countQuery += ` AND sl.item_id = ?`;
      countParams.push(item_id);
    }

    if (type) {
      countQuery += ` AND sl.type = ?`;
      countParams.push(type);
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
    console.error("Error fetching stock logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Tambah log transaksi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      item_id,
      user_id = 1, // Default to admin user for now
      type,
      quantity,
      previous_stock,
      current_stock,
      notes,
      reference_no,
    } = body;

    // Validasi data required
    if (
      !item_id ||
      !type ||
      !quantity ||
      previous_stock === undefined ||
      current_stock === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validasi type
    if (!["in", "out", "adjustment"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid transaction type" },
        { status: 400 }
      );
    }

    // Insert log
    const insertQuery = `
      INSERT INTO stock_logs (
        item_id, user_id, type, quantity, previous_stock, current_stock,
        notes, reference_no, transaction_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const insertParams = [
      item_id,
      user_id,
      type,
      quantity,
      previous_stock,
      current_stock,
      notes || null,
      reference_no || null,
    ];

    const result = await executeQuery(insertQuery, insertParams);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to create stock log" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Stock log created successfully", data: result.data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating stock log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
