import type { NextConfig } from "next";
import path from "path";

const emptyModule = path.resolve("./lib/empty-module.js");

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    // @coinbase/cdp-sdk (transitive dep of @wagmi/connectors) imports Solana
    // packages that are not installed. Replace ALL imports from these packages
    // with an empty module so the build doesn't fail.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { NormalModuleReplacementPlugin } = require("webpack");
    config.plugins.push(
      new NormalModuleReplacementPlugin(/^@coinbase\/cdp-sdk/, emptyModule),
      new NormalModuleReplacementPlugin(/^@solana\/kit/, emptyModule),
      new NormalModuleReplacementPlugin(/^@solana-program\//, emptyModule)
    );
    return config;
  },
};

export default nextConfig;
