import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

/**
 * Authentication middleware for protecting API routes
 * Returns the authenticated user or throws an error
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
