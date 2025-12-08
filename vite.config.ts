import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "assets",
  build: {
    outDir: "build",
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
  },
});
