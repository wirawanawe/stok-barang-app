import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key";
const JWT_EXPIRES_IN = "7d";

// Convert string secret to Uint8Array for jose
const getJWTSecret = () => new TextEncoder().encode(JWT_SECRET);

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  is_active: boolean;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
  [key: string]: any; // Add index signature for jose compatibility
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export async function generateToken(user: User): Promise<string> {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRES_IN)
    .setIssuedAt()
    .sign(getJWTSecret());

  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
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
    // Log specific error types for better debugging
    if (error instanceof Error) {
      if (error.message.includes("expired")) {
        console.warn("Token expired:", error.message);
      } else if (error.message.includes("signature")) {
        console.error("Token signature verification failed:", error.message);
      } else {
        console.error("Token verification failed:", error.message);
      }
    } else {
      console.error("Token verification failed:", error);
    }
    return null;
  }
}

// Extract token from request headers
export function extractTokenFromHeaders(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// Check if user has admin role
export function isAdmin(user: JWTPayload | User): boolean {
  return user.role === "admin";
}
