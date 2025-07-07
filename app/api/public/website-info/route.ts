import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// GET - Get public website information (settings + latest news)
export async function GET(request: NextRequest) {
  try {
    // Get website settings
    const settingsResult = await executeQuery(`
      SELECT setting_key, setting_value
      FROM website_settings
      ORDER BY setting_key
    `);

    // Get latest published news articles
    const newsResult = await executeQuery(`
      SELECT 
        id, title, slug, excerpt, category, featured_image, published_at
      FROM news_articles
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 6
    `);

    if (!settingsResult.success || !newsResult.success) {
      throw new Error("Failed to fetch website information");
    }

    // Convert settings array to object
    const settings: Record<string, string> = {};
    (settingsResult.data as any[]).forEach((setting) => {
      settings[setting.setting_key] = setting.setting_value;
    });

    return NextResponse.json({
      success: true,
      data: {
        settings,
        news: newsResult.data,
      },
    });
  } catch (error) {
    console.error("Get website info error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
