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
        { success: false, message: "Invalid location ID" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      "SELECT * FROM locations WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    const locations = result.data as any[];
    if (locations.length === 0) {
      return NextResponse.json(
        { success: false, message: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: locations[0],
    });
  } catch (error) {
    console.error("Error fetching location:", error);
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
        { success: false, message: "Invalid location ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Location name is required" },
        { status: 400 }
      );
    }

    // Check if location exists
    const existingResult = await executeQuery(
      "SELECT id FROM locations WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (!existingResult.success) {
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    const existingLocations = existingResult.data as any[];
    if (existingLocations.length === 0) {
      return NextResponse.json(
        { success: false, message: "Location not found" },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current location)
    const duplicateResult = await executeQuery(
      "SELECT id FROM locations WHERE name = ? AND id != ? AND deleted_at IS NULL",
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
        { success: false, message: "Location name already exists" },
        { status: 400 }
      );
    }

    // Update location
    const updateResult = await executeQuery(
      "UPDATE locations SET name = ?, description = ?, updated_at = NOW() WHERE id = ?",
      [name.trim(), description?.trim() || "", id]
    );

    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, message: "Failed to update location" },
        { status: 500 }
      );
    }

    // Get updated location
    const updatedResult = await executeQuery(
      "SELECT * FROM locations WHERE id = ?",
      [id]
    );

    if (!updatedResult.success) {
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    const updatedLocations = updatedResult.data as any[];
    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      data: updatedLocations[0],
    });
  } catch (error) {
    console.error("Error updating location:", error);
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
        { success: false, message: "Invalid location ID" },
        { status: 400 }
      );
    }

    // Check if location exists
    const existingResult = await executeQuery(
      "SELECT id FROM locations WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (!existingResult.success) {
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    const existingLocations = existingResult.data as any[];
    if (existingLocations.length === 0) {
      return NextResponse.json(
        { success: false, message: "Location not found" },
        { status: 404 }
      );
    }

    // Check if location is being used by items
    const itemsResult = await executeQuery(
      "SELECT COUNT(*) as count FROM items WHERE location_id = ? AND deleted_at IS NULL",
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
          message: `Cannot delete location. ${itemsData[0].count} items are using this location.`,
        },
        { status: 400 }
      );
    }

    // Soft delete location
    const deleteResult = await executeQuery(
      "UPDATE locations SET deleted_at = NOW() WHERE id = ?",
      [id]
    );

    if (!deleteResult.success) {
      return NextResponse.json(
        { success: false, message: "Failed to delete location" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
