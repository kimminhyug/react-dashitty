import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@dashboardity/layout-core": path.resolve(__dirname, "node_modules/@dashboardity/layout-core"),
      "@dashboardity/layout-store": path.resolve(__dirname, "node_modules/@dashboardity/layout-store"),
    },
  },
});
