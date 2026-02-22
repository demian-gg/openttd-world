#!/usr/bin/env node

/**
 * Build script.
 * Usage: npm run build [-- --backend|--frontend]
 */

import { spawn } from "child_process";

/** The CLI arguments passed to the script. */
const args = process.argv.slice(2);

if (args.includes("--backend")) {
  // Build backend only.
  const child = spawn("npx", ["tsc"], {
    stdio: "inherit",
    cwd: "./backend",
  });
  child.on("exit", (code) => process.exit(code || 0));
} else if (args.includes("--frontend")) {
  // Build frontend only.
  const child = spawn("npx", ["vite", "build"], {
    stdio: "inherit",
    cwd: "./frontend",
  });
  child.on("exit", (code) => process.exit(code || 0));
} else {
  // Build both sequentially (backend first).
  console.log("\n🏗️  Building backend...\n");
  const backend = spawn("npx", ["tsc"], {
    stdio: "inherit",
    cwd: "./backend",
  });

  backend.on("exit", (code) => {
    if (code !== 0) {
      console.log("\n✗ Backend build failed.\n");
      process.exit(code);
    }

    // Build frontend after backend succeeds.
    console.log("\n🏗️  Building frontend...\n");
    const frontend = spawn("npx", ["vite", "build"], {
      stdio: "inherit",
      cwd: "./frontend",
    });

    frontend.on("exit", (code) => {
      if (code === 0) {
        console.log("\n✓ Build complete!\n");
      } else {
        console.log("\n✗ Frontend build failed.\n");
      }
      process.exit(code);
    });
  });
}
