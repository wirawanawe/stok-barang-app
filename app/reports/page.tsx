"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

interface StockLog {
  id: number;
  item_name: string;
  item_code: string;
  user_name: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  previous_stock: number;
  current_stock: number;
  notes: string;
  reference_no: string;
  transaction_date: string;
}

export default function ReportsPage() {
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState("");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  useEffect(() => {
    fetchStockLogs();
  }, [currentPage, filterType]);

  const fetchStockLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(filterType && { type: filterType }),
      });

      const response = await fetch(`/api/stock-logs?${params}`);
      const data = await response.json();

      if (data.data) {
        setStockLogs(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching stock logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "in":
        return <Download className="h-4 w-4 text-green-600" />;
      case "out":
        return <Upload className="h-4 w-4 text-red-600" />;
      case "adjustment":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "in":
        return "Stok Masuk";
      case "out":
        return "Stok Keluar";
      case "adjustment":
        return "Penyesuaian";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "in":
        return "bg-green-100 text-green-800";
      case "out":
        return "bg-red-100 text-red-800";
      case "adjustment":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Laporan & Riwayat</h1>
            <p className="text-purple-100 text-lg">
              Analisis dan riwayat transaksi stok kain
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Filter & Pencarian
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Transaksi
            </label>
            <select
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Semua Jenis</option>
              <option value="in">Stok Masuk</option>
              <option value="out">Stok Keluar</option>
              <option value="adjustment">Penyesuaian</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Riwayat Transaksi
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Catatan lengkap semua aktivitas stok masuk dan keluar
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok Sebelum/Sesudah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referensi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(log.transaction_date), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {log.item_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.item_code}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        log.type
                      )}`}
                    >
                      {getTypeIcon(log.type)}
                      <span className="ml-1">{getTypeLabel(log.type)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.type === "out" && "-"}
                    {log.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="text-gray-500">{log.previous_stock}</span>
                    <span className="mx-1">→</span>
                    <span className="font-medium">{log.current_stock}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.reference_no || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate" title={log.notes}>
                      {log.notes || "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stockLogs.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Belum ada transaksi
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Transaksi akan muncul di sini setelah ada aktivitas stok.
            </p>
            <div className="mt-6">
              <Link
                href="/transactions"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Buat Transaksi
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Halaman <span className="font-medium">{currentPage}</span> dari{" "}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
