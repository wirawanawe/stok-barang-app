"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, Package } from "lucide-react";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [websiteInfo, setWebsiteInfo] = useState<any>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
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

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        // No token, user definitely not logged in
        return;
      }

      const response = await fetch("/api/auth/me");
      if (response.ok) {
        router.push(redirectTo);
      } else {
        // Token invalid, clear it
        localStorage.removeItem("auth-token");
        localStorage.removeItem("user");
      }
    } catch (error) {
      // User not logged in, continue to login page
      localStorage.removeItem("auth-token");
      localStorage.removeItem("user");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage for client-side access
        localStorage.setItem("auth-token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        // Show success message before redirect
        setError(""); // Clear any previous errors

        // Redirect to dashboard based on user role
        const redirectUrl = redirectTo !== "/" ? redirectTo : "/dashboard";

        // Use window.location for immediate redirect (faster than router.push)
        window.location.href = redirectUrl;
      } else {
        setError(data.message || "Login gagal");
      }
    } catch (error) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-white px-8 py-6 text-black">
          <div className="flex items-center justify-center mb-4">
            {websiteInfo?.settings?.site_logo ? (
              <img
                src={websiteInfo.settings.site_logo}
                alt={websiteInfo.settings.site_title || "Logo"}
                className="h-10 w-auto mr-3"
              />
            ) : (
              <Package className="h-10 w-10 mr-3" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-center">
            {websiteInfo?.settings?.site_title || "Stok Barang App"}
          </h1>
          <p className="text-black text-center mt-2">
            {websiteInfo?.settings?.site_description ||
              "Sistem Manajemen Inventori"}
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username atau Email
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Masukkan username atau email"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Masukkan password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ff1717] hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Masuk ke aplikasi...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
              <div className="flex items-center justify-center mb-4">
                <Package className="h-12 w-12" />
              </div>
              <h1 className="text-2xl font-bold text-center">
                Stok Barang App
              </h1>
              <p className="text-blue-100 text-center mt-2">
                Sistem Manajemen Inventori
              </p>
            </div>
            <div className="px-8 py-6">
              <div className="animate-pulse space-y-6">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
