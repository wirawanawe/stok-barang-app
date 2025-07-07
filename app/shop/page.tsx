"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Grid,
  List,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  ArrowRight,
  Package,
  User,
  LogOut,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { useCart } from "@/lib/cart-context";
import { FeatureGuard } from "@/lib/feature-context";

interface Item {
  id: number;
  code: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  online_price: number;
  min_order_qty: number;
  category_name: string;
  location_name: string;
  images: string;
}

interface Category {
  id: number;
  name: string;
}

export default function ShopPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    sortBy: "name",
    sortOrder: "asc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [cartItems, setCartItems] = useState<{ [key: number]: number }>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const { cartCount, fetchCartCount, incrementCartCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    fetchItems();
  }, [filters, pagination.page]);

  // Sync cart count when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartCount();
      fetchCartItems();
    }
  }, [isAuthenticated, fetchCartCount]);

  const fetchCartItems = async () => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("customer-auth-token");
      const response = await fetch("/api/customer/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Convert cart items to the format needed for cartItems state
        const cartItemsMap: { [key: number]: number } = {};
        data.data.items.forEach((item: any) => {
          cartItemsMap[item.item_id] = item.cart_quantity;
        });
        setCartItems(cartItemsMap);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });

      const response = await fetch(`/api/customer/items?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data.items);
        setCategories(data.data.categories);
        setPagination((prev) => ({ ...prev, ...data.data.pagination }));
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const addToCart = async (itemId: number, quantity: number = 1) => {
    if (!isAuthenticated) {
      router.push("/customer/login?redirect=/shop");
      return;
    }

    try {
      const token = localStorage.getItem("customer-auth-token");
      const response = await fetch("/api/customer/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_id: itemId,
          quantity: quantity,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local cart count for UI feedback
        setCartItems((prev) => ({
          ...prev,
          [itemId]: (prev[itemId] || 0) + quantity,
        }));

        // Update global cart count
        incrementCartCount(quantity);

        // Refresh cart items to ensure sync
        fetchCartItems();
      } else {
        setMessage({ type: "error", text: data.message });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: "Gagal menambahkan ke keranjang" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const checkoutItem = async (itemId: number, quantity: number = 1) => {
    if (!isAuthenticated) {
      router.push("/customer/login?redirect=/shop");
      return;
    }

    // Get item details for direct checkout
    const item = items.find((item) => item.id === itemId);
    if (!item) {
      setMessage({ type: "error", text: "Item tidak ditemukan" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Store direct checkout item in localStorage
    const directCheckoutItem = {
      item_id: itemId,
      quantity: quantity,
      name: item.name,
      code: item.code,
      description: item.description,
      unit: item.unit,
      online_price: item.online_price,
      category_name: item.category_name,
    };

    localStorage.setItem(
      "direct-checkout-item",
      JSON.stringify(directCheckoutItem)
    );

    // Redirect to checkout with direct buy flag
    router.push("/checkout?direct=true");
  };

  const updateCartQuantity = async (itemId: number, quantity: number) => {
    if (!isAuthenticated) {
      router.push("/customer/login?redirect=/shop");
      return;
    }

    if (quantity <= 0) {
      // Remove item from cart
      await removeFromCart(itemId);
      return;
    }

    try {
      const token = localStorage.getItem("customer-auth-token");

      // First, find the cart_id for this item
      const cartResponse = await fetch("/api/customer/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const cartData = await cartResponse.json();
      if (cartData.success) {
        const cartItem = cartData.data.items.find(
          (item: any) => item.item_id === itemId
        );

        if (cartItem) {
          // Update existing cart item
          const response = await fetch("/api/customer/cart", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              cart_id: cartItem.cart_id,
              quantity: quantity,
            }),
          });

          const data = await response.json();
          if (data.success) {
            // Update local state
            setCartItems((prev) => ({ ...prev, [itemId]: quantity }));
            // Update global cart count
            fetchCartCount();
          } else {
            setMessage({ type: "error", text: data.message });
            setTimeout(() => setMessage(null), 3000);
          }
        } else {
          // Item not in cart, add it first
          await addToCart(itemId, quantity);
        }
      }
    } catch (error) {
      setMessage({ type: "error", text: "Gagal mengupdate quantity" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const removeFromCart = async (itemId: number) => {
    if (!isAuthenticated) return;

    try {
      const token = localStorage.getItem("customer-auth-token");

      // Find the cart_id for this item
      const cartResponse = await fetch("/api/customer/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const cartData = await cartResponse.json();
      if (cartData.success) {
        const cartItem = cartData.data.items.find(
          (item: any) => item.item_id === itemId
        );

        if (cartItem) {
          const response = await fetch(
            `/api/customer/cart?cart_id=${cartItem.cart_id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();
          if (data.success) {
            // Remove from local state
            const newCart = { ...cartItems };
            delete newCart[itemId];
            setCartItems(newCart);
            // Update global cart count
            fetchCartCount();
          }
        }
      }
    } catch (error) {
      setMessage({ type: "error", text: "Gagal menghapus dari keranjang" });
      setTimeout(() => setMessage(null), 3000);
    }
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

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <FeatureGuard
      featureKey="customer_portal"
      pageKey="customer_shop"
      userRole="user"
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <Package className="h-8 w-8 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">
                    StokKain Shop
                  </span>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                {/* Cart */}
                <Link href="/cart" className="relative p-2">
                  <ShoppingCart className="h-6 w-6 text-gray-600" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {customer?.full_name}
                      </span>
                    </div>
                    <button
                      onClick={logout}
                      className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/customer/login"
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/customer/register"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Daftar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-600"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          {/* Filters */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Category Filter */}
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-blue-500 focus:border-blue-500"
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-black focus:ring-blue-500 focus:border-blue-500"
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split("-");
                    setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                  }}
                >
                  <option value="name-asc">Nama A-Z</option>
                  <option value="name-desc">Nama Z-A</option>
                  <option value="price-asc">Harga Terendah</option>
                  <option value="price-desc">Harga Tertinggi</option>
                  <option value="newest-desc">Terbaru</option>
                </select>

                {/* View Mode */}
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${
                      viewMode === "grid"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600"
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${
                      viewMode === "list"
                        ? "bg-blue-600 text-white"
                        : "text-gray-600"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Items Grid/List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat produk...</p>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                }
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                      viewMode === "list"
                        ? "flex items-center p-4"
                        : "overflow-hidden"
                    }`}
                  >
                    {viewMode === "grid" ? (
                      // Grid View
                      <>
                        <div className="aspect-w-1 aspect-h-1 bg-gray-200 relative overflow-hidden">
                          {item.images && JSON.parse(item.images).length > 0 ? (
                            <img
                              src={JSON.parse(item.images)[0]}
                              alt={item.name}
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="mb-2">
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                              {item.category_name}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {item.code}
                          </p>
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <span className="text-xl font-bold text-gray-900">
                                {formatPrice(item.online_price)}
                              </span>
                              <span className="text-sm text-gray-500">
                                /{item.unit}
                              </span>
                            </div>
                            <span className="text-sm text-green-600">
                              Stok: {item.quantity}
                            </span>
                          </div>

                          {cartItems[item.id] ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-center bg-gray-50 rounded-xl p-3">
                                <button
                                  onClick={() =>
                                    updateCartQuantity(
                                      item.id,
                                      cartItems[item.id] - 1
                                    )
                                  }
                                  className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all"
                                >
                                  <Minus className="h-4 w-4 text-gray-600" />
                                </button>
                                <span className="mx-4 text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                                  {cartItems[item.id]}
                                </span>
                                <button
                                  onClick={() =>
                                    updateCartQuantity(
                                      item.id,
                                      cartItems[item.id] + 1
                                    )
                                  }
                                  className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all"
                                >
                                  <Plus className="h-4 w-4 text-gray-600" />
                                </button>
                              </div>
                              <button
                                onClick={() => router.push("/checkout")}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                              >
                                <ArrowRight className="h-5 w-5" />
                                Checkout Sekarang
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <button
                                onClick={() => checkoutItem(item.id, 1)}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                              >
                                <ArrowRight className="h-5 w-5" />
                                Beli Sekarang
                              </button>
                              <button
                                onClick={() => addToCart(item.id, 1)}
                                className="w-full bg-white border-2 border-emerald-200 hover:border-emerald-300 text-emerald-600 hover:text-emerald-700 font-medium py-2.5 px-4 rounded-xl transition-all duration-200 hover:bg-emerald-50 flex items-center justify-center gap-2"
                              >
                                <ShoppingCart className="h-4 w-4" />
                                Tambah ke Keranjang
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      // List View
                      <>
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {item.images && JSON.parse(item.images).length > 0 ? (
                            <img
                              src={JSON.parse(item.images)[0]}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 ml-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {item.name}
                                </h3>
                                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                  {item.category_name}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {item.code}
                              </p>
                              <p className="text-sm text-gray-500 mb-2">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-4">
                                <span className="text-xl font-bold text-gray-900">
                                  {formatPrice(item.online_price)}/{item.unit}
                                </span>
                                <span className="text-sm text-green-600">
                                  Stok: {item.quantity}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col items-end gap-3 min-w-[200px]">
                              {cartItems[item.id] ? (
                                <>
                                  <div className="flex items-center bg-gray-50 rounded-xl p-2">
                                    <button
                                      onClick={() =>
                                        updateCartQuantity(
                                          item.id,
                                          cartItems[item.id] - 1
                                        )
                                      }
                                      className="w-7 h-7 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all"
                                    >
                                      <Minus className="h-3 w-3 text-gray-600" />
                                    </button>
                                    <span className="mx-3 text-base font-semibold text-gray-900 min-w-[1.5rem] text-center">
                                      {cartItems[item.id]}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateCartQuantity(
                                          item.id,
                                          cartItems[item.id] + 1
                                        )
                                      }
                                      className="w-7 h-7 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all"
                                    >
                                      <Plus className="h-3 w-3 text-gray-600" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => router.push("/checkout")}
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center gap-2"
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                    Checkout
                                  </button>
                                </>
                              ) : (
                                <div className="space-y-2 w-full">
                                  <button
                                    onClick={() => checkoutItem(item.id, 1)}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                    Beli Sekarang
                                  </button>
                                  <button
                                    onClick={() => addToCart(item.id, 1)}
                                    className="w-full bg-white border-2 border-emerald-200 hover:border-emerald-300 text-emerald-600 hover:text-emerald-700 font-medium py-2 px-4 rounded-xl transition-all duration-200 hover:bg-emerald-50 flex items-center justify-center gap-2"
                                  >
                                    <ShoppingCart className="h-4 w-4" />+
                                    Keranjang
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-black"
                  >
                    Sebelumnya
                  </button>

                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: pageNum }))
                      }
                      className={`px-3 py-2 border rounded-lg ${
                        pagination.page === pageNum
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-gray-300 hover:bg-gray-50 text-black"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(prev.totalPages, prev.page + 1),
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-black"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </FeatureGuard>
  );
}
