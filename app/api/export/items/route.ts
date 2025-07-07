import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "excel";
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    // Query untuk mengambil data items
    let query = `
      SELECT 
        i.id,
        i.code,
        i.name,
        i.description,
        i.quantity,
        i.unit,
        i.price,
        i.min_stock,
        i.max_stock,
        c.name as category_name,
        l.name as location_name,
        i.created_at,
        i.updated_at
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      query += " AND (i.name LIKE ? OR i.code LIKE ? OR i.description LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      query += " AND i.category_id = ?";
      params.push(category);
    }

    query += " ORDER BY i.name ASC";

    const connection = await getDbConnection();
    const [rows] = await connection.execute(query, params);
    const items = rows as any[];

    if (format === "excel") {
      // Format data untuk Excel
      const excelData = items.map((item, index) => {
        const isLowStock = item.quantity <= item.min_stock;
        return {
          No: index + 1,
          "Kode Barang": item.code,
          "Nama Barang": item.name,
          Deskripsi: item.description || "-",
          Kategori: item.category_name || "-",
          Lokasi: item.location_name || "-",
          "Stok Saat Ini": item.quantity,
          Satuan: item.unit,
          Harga: item.price,
          "Stok Minimum": item.min_stock,
          "Stok Maksimum": item.max_stock,
          "Status Stok": isLowStock ? "Stok Rendah" : "Normal",
          "Tanggal Dibuat": new Date(item.created_at).toLocaleDateString(
            "id-ID"
          ),
          "Terakhir Update": new Date(item.updated_at).toLocaleDateString(
            "id-ID"
          ),
        };
      });

      // Buat workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const wscols = [
        { wch: 5 }, // No
        { wch: 15 }, // Kode Barang
        { wch: 25 }, // Nama Barang
        { wch: 30 }, // Deskripsi
        { wch: 15 }, // Kategori
        { wch: 15 }, // Lokasi
        { wch: 12 }, // Stok Saat Ini
        { wch: 10 }, // Satuan
        { wch: 15 }, // Harga
        { wch: 12 }, // Stok Min
        { wch: 12 }, // Stok Max
        { wch: 15 }, // Status
        { wch: 15 }, // Tanggal Dibuat
        { wch: 15 }, // Update
      ];
      ws["!cols"] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "Data Stok Barang");

      // Generate buffer
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `stok-barang-${currentDate}.xlsx`;

      return new NextResponse(buf, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Return JSON data untuk PDF
      return NextResponse.json({
        success: true,
        data: items,
        meta: {
          total: items.length,
          exported_at: new Date().toISOString(),
          filters: { search, category },
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor data" },
      { status: 500 }
    );
  }
}
