import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/** 루트에서 vite --config examples/playground/vite.config.ts 실행 시에도 playground 폴더가 root가 되도록 */
const playgroundRoot = path.resolve(__dirname, ".");

export default defineConfig({
  plugins: [react()],
  root: playgroundRoot,
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
