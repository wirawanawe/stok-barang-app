"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { logAuthDebugInfo } from "@/lib/auth-debug";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  const checkAuth = async (skipLoading = false) => {
    try {
      if (!skipLoading) setIsLoading(true);

      // Check if we have a token first
      const token = localStorage.getItem("auth-token");
      if (!token) {
        setUser(null);
        localStorage.removeItem("user");
        if (!skipLoading) setIsLoading(false);
        return;
      }

      const response = await apiClient.get("/api/auth/me");

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);

        // Update localStorage
        localStorage.setItem("user", JSON.stringify(data.data));
      } else {
        // Only clear auth on actual auth errors, not network issues
        if (response.status === 401 || response.status === 403) {
          setUser(null);
          localStorage.removeItem("user");
          localStorage.removeItem("auth-token");
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);

      // Don't immediately logout on network errors - distinguish between auth and network issues
      if (
        error instanceof Error &&
        error.message.includes("Authentication failed")
      ) {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("auth-token");
      }
      // For other errors (network issues), keep the user logged in but log the error
    } finally {
      if (!skipLoading) setIsLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      logAuthDebugInfo("Before login attempt");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Set user immediately for faster UI response
        setUser(data.data.user);
        setIsLoading(false);
        localStorage.setItem("auth-token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        logAuthDebugInfo("After successful login");
        return true;
      }

      logAuthDebugInfo("Login failed - invalid credentials");
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      logAuthDebugInfo("Login failed - network error");
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("auth-token");
      router.push("/login");
    }
  };

  useEffect(() => {
    logAuthDebugInfo("Auth context initialization");

    // Check if user data exists in localStorage
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("auth-token");

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsLoading(false);

        logAuthDebugInfo("Found saved auth data, verifying with server");
        // Verify authentication with server in background (no loading state)
        checkAuth(true);
      } catch (error) {
        console.error("Failed to parse saved user data:", error);
        logAuthDebugInfo("Failed to parse saved data");
        localStorage.removeItem("user");
        localStorage.removeItem("auth-token");
        checkAuth();
      }
    } else {
      logAuthDebugInfo("No saved auth data found");
      // No saved data, verify with server
      checkAuth();
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
