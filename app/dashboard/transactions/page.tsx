"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  User,
  CreditCard,
  Calculator,
  Receipt,
  Search,
  Barcode,
  Save,
  X,
} from "lucide-react";

interface Item {
  id: number;
  code: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category_name: string;
  images: string;
}

interface CartItem {
  id: number;
  code: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  total: number;
  available_stock: number;
  images: string;
}

interface Customer {
  id: number;
  customer_code: string;
  name: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  is_active: boolean;
}

export default function POSPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "bank_transfer"
  >("cash");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidAmountDisplay, setPaidAmountDisplay] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Automatically set paid amount for non-cash payments
    if (paymentMethod !== "cash") {
      const total = getCartTotal();
      setPaidAmount(total);
      setPaidAmountDisplay(total.toString());
    } else {
      // Reset to empty for cash payments
      setPaidAmount(0);
      setPaidAmountDisplay("");
    }
  }, [paymentMethod, cart]);

  useEffect(() => {
    fetchItems();
    fetchCustomers();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/items?limit=100");
      const data = await response.json();
      if (data.data) {
        setItems(data.data);
      } else {
        // Fallback to empty array if no items found
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      // Set empty array on error to prevent filter issues
      setItems([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers?limit=100");
      const data = await response.json();
      if (data.success && data.data && data.data.customers) {
        setCustomers(data.data.customers);
      } else {
        // Fallback to empty array if no customers found
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      // Set empty array on error to prevent filter issues
      setCustomers([]);
    }
  };

  const addToCart = (item: Item) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id);

    if (existingItem) {
      if (existingItem.quantity >= item.quantity) {
        setError("Stok tidak mencukupi");
        setTimeout(() => setError(""), 3000);
        return;
      }
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
                total: (cartItem.quantity + 1) * cartItem.price,
              }
            : cartItem
        )
      );
    } else {
      if (item.quantity <= 0) {
        setError("Stok tidak mencukupi");
        setTimeout(() => setError(""), 3000);
        return;
      }
      setCart([
        ...cart,
        {
          id: item.id,
          code: item.code,
          name: item.name,
          unit: item.unit,
          price: item.price,
          quantity: 1,
          total: item.price,
          available_stock: item.quantity,
          images: item.images,
        },
      ]);
    }
  };

  const updateCartQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    const item = cart.find((cartItem) => cartItem.id === id);
    if (item && quantity > item.available_stock) {
      setError("Quantity melebihi stok tersedia");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setCart(
      cart.map((cartItem) =>
        cartItem.id === id
          ? { ...cartItem, quantity, total: quantity * cartItem.price }
          : cartItem
      )
    );
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((cartItem) => cartItem.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaidAmount(0);
    setPaidAmountDisplay("");
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const getCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getChange = () => {
    const total = getCartTotal();
    return paidAmount - total;
  };

  // Function to handle payment amount input and remove leading zeros
  const handlePaidAmountChange = (value: string) => {
    // Only allow numeric characters
    const numericOnly = value.replace(/[^0-9]/g, "");

    // If empty, reset both states
    if (numericOnly === "") {
      setPaidAmountDisplay("");
      setPaidAmount(0);
      return;
    }

    // Remove leading zeros
    const withoutLeadingZeros = numericOnly.replace(/^0+/, "") || "0";

    // Update display with the cleaned value
    setPaidAmountDisplay(withoutLeadingZeros);

    // Convert to number for calculations
    const numericValue = Number(withoutLeadingZeros);
    setPaidAmount(numericValue);
  };

  const handlePayment = async () => {
    if (cart.length === 0) {
      setError("Keranjang kosong");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const total = getCartTotal();
    let finalPaidAmount = paidAmount;

    // For non-cash payments, always use exact total
    if (paymentMethod !== "cash") {
      finalPaidAmount = total;
      setPaidAmount(total);
    }

    if (paymentMethod === "cash" && finalPaidAmount < total) {
      setError("Jumlah pembayaran tidak mencukupi");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/pos/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: selectedCustomer?.id || null,
          payment_method: paymentMethod,
          paid_amount: finalPaidAmount,
          items: cart.map((item) => ({
            item_id: item.id,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Transaksi berhasil!");
        setShowPaymentModal(false);

        // Print receipt (optional)
        if (data.data.receipt) {
          printReceipt(data.data.receipt);
        }

        // Clear cart and refresh items
        clearCart();
        fetchItems();

        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.message || "Transaksi gagal");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setError("Terjadi kesalahan saat memproses transaksi");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = (receipt: any) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: monospace; font-size: 12px; }
              .receipt { max-width: 300px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .total { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>RECEIPT</h2>
                <p>Transaction #${receipt.transaction_number}</p>
                <p>${new Date(receipt.date).toLocaleString()}</p>
              </div>
              
              <div class="line"></div>
              
              ${receipt.items
                .map(
                  (item: any) => `
                <div style="display: flex; justify-content: space-between;">
                  <span>${item.name} (${item.quantity}x)</span>
                  <span>Rp ${item.total.toLocaleString()}</span>
                </div>
              `
                )
                .join("")}
              
              <div class="line"></div>
              
              <div class="total">
                <div style="display: flex; justify-content: space-between;">
                  <span>TOTAL:</span>
                  <span>Rp ${receipt.total.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>PAID:</span>
                  <span>Rp ${receipt.paid_amount.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>CHANGE:</span>
                  <span>Rp ${receipt.change.toLocaleString()}</span>
                </div>
              </div>
              
              <div class="line"></div>
              
              <div class="header">
                <p>Thank you for your purchase!</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const filteredItems = (items || []).filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = (customers || []).filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.phone || "")
        .toLowerCase()
        .includes(customerSearchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  const getItemImage = (images: string) => {
    try {
      const imageArray = JSON.parse(images);
      if (imageArray && imageArray.length > 0) {
        return `/uploads/items/${imageArray[0]}`;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">POS System</h1>
            <p className="text-blue-100 text-lg">
              Point of Sale - Sistem Penjualan
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
          <X className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center">
          <Receipt className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Produk
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  className="w-full pl-10 pr-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {getItemImage(item.images) ? (
                          <img
                            src={getItemImage(item.images)!}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to Package icon if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              target.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                        <Package className="h-6 w-6 text-gray-400 hidden" />
                      </div>
                      <span className="text-sm text-gray-500">{item.code}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.category_name}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-600">
                        {formatPrice(item.price)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Stok: {item.quantity} {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Keranjang ({getCartItems()})
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Customer Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pelanggan
                </label>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-700">
                      {selectedCustomer
                        ? selectedCustomer.name
                        : "Pilih pelanggan"}
                    </span>
                  </div>
                  <Plus className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {getItemImage(item.images) ? (
                        <img
                          src={getItemImage(item.images)!}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : (
                        <Package className="h-5 w-5 text-gray-400" />
                      )}
                      <Package className="h-5 w-5 text-gray-400 hidden" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">{item.code}</p>
                      <p className="text-sm font-medium text-blue-600">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity - 1)
                        }
                        className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity + 1)
                        }
                        className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowPaymentModal(true);
                    // Reset payment form when opening modal
                    if (paymentMethod === "cash") {
                      setPaidAmount(0);
                      setPaidAmountDisplay("");
                    } else {
                      const total = getCartTotal();
                      setPaidAmount(total);
                      setPaidAmountDisplay(total.toString());
                    }
                  }}
                  disabled={cart.length === 0}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Bayar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Pembayaran
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Pembayaran
                </label>
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(getCartTotal())}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as "cash" | "card" | "bank_transfer"
                    )
                  }
                  className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cash">Tunai</option>
                  <option value="card">Kartu</option>
                  <option value="bank_transfer">Transfer Bank</option>
                </select>
              </div>

              {paymentMethod === "cash" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Dibayar
                  </label>
                  <input
                    type="text"
                    value={paidAmountDisplay}
                    onChange={(e) => handlePaidAmountChange(e.target.value)}
                    className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan jumlah yang dibayar"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  {paidAmount > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Kembalian: </span>
                      <span className="font-medium text-green-600">
                        {formatPrice(getChange())}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4" />
                      <span>Bayar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Pilih Pelanggan
              </h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Cari pelanggan..."
                className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setShowCustomerModal(false);
                }}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900">
                  Walk-in Customer
                </div>
                <div className="text-sm text-gray-500">
                  Pelanggan tanpa data
                </div>
              </button>

              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium text-gray-900">
                    {customer.name}
                  </div>
                  <div className="text-sm text-gray-500">{customer.email}</div>
                  <div className="text-sm text-gray-500">{customer.phone}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
