"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  Calendar,
  MapPin,
  Phone,
  User,
  ArrowRight,
  Home,
  ShoppingBag,
} from "lucide-react";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { FeatureGuard } from "@/lib/feature-context";

interface OrderItem {
  id: number;
  item_id: number;
  quantity: number;
  price: number;
  total: number;
  item_name: string;
  item_code: string;
  unit: string;
  description: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_notes: string;
  payment_method: string;
  payment_status: string;
  special_instructions: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
}

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { customer, isAuthenticated, isLoading } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("order_id");

  useEffect(() => {
    // Only redirect if not loading and not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push("/customer/login");
      return;
    }

    if (!orderId) {
      router.push("/shop");
      return;
    }

    // Only fetch order if authenticated and not loading
    if (!isLoading && isAuthenticated && orderId) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, isLoading, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem("customer-auth-token");
      const response = await fetch(
        `/api/customer/checkout?order_id=${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setOrder(data.data.order);
        setOrderItems(data.data.items);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Gagal memuat detail pesanan");
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Menunggu Konfirmasi";
      case "processing":
        return "Sedang Diproses";
      case "shipped":
        return "Dikirim";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Transfer Bank";
      case "cod":
        return "Bayar di Tempat (COD)";
      default:
        return method;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Menunggu Pembayaran";
      case "paid":
        return "Sudah Dibayar";
      case "failed":
        return "Gagal";
      default:
        return status;
    }
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
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat detail pesanan...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pesanan Tidak Ditemukan
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "Pesanan tidak dapat ditemukan"}
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            Kembali Berbelanja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <FeatureGuard
      featureKey="order_confirmation"
      pageKey="customer_confirmation"
      userRole="user"
    >
      <div className="min-h-screen bg-gray-50">
        {/* Success Header */}
        <div className="bg-green-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Pesanan Berhasil Dibuat!
              </h1>
              <p className="text-green-100 text-lg">
                Terima kasih telah berbelanja dengan kami. Pesanan Anda sedang
                diproses.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Detail Pesanan
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nomor Pesanan
                      </label>
                      <p className="text-lg font-mono font-semibold text-blue-600">
                        {order.order_number}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Tanggal Pesanan
                      </label>
                      <p className="text-gray-900">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <CreditCard className="h-4 w-4 inline mr-1" />
                        Metode Pembayaran
                      </label>
                      <p className="text-gray-900">
                        {getPaymentMethodText(order.payment_method)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status Pembayaran
                      </label>
                      <p className="text-gray-900">
                        {getPaymentStatusText(order.payment_status)}
                      </p>
                    </div>
                  </div>

                  {order.special_instructions && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catatan Khusus
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {order.special_instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Item Pesanan ({orderItems.length})
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {orderItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.item_name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {item.item_code}
                          </p>
                          <p className="text-sm text-gray-500 mb-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                              {item.quantity} {item.unit} ×{" "}
                              {formatPrice(item.price)}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatPrice(item.total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <Truck className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Informasi Pengiriman
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.shipping_name}
                      </p>
                      <p className="text-gray-600 flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {order.shipping_phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-900">{order.shipping_address}</p>
                      <p className="text-gray-600">
                        {order.shipping_city}, {order.shipping_postal_code}
                      </p>
                      {order.shipping_notes && (
                        <p className="text-sm text-gray-500 mt-1">
                          Catatan: {order.shipping_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1 mt-8 lg:mt-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Ringkasan Pembayaran
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {formatPrice(order.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ongkos Kirim</span>
                    <span className="font-medium">
                      {order.shipping_cost > 0
                        ? formatPrice(order.shipping_cost)
                        : "Gratis"}
                    </span>
                  </div>
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pajak</span>
                      <span className="font-medium">
                        {formatPrice(order.tax_amount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {order.payment_method === "bank_transfer" &&
                  order.payment_status === "pending" && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Instruksi Pembayaran
                      </h3>
                      <p className="text-sm text-blue-800 mb-2">
                        Silakan transfer ke rekening berikut:
                      </p>
                      <div className="text-sm text-blue-800">
                        <p>
                          <strong>Bank:</strong> BCA
                        </p>
                        <p>
                          <strong>No. Rekening:</strong> 1234567890
                        </p>
                        <p>
                          <strong>Atas Nama:</strong> PT Stok Barang
                        </p>
                        <p className="mt-2">
                          <strong>Jumlah:</strong>{" "}
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <Link
                    href="/shop"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Lanjut Berbelanja
                  </Link>
                  <Link
                    href="/"
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Home className="h-5 w-5" />
                    Kembali ke Beranda
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGuard>
  );
}
