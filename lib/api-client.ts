// Utility functions for authenticated API calls

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function authenticatedFetch(
  url: string,
  options: FetchOptions = {}
) {
  // Get token from localStorage
  const token = localStorage.getItem("auth-token");

  // Merge headers with authentication
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle authentication errors more gracefully
    if (response.status === 401) {
      // Token expired or invalid - let auth context handle this
      console.warn("Authentication failed - token may be expired");
      throw new Error("Authentication failed");
    }

    if (response.status === 403) {
      throw new Error("Access forbidden - Admin access required");
    }

    return response;
  } catch (error) {
    // Don't immediately redirect on network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("Network error:", error);
      throw new Error("Network error - please check your connection");
    }

    console.error("API call failed:", error);
    throw error;
  }
}

// Convenience methods
export const apiClient = {
  get: (url: string, options?: FetchOptions) =>
    authenticatedFetch(url, { ...options, method: "GET" }),

  post: (url: string, data?: any, options?: FetchOptions) =>
    authenticatedFetch(url, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: any, options?: FetchOptions) =>
    authenticatedFetch(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: FetchOptions) =>
    authenticatedFetch(url, { ...options, method: "DELETE" }),
};
