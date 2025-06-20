"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

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

      const response = await apiClient.get("/api/auth/me");

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);

        // Update localStorage
        localStorage.setItem("user", JSON.stringify(data.data));
      } else {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("auth-token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("auth-token");
    } finally {
      if (!skipLoading) setIsLoading(false);
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
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
        // Set user immediately for faster UI response
        setUser(data.data.user);
        setIsLoading(false);
        localStorage.setItem("auth-token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login failed:", error);
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
    // Check if user data exists in localStorage
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("auth-token");

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsLoading(false);

        // Verify authentication with server in background (no loading state)
        checkAuth(true);
      } catch (error) {
        console.error("Failed to parse saved user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("auth-token");
        checkAuth();
      }
    } else {
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
