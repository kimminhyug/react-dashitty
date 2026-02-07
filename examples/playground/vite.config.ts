import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      dashboardity: path.resolve(__dirname, "../../src"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-griditty", "@dashboardity/layout-core"],
  },
  server: {
    port: 5173,
    open: true,
  },
});
