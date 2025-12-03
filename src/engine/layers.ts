/**
 * Layer management for render ordering.
 * Each layer is a separate canvas that components render to.
 * Layers are composited onto the main canvas in z-order.
 */

import { CanvasResolution } from "./canvas";
import {
  canvasEvents,
  CanvasResizedEvent,
  engineEvents,
  EngineSetupEvent,
} from "./events";

/** Default layer for components that don't specify one. */
export const DEFAULT_LAYER = 0;

/**
 * Represents a render layer.
 * Each layer has its own canvas that gets composited onto the main canvas.
 */
export interface Layer {
  /** Layer z-index for ordering. */
  id: number;

  /** Canvas for this layer (not attached to DOM). */
  canvas: OffscreenCanvas;

  /** 2D rendering context for this layer. */
  ctx: OffscreenCanvasRenderingContext2D;

  /** Whether this layer needs to be re-rendered. */
  dirty: boolean;

  /** Whether this layer transform changed and needs re-compositing. */
  moved: boolean;

  /** Layer opacity (0-1). */
  opacity: number;

  /** Blend mode for compositing. */
  blendMode: GlobalCompositeOperation;

  /** Scale factor for compositing (1 = no scaling). */
  scale: number;

  /** X offset from center (0 = centered). */
  x: number;

  /** Y offset from center (0 = centered). */
  y: number;
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

  // Create canvas matching current resolution (not attached to DOM).
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
    moved: true,
    opacity: 1,
    blendMode: "source-over",
    scale: 1,
    x: 0,
    y: 0,
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
 * Set layer scale.
 *
 * @param id - The layer z-index.
 * @param scale - Scale factor (1 = no scaling).
 */
export function setLayerScale(id: number, scale: number): void {
  const layer = layers.get(id);
  if (layer && layer.scale !== scale) {
    layer.scale = scale;
    layer.moved = true;
  }
}

/**
 * Set layer position offset from center.
 *
 * @param id - The layer z-index.
 * @param x - X offset from center (0 = centered).
 * @param y - Y offset from center (0 = centered).
 */
export function setLayerPosition(id: number, x: number, y: number): void {
  const layer = layers.get(id);
  if (layer && (layer.x !== x || layer.y !== y)) {
    layer.x = x;
    layer.y = y;
    layer.moved = true;
  }
}

/**
 * Set layer canvas size.
 * This resizes the layer's offscreen canvas.
 *
 * @param id - The layer z-index.
 * @param width - Custom width.
 * @param height - Custom height.
 */
export function setLayerSize(id: number, width: number, height: number): void {
  const layer = layers.get(id);
  if (layer) {
    if (layer.canvas.width !== width || layer.canvas.height !== height) {
      layer.canvas.width = width;
      layer.canvas.height = height;
      layer.ctx.imageSmoothingEnabled = false;
      layer.dirty = true;
    }
  }
}

// Self-register on engine setup.
engineEvents.on(EngineSetupEvent, (e) => {
  currentResolution = e.resolution;

  // Subscribe to canvas resize events.
  canvasEvents.on(CanvasResizedEvent, (e) => {
    currentResolution = e.resolution;

    for (const layer of layers.values()) {
      // Resize to match new viewport.
      layer.canvas.width = e.resolution.width;
      layer.canvas.height = e.resolution.height;

      // Re-disable smoothing after resize.
      layer.ctx.imageSmoothingEnabled = false;

      // Mark as dirty since content was cleared.
      layer.dirty = true;
    }
  });
});

/**
 * Get all layers sorted by id (lowest first).
 *
 * @returns Array of layers in z-order.
 */
export function getLayers(): Layer[] {
  return [...layers.values()].sort((a, b) => a.id - b.id);
}
