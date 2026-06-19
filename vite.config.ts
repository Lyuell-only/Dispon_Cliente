import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O site é publicado em https://<user>.github.io/Dispon_Cliente/
// então o base precisa apontar para a subpasta do repositório.
// IMPORTANTE: o caminho do GitHub Pages diferencia maiúsculas/minúsculas e
// precisa ser idêntico ao nome do repositório ("Dispon_Cliente").
export default defineConfig({
  plugins: [react()],
  base: "/Dispon_Cliente/",
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
