/**
 * Application entry point.
 */

import { startEngine } from "./engine/engine";
import { component } from "./engine/components";
import { store } from "./engine/stores";

import { initOverlayStore } from "./stores/overlay";
import { initWorldMapStore } from "./stores/world-map";
import { initResolutionStore } from "./stores/resolution";
import { initSelectionStore } from "./stores/selection";
import { initZoneStore } from "./stores/zone";

import { initVignetteComponent } from "./components/vignette";
import { initWorldMapComponent } from "./components/world-map";
import { initSelectionComponent } from "./components/selection";
import { initOverlayComponent } from "./components/overlay/overlay";

/**
 * Initializes and starts the application.
 */
async function main(): Promise<void> {
  // Create and attach canvas to DOM.
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  // Start the engine.
  await startEngine({
    canvas,
    stores: [
      store(initOverlayStore),
      store(initWorldMapStore),
      store(initResolutionStore),
      store(initSelectionStore),
      store(initZoneStore),
    ],
    components: [
      component(initWorldMapComponent, { layer: 0 }),
      component(initSelectionComponent, { layer: 1 }),
      component(initVignetteComponent, { layer: 2 }),
      component(initOverlayComponent, { layer: 3 }),
    ],
    backgroundColor: "#2a5f96",
    layerShadows: [
      {
        layer: 3,
        color: "rgba(0, 0, 0, 0.5)",
        blur: 0,
        offsetX: 3,
        offsetY: 3,
      },
      {
        layer: 3,
        color: "rgba(0, 0, 0, 0.5)",
        blur: 12,
        offsetX: 3,
        offsetY: 3,
      },
    ],
  });
}

main();
