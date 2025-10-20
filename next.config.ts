import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Initialize Cloudflare development environment
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable to prevent double-mounting particles
};

export default nextConfig;
