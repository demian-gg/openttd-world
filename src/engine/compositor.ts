/**
 * Frame compositor and render loop management.
 * Handles layer compositing, component rendering, and the main game loop.
 */

import {
  getEngineState,
  isEngineRunning,
  engineEvents,
  EngineStartedEvent,
  EngineStoppedEvent,
} from "./engine";
import { handleCanvasResize } from "./canvas";
import { DEFAULT_LAYER, getLayer, clearLayer, getLayers } from "./layers";
import { getComponents } from "./components";
import { clearPointerAreas } from "./pointer";

/**
 * Composites a single frame, outputting to the main canvas.
 */
function compositeFrame(): void {
  const { ctx, backgroundColor } = getEngineState();
  const components = getComponents();

  // Clear pointer areas from previous frame.
  clearPointerAreas();

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
      // Scale from center pivot.
      const scaledWidth = Math.round(layer.canvas.width * layer.scale);
      const scaledHeight = Math.round(layer.canvas.height * layer.scale);
      const offsetX = Math.round((ctx.canvas.width - scaledWidth) / 2);
      const offsetY = Math.round((ctx.canvas.height - scaledHeight) / 2);
      ctx.drawImage(layer.canvas, offsetX, offsetY, scaledWidth, scaledHeight);
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
 * Handle engine started event.
 * Starts the compositor render loop.
 */
function handleEngineStarted(): void {
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
 * Handle engine stopped event.
 */
function handleEngineStopped(): void {
  // Remove event listeners.
  window.removeEventListener("resize", handleCompositorResize);
}

/**
 * Setup the compositor module.
 * Subscribes to engine lifecycle events.
 */
export function setupCompositor(): void {
  engineEvents.addEventListener(EngineStartedEvent.type, handleEngineStarted);
  engineEvents.addEventListener(EngineStoppedEvent.type, handleEngineStopped);
}
