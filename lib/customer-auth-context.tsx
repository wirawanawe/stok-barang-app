"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface Customer {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (customerData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<Customer>) => Promise<boolean>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(
  undefined
);

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error(
      "useCustomerAuth must be used within a CustomerAuthProvider"
    );
  }
  return context;
};

export const CustomerAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("customer-auth-token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/customer/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
      } else {
        localStorage.removeItem("customer-auth-token");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      localStorage.removeItem("customer-auth-token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/customer/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("customer-auth-token", data.token);
        setCustomer(data.customer);
        return true;
      } else {
        console.error("Login failed:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (customerData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  }): Promise<boolean> => {
    try {
      const response = await fetch("/api/customer/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("customer-auth-token", data.token);
        setCustomer(data.customer);
        return true;
      } else {
        console.error("Registration failed:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("customer-auth-token");
    setCustomer(null);
    // Call logout API to clean up server-side session
    fetch("/api/customer/auth/logout", {
      method: "POST",
    }).catch(console.error);
  };

  const updateProfile = async (data: Partial<Customer>): Promise<boolean> => {
    try {
      const token = localStorage.getItem("customer-auth-token");
      const response = await fetch("/api/customer/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCustomer(result.customer);
        return true;
      } else {
        console.error("Profile update failed:", result.message);
        return false;
      }
    } catch (error) {
      console.error("Profile update error:", error);
      return false;
    }
  };

  const value = {
    customer,
    isAuthenticated: !!customer,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};
