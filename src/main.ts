/**
 * Application entry point.
 */

import { setupEngine, startEngine } from "./engine/engine";
import { registerComponent, loadComponents } from "./engine/components";

import { Vignette } from "./components/vignette";
import { WorldGrid } from "./components/world-grid";
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
  registerComponent(new WorldGrid({ layer: 0 }));
  registerComponent(new WorldMap({ layer: 0 }));
  registerComponent(new Vignette({ layer: 1 }));

  // Load all previously registered components.
  await loadComponents();

  // Start the engine.
  startEngine();
}

main();
