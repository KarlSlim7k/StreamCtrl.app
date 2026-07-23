import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/overlay/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3100,
    strictPort: true,
    proxy: {
      "/socket.io": {
        target: "http://127.0.0.1:3103",
        ws: true
      }
    }
  }
});
