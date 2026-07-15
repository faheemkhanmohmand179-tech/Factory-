import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow preview sandbox origin to access the dev server without warnings
  allowedDevOrigins: [
    "preview-chat-46477f93-4504-42d0-8f84-a3d1017e9ec8.space-z.ai",
    "*.space-z.ai",
  ],
};

export default nextConfig;
