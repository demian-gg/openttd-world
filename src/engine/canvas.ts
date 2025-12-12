/**
 * Canvas initialization and resolution management.
 * Handles canvas setup, resolution scaling, and context configuration.
 */

import { canvasEvents, CanvasResizedEvent } from "./events";

// Re-export events for convenience.
export { canvasEvents, CanvasResizedEvent };

/** A type representing configuration for computing canvas resolution. */
export type CanvasResolutionConfig = {
  /** The maximum internal render width in game pixels. */
  maxWidth?: number;

  /** The maximum internal render height in game pixels. */
  maxHeight?: number;
};

/**
 * A type representing computed canvas resolution.
 *
 * Canvas is always 1:1 with screen pixels for crisp rendering.
 */
export type CanvasResolution = {
  /** The canvas width in pixels. */
  width: number;

  /** The canvas height in pixels. */
  height: number;
};

/**
 * Rendering context type (works for both main and offscreen canvas).
 * Use this for functions that can render to either context type.
 */
export type RenderContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

/**
 * A type representing the canvas context returned by initCanvas.
 *
 * Contains the canvas element, 2D context, and current resolution.
 */
export type CanvasContext = {
  /** The HTML canvas element. */
  canvas: HTMLCanvasElement;

  /** The 2D rendering context. */
  ctx: CanvasRenderingContext2D;

  /** The current computed resolution. */
  resolution: CanvasResolution;
};

/** The singleton canvas context, null until initializeCanvas is called. */
let context: CanvasContext | null = null;

/**
 * Computes the canvas resolution based on window size and config.
 *
 * @param config - Optional resolution configuration overrides.
 *
 * @returns The computed resolution.
 */
function computeCanvasResolution(
  config: CanvasResolutionConfig = {}
): CanvasResolution {
  // Extract configuration with defaults.
  const maxWidth = config.maxWidth ?? Infinity;
  const maxHeight = config.maxHeight ?? Infinity;

  // Clamp window dimensions to max constraints.
  const width = Math.min(maxWidth, window.innerWidth);
  const height = Math.min(maxHeight, window.innerHeight);

  return { width, height };
}

/**
 * Applies the computed resolution to the canvas and context.
 *
 * @param canvas - The canvas element to configure.
 * @param ctx - The 2D rendering context.
 * @param resolution - The computed resolution to apply.
 */
function applyCanvasResolution(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  resolution: CanvasResolution
): void {
  // Set canvas resolution (1:1 with screen).
  canvas.width = resolution.width;
  canvas.height = resolution.height;

  // Set CSS size to match.
  canvas.style.width = `${resolution.width}px`;
  canvas.style.height = `${resolution.height}px`;

  // Reset body styles.
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";

  // Disable smoothing for crisp pixel art.
  ctx.imageSmoothingEnabled = false;
}

/** A type representing configuration for canvas initialization. */
export type CanvasConfig = {
  /** The HTML canvas element to render into. */
  canvas: HTMLCanvasElement;

  /** The optional resolution configuration. */
  resolution?: CanvasResolutionConfig;
};

/**
 * Initializes the canvas with the provided configuration.
 *
 * Sets up the canvas, computes resolution, and stores canvas context.
 *
 * @param config - The canvas configuration.
 *
 * @returns The initialized canvas context.
 */
export function initializeCanvas(config: CanvasConfig): CanvasContext {
  // Destructure config options.
  const { canvas, resolution: resolutionConfig } = config;

  // Acquire 2D rendering context.
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context.");
  }

  // Compute internal resolution from config.
  const resolution = computeCanvasResolution(resolutionConfig);

  // Apply resolution to canvas and context.
  applyCanvasResolution(canvas, ctx, resolution);

  // Store canvas context.
  context = { canvas, ctx, resolution };

  return context;
}

/**
 * Resizes the canvas to match current window dimensions.
 *
 * @param resolutionConfig - Optional resolution config overrides.
 *
 * @returns The new computed resolution.
 */
export function handleCanvasResize(
  resolutionConfig?: CanvasResolutionConfig
): CanvasResolution {
  // Ensure canvas is initialized.
  if (!context) {
    throw new Error("Canvas not initialized.");
  }

  // Compute new resolution.
  const resolution = computeCanvasResolution(resolutionConfig);

  // Apply resolution to canvas.
  applyCanvasResolution(context.canvas, context.ctx, resolution);

  // Update stored resolution.
  context.resolution = resolution;

  // Emit resize event.
  canvasEvents.emit(new CanvasResizedEvent(resolution));

  return resolution;
}

/**
 * Gets the current canvas context.
 *
 * @returns The current canvas context.
 */
export function getCanvasContext(): CanvasContext {
  // Ensure canvas is initialized.
  if (!context) {
    throw new Error("Canvas not initialized.");
  }

  return context;
}
