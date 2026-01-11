// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "static", // 💡 Required for GitHub Pages deployment
  base: "/MatthewTHutchinson.github.io/", // Must match your repo name (case-sensitive)
  vite: {
    plugins: [tailwindcss()],
  },
});