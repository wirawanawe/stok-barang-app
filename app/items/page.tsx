"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  AlertCircle,
} from "lucide-react";

interface Item {
  id: number;
  code: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  min_stock: number;
  max_stock: number;
  category_name: string;
  location_name: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [currentPage, search, selectedCategory]);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
        ...(selectedCategory && { category: selectedCategory }),
      });

      const response = await fetch(`/api/items?${params}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      const data = await response.json();

      if (data.data) {
        setItems(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.data) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchItems();
  };

  const isLowStock = (item: Item) => item.quantity <= item.min_stock;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus barang "${name}"?`)) {
      try {
        const response = await fetch(`/api/items/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Refresh data
          fetchItems();
          alert("Barang berhasil dihapus");
        } else {
          const error = await response.json();
          alert(error.error || "Gagal menghapus barang");
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Terjadi kesalahan saat menghapus barang");
      }
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Kelola Barang
            </h1>
            <p className="text-gray-600 text-lg">
              Atur dan kelola stok kain Anda
            </p>
          </div>
          <Link
            href="/items/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tambah Barang
          </Link>
        </div>
      </div>
      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau kode barang..."
                className="w-full pl-10 pr-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </form>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode & Nama Barang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori & Lokasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500">{item.code}</div>
                      {item.description && (
                        <div className="text-xs text-gray-400 mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.category_name || "Tanpa Kategori"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.location_name || "Tanpa Lokasi"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.quantity} {item.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {item.min_stock} | Max: {item.max_stock}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(item.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isLowStock(item) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Stok Menipis
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        href={`/items/${item.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Hapus barang"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Tidak ada barang
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Mulai dengan menambahkan barang pertama Anda.
            </p>
            <div className="mt-6">
              <Link
                href="/items/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Barang
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
