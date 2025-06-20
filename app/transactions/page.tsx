"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Plus,
  Filter,
  Download,
  Upload,
} from "lucide-react";

interface Item {
  id: number;
  code: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function TransactionsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [transactionType, setTransactionType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items?limit=100");
      const data = await response.json();
      if (data.data) {
        setItems(data.data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
  };

  const handleTransaction = async () => {
    if (!selectedItem || !quantity) {
      alert("Pilih barang dan masukkan jumlah");
      return;
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      alert("Jumlah harus lebih dari 0");
      return;
    }

    if (transactionType === "out" && qty > selectedItem.quantity) {
      alert("Jumlah keluar tidak boleh melebihi stok yang tersedia");
      return;
    }

    setLoading(true);

    try {
      // Update item quantity
      const newQuantity =
        transactionType === "in"
          ? selectedItem.quantity + qty
          : selectedItem.quantity - qty;

      const response = await fetch(`/api/items/${selectedItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...selectedItem,
          quantity: newQuantity,
        }),
      });

      if (response.ok) {
        // Log transaction to stock_logs table
        try {
          await fetch("/api/stock-logs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              item_id: selectedItem.id,
              type: transactionType,
              quantity: qty,
              previous_stock: selectedItem.quantity,
              current_stock: newQuantity,
              notes: notes || null,
              reference_no: referenceNo || null,
            }),
          });
        } catch (logError) {
          console.error("Error logging transaction:", logError);
          // Continue even if logging fails
        }

        alert(
          `Transaksi ${transactionType === "in" ? "masuk" : "keluar"} berhasil!`
        );

        // Reset form
        setSelectedItem(null);
        setQuantity("");
        setNotes("");
        setReferenceNo("");

        // Refresh items
        fetchItems();
      } else {
        alert("Gagal melakukan transaksi");
      }
    } catch (error) {
      console.error("Error processing transaction:", error);
      alert("Terjadi kesalahan saat memproses transaksi");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transaksi Stok</h1>
            <p className="text-green-100 text-lg">
              Catat transaksi stok masuk dan keluar
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transaction Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Buat Transaksi Baru
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Catat stok masuk atau keluar untuk barang yang dipilih
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Jenis Transaksi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTransactionType("in")}
                  className={`flex items-center justify-center px-4 py-3 border rounded-lg ${
                    transactionType === "in"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Stok Masuk
                </button>
                <button
                  onClick={() => setTransactionType("out")}
                  className={`flex items-center justify-center px-4 py-3 border rounded-lg ${
                    transactionType === "out"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Stok Keluar
                </button>
              </div>
            </div>

            {/* Selected Item */}
            {selectedItem && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900">Barang Dipilih:</h3>
                <p className="text-blue-800">{selectedItem.name}</p>
                <p className="text-sm text-blue-600">
                  {selectedItem.code} • Stok saat ini: {selectedItem.quantity}{" "}
                  {selectedItem.unit}
                </p>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Jumlah *
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan jumlah"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Reference Number */}
            <div>
              <label
                htmlFor="referenceNo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                No. Referensi
              </label>
              <input
                type="text"
                id="referenceNo"
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contoh: PO-2024-001"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Catatan
              </label>
              <textarea
                id="notes"
                rows={3}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Catatan tambahan (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleTransaction}
              disabled={loading || !selectedItem || !quantity}
              className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center ${
                transactionType === "in"
                  ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300"
                  : "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  {transactionType === "in" ? (
                    <Download className="h-4 w-4 mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {transactionType === "in" ? "Tambah Stok" : "Kurangi Stok"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Pilih Barang
            </h2>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Cari barang..."
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredItems.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedItem?.id === item.id
                        ? "bg-blue-50 border-r-4 border-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">{item.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {item.quantity} {item.unit}
                        </p>
                        <p
                          className={`text-xs ${
                            item.quantity <= 5
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {item.quantity <= 5 ? "Stok Rendah" : "Stok Aman"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Tidak ada barang
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? "Barang tidak ditemukan"
                    : "Belum ada barang tersedia"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
