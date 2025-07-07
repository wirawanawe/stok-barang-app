"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  Truck,
  MapPin,
  Phone,
  User,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
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

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [directCheckoutItem, setDirectCheckoutItem] = useState<any>(null);
  const [selectedCartItems, setSelectedCartItems] = useState<CartItem[]>([]);
  const [isDirectCheckout, setIsDirectCheckout] = useState(false);
  const [isSelectedCartCheckout, setIsSelectedCartCheckout] = useState(false);
  const [totals, setTotals] = useState<CartTotals>({
    subtotal: 0,
    totalItems: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    shipping_name: "",
    shipping_phone: "",
    shipping_address: "",
    shipping_city: "",
    shipping_postal_code: "",
    shipping_notes: "",
    payment_method: "bank_transfer",
    special_instructions: "",
  });

  const { customer, isAuthenticated, isLoading } = useCustomerAuth();
  const { updateCartCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/customer/login?redirect=/checkout");
      return;
    }

    // Auto-fill form with customer data when customer is loaded
    if (customer && isAuthenticated) {
      setFormData((prev) => ({
        ...prev,
        shipping_name: customer.full_name || "",
        shipping_phone: customer.phone || "",
        shipping_address: customer.address || "",
        shipping_city: customer.city || "",
        shipping_postal_code: customer.postal_code || "",
      }));
    }

    // Check checkout type
    const urlParams = new URLSearchParams(window.location.search);
    const isDirect = urlParams.get("direct") === "true";
    const isFromCart = urlParams.get("from") === "cart";

    setIsDirectCheckout(isDirect);
    setIsSelectedCartCheckout(isFromCart);

    if (isDirect) {
      // Handle direct checkout
      const directItem = localStorage.getItem("direct-checkout-item");
      if (directItem) {
        const item = JSON.parse(directItem);
        setDirectCheckoutItem(item);

        // Calculate totals for direct checkout
        const subtotal = item.online_price * item.quantity;
        const shipping = 0;
        const tax = 0;
        const total = subtotal + shipping + tax;

        setTotals({
          subtotal,
          totalItems: item.quantity,
          shipping,
          tax,
          total,
        });

        setLoading(false);
      } else {
        // No direct checkout item, redirect to shop
        router.push("/shop");
      }
    } else if (isFromCart) {
      // Handle selected cart items checkout
      const selectedItems = localStorage.getItem("selected-cart-items");
      if (selectedItems) {
        const items = JSON.parse(selectedItems);
        setSelectedCartItems(items);

        // Calculate totals for selected items
        const subtotal = items.reduce(
          (sum: number, item: CartItem) =>
            sum + item.cart_price * item.cart_quantity,
          0
        );
        const totalItems = items.reduce(
          (sum: number, item: CartItem) => sum + item.cart_quantity,
          0
        );
        const shipping = 0;
        const tax = 0;
        const total = subtotal + shipping + tax;

        setTotals({
          subtotal,
          totalItems,
          shipping,
          tax,
          total,
        });

        setLoading(false);
      } else {
        // No selected items, redirect to cart
        router.push("/cart");
      }
    } else {
      // Only fetch cart if authenticated and not loading
      if (!isLoading && isAuthenticated) {
        fetchCart();
      }
    }
  }, [isAuthenticated, isLoading, customer]);

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

        // If cart is empty, redirect to shop
        if (data.data.items.length === 0 && !isDirectCheckout) {
          router.push("/shop");
          return;
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Gagal memuat keranjang");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("customer-auth-token");

      let requestBody;
      if (isDirectCheckout && directCheckoutItem) {
        // For direct checkout, send item data directly
        requestBody = {
          ...formData,
          direct_checkout: true,
          item: directCheckoutItem,
        };
      } else if (isSelectedCartCheckout && selectedCartItems.length > 0) {
        // For selected cart items checkout
        requestBody = {
          ...formData,
          selected_cart_checkout: true,
          items: selectedCartItems,
        };
      } else {
        // For full cart checkout, use existing cart items
        requestBody = formData;
      }

      const response = await fetch("/api/customer/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);

        // Clear checkout data from localStorage
        if (isDirectCheckout) {
          localStorage.removeItem("direct-checkout-item");
        } else if (isSelectedCartCheckout) {
          localStorage.removeItem("selected-cart-items");
        } else {
          // Reset cart count since cart is now empty
          updateCartCount(0);
        }

        // Redirect to order confirmation page
        setTimeout(() => {
          router.push(`/order-confirmation?order_id=${data.data.order_id}`);
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Terjadi kesalahan saat memproses pesanan");
    } finally {
      setSubmitting(false);
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
          <p className="mt-4 text-gray-600">Memuat checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard
      featureKey="checkout"
      pageKey="customer_checkout"
      userRole="user"
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href={isDirectCheckout ? "/shop" : "/cart"}
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  {isDirectCheckout
                    ? "Kembali ke Shop"
                    : "Kembali ke Keranjang"}
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <CreditCard className="h-7 w-7 mr-2" />
                Checkout
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

          <form onSubmit={handleSubmit}>
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-8 space-y-8">
                {/* Shipping Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-4">
                    <Truck className="h-6 w-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Informasi Pengiriman
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 inline mr-1" />
                        Nama Penerima *
                      </label>
                      <input
                        type="text"
                        name="shipping_name"
                        value={formData.shipping_name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="Masukkan nama penerima"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Nomor Telepon *
                      </label>
                      <input
                        type="tel"
                        name="shipping_phone"
                        value={formData.shipping_phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Alamat Lengkap *
                      </label>
                      <textarea
                        name="shipping_address"
                        value={formData.shipping_address}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kota *
                      </label>
                      <input
                        type="text"
                        name="shipping_city"
                        value={formData.shipping_city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="Nama kota"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kode Pos *
                      </label>
                      <input
                        type="text"
                        name="shipping_postal_code"
                        value={formData.shipping_postal_code}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="12345"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catatan Pengiriman
                      </label>
                      <textarea
                        name="shipping_notes"
                        value={formData.shipping_notes}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="Patokan atau catatan khusus untuk kurir"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-4">
                    <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Metode Pembayaran
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment_method"
                        value="bank_transfer"
                        checked={formData.payment_method === "bank_transfer"}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-black">
                          Transfer Bank
                        </div>
                        <div className="text-sm text-gray-600">
                          Bayar melalui transfer ke rekening kami
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={formData.payment_method === "cod"}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-black">
                          Bayar di Tempat (COD)
                        </div>
                        <div className="text-sm text-gray-600">
                          Bayar saat barang diterima
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Catatan Khusus
                  </h2>
                  <textarea
                    name="special_instructions"
                    value={formData.special_instructions}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Catatan atau permintaan khusus untuk pesanan ini"
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-4 mt-8 lg:mt-0">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Ringkasan Pesanan
                  </h2>

                  {/* Items */}
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                    {isDirectCheckout && directCheckoutItem ? (
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {directCheckoutItem.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {directCheckoutItem.code}
                          </p>
                          <p className="text-sm text-gray-600">
                            {directCheckoutItem.quantity} ×{" "}
                            {formatPrice(directCheckoutItem.online_price)}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(
                            directCheckoutItem.online_price *
                              directCheckoutItem.quantity
                          )}
                        </div>
                      </div>
                    ) : isSelectedCartCheckout &&
                      selectedCartItems.length > 0 ? (
                      selectedCartItems.map((item) => (
                        <div
                          key={item.cart_id}
                          className="flex items-start space-x-3"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-500">{item.code}</p>
                            <p className="text-sm text-gray-600">
                              {item.cart_quantity} ×{" "}
                              {formatPrice(item.cart_price)}
                            </p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(item.cart_price * item.cart_quantity)}
                          </div>
                        </div>
                      ))
                    ) : (
                      cartItems.map((item) => (
                        <div
                          key={item.cart_id}
                          className="flex items-start space-x-3"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-500">{item.code}</p>
                            <p className="text-sm text-gray-600">
                              {item.cart_quantity} ×{" "}
                              {formatPrice(item.cart_price)}
                            </p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(item.cart_price * item.cart_quantity)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Totals */}
                  <div className="space-y-3 mb-6 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Subtotal ({totals.totalItems} items)
                      </span>
                      <span className="font-medium text-black">
                        {formatPrice(totals.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ongkos Kirim</span>
                      <span className="font-medium text-black">
                        {totals.shipping > 0
                          ? formatPrice(totals.shipping)
                          : "Gratis"}
                      </span>
                    </div>
                    {totals.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pajak</span>
                        <span className="font-medium text-black">
                          {formatPrice(totals.tax)}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-gray-900">
                          Total
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(totals.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Memproses Pesanan...
                      </>
                    ) : (
                      "Buat Pesanan"
                    )}
                  </button>

                  {/* Security Info */}
                  <div className="mt-4 text-center">
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
          </form>
        </div>
      </div>
    </FeatureGuard>
  );
}
