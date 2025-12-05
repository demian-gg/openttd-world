/**
 * Application entry point.
 */

import { startEngine } from "./engine/engine";

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

  // Start the engine.
  await startEngine({
    canvas,
    backgroundColor: "#2a5f96",
    stores: [registerOverlayStore, registerWorldMapStore],
    components: [
      [registerWorldMap, { layer: 0 }],
      [registerVignette, { layer: 1 }],
      [registerOverlay, { layer: 2 }],
    ],
    layerShadows: [
      {
        layer: 2,
        color: "rgba(0, 0, 0, 0.65)",
        blur: 0,
        offsetX: 3,
        offsetY: 3,
      },
    ],
  });
}

main();
