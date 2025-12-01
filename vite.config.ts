import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "build",
    emptyOutDir: true,
    sourcemap: false,
    minify: "esbuild",
  },
});
