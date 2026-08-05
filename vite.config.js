import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["@tanstack/react-router"],
          "vendor-convex": ["convex"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
