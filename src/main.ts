/**
 * Application entry point.
 */

import { setupEngine, startEngine } from "./engine/engine";
import { registerComponent, loadComponents } from "./engine/components";
import { setLayerShadow } from "./engine/layers";

import { Vignette } from "./components/vignette";
import { WorldMap } from "./components/world-map";
import { Overlay } from "./components/overlay/overlay";

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
  registerComponent(new WorldMap({ layer: 0 }));
  registerComponent(new Vignette({ layer: 1 }));
  registerComponent(new Overlay({ layer: 2 }));

  // Configure layer shadows.
  setLayerShadow(2, "rgba(0, 0, 0, 0.65)", 0, 2, 3);

  // Load all previously registered components.
  await loadComponents();

  // Start the engine.
  startEngine();
}

main();
