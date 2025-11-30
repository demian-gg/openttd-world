/**
 * Frame compositor and render loop management.
 * Handles layer compositing, component rendering, and the main game loop.
 */

import { getEngineState, isEngineRunning, setEngineRunning } from "./engine";
import { handleCanvasResize } from "./canvas";
import { DEFAULT_LAYER, getLayer, clearLayer, getLayers } from "./layer";
import { getComponents } from "./components";

/**
 * Composite a single frame.
 * Clears background, renders components to layers, flattens onto main canvas.
 */
function compositeFrame(): void {
  const { ctx, backgroundColor } = getEngineState();
  const components = getComponents();

  // Clear main canvas with background.
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Group components by layer.
  const byLayer = Map.groupBy(components, (c) => c.LAYER ?? DEFAULT_LAYER);

  // Clear and render each layer.
  for (const [layerId, group] of byLayer) {
    const layer = getLayer(layerId);
    clearLayer(layerId);

    for (const component of group) {
      component.render(layer.ctx);
    }
  }

  // Flatten all layers onto main canvas.
  for (const layer of getLayers()) {
    if (layer.opacity <= 0) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    ctx.drawImage(layer.canvas, 0, 0);
    ctx.restore();
  }
}

/** Handle window resize. */
function onCompositorResize(): void {
  handleCanvasResize();
  compositeFrame();
}

/**
 * Initialize and start the compositor.
 * Attaches resize listener and begins requestAnimationFrame loop.
 */
export function initializeCompositor(): void {
  if (isEngineRunning()) return;

  setEngineRunning(true);
  window.addEventListener("resize", onCompositorResize);

  (function compositorLoop() {
    if (!isEngineRunning()) return;
    compositeFrame();
    requestAnimationFrame(compositorLoop);
  })();
}

/**
 * Stop the compositor.
 */
export function stopCompositor(): void {
  setEngineRunning(false);
  window.removeEventListener("resize", onCompositorResize);
}
