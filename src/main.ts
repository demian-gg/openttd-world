/**
 * Application entry point.
 */

import { setupEngine, startEngine } from "./engine/engine";
import { registerComponent, loadComponents } from "./engine/components";

import { WorldMap } from "./components/world-map";

/**
 * Initialize and start the application.
 */
async function main(): Promise<void> {
  // Create and attach canvas to DOM.
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  // Setup the engine.
  setupEngine({
    canvas,
    backgroundColor: "#306499",
  });

  // Register components.
  registerComponent(new WorldMap());

  // Load all previously registered components.
  await loadComponents();

  // Start the engine.
  startEngine();
}

main();
