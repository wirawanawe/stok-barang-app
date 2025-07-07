"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useFeatures } from "@/lib/feature-context";
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
  Globe,
  Newspaper,
  Shield,
  Sliders,
  Lock,
  Database,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [superAdminOpen, setSuperAdminOpen] = useState(false);
  const [websiteInfo, setWebsiteInfo] = useState<any>(null);
  // Safely get auth and feature context with fallbacks
  let user, isSuperAdmin, isAdmin;
  let isFeatureEnabled, hasPageAccess;

  try {
    const auth = useAuth();
    user = auth.user;
    isSuperAdmin = auth.isSuperAdmin;
    isAdmin = auth.isAdmin;
  } catch (error) {
    // If useAuth is not available, set defaults
    user = null;
    isSuperAdmin = false;
    isAdmin = false;
  }

  try {
    const features = useFeatures();
    isFeatureEnabled = features.isFeatureEnabled;
    hasPageAccess = features.hasPageAccess;
  } catch (error) {
    // If useFeatures is not available, set defaults
    isFeatureEnabled = () => true;
    hasPageAccess = () => true;
  }

  useEffect(() => {
    fetchWebsiteInfo();
  }, []);

  const fetchWebsiteInfo = async () => {
    try {
      const response = await fetch("/api/public/website-info");
      const data = await response.json();
      if (data.success) {
        setWebsiteInfo(data.data);
      }
    } catch (error) {
      console.error("Error fetching website info:", error);
    }
  };

  const mainMenuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      featureKey: "dashboard",
      pageKey: "dashboard",
    },
    {
      name: "POS / Transaksi",
      href: "/dashboard/transactions",
      icon: ArrowUpDown,
      featureKey: "transactions",
      pageKey: "transactions",
    },
    {
      name: "Stok Barang",
      href: "/dashboard/items",
      icon: Package,
      featureKey: "items_management",
      pageKey: "items",
    },
    {
      name: "Customer",
      href: "/dashboard/customers",
      icon: Users,
      featureKey: "customers",
      pageKey: "customers",
    },
    {
      name: "Laporan",
      href: "/dashboard/reports",
      icon: FileText,
      featureKey: "reports",
      pageKey: "reports",
    },
  ];

  const settingsItems = [
    {
      name: "User Management",
      href: "/dashboard/settings/users",
      icon: Users,
      featureKey: "user_management",
      pageKey: "settings_users",
    },
    {
      name: "Pengaturan Website",
      href: "/dashboard/settings/website",
      icon: Globe,
      featureKey: "website_settings",
      pageKey: "settings_website",
    },
    {
      name: "Kelola Berita",
      href: "/dashboard/settings/news",
      icon: Newspaper,
      featureKey: "news_management",
      pageKey: "settings_news",
    },
    {
      name: "Kelola Lokasi",
      href: "/dashboard/settings/locations",
      icon: MapPin,
      featureKey: "locations",
      pageKey: "settings_locations",
    },
    {
      name: "Kelola Kategori",
      href: "/dashboard/settings/categories",
      icon: Tag,
      featureKey: "categories",
      pageKey: "settings_categories",
    },
  ];

  // Super Admin exclusive menu items (hidden from regular users and admins)
  const superAdminItems = [
    {
      name: "Feature Toggles",
      href: "/dashboard/super-admin/features",
      icon: Sliders,
      description: "Manage system features",
    },
    {
      name: "Page Access Control",
      href: "/dashboard/super-admin/pages",
      icon: Lock,
      description: "Control page access",
    },
    {
      name: "System Configuration",
      href: "/dashboard/super-admin/config",
      icon: Database,
      description: "System settings",
    },
    {
      name: "User Roles",
      href: "/dashboard/super-admin/roles",
      icon: Shield,
      description: "Manage user roles",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const isSettingsActive = settingsItems.some((item) => isActive(item.href));
  const isSuperAdminActive = superAdminItems.some((item) =>
    isActive(item.href)
  );

  // Filter menu items based on feature toggles and page access
  const getVisibleMenuItems = (items: any[]) => {
    return items.filter((item) => {
      const featureEnabled =
        !item.featureKey || isFeatureEnabled(item.featureKey);
      const pageAccessible = !item.pageKey || hasPageAccess(item.pageKey);
      return featureEnabled && pageAccessible;
    });
  };

  const visibleMainItems = getVisibleMenuItems(mainMenuItems);
  const visibleSettingsItems = getVisibleMenuItems(settingsItems);

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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
          <div className="flex items-center">
            {websiteInfo?.settings?.site_logo ? (
              <img
                src={websiteInfo.settings.site_logo}
                alt={websiteInfo.settings.site_title || "Logo"}
                className="h-10 w-auto mr-3"
              />
            ) : (
              <div className="p-2 bg-emerald-600 rounded-lg mr-3">
                <Package className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {websiteInfo?.settings?.site_title || "Stok Kain"}
              </h1>
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
          {visibleMainItems.map((item) => {
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
                      ? "bg-[#ff1717] text-white shadow-lg shadow-emerald-600/25"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}

          {/* Super Admin Menu - Only visible to super admin */}
          {isSuperAdmin && (
            <div>
              <button
                onClick={() => setSuperAdminOpen(!superAdminOpen)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isSuperAdminActive || superAdminOpen
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-3" />
                  System Control
                </div>
                {superAdminOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Super Admin Submenu */}
              {superAdminOpen && (
                <div className="mt-2 ml-6 space-y-1 border-l-2 border-purple-200 pl-4">
                  {superAdminItems.map((item) => {
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
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium"
                              : "text-gray-600 hover:bg-purple-50 hover:text-purple-800"
                          }
                        `}
                        title={item.description}
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

          {/* Settings with Submenu - Only for Admin and Super Admin */}
          {isAdmin && visibleSettingsItems.length > 0 && (
            <div>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isSettingsActive || settingsOpen
                      ? "bg-[#ff1717] text-white shadow-lg shadow-emerald-600/25"
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
                  {visibleSettingsItems.map((item) => {
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
                              ? "bg-[#ff1717] text-white font-medium"
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
          <div className="text-xs text-gray-400 text-center mt-1">
            v1.0.0 {isSuperAdmin && "- Super Admin"}
          </div>
        </div>
      </div>
    </>
  );
}
