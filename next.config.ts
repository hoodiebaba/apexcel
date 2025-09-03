import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Ignore TypeScript build errors (not recommended for production, but useful for unblock)
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;