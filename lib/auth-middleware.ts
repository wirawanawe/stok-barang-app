import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key";

// Convert string secret to Uint8Array for jose
const getJWTSecret = () => new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
  [key: string]: any; // Add index signature for jose compatibility
}

// Verify JWT token (middleware-safe version - no database calls)
export async function verifyTokenMiddleware(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret());
    return {
      userId: payload.userId as number,
      username: payload.username as string,
      role: payload.role as string,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// Check if user has admin role
export function isAdmin(user: JWTPayload): boolean {
  return user.role === "admin";
}
