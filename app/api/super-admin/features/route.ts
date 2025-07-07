import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// Verify super admin access
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

// GET - Get all feature toggles
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
        id, feature_key, feature_name, description, 
        is_enabled, category, created_at, updated_at
      FROM feature_toggles 
      ORDER BY category, feature_name
    `);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch features" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Feature toggles fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update feature toggle
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, message: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { feature_key, is_enabled } = await request.json();

    if (!feature_key || typeof is_enabled !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Feature key and enabled status are required",
        },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      "UPDATE feature_toggles SET is_enabled = ?, updated_at = NOW() WHERE feature_key = ?",
      [is_enabled, feature_key]
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to update feature" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Feature ${feature_key} ${
        is_enabled ? "enabled" : "disabled"
      } successfully`,
    });
  } catch (error) {
    console.error("Feature toggle update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new feature toggle
export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, message: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { feature_key, feature_name, description, category, is_enabled } =
      await request.json();

    if (!feature_key || !feature_name) {
      return NextResponse.json(
        { success: false, message: "Feature key and name are required" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `
      INSERT INTO feature_toggles (feature_key, feature_name, description, category, is_enabled)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        feature_key,
        feature_name,
        description || null,
        category || "general",
        is_enabled ?? true,
      ]
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Failed to create feature" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Feature created successfully",
    });
  } catch (error) {
    console.error("Feature toggle create error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
