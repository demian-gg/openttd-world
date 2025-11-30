import { getState } from "./engine";

/** Default layer for components that don't specify one. */
export const DEFAULT_LAYER = 0;

/** Represents an offscreen render layer. */
interface Layer {
  /** Layer z-index for ordering. */
  id: number;

  /** Offscreen canvas for this layer. */
  canvas: OffscreenCanvas;

  /** 2D rendering context for this layer. */
  ctx: OffscreenCanvasRenderingContext2D;

  /** Whether this layer needs to be re-rendered. */
  dirty: boolean;

  /** Layer opacity (0-1). */
  opacity: number;

  /** Blend mode for compositing. */
  blendMode: GlobalCompositeOperation;
}

/** Map of layer id to layer instance. */
const layers = new Map<number, Layer>();

/**
 * Create a new layer with the given id.
 *
 * @param id - The layer z-index.
 * @returns The created layer.
 */
function createLayer(id: number): Layer {
  // Get current resolution for layer size.
  const { resolution } = getState();

  // Create offscreen canvas matching internal resolution.
  const canvas = new OffscreenCanvas(resolution.width, resolution.height);

  // Get 2D context.
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(`Failed to get 2D context for layer ${id}.`);
  }

  // Disable smoothing for crisp pixel art.
  ctx.imageSmoothingEnabled = false;

  // Create layer instance.
  const layer: Layer = {
    id,
    canvas,
    ctx,
    dirty: true,
    opacity: 1,
    blendMode: "source-over",
  };

  // Store in map.
  layers.set(id, layer);

  return layer;
}

/**
 * Get a layer by id, creating it if it doesn't exist.
 *
 * @param id - The layer z-index.
 * @returns The layer instance.
 */
export function getLayer(id: number): Layer {
  // Return existing layer or create new one.
  return layers.get(id) ?? createLayer(id);
}

/**
 * Mark a layer as needing re-render.
 *
 * @param id - The layer z-index.
 */
export function markDirty(id: number): void {
  const layer = layers.get(id);
  if (layer) {
    layer.dirty = true;
  }
}

/**
 * Mark all layers as dirty.
 */
export function markAllDirty(): void {
  for (const layer of layers.values()) {
    layer.dirty = true;
  }
}

/**
 * Clear a layer's canvas.
 *
 * @param id - The layer z-index.
 */
export function clearLayer(id: number): void {
  const layer = layers.get(id);
  if (layer) {
    layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
  }
}

/**
 * Set layer opacity.
 *
 * @param id - The layer z-index.
 * @param opacity - Opacity value (0-1).
 */
export function setLayerOpacity(id: number, opacity: number): void {
  const layer = layers.get(id);
  if (layer) {
    layer.opacity = Math.max(0, Math.min(1, opacity));
  }
}

/**
 * Set layer blend mode.
 *
 * @param id - The layer z-index.
 * @param blendMode - The blend mode to use.
 */
export function setLayerBlendMode(
  id: number,
  blendMode: GlobalCompositeOperation
): void {
  const layer = layers.get(id);
  if (layer) {
    layer.blendMode = blendMode;
  }
}

/**
 * Resize all layers to match current resolution.
 * Called when window is resized.
 */
export function resizeLayers(): void {
  const { resolution } = getState();

  for (const layer of layers.values()) {
    // Resize canvas.
    layer.canvas.width = resolution.width;
    layer.canvas.height = resolution.height;

    // Re-disable smoothing after resize.
    layer.ctx.imageSmoothingEnabled = false;

    // Mark as dirty since content was cleared.
    layer.dirty = true;
  }
}

/**
 * Composite all layers onto the main canvas.
 * Layers are drawn in order of their id (lowest first).
 *
 * @param ctx - The main canvas 2D rendering context.
 */
export function composite(ctx: CanvasRenderingContext2D): void {
  // Sort layers by id.
  const sorted = [...layers.values()].sort((a, b) => a.id - b.id);

  // Draw each layer onto main canvas.
  for (const layer of sorted) {
    // Skip fully transparent layers.
    if (layer.opacity <= 0) {
      continue;
    }

    // Save context state.
    ctx.save();

    // Apply layer settings.
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;

    // Draw layer canvas onto main canvas.
    ctx.drawImage(layer.canvas, 0, 0);

    // Restore context state.
    ctx.restore();
  }
}
