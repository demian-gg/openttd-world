/**
 * Application entry point.
 */

import { setupEngine, startEngine } from "./engine/engine";
import { setLayerShadow } from "./engine/layers";

import { registerOverlayStore } from "./stores/overlay";
import { registerWorldMapStore } from "./stores/world-map";
import { registerVignette } from "./components/vignette";
import { registerWorldMap } from "./components/world-map";
import { registerOverlay } from "./components/overlay/overlay";

/**
 * Initialize and start the application.
 */
async function main(): Promise<void> {
  // Create and attach canvas to DOM.
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  // Setup the engine with stores and components.
  await setupEngine({
    canvas,
    backgroundColor: "#2a5f96",
    stores: [registerOverlayStore, registerWorldMapStore],
    components: [
      [registerWorldMap, { layer: 0 }],
      [registerVignette, { layer: 1 }],
      [registerOverlay, { layer: 2 }],
    ],
  });

  // Configure layer shadows.
  setLayerShadow(2, "rgba(0, 0, 0, 0.65)", 0, 2, 3);

  // Start the engine.
  startEngine();
}

main();
