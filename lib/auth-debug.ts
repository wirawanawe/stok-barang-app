// Debug utilities for authentication issues

export interface AuthDebugInfo {
  hasLocalStorageToken: boolean;
  hasUserInLocalStorage: boolean;
  tokenFromLocalStorage: string | null;
  userAgent: string;
  timestamp: string;
  url: string;
}

export function getAuthDebugInfo(): AuthDebugInfo {
  const hasLocalStorageToken = !!localStorage.getItem("auth-token");
  const hasUserInLocalStorage = !!localStorage.getItem("user");
  const tokenFromLocalStorage = localStorage.getItem("auth-token");
  const userAgent = navigator.userAgent;
  const timestamp = new Date().toISOString();
  const url = window.location.href;

  return {
    hasLocalStorageToken,
    hasUserInLocalStorage,
    tokenFromLocalStorage: tokenFromLocalStorage
      ? `${tokenFromLocalStorage.substring(0, 20)}...`
      : null,
    userAgent,
    timestamp,
    url,
  };
}

export function logAuthDebugInfo(context: string) {
  if (typeof window !== "undefined") {
    const debugInfo = getAuthDebugInfo();
    console.log(`[AUTH DEBUG] ${context}:`, debugInfo);
  }
}

export function clearAuthDebugInfo() {
  if (typeof window !== "undefined") {
    console.log("[AUTH DEBUG] Clearing authentication data");
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user");
  }
}
