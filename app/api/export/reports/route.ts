import { NextRequest, NextResponse } from "next/server";
import { getDbConnection } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "excel";
    const type = searchParams.get("type") || "";
    const startDate = searchParams.get("start_date") || "";
    const endDate = searchParams.get("end_date") || "";

    // Query untuk mengambil data stock logs
    let query = `
      SELECT 
        sl.id,
        i.name as item_name,
        i.code as item_code,
        u.username as user_name,
        sl.type,
        sl.quantity,
        sl.previous_stock,
        sl.current_stock,
        sl.notes,
        sl.reference_no,
        sl.transaction_date,
        c.name as category_name,
        l.name as location_name
      FROM stock_logs sl
      LEFT JOIN items i ON sl.item_id = i.id
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN locations l ON i.location_id = l.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (type) {
      query += " AND sl.type = ?";
      params.push(type);
    }

    if (startDate) {
      query += " AND DATE(sl.transaction_date) >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND DATE(sl.transaction_date) <= ?";
      params.push(endDate);
    }

    query += " ORDER BY sl.transaction_date DESC";

    const connection = await getDbConnection();
    const [rows] = await connection.execute(query, params);
    const stockLogs = rows as any[];

    if (format === "excel") {
      // Format data untuk Excel
      const excelData = stockLogs.map((log, index) => ({
        No: index + 1,
        "Tanggal Transaksi": new Date(log.transaction_date).toLocaleString(
          "id-ID"
        ),
        "Kode Barang": log.item_code,
        "Nama Barang": log.item_name,
        Kategori: log.category_name || "-",
        Lokasi: log.location_name || "-",
        "Jenis Transaksi":
          log.type === "in"
            ? "Stok Masuk"
            : log.type === "out"
            ? "Stok Keluar"
            : "Penyesuaian",
        Jumlah: log.quantity,
        "Stok Sebelum": log.previous_stock,
        "Stok Sesudah": log.current_stock,
        "No. Referensi": log.reference_no || "-",
        Catatan: log.notes || "-",
        User: log.user_name,
      }));

      // Buat workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const wscols = [
        { wch: 5 }, // No
        { wch: 20 }, // Tanggal
        { wch: 15 }, // Kode Barang
        { wch: 25 }, // Nama Barang
        { wch: 15 }, // Kategori
        { wch: 15 }, // Lokasi
        { wch: 15 }, // Jenis
        { wch: 10 }, // Jumlah
        { wch: 12 }, // Stok Sebelum
        { wch: 12 }, // Stok Sesudah
        { wch: 15 }, // No. Referensi
        { wch: 20 }, // Catatan
        { wch: 15 }, // User
      ];
      ws["!cols"] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "Laporan Stok");

      // Generate buffer
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `laporan-stok-${currentDate}.xlsx`;

      return new NextResponse(buf, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Return JSON data untuk PDF (akan diproses di client-side)
      return NextResponse.json({
        success: true,
        data: stockLogs,
        meta: {
          total: stockLogs.length,
          exported_at: new Date().toISOString(),
          filters: { type, startDate, endDate },
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
