import type { NextConfig } from "next";
import path from "path";
import webpack from "webpack";

const emptyModule = path.resolve("./lib/empty-module.js");

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    // @coinbase/cdp-sdk (transitive dep of @wagmi/connectors) imports Solana
    // packages that are not installed. Replace ALL imports from these packages
    // with an empty module so the build doesn't fail.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@coinbase\/cdp-sdk/,
        emptyModule
      ),
      new webpack.NormalModuleReplacementPlugin(
        /^@solana\/kit/,
        emptyModule
      ),
      new webpack.NormalModuleReplacementPlugin(
        /^@solana-program\//,
        emptyModule
      )
    );
    return config;
  },
};

export default nextConfig;
