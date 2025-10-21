import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import { getDB } from "./cloudflare";

/**
 * Authentication middleware for protecting API routes
 * Returns the authenticated user or throws an error
 * Also checks if user account is active (not pending approval)
 */
export async function requireAuth(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to access this resource" },
        { status: 401 }
      );
    }

    // Check if user is active (not pending approval)
    const db = await getDB();
    if (db) {
      const user = await db
        .prepare('SELECT active FROM user WHERE id = ?')
        .bind(session.user.id)
        .first<{ active: number }>();

      if (user && user.active === 0) {
        return NextResponse.json(
          { error: "Account pending approval - Please wait for admin to activate your account" },
          { status: 403 }
        );
      }
    }

    return {
      user: session.user,
      session: session.session,
    };
  } catch (error) {
    console.error("[Auth Middleware] Error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}

/**
 * Optional auth middleware - returns user if authenticated, null otherwise
 * Does not block the request
 */
export async function optionalAuth(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return null;
    }

    return {
      user: session.user,
      session: session.session,
    };
  } catch (error) {
    console.error("[Optional Auth] Error:", error);
    return null;
  }
}

/**
 * Helper to check if user owns a resource
 */
export function checkOwnership(userId: string, resourceUserId: string | null) {
  if (!resourceUserId) {
    // Resource has no owner (legacy data) - could allow or deny based on policy
    return false;
  }

  return userId === resourceUserId;
}
