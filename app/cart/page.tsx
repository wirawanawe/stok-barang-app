"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Package,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { useCart } from "@/lib/cart-context";
import { FeatureGuard } from "@/lib/feature-context";

interface CartItem {
  cart_id: number;
  cart_quantity: number;
  cart_price: number;
  item_id: number;
  code: string;
  name: string;
  description: string;
  unit: string;
  online_price: number;
  stock_quantity: number;
  min_order_qty: number;
  category_name: string;
}

interface CartTotals {
  subtotal: number;
  totalItems: number;
  shipping: number;
  tax: number;
  total: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [totals, setTotals] = useState<CartTotals>({
    subtotal: 0,
    totalItems: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { customer, isAuthenticated, isLoading } = useCustomerAuth();
  const { updateCartCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/customer/login?redirect=/cart");
      return;
    }

    // Only fetch cart if authenticated and not loading
    if (!isLoading && isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, isLoading]);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("customer-auth-token");
      const response = await fetch("/api/customer/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setCartItems(data.data.items);
        setTotals(data.data.totals);
        // By default, select all items
        setSelectedItems(
          new Set(data.data.items.map((item: CartItem) => item.cart_id))
        );
        // Update global cart count
        updateCartCount(data.data.totals.totalItems || 0);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Gagal memuat keranjang");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId: number, newQuantity: number) => {
    setUpdating(cartId);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("customer-auth-token");
      const response = await fetch("/api/customer/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cart_id: cartId,
          quantity: newQuantity,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        fetchCart();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Gagal mengupdate quantity");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartId: number) => {
    setUpdating(cartId);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("customer-auth-token");
      const response = await fetch(`/api/customer/cart?cart_id=${cartId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        fetchCart();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Gagal menghapus item");
    } finally {
      setUpdating(null);
    }
  };

  // Handle item selection
  const toggleItemSelection = (cartId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(cartId)) {
      newSelected.delete(cartId);
    } else {
      newSelected.add(cartId);
    }
    setSelectedItems(newSelected);
  };

  const selectAllItems = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((item) => item.cart_id)));
    }
  };

  // Calculate totals for selected items
  const calculateSelectedTotals = () => {
    const selectedCartItems = cartItems.filter((item) =>
      selectedItems.has(item.cart_id)
    );
    const subtotal = selectedCartItems.reduce(
      (sum, item) => sum + item.cart_price * item.cart_quantity,
      0
    );
    const totalItems = selectedCartItems.reduce(
      (sum, item) => sum + item.cart_quantity,
      0
    );
    const shipping = 0;
    const tax = 0;
    const total = subtotal + shipping + tax;

    return { subtotal, totalItems, shipping, tax, total };
  };

  const checkoutSelected = () => {
    if (selectedItems.size === 0) {
      setError("Pilih minimal satu item untuk checkout");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Store selected items for checkout
    const selectedCartItems = cartItems.filter((item) =>
      selectedItems.has(item.cart_id)
    );
    localStorage.setItem(
      "selected-cart-items",
      JSON.stringify(selectedCartItems)
    );
    router.push("/checkout?from=cart");
  };

  const formatPrice = (price: number) => {
    // Protect against NaN values
    const validPrice =
      isNaN(price) || price === null || price === undefined ? 0 : price;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(validPrice);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memeriksa authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat keranjang...</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard
      featureKey="shopping_cart"
      pageKey="customer_cart"
      userRole="user"
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/shop"
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Lanjut Belanja
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="h-7 w-7 mr-2" />
                Keranjang Belanja
              </h1>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {totals.totalItems} item{totals.totalItems > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Keranjang Anda Kosong
              </h3>
              <p className="text-gray-600 mb-6">
                Belum ada produk di keranjang Anda. Mari mulai berbelanja!
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Package className="h-5 w-5 mr-2" />
                Mulai Belanja
              </Link>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Item di Keranjang ({totals.totalItems})
                      </h2>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            selectedItems.size === cartItems.length &&
                            cartItems.length > 0
                          }
                          onChange={selectAllItems}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-600">
                          Pilih Semua
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <div key={item.cart_id} className="p-6">
                        <div className="flex items-start space-x-4">
                          {/* Checkbox */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.cart_id)}
                              onChange={() => toggleItemSelection(item.cart_id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>

                          {/* Product Image Placeholder */}
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">
                                  {item.code}
                                </p>
                                <p className="text-sm text-gray-500 mb-2">
                                  {item.description}
                                </p>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {item.category_name}
                                  </span>
                                  <span className="text-green-600">
                                    Stok: {item.stock_quantity}
                                  </span>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="text-right ml-4">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatPrice(item.cart_price)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  /{item.unit}
                                </p>
                              </div>
                            </div>

                            {/* Quantity Controls & Total */}
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-black">
                                  Jumlah:
                                </span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item.cart_id,
                                        item.cart_quantity - 1
                                      )
                                    }
                                    disabled={
                                      updating === item.cart_id ||
                                      item.cart_quantity <= 1
                                    }
                                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="px-3 py-1 bg-gray-50 rounded min-w-[3rem] text-center text-black">
                                    {updating === item.cart_id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                                    ) : (
                                      item.cart_quantity
                                    )}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item.cart_id,
                                        item.cart_quantity + 1
                                      )
                                    }
                                    disabled={
                                      updating === item.cart_id ||
                                      item.cart_quantity >= item.stock_quantity
                                    }
                                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeItem(item.cart_id)}
                                  disabled={updating === item.cart_id}
                                  className="text-red-600 hover:text-red-700 p-1 disabled:opacity-50"
                                  title="Hapus dari keranjang"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatPrice(
                                    item.cart_price * item.cart_quantity
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Per {item.unit}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-4 mt-8 lg:mt-0">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Ringkasan Pesanan
                  </h2>

                  {selectedItems.size > 0 ? (
                    (() => {
                      const selectedTotals = calculateSelectedTotals();
                      return (
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Subtotal ({selectedTotals.totalItems} items
                              dipilih)
                            </span>
                            <span className="font-medium text-black">
                              {formatPrice(selectedTotals.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ongkos Kirim</span>
                            <span className="font-medium text-black">
                              {selectedTotals.shipping > 0
                                ? formatPrice(selectedTotals.shipping)
                                : "Gratis"}
                            </span>
                          </div>
                          {selectedTotals.tax > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pajak</span>
                              <span className="font-medium text-black">
                                {formatPrice(selectedTotals.tax)}
                              </span>
                            </div>
                          )}
                          <div className="border-t pt-3">
                            <div className="flex justify-between">
                              <span className="text-lg font-bold text-gray-900">
                                Total
                              </span>
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(selectedTotals.total)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="mb-6">
                      <p className="text-gray-500 text-center py-8">
                        Pilih item untuk melihat ringkasan pesanan
                      </p>
                    </div>
                  )}

                  <button
                    onClick={checkoutSelected}
                    disabled={selectedItems.size === 0}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    Checkout Item Terpilih ({selectedItems.size})
                    <ArrowRight className="h-5 w-5" />
                  </button>

                  <div className="mt-4 text-center">
                    <Link
                      href="/shop"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      ← Lanjut Belanja
                    </Link>
                  </div>

                  {/* Security Info */}
                  <div className="mt-6 text-center">
                    <div className="flex items-center justify-center text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Pembayaran Aman
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Data Anda dilindungi dengan enkripsi SSL
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FeatureGuard>
  );
}
