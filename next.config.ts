import type { NextConfig } from "next";
import path from "path";
import webpack from "webpack";

const emptyModule = path.resolve("./lib/empty-module.js");

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
