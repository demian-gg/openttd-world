import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
  },
});
