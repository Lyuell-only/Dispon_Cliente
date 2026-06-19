import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O site é publicado em https://<user>.github.io/dispon_cliente/
// então o base precisa apontar para a subpasta do repositório.
export default defineConfig({
  plugins: [react()],
  base: "/dispon_cliente/",
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
