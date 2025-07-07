import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// Verify super admin access (reused from features)
async function verifySuperAdmin(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("auth-token")?.value;

    if (!token) {
      return { error: "No token provided", status: 401 };
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return { error: "Invalid token", status: 401 };
    }

    const userResult = await executeQuery(
      "SELECT id, username, email, full_name, role FROM users WHERE id = ? AND is_active = 1",
      [decoded.userId]
    );

    if (
      !userResult.success ||
      !userResult.data ||
      (userResult.data as any[]).length === 0
    ) {
      return { error: "User not found", status: 401 };
    }

    const user = (userResult.data as any[])[0];
    if (user.role !== "super_admin") {
      return { error: "Access denied - Super admin required", status: 403 };
    }

    return { user };
  } catch (error) {
    return { error: "Invalid token", status: 401 };
  }
}

// GET - Get all page access controls
export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, message: authCheck.error },
        { status: authCheck.status }
      );
    }

    const result = await executeQuery(`
      SELECT 
        id, page_key, page_name, page_path, description, 
        is_enabled, required_role, category, sort_order,
        created_at, updated_at
      FROM page_access 
      ORDER BY category, sort_order, page_name
    `);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch page access controls" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Page access fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update page access control
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, message: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { page_key, is_enabled, required_role } = await request.json();

    if (!page_key) {
      return NextResponse.json(
        { success: false, message: "Page key is required" },
        { status: 400 }
      );
    }

    let updateQuery = "UPDATE page_access SET updated_at = NOW()";
    const params: any[] = [];

    if (typeof is_enabled === "boolean") {
      updateQuery += ", is_enabled = ?";
      params.push(is_enabled);
    }

    if (
      required_role &&
      ["super_admin", "admin", "user"].includes(required_role)
    ) {
      updateQuery += ", required_role = ?";
      params.push(required_role);
    }

    updateQuery += " WHERE page_key = ?";
    params.push(page_key);

    const result = await executeQuery(updateQuery, params);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to update page access" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Page access for ${page_key} updated successfully`,
    });
  } catch (error) {
    console.error("Page access update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new page access control
export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, message: authCheck.error },
        { status: authCheck.status }
      );
    }

    const {
      page_key,
      page_name,
      page_path,
      description,
      required_role,
      category,
      sort_order,
      is_enabled,
    } = await request.json();

    if (!page_key || !page_name || !page_path) {
      return NextResponse.json(
        { success: false, message: "Page key, name, and path are required" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `
      INSERT INTO page_access 
      (page_key, page_name, page_path, description, required_role, category, sort_order, is_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        page_key,
        page_name,
        page_path,
        description || null,
        required_role || "user",
        category || "main",
        sort_order || 0,
        is_enabled ?? true,
      ]
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to create page access control" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Page access control created successfully",
    });
  } catch (error) {
    console.error("Page access create error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove page access control
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, message: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const page_key = searchParams.get("page_key");

    if (!page_key) {
      return NextResponse.json(
        { success: false, message: "Page key is required" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      "DELETE FROM page_access WHERE page_key = ?",
      [page_key]
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to delete page access control" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Page access control deleted successfully",
    });
  } catch (error) {
    console.error("Page access delete error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
