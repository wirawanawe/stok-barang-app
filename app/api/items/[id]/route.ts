import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET - Ambil item berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    const result = await executeQuery(
      `SELECT 
        i.*, 
        c.name as category_name,
        l.name as location_name
       FROM items i
       LEFT JOIN categories c ON i.category_id = c.id
       LEFT JOIN locations l ON i.location_id = l.id
       WHERE i.id = ? AND i.is_active = true`,
      [itemId]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to fetch item" },
        { status: 500 }
      );
    }

    const items = result.data as any[];
    if (items.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ data: items[0] });
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

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

    // Cek apakah item exists
    const checkResult = await executeQuery(
      "SELECT id FROM items WHERE id = ? AND is_active = true",
      [itemId]
    );

    if (!checkResult.success || (checkResult.data as any[]).length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Cek apakah code sudah digunakan oleh item lain
    const codeCheckResult = await executeQuery(
      "SELECT id FROM items WHERE code = ? AND id != ? AND is_active = true",
      [code, itemId]
    );

    if (codeCheckResult.success && (codeCheckResult.data as any[]).length > 0) {
      return NextResponse.json(
        { error: "Item code already exists" },
        { status: 400 }
      );
    }

    // Update item
    const updateQuery = `
      UPDATE items SET 
        code = ?, name = ?, description = ?, category_id = ?, location_id = ?,
        quantity = ?, unit = ?, price = ?, min_stock = ?, max_stock = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const updateParams = [
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
      itemId,
    ];

    const result = await executeQuery(updateQuery, updateParams);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to update item" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Item updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Hapus item (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });
    }

    // Cek apakah item exists
    const checkResult = await executeQuery(
      "SELECT id, name FROM items WHERE id = ? AND is_active = true",
      [itemId]
    );

    if (!checkResult.success || (checkResult.data as any[]).length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Soft delete - set is_active = false
    const result = await executeQuery(
      "UPDATE items SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [itemId]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to delete item" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
