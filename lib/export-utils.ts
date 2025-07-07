import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Export to Excel
export const exportToExcel = async (
  endpoint: string,
  params: Record<string, string> = {}
) => {
  try {
    const urlParams = new URLSearchParams({
      format: "excel",
      ...params,
    });

    const token = localStorage.getItem("auth-token");
    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${endpoint}?${urlParams}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
      : "export.xlsx";

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  } catch (error) {
    console.error("Export error:", error);
    return { success: false, error: "Gagal mengekspor ke Excel" };
  }
};

// Export to PDF
export const exportToPDF = async (
  endpoint: string,
  params: Record<string, string> = {},
  title: string = "Data Export"
) => {
  try {
    console.log("Starting PDF export...", { endpoint, params, title });

    const urlParams = new URLSearchParams({
      format: "json",
      ...params,
    });

    const token = localStorage.getItem("auth-token");
    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    console.log("Fetching data from API...");
    const response = await fetch(`${endpoint}?${urlParams}`, {
      headers,
    });

    if (!response.ok) {
      console.error(
        "API response not ok:",
        response.status,
        response.statusText
      );
      throw new Error(
        `Export failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log("API response:", result);

    if (!result.success) {
      console.error("API returned error:", result.error);
      throw new Error(result.error || "Unknown API error");
    }

    if (!result.data || !Array.isArray(result.data)) {
      console.error("Invalid data format:", result);
      throw new Error("Data tidak valid dari server");
    }

    console.log("Generating PDF with data:", result.data.length, "rows");

    // Generate PDF based on endpoint type
    const pdf = new jsPDF();

    // Add title
    pdf.setFontSize(16);
    pdf.text(title, 20, 20);

    // Add export info
    pdf.setFontSize(10);
    pdf.text(`Diekspor pada: ${new Date().toLocaleString("id-ID")}`, 20, 30);
    pdf.text(`Total data: ${result.meta?.total || result.data.length}`, 20, 35);

    try {
      if (endpoint.includes("reports")) {
        console.log("Generating reports PDF...");
        generateReportsPDF(pdf, result.data);
      } else if (endpoint.includes("items")) {
        console.log("Generating items PDF...");
        generateItemsPDF(pdf, result.data);
      } else if (endpoint.includes("customers")) {
        console.log("Generating customers PDF...");
        generateCustomersPDF(pdf, result.data);
      }
    } catch (tableError) {
      console.error("Error generating table:", tableError);
      throw new Error("Gagal membuat tabel PDF");
    }

    // Save PDF
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `${title
      .toLowerCase()
      .replace(/\s+/g, "-")}-${currentDate}.pdf`;

    console.log("Saving PDF as:", filename);
    pdf.save(filename);

    return { success: true };
  } catch (error) {
    console.error("PDF export error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengekspor ke PDF",
    };
  }
};

// Generate Reports PDF
const generateReportsPDF = (pdf: jsPDF, data: any[]) => {
  const tableData = data.map((log, index) => [
    index + 1,
    new Date(log.transaction_date).toLocaleDateString("id-ID"),
    log.item_code || "-",
    log.item_name || "-",
    log.type === "in" ? "Masuk" : log.type === "out" ? "Keluar" : "Adjust",
    log.quantity || 0,
    log.current_stock || 0,
    log.user_name || "-",
  ]);

  autoTable(pdf, {
    head: [
      ["No", "Tanggal", "Kode", "Barang", "Jenis", "Jumlah", "Stok", "User"],
    ],
    body: tableData,
    startY: 45,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [63, 81, 181] },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 35 },
      4: { halign: "center", cellWidth: 20 },
      5: { halign: "right", cellWidth: 20 },
      6: { halign: "right", cellWidth: 20 },
      7: { cellWidth: 25 },
    },
  });
};

// Generate Items PDF
const generateItemsPDF = (pdf: jsPDF, data: any[]) => {
  const tableData = data.map((item, index) => [
    index + 1,
    item.code || "-",
    item.name || "-",
    item.category_name || "-",
    item.quantity || 0,
    item.unit || "-",
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(item.price || 0),
    item.quantity <= item.min_stock ? "Rendah" : "Normal",
  ]);

  autoTable(pdf, {
    head: [
      [
        "No",
        "Kode",
        "Nama Barang",
        "Kategori",
        "Stok",
        "Satuan",
        "Harga",
        "Status",
      ],
    ],
    body: tableData,
    startY: 45,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [63, 81, 181] },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { cellWidth: 20 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
      4: { halign: "right", cellWidth: 20 },
      5: { halign: "center", cellWidth: 20 },
      6: { halign: "right", cellWidth: 30 },
      7: { halign: "center", cellWidth: 20 },
    },
  });
};

// Generate Customers PDF
const generateCustomersPDF = (pdf: jsPDF, data: any[]) => {
  const tableData = data.map((customer, index) => [
    index + 1,
    customer.customer_code || "-",
    customer.name || "-",
    customer.email || "-",
    customer.phone || "-",
    customer.city || "-",
    customer.is_active ? "Aktif" : "Nonaktif",
  ]);

  autoTable(pdf, {
    head: [["No", "Kode", "Username", "Email", "Telepon", "Kota", "Status"]],
    body: tableData,
    startY: 45,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [63, 81, 181] },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 40 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { halign: "center", cellWidth: 20 },
    },
  });
};
