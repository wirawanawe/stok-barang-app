import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user info from middleware headers
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin for customers management
    if (userRole !== "admin") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak" },
        { status: 403 }
      );
    }

    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, message: "ID customer tidak valid" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Status harus berupa boolean" },
        { status: 400 }
      );
    }

    // Update customer status
    const updateQuery = `
      UPDATE customers 
      SET is_active = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const result = await executeQuery(updateQuery, [is_active, customerId]);

    if (!result.success) {
      throw new Error("Failed to update customer");
    }

    return NextResponse.json({
      success: true,
      message: `Customer berhasil ${
        is_active ? "diaktifkan" : "dinonaktifkan"
      }`,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengubah status customer" },
      { status: 500 }
    );
  }
}
