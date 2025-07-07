import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { validateApiRequest } from "@/lib/auth";

// GET - Get single article by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await executeQuery(
      `
      SELECT 
        n.*, u.full_name as author_name
      FROM news_articles n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `,
      [params.id]
    );

    if (!result.success) {
      throw new Error("Failed to fetch article");
    }

    if (!Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(
        { success: false, message: "Artikel tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data[0],
    });
  } catch (error) {
    console.error("Get article error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT - Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get current article
    const currentArticle = await executeQuery(
      "SELECT slug, status FROM news_articles WHERE id = ?",
      [params.id]
    );

    if (
      !currentArticle.success ||
      !Array.isArray(currentArticle.data) ||
      currentArticle.data.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Artikel tidak ditemukan" },
        { status: 404 }
      );
    }

    const current = currentArticle.data[0] as any;

    // Generate new slug if title changed
    let slug = current.slug;
    const newSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    if (newSlug !== current.slug) {
      // Check if new slug already exists
      const existingSlug = await executeQuery(
        "SELECT id FROM news_articles WHERE slug = ? AND id != ?",
        [newSlug, params.id]
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
      slug = newSlug;
    }

    // Set published_at if status changed from draft to published
    let publishedAt = null;
    if (status === "published" && current.status !== "published") {
      publishedAt = new Date();
    }

    const updateQuery = publishedAt
      ? `
        UPDATE news_articles 
        SET title = ?, slug = ?, content = ?, excerpt = ?, category = ?, 
            status = ?, featured_image = ?, published_at = ?, updated_at = NOW()
        WHERE id = ?
      `
      : `
        UPDATE news_articles 
        SET title = ?, slug = ?, content = ?, excerpt = ?, category = ?, 
            status = ?, featured_image = ?, updated_at = NOW()
        WHERE id = ?
      `;

    const updateParams = publishedAt
      ? [
          title,
          slug,
          content,
          excerpt || "",
          category || "textile",
          status || "draft",
          featured_image || "",
          publishedAt,
          params.id,
        ]
      : [
          title,
          slug,
          content,
          excerpt || "",
          category || "textile",
          status || "draft",
          featured_image || "",
          params.id,
        ];

    const result = await executeQuery(updateQuery, updateParams);

    if (!result.success) {
      throw new Error("Failed to update article");
    }

    return NextResponse.json({
      success: true,
      message: "Artikel berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update article error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await executeQuery(
      "DELETE FROM news_articles WHERE id = ?",
      [params.id]
    );

    if (!result.success) {
      throw new Error("Failed to delete article");
    }

    return NextResponse.json({
      success: true,
      message: "Artikel berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete article error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
