"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Package,
  ArrowUpDown,
  FileText,
  Settings,
  Users,
  MapPin,
  Tag,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user } = useAuth();

  const mainMenuItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Transaksi",
      href: "/transactions",
      icon: ArrowUpDown,
    },
    {
      name: "Stok Barang",
      href: "/items",
      icon: Package,
    },
    {
      name: "Laporan",
      href: "/reports",
      icon: FileText,
    },
  ];

  const settingsItems = [
    {
      name: "User Management",
      href: "/settings/users",
      icon: Users,
    },

    {
      name: "Kelola Lokasi",
      href: "/settings/locations",
      icon: MapPin,
    },
    {
      name: "Kelola Kategori",
      href: "/settings/categories",
      icon: Tag,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const isSettingsActive = settingsItems.some((item) => isActive(item.href));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 z-50 h-screen bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto lg:h-screen
        w-64 border-r border-gray-200 flex flex-col
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg mr-3">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Stok Kain</h1>
              <p className="text-xs text-gray-600">Management System</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
          {/* Main Menu Items */}
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={`
                  flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive(item.href)
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}

          {/* Settings with Submenu - Only for Admin */}
          {user?.role === "admin" && (
            <div>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isSettingsActive || settingsOpen
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <div className="flex items-center">
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </div>
                {settingsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Settings Submenu */}
              {settingsOpen && (
                <div className="mt-2 ml-6 space-y-1 border-l-2 border-gray-200 pl-4">
                  {settingsItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            onToggle();
                          }
                        }}
                        className={`
                          flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200
                          ${
                            isActive(item.href)
                              ? "bg-blue-50 text-blue-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                          }
                        `}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-xs text-gray-500 text-center">
            © 2025 Sistem Stok Kain
          </div>
          <div className="text-xs text-gray-400 text-center mt-1">v1.0.0</div>
        </div>
      </div>
    </>
  );
}
