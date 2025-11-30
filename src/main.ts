import { init } from "./engine/engine";
import { startLoop } from "./engine/compositor";
import { registerComponent, loadComponents } from "./engine/components";

import * as developerSprite from "./components/developer-sprite";

/** Create and attach canvas element to DOM. */
function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  return canvas;
}

/** Initialize and start the application. */
async function main(): Promise<void> {
  // Initialize engine.
  init({
    canvas: createCanvas(),
    resolution: { pixelScale: 2 },
  });

  // Register components.
  registerComponent(developerSprite);

  // Load all components.
  await loadComponents();

  // Start render loop.
  startLoop();
}

main();
