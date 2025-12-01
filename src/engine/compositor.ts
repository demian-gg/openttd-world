/**
 * Frame compositor and render loop management.
 * Handles layer compositing, component rendering, and the main game loop.
 */

import { getEngineState, isEngineRunning, setEngineRunning } from "./engine";
import { handleCanvasResize } from "./canvas";
import { DEFAULT_LAYER, getLayer, clearLayer, getLayers } from "./layers";
import { getComponents } from "./components";

/**
 * Composites a single frame, outputting to the main canvas.
 */
function compositeFrame(): void {
  const { ctx, backgroundColor } = getEngineState();
  const components = getComponents();

  // Clear main canvas with background.
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Group components by layer.
  const byLayer = Map.groupBy(
    components,
    (c) => (c.props?.layer as number) ?? DEFAULT_LAYER
  );

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

    // Draw layer canvas, applying scale if set.
    if (layer.scale !== 1) {
      // Round to integers for crisp pixels.
      const scaledWidth = Math.round(layer.canvas.width * layer.scale);
      const scaledHeight = Math.round(layer.canvas.height * layer.scale);
      ctx.drawImage(layer.canvas, 0, 0, scaledWidth, scaledHeight);
    } else {
      ctx.drawImage(layer.canvas, 0, 0);
    }

    ctx.restore();
  }
}

/**
 * Event handler callback for when the browser window is resized.
 */
function handleCompositorResize(): void {
  handleCanvasResize();
  compositeFrame();
}

/**
 * Initializes and starts the compositor.
 */
export function initializeCompositor(): void {
  // Prevent multiple initializations.
  if (isEngineRunning()) return;
  setEngineRunning(true);

  // Attach event listeners.
  window.addEventListener("resize", handleCompositorResize);

  // Start the compositor rendering loop.
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

  // Remove event listeners.
  window.removeEventListener("resize", handleCompositorResize);
}
