/**
 * Application entry point.
 */

import { init } from "./engine/engine";
import { startLoop } from "./engine/compositor";
import { registerComponent, loadComponents } from "./engine/components";

import * as developerSprite from "./components/developer-sprite";

/** Initialize and start the application. */
async function main(): Promise<void> {
  // Create and attach canvas to DOM.
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  // Initialize engine.
  init({
    canvas,
    resolution: { pixelScale: 2 },
    backgroundColor: "#306499",
  });

  // Register components.
  registerComponent(developerSprite);

  // Load all components.
  await loadComponents();

  // Start render loop.
  startLoop();
}

main();
