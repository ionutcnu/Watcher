import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";
import { getDBSync } from "./cloudflare";

// Better Auth configuration with D1 database using Kysely
export const auth = betterAuth({
  database: {
    // D1 database adapter using Kysely - Better Auth will use this for storing users, sessions, accounts
    provider: "sqlite", // D1 is SQLite-compatible
    // Use a getter function to avoid calling getDB() at module initialization time
    // Wrap D1 with Kysely for proper ORM support
    get db() {
      const d1 = getDBSync();
      return new Kysely({
        dialect: new D1Dialect({ database: d1 }),
      });
    },
  },

  // Email and Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can enable later with email service
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true, // Automatically sign in after registration
  },

  // User configuration
  user: {
    // Additional user fields can be added here
    additionalFields: {
      username: {
        type: "string",
        required: false,
        unique: true,
      },
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },

  // Advanced security settings
  advanced: {
    cookieSameSite: "lax",
    cookieSecure: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
    // Enable CSRF protection
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // Rate limiting configuration
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute window
    max: 10, // max 10 requests per window
  },

  // Trust proxy headers (for Cloudflare)
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],

});

// Export types for use in other files
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
