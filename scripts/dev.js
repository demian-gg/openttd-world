#!/usr/bin/env node

/**
 * Development server script.
 * Usage: npm run dev [-- --backend|--frontend]
 */

import { spawn } from "child_process";
import blessed from "blessed";

/** The panel definitions for each dev server. */
const panels = [
  {
    name: "frontend",
    color: "cyan",
    key: "f",
    command: ["npx", ["vite"]],
    cwd: "./frontend",
  },
  {
    name: "backend",
    color: "green",
    key: "b",
    command: [
      "npx",
      [
        "nodemon",
        "--exec",
        "node --import tsx src/server.ts",
      ],
    ],
    cwd: "./backend",
  },
];

/** The CLI arguments passed to the script. */
const args = process.argv.slice(2);

// Check for a single-service flag passthrough.
const passthrough = panels.find(
  (panel) => args.includes(`--${panel.name}`)
);

if (passthrough) {
  // Run the matched service with inherited stdio.
  const child = spawn(...passthrough.command, {
    stdio: "inherit",
    cwd: passthrough.cwd,
  });
  child.on("exit", (code) => process.exit(code || 0));
} else {
  // Run all services with split-view TUI.

  /** The blessed screen instance. */
  const screen = blessed.screen({
    smartCSR: true,
    title: "Dev Server",
  });

  /** The width percentage for each panel. */
  const panelWidth = Math.floor(100 / panels.length);

  // Create a panel, log, and child process per service.
  /** The active state for each service. */
  const state = panels.map((panel, index) => {
    /** The display label (capitalized name). */
    const label =
      panel.name[0].toUpperCase() + panel.name.slice(1);

    const box = blessed.box({
      top: 0,
      left: `${index * panelWidth}%`,
      width: `${panelWidth}%`,
      height: "100%-1",
      border: { type: "line" },
      label: ` ${label} `,
      tags: true,
      style: { border: { fg: panel.color } },
    });

    const log = blessed.log({
      parent: box,
      top: 0,
      left: 0,
      width: "100%-2",
      height: "100%-2",
      scrollable: true,
      alwaysScroll: true,
      scrollbar: { ch: " ", bg: panel.color },
      keys: true,
      vi: true,
      mouse: true,
      tags: true,
    });

    // Spawn the dev server and pipe into the log.
    const child = spawn(...panel.command, {
      cwd: panel.cwd,
      detached: true,
    });
    child.stdout.on("data", (d) => log.log(d.toString()));
    child.stderr.on("data", (d) => log.log(d.toString()));
    child.on("exit", (code) => {
      log.log(
        `{red-fg}${label} exited: ${code}{/red-fg}`
      );
      screen.render();
    });

    screen.append(box);

    return { label, log, child, key: panel.key };
  });

  // Build status bar text from panel keys.
  /** The default status bar content. */
  const DEFAULT_STATUS =
    " " +
    state
      .map((s) => `${s.key}: Copy ${s.label} Output`)
      .join(" | ") +
    " | Escape/q/Ctrl-C: Exit";

  /** The bottom bar displaying keyboard shortcuts. */
  const statusBar = blessed.box({
    bottom: 0,
    left: 0,
    width: "100%",
    height: 1,
    content: DEFAULT_STATUS,
    tags: true,
    style: { fg: "white", bg: "blue" },
  });
  screen.append(statusBar);

  /**
   * Displays a temporary message in the status bar.
   *
   * @param message - The message to display.
   *
   * @param duration - Duration in milliseconds.
   */
  function showStatus(message, duration = 2000) {
    // Set the temporary message.
    statusBar.setContent(message);
    screen.render();

    // Restore the default after the duration elapses.
    setTimeout(() => {
      statusBar.setContent(DEFAULT_STATUS);
      screen.render();
    }, duration);
  }

  /**
   * Copies text to the system clipboard via xclip.
   *
   * @param text - The content to copy.
   *
   * @param label - A label for the status message.
   */
  function copyToClipboard(text, label) {
    // Take only the last 50 lines.
    const trimmed = text.split("\n").slice(-50).join("\n");

    // Spawn xclip and pipe the text into it.
    const clipboardProcess = spawn(
      "xclip",
      ["-selection", "clipboard"],
      { shell: true }
    );
    clipboardProcess.stdin.write(trimmed);
    clipboardProcess.stdin.end();

    // Report success or failure in the status bar.
    clipboardProcess.on("exit", (code) => {
      if (code === 0) {
        showStatus(
          ` ✓ ${label} output copied to clipboard!`
        );
      } else {
        showStatus(
          " ✗ Failed to copy" +
            " (install xclip: sudo apt install xclip)"
        );
      }
    });
  }

  /** Terminates all child process groups and exits. */
  function cleanup() {
    for (const { child } of state) {
      try {
        if (child?.pid && !child.killed) {
          process.kill(-child.pid, "SIGTERM");
        }
      } catch {
        // Process already dead, ignore.
      }
    }
    setTimeout(() => process.exit(0), 500);
  }

  // Register clipboard key bindings per panel.
  for (const { key, label, log } of state) {
    screen.key([key], () => {
      copyToClipboard(log.getContent(), label);
    });
  }

  // Register exit key bindings.
  screen.key(["escape", "q", "C-c"], () => cleanup());
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Render the initial screen.
  screen.render();
}
