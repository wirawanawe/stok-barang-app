import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { executeQuery } from "./db";

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
    console.error("Token verification failed:", error);
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

// Session management functions
export async function createUserSession(
  userId: number,
  sessionToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<boolean> {
  try {
    // First, delete any existing sessions for this user (physically remove them)
    await executeQuery("DELETE FROM user_sessions WHERE user_id = ?", [userId]);

    // Create new session with 7 days expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await executeQuery(
      `INSERT INTO user_sessions (user_id, session_token, expires_at, user_agent, ip_address) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, sessionToken, expiresAt, userAgent, ipAddress]
    );

    return result.success;
  } catch (error) {
    console.error("Error creating user session:", error);
    return false;
  }
}

export async function getUserActiveSession(
  userId: number
): Promise<string | null> {
  try {
    const result = await executeQuery(
      `SELECT session_token FROM user_sessions 
       WHERE user_id = ? AND is_active = true AND expires_at > NOW()`,
      [userId]
    );

    if (
      result.success &&
      Array.isArray(result.data) &&
      result.data.length > 0
    ) {
      const session = result.data[0] as any;
      return session.session_token;
    }
    return null;
  } catch (error) {
    console.error("Error getting user active session:", error);
    return null;
  }
}

export async function validateSession(
  sessionToken: string
): Promise<{ valid: boolean; userId?: number }> {
  try {
    const result = await executeQuery(
      `SELECT user_id FROM user_sessions 
       WHERE session_token = ? AND is_active = true AND expires_at > NOW()`,
      [sessionToken]
    );

    if (
      result.success &&
      Array.isArray(result.data) &&
      result.data.length > 0
    ) {
      const session = result.data[0] as any;
      return { valid: true, userId: session.user_id };
    }
    return { valid: false };
  } catch (error) {
    console.error("Error validating session:", error);
    return { valid: false };
  }
}

export async function removeUserSession(
  sessionToken: string
): Promise<boolean> {
  try {
    const result = await executeQuery(
      "DELETE FROM user_sessions WHERE session_token = ?",
      [sessionToken]
    );
    return result.success;
  } catch (error) {
    console.error("Error removing user session:", error);
    return false;
  }
}

export async function removeAllUserSessions(userId: number): Promise<boolean> {
  try {
    const result = await executeQuery(
      "DELETE FROM user_sessions WHERE user_id = ?",
      [userId]
    );
    return result.success;
  } catch (error) {
    console.error("Error removing all user sessions:", error);
    return false;
  }
}

// Cleanup expired sessions (can be called periodically)
export async function cleanupExpiredSessions(): Promise<boolean> {
  try {
    const result = await executeQuery(
      "UPDATE user_sessions SET is_active = false WHERE expires_at <= NOW()"
    );
    return result.success;
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
    return false;
  }
}

// Helper function for API routes to validate session
export async function validateApiRequest(request: Request): Promise<{
  valid: boolean;
  user?: JWTPayload;
  error?: string;
}> {
  try {
    // Get token from headers (set by middleware)
    const token = request.headers.get("x-session-token");

    if (!token) {
      return { valid: false, error: "No session token found" };
    }

    // Verify JWT token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return { valid: false, error: "Invalid JWT token" };
    }

    // Validate session in database
    const sessionValidation = await validateSession(token);
    if (!sessionValidation.valid) {
      return { valid: false, error: "Session not found or expired" };
    }

    return { valid: true, user: decoded };
  } catch (error) {
    console.error("API request validation error:", error);
    return { valid: false, error: "Validation error" };
  }
}
