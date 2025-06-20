"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  recentTransactions: number;
}

interface Item {
  id: number;
  code: string;
  name: string;
  quantity: number;
  min_stock: number;
  unit: string;
  category_name: string;
  location_name: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    recentTransactions: 0,
  });
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();

      if (data.stats) {
        setStats(data.stats);
        setRecentItems(data.recentItems || []);
        setLowStockItems(data.lowStockItems || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Fallback to old method if dashboard API fails
      try {
        const itemsResponse = await fetch("/api/items?limit=5");
        const itemsData = await itemsResponse.json();

        if (itemsData.data) {
          setRecentItems(itemsData.data);

          const total = itemsData.pagination?.total || 0;
          const lowStock = itemsData.data.filter(
            (item: Item) => item.quantity <= item.min_stock
          ).length;

          setStats({
            totalItems: total,
            lowStockItems: lowStock,
            totalValue: 0,
            recentTransactions: 0,
          });

          setLowStockItems(
            itemsData.data.filter(
              (item: Item) => item.quantity <= item.min_stock
            )
          );
        }
      } catch (fallbackError) {
        console.error("Error with fallback data fetch:", fallbackError);
      }
    } finally {
      setLoading(false);
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-blue-100 text-lg">
              Ringkasan dan statistik stok kain Anda
            </p>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Barang</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalItems}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stok Menipis</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.lowStockItems}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Nilai Total Stok
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Transaksi Bulan Ini
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.recentTransactions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Items */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Barang Terbaru
            </h2>
          </div>
          <div className="p-6">
            {recentItems.length > 0 ? (
              <div className="space-y-4">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        {item.code} • {item.category_name || "Tanpa Kategori"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {item.quantity} {item.unit}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.location_name || "Tanpa Lokasi"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Belum ada barang</p>
            )}
            <div className="mt-4">
              <Link
                href="/items"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Lihat semua barang →
              </Link>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Peringatan Stok Menipis
            </h2>
          </div>
          <div className="p-6">
            {lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">
                        {item.quantity} {item.unit}
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {item.min_stock} {item.unit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Semua stok aman</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/items/new"
            className="flex items-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
          >
            <Plus className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Tambah Barang Baru</h3>
              <p className="text-sm text-gray-600">
                Daftarkan barang ke dalam sistem
              </p>
            </div>
          </Link>

          <Link
            href="/transactions"
            className="flex items-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
          >
            <TrendingUp className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Catat Transaksi</h3>
              <p className="text-sm text-gray-600">
                Kelola stok masuk dan keluar
              </p>
            </div>
          </Link>

          <Link
            href="/reports"
            className="flex items-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
          >
            <BarChart3 className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Lihat Laporan</h3>
              <p className="text-sm text-gray-600">
                Analisis data dan statistik
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
