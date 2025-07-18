"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut, User } from "lucide-react";
import Sidebar from "./Sidebar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { CustomerAuthProvider } from "@/lib/customer-auth-context";
import { CartProvider } from "@/lib/cart-context";
import { FeatureProvider } from "@/lib/feature-context";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Component for public routes (no auth needed)
function PublicLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  // Don't show layout for login page
  if (pathname === "/dashboard/login") {
    return <>{children}</>;
  }

  // For homepage, wrap with CustomerAuthProvider and FeatureProvider
  if (pathname === "/") {
    return (
      <FeatureProvider>
        <CustomerAuthProvider>{children}</CustomerAuthProvider>
      </FeatureProvider>
    );
  }

  // For other public routes, just render the content
  return <>{children}</>;
}

// Component for dashboard routes (auth required)
function DashboardLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated, isLoading, displayRole } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Show loading state only if authentication is being checked and no user data
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Memuat aplikasi...</p>
          <p className="mt-2 text-gray-500 text-sm">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not loading, redirect will be handled by middleware
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-8 bg-blue-200 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  // Render dashboard layout with sidebar
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 ml-2 lg:ml-0">
                Sistem Stok Barang
              </h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.full_name}</span>
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {displayRole}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  // Routes that don't need AuthProvider (public customer pages)
  const publicRoutes = ["/", "/dashboard/login"];

  // Routes that need customer auth (shop, cart, etc.)
  const customerRoutes = [
    "/shop",
    "/cart",
    "/checkout",
    "/order-confirmation",
    "/customer",
  ];

  // Routes that require dashboard layout (with sidebar and auth)
  const dashboardRoutes = [
    "/dashboard",
    "/dashboard/items",
    "/dashboard/reports",
    "/dashboard/settings",
    "/dashboard/transactions",
  ];

  const isPublicRoute = publicRoutes.includes(pathname);
  const isCustomerRoute = customerRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isDashboardRoute = dashboardRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // For public routes, use PublicLayout (no AuthProvider needed)
  if (isPublicRoute) {
    return <PublicLayout>{children}</PublicLayout>;
  }

  // For customer routes, use customer auth with cart
  if (isCustomerRoute) {
    return (
      <CustomerAuthProvider>
        <CartProvider>{children}</CartProvider>
      </CustomerAuthProvider>
    );
  }

  // For dashboard routes, use DashboardLayout with AuthProvider and FeatureProvider
  if (isDashboardRoute) {
    return (
      <AuthProvider>
        <FeatureProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </FeatureProvider>
      </AuthProvider>
    );
  }

  // For other routes, just render children
  return <>{children}</>;
}
