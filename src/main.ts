import { init, resize } from "./engine/canvas";

// Create canvas element.
const canvas = document.createElement("canvas");

// Attach canvas to document body.
document.body.appendChild(canvas);

// Initialize engine with canvas and pixel scale.
const engine = init({
  canvas,
  resolution: { pixelScale: 2 },
});

// Register resize handler to update resolution on window resize.
window.addEventListener("resize", () => resize());

// Log engine state for debugging.
console.log("Engine ready", engine);
