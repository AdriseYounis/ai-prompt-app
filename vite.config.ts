import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "./frontend",
  build: {
    outDir: "../dist/frontend",
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 3001,
    proxy: {
      "/api": {
        target: "http://localhost:3030",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend/src"),
    },
  },
});
