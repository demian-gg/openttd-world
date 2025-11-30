/**
 * Application entry point.
 */

import { initializeEngine } from "./engine/engine";
import { initializeCompositor } from "./engine/compositor";
import { registerComponent, loadComponents } from "./engine/components";

import * as developerSprite from "./components/developer-sprite";

/** Initialize and start the application. */
async function main(): Promise<void> {
  // Create and attach canvas to DOM.
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  // Initialize engine.
  initializeEngine({
    canvas,
    resolution: { pixelScale: 2 },
    backgroundColor: "#306499",
  });

  // Register components.
  registerComponent(developerSprite);
  // registerComponent(anotherComponent);
  // registerComponent(yetAnotherComponent);

  // Load all components.
  await loadComponents();

  // Initialize compositor, starting the render loop.
  initializeCompositor();
}

main();
