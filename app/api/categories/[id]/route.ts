import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      "SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    const categories = result.data as any[];
    if (categories.length === 0) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: categories[0],
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingResult = await executeQuery(
      "SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (!existingResult.success) {
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    const existingCategories = existingResult.data as any[];
    if (existingCategories.length === 0) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current category)
    const duplicateResult = await executeQuery(
      "SELECT id FROM categories WHERE name = ? AND id != ? AND deleted_at IS NULL",
      [name.trim(), id]
    );

    if (!duplicateResult.success) {
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    const duplicates = duplicateResult.data as any[];
    if (duplicates.length > 0) {
      return NextResponse.json(
        { success: false, message: "Category name already exists" },
        { status: 400 }
      );
    }

    // Update category
    const updateResult = await executeQuery(
      "UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?",
      [name.trim(), description?.trim() || "", id]
    );

    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, message: "Failed to update category" },
        { status: 500 }
      );
    }

    // Get updated category
    const updatedResult = await executeQuery(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );

    if (!updatedResult.success) {
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    const updatedCategories = updatedResult.data as any[];
    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategories[0],
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingResult = await executeQuery(
      "SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (!existingResult.success) {
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    const existingCategories = existingResult.data as any[];
    if (existingCategories.length === 0) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category is being used by items
    const itemsResult = await executeQuery(
      "SELECT COUNT(*) as count FROM items WHERE category_id = ? AND deleted_at IS NULL",
      [id]
    );

    if (!itemsResult.success) {
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    const itemsData = itemsResult.data as any[];
    if (itemsData[0].count > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete category. ${itemsData[0].count} items are using this category.`,
        },
        { status: 400 }
      );
    }

    // Soft delete category
    const deleteResult = await executeQuery(
      "UPDATE categories SET deleted_at = NOW() WHERE id = ?",
      [id]
    );

    if (!deleteResult.success) {
      return NextResponse.json(
        { success: false, message: "Failed to delete category" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
