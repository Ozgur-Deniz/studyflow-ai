import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Extracts and verifies the authenticated user ID from the JWT token cookie.
 * All API routes should use this single function for consistent authentication.
 * Throws an error if the token is missing or invalid.
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string> {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    throw new AuthError("Unauthorized.", 401);
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  const userId = payload.id as string;

  if (!userId) {
    throw new AuthError("Invalid token payload.", 401);
  }

  return userId;
}

/**
 * Custom error class for authentication failures.
 * Includes an HTTP status code for easy response generation.
 */
export class AuthError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}
