#!/usr/bin/env node

/**
 * Clean script, removes all node_modules directories.
 * Usage: npm run clean
 */

import { spawn } from "child_process";

console.log("\n🧹 Cleaning node_modules...\n");

/** The directories to remove. */
const targets = [
  "backend/node_modules",
  "frontend/node_modules",
  "node_modules",
];

const child = spawn("rm", ["-rf", ...targets], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  if (code === 0) {
    console.log("\n✓ Cleaned successfully.\n");
  }
  process.exit(code);
});
