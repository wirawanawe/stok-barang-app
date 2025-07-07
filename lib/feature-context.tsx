"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface FeatureToggle {
  id: number;
  feature_key: string;
  feature_name: string;
  description: string;
  is_enabled: boolean;
  category: string;
}

interface PageAccess {
  id: number;
  page_key: string;
  page_name: string;
  page_path: string;
  description: string;
  is_enabled: boolean;
  required_role: "super_admin" | "admin" | "user";
  category: string;
  sort_order: number;
}

interface FeatureContextType {
  features: FeatureToggle[];
  pages: PageAccess[];
  isLoading: boolean;
  isFeatureEnabled: (featureKey: string) => boolean;
  isPageEnabled: (pageKey: string) => boolean;
  hasPageAccess: (pageKey: string, userRole?: string) => boolean;
  getEnabledPages: (category?: string) => PageAccess[];
  refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export const useFeatures = () => {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error("useFeatures must be used within a FeatureProvider");
  }
  return context;
};

export const FeatureProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [features, setFeatures] = useState<FeatureToggle[]>([]);
  const [pages, setPages] = useState<PageAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Safely get auth context with fallback
  let user, isAuthenticated;
  try {
    const auth = useAuth();
    user = auth.user;
    isAuthenticated = auth.isAuthenticated;
  } catch (error) {
    // If useAuth is not available, set defaults
    user = null;
    isAuthenticated = false;
  }

  const fetchFeatures = async () => {
    try {
      // Fetch feature toggles
      const featuresResponse = await fetch("/api/public/features");
      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json();
        if (featuresData.success) {
          setFeatures(featuresData.data);
        }
      }

      // Fetch page access controls
      const pagesResponse = await fetch("/api/public/pages");
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        if (pagesData.success) {
          setPages(pagesData.data);
        }
      }
    } catch (error) {
      console.error("Error fetching features and pages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFeatures = async () => {
    setIsLoading(true);
    await fetchFeatures();
  };

  const isFeatureEnabled = (featureKey: string): boolean => {
    const feature = features.find((f) => f.feature_key === featureKey);
    if (feature) {
      return feature.is_enabled;
    }

    // Default fallback for homepage - enabled by default if not in database
    if (featureKey === "homepage") {
      return true;
    }

    return false;
  };

  const isPageEnabled = (pageKey: string): boolean => {
    const page = pages.find((p) => p.page_key === pageKey);
    return page ? page.is_enabled : false;
  };

  const hasPageAccess = (pageKey: string, userRole?: string): boolean => {
    const page = pages.find((p) => p.page_key === pageKey);

    // If page not found in database but it's homepage, allow access by default
    if (!page && pageKey === "homepage") {
      return true;
    }

    if (!page || !page.is_enabled) return false;

    const role = userRole || user?.role || "user";

    // Super admin has access to everything
    if (role === "super_admin") return true;

    // Admin has access to admin and user level pages
    if (
      role === "admin" &&
      (page.required_role === "admin" || page.required_role === "user")
    ) {
      return true;
    }

    // User has access only to user level pages
    if (role === "user" && page.required_role === "user") {
      return true;
    }

    return false;
  };

  const getEnabledPages = (category?: string): PageAccess[] => {
    let filteredPages = pages.filter(
      (page) => page.is_enabled && hasPageAccess(page.page_key)
    );

    if (category) {
      filteredPages = filteredPages.filter(
        (page) => page.category === category
      );
    }

    return filteredPages.sort((a, b) => a.sort_order - b.sort_order);
  };

  useEffect(() => {
    fetchFeatures();
  }, [isAuthenticated]);

  const value: FeatureContextType = {
    features,
    pages,
    isLoading,
    isFeatureEnabled,
    isPageEnabled,
    hasPageAccess,
    getEnabledPages,
    refreshFeatures,
  };

  return (
    <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>
  );
};

// Component to guard features and pages
interface FeatureGuardProps {
  featureKey?: string;
  pageKey?: string;
  userRole?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGuard({
  featureKey,
  pageKey,
  userRole = "user",
  fallback,
  children,
}: FeatureGuardProps) {
  const { isFeatureEnabled, hasPageAccess, isLoading } = useFeatures();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  // Check feature access
  if (featureKey && !isFeatureEnabled(featureKey)) {
    return fallback || <UnderMaintenancePage />;
  }

  // Check page access
  if (pageKey && !hasPageAccess(pageKey, userRole)) {
    return fallback || <UnderMaintenancePage />;
  }

  return <>{children}</>;
}

// Under Maintenance Page Component
function UnderMaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Maintenance Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          {/* Floating elements for visual appeal */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full opacity-60 animate-bounce"></div>
          <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-green-400 rounded-full opacity-40 animate-pulse"></div>
          <div className="absolute top-8 -left-8 w-4 h-4 bg-pink-400 rounded-full opacity-50 animate-ping"></div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Sedang Dalam Pemeliharaan
          </h1>

          <div className="space-y-4">
            <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
              Halaman yang Anda cari sedang dalam pemeliharaan untuk memberikan
              pengalaman yang lebih baik.
            </p>

            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                <div
                  className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-green-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
              <p className="text-gray-500 text-sm text-left">
                💻 Meningkatkan performa sistem
                <br />
                🔧 Menambahkan fitur baru
                <br />
                🚀 Optimasi pengalaman pengguna
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button
              onClick={() => (window.location.href = "/")}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Kembali ke Beranda
            </button>

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg border border-gray-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Muat Ulang
            </button>
          </div>

          {/* Additional Info */}
          <div className="pt-8 border-t border-gray-200 max-w-md mx-auto">
            <p className="text-sm text-gray-500 mb-2">Butuh bantuan segera?</p>
            <div className="flex justify-center space-x-6 text-sm">
              <a
                href="mailto:support@stokkain.com"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                📧 Email Support
              </a>
              <a
                href="tel:+628123456789"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                📞 Hubungi Kami
              </a>
            </div>
          </div>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 opacity-10 animate-pulse"></div>
          <div
            className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-10 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
