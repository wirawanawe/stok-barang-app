import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { verifyTokenMiddleware, isAdmin } from "@/lib/auth-middleware";

// GET - Get all website settings
export async function GET(request: NextRequest) {
  try {
    const result = await executeQuery(`
      SELECT setting_key, setting_value, setting_type, description
      FROM website_settings
      ORDER BY setting_key
    `);

    if (!result.success) {
      throw new Error("Failed to fetch website settings");
    }

    // Convert array to object for easier access
    const settings: Record<string, any> = {};
    (result.data as any[]).forEach((setting) => {
      settings[setting.setting_key] = {
        value: setting.setting_value,
        type: setting.setting_type,
        description: setting.description,
      };
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get website settings error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT - Update website settings
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = await verifyTokenMiddleware(token);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Hanya admin yang diizinkan.",
        },
        { status: 403 }
      );
    }

    const settings = await request.json();

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      await executeQuery(
        `
        UPDATE website_settings 
        SET setting_value = ?, updated_at = NOW()
        WHERE setting_key = ?
      `,
        [value, key]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pengaturan website berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update website settings error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
