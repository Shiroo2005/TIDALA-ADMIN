import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
      "@app": resolve(import.meta.dirname, "src/app"),
      "@config": resolve(import.meta.dirname, "src/config"),
      "@features": resolve(import.meta.dirname, "src/features"),
      "@pages": resolve(import.meta.dirname, "src/pages"),
      "@routes": resolve(import.meta.dirname, "src/routes"),
      "@services": resolve(import.meta.dirname, "src/services"),
      "@shared": resolve(import.meta.dirname, "src/shared"),
    },
  },
  server: { port: 5174, host: true },
});
