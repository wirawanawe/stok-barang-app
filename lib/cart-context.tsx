"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CartContextType {
  cartCount: number;
  fetchCartCount: () => Promise<void>;
  updateCartCount: (count: number) => void;
  incrementCartCount: (increment: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem("customer-auth-token");
      if (!token) {
        setCartCount(0);
        return;
      }

      const response = await fetch("/api/customer/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const totalItems = data.data.totals.totalItems || 0;
        setCartCount(totalItems);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
      setCartCount(0);
    }
  };

  const updateCartCount = (count: number) => {
    setCartCount(count);
  };

  const incrementCartCount = (increment: number) => {
    setCartCount((prev) => Math.max(0, prev + increment));
  };

  // Fetch cart count when component mounts
  useEffect(() => {
    fetchCartCount();
  }, []);

  // Listen for storage changes (e.g., when user logs out)
  useEffect(() => {
    const handleStorageChange = () => {
      fetchCartCount();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        fetchCartCount,
        updateCartCount,
        incrementCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
