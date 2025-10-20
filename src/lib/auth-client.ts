import { createAuthClient } from "better-auth/react";

// Better Auth client for frontend
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export hooks for use in components
export const {
  useSession,
  signIn,
  signUp,
  signOut,
} = authClient;
