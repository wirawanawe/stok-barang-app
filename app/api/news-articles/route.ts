import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { validateApiRequest } from "@/lib/auth";

// GET - Get all news articles with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "published";
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = [];
    let queryParams: any[] = [];

    if (status && status !== "all") {
      whereConditions.push("status = ?");
      queryParams.push(status);
    }

    if (category) {
      whereConditions.push("category = ?");
      queryParams.push(category);
    }

    if (search) {
      whereConditions.push("(title LIKE ? OR content LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get articles with pagination
    const articlesQuery = `
      SELECT 
        id, title, slug, excerpt, category, status, 
        featured_image, published_at, created_at, updated_at
      FROM news_articles
      ${whereClause}
      ORDER BY 
        CASE WHEN status = 'published' THEN published_at ELSE created_at END DESC
      LIMIT ? OFFSET ?
    `;

    const articlesResult = await executeQuery(articlesQuery, [
      ...queryParams,
      limit,
      offset,
    ]);

    if (!articlesResult.success) {
      throw new Error("Failed to fetch articles");
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM news_articles
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, queryParams);
    const total =
      countResult.success && Array.isArray(countResult.data)
        ? (countResult.data[0] as any).total
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        articles: articlesResult.data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get news articles error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Create new article
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await validateApiRequest(request);
    if (!authResult.valid || authResult.user?.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak. Hanya admin yang diizinkan.",
        },
        { status: 403 }
      );
    }

    const { title, content, excerpt, category, status, featured_image } =
      await request.json();

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Judul dan konten wajib diisi" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Check if slug already exists
    const existingSlug = await executeQuery(
      "SELECT id FROM news_articles WHERE slug = ?",
      [slug]
    );

    if (
      existingSlug.success &&
      Array.isArray(existingSlug.data) &&
      existingSlug.data.length > 0
    ) {
      return NextResponse.json(
        { success: false, message: "Artikel dengan judul serupa sudah ada" },
        { status: 400 }
      );
    }

    // Set published_at if status is published
    const publishedAt = status === "published" ? new Date() : null;

    const result = await executeQuery(
      `
      INSERT INTO news_articles 
      (title, slug, content, excerpt, category, status, featured_image, author_id, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        title,
        slug,
        content,
        excerpt || "",
        category || "textile",
        status || "draft",
        featured_image || "",
        authResult.user.userId,
        publishedAt,
      ]
    );

    if (!result.success) {
      throw new Error("Failed to create article");
    }

    return NextResponse.json({
      success: true,
      message: "Artikel berhasil dibuat",
      data: {
        id: (result.data as any).insertId,
        slug,
      },
    });
  } catch (error) {
    console.error("Create article error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
