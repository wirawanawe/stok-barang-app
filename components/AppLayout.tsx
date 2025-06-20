"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut, User } from "lucide-react";
import Sidebar from "./Sidebar";
import { AuthProvider, useAuth } from "@/lib/auth-context";

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Don't show layout for login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

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
                  {user?.role}
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
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  );
}
