import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Export Better Auth handlers for Next.js App Router
// This handles all auth routes: /api/auth/signin, /api/auth/callback, etc.
export const { GET, POST } = toNextJsHandler(auth);
