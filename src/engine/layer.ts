/**
 * Offscreen layer management.
 * Provides layer creation, clearing, and resizing.
 */

import { canvasEvents, CanvasResizedEvent, CanvasResolution } from "./canvas";

/** Default layer for components that don't specify one. */
export const DEFAULT_LAYER = 0;

/** Represents an offscreen render layer. */
export interface Layer {
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

/** Current resolution for creating new layers. */
let currentResolution: CanvasResolution | null = null;

/**
 * Create a new layer with the given id.
 *
 * @param id - The layer z-index.
 * @returns The created layer.
 */
function createLayer(id: number): Layer {
  if (!currentResolution) {
    throw new Error("Layers not initialized. Call initializeLayers first.");
  }

  // Create offscreen canvas matching current resolution.
  const canvas = new OffscreenCanvas(
    currentResolution.width,
    currentResolution.height
  );

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
export function dirtyLayer(id: number): void {
  const layer = layers.get(id);
  if (layer) {
    layer.dirty = true;
  }
}

/**
 * Mark all layers as dirty.
 */
export function dirtyAllLayers(): void {
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
 * Initialize the layer system.
 * Subscribes to canvas resize events.
 *
 * @param resolution - The initial canvas resolution.
 */
export function initializeLayers(resolution: CanvasResolution): void {
  currentResolution = resolution;

  // Subscribe to canvas resize events.
  canvasEvents.addEventListener(CanvasResizedEvent.type, (e) => {
    const newResolution = (e as CanvasResizedEvent).resolution;
    currentResolution = newResolution;

    for (const layer of layers.values()) {
      // Resize canvas.
      layer.canvas.width = newResolution.width;
      layer.canvas.height = newResolution.height;

      // Re-disable smoothing after resize.
      layer.ctx.imageSmoothingEnabled = false;

      // Mark as dirty since content was cleared.
      layer.dirty = true;
    }
  });
}

/**
 * Get all layers sorted by id (lowest first).
 *
 * @returns Array of layers in z-order.
 */
export function getLayers(): Layer[] {
  return [...layers.values()].sort((a, b) => a.id - b.id);
}
