import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    // @coinbase/cdp-sdk is a transitive dep of @elevenlabs/react that imports
    // Solana packages not installed in this project. Ignore it entirely.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@coinbase/cdp-sdk": false,
      "@solana-program/system": false,
      "@solana-program/token": false,
    };
    return config;
  },
};

export default nextConfig;
