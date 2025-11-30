/**
 * Frame compositor and render loop management.
 * Handles layer compositing, component rendering, and the main game loop.
 */

import { getState, resize, isRunning, setRunning } from "./engine";
import { DEFAULT_LAYER, getLayer, clearLayer, composite } from "./layer";
import { Component, getComponents } from "./components";

/**
 * Get component's layer id, defaulting to DEFAULT_LAYER.
 *
 * @param component - The component to get layer for.
 * @returns The layer id.
 */
function getComponentLayer(component: Component): number {
  return component.LAYER ?? DEFAULT_LAYER;
}

/**
 * Clear the canvas and fill with the background color.
 *
 * @param ctx - The 2D rendering context to draw into.
 * @param color - The background color.
 */
function clearBackground(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Render a single frame.
 * Clears background, renders components to layers, composites to main canvas.
 */
function renderFrame(): void {
  const engine = getState();
  const components = getComponents();

  // Clear main canvas with background.
  clearBackground(engine.ctx, engine.backgroundColor);

  // Group components by layer.
  const byLayer = new Map<number, Component[]>();
  for (const component of components) {
    const layerId = getComponentLayer(component);
    const group = byLayer.get(layerId) ?? [];
    group.push(component);
    byLayer.set(layerId, group);
  }

  // Clear and render each layer.
  for (const [layerId, group] of byLayer) {
    const layer = getLayer(layerId);
    clearLayer(layerId);

    for (const component of group) {
      component.render(layer.ctx);
    }
  }

  // Composite all layers onto main canvas.
  composite(engine.ctx);
}

/**
 * Handle window resize.
 */
function onResize(): void {
  resize();
  renderFrame();
}

/**
 * Start the render loop.
 * Attaches resize listener and begins requestAnimationFrame loop.
 */
export function startLoop(): void {
  if (isRunning()) {
    return;
  }

  setRunning(true);
  window.addEventListener("resize", onResize);

  function loop(): void {
    if (!isRunning()) {
      return;
    }
    renderFrame();
    requestAnimationFrame(loop);
  }
  loop();
}

/**
 * Stop the render loop.
 */
export function stopLoop(): void {
  setRunning(false);
  window.removeEventListener("resize", onResize);
}
