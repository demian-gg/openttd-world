/**
 * Frame compositor and render loop management.
 * Handles layer compositing, component rendering, and the main game loop.
 */

import { getEngineState, isEngineRunning } from "./engine";
import {
  engineEvents,
  EngineSetupEvent,
  EngineStartedEvent,
  EngineStoppedEvent,
} from "./events";
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

  // Group components by layer.
  const byLayer = Map.groupBy(
    components,
    (c) => (c.props?.layer as number) ?? DEFAULT_LAYER
  );

  // Ensure layers exist and update all components.
  for (const [layerId, group] of byLayer) {
    getLayer(layerId); // Ensure layer exists.
    for (const component of group) {
      component.update?.();
    }
  }

  // Get layers after they've been created/updated.
  const layers = getLayers();

  // Skip compositing if nothing changed.
  const needsWork = layers.some((l) => l.dirty || l.moved);
  if (!needsWork) return;

  // Clear main canvas with background.
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Render dirty layers.
  for (const [layerId, group] of byLayer) {
    const layer = getLayer(layerId);

    // Only render if layer content is dirty.
    if (layer.dirty) {
      clearLayer(layerId);
      for (const component of group) {
        component.render(layer.ctx);
      }
      layer.dirty = false;
    }
  }

  // Flatten all layers onto main canvas.
  for (const layer of layers) {
    // Skip invisible layers.
    if (layer.opacity <= 0) continue;

    // Save context state so we can restore later.
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;

    // Calculate destination position (centered with offset).
    const destWidth = Math.round(layer.canvas.width * layer.scale);
    const destHeight = Math.round(layer.canvas.height * layer.scale);
    const destX = Math.round((ctx.canvas.width - destWidth) / 2) + layer.x;
    const destY = Math.round((ctx.canvas.height - destHeight) / 2) + layer.y;

    ctx.drawImage(layer.canvas, destX, destY, destWidth, destHeight);

    // Clear moved flag.
    layer.moved = false;

    // Restore context state.
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

// Self-register on engine setup.
engineEvents.on(EngineSetupEvent, () => {
  engineEvents.on(EngineStartedEvent, handleEngineStarted);
  engineEvents.on(EngineStoppedEvent, handleEngineStopped);
});
