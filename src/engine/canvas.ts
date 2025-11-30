/**
 * Canvas initialization and resolution management.
 * Handles canvas setup, resolution scaling, and context configuration.
 */

import type { InternalResolution, ResolutionConfig } from "./engine";

/**
 * Rendering context type (works for both main and offscreen canvas).
 * Use this for functions that can render to either context type.
 */
export type RenderContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

/**
 * Canvas context returned by initCanvas.
 * Contains the canvas element, 2D context, and current resolution.
 */
export interface CanvasContext {
  /** The HTML canvas element. */
  canvas: HTMLCanvasElement;

  /** The 2D rendering context. */
  ctx: CanvasRenderingContext2D;

  /** The current computed resolution. */
  resolution: InternalResolution;
}

/** Singleton canvas context, `null` until `initCanvas()` is called. */
let context: CanvasContext | null = null;

/** Default pixel scale factor for upscaling. */
const DEFAULT_PIXEL_SCALE = 2;

/** Default minimum internal render width. */
const DEFAULT_MIN_WIDTH = 320;

/** Default minimum internal render height. */
const DEFAULT_MIN_HEIGHT = 180;

/**
 * Compute the internal render resolution based on window size and config.
 * Applies pixel scaling and clamps to min/max constraints.
 *
 * @param config - Optional resolution configuration overrides.
 * @returns The computed internal resolution.
 */
function computeResolution(config: ResolutionConfig = {}): InternalResolution {
  // Extract config values with defaults.
  const pixelScale = config.pixelScale ?? DEFAULT_PIXEL_SCALE;
  const minWidth = config.minWidth ?? DEFAULT_MIN_WIDTH;
  const minHeight = config.minHeight ?? DEFAULT_MIN_HEIGHT;
  const maxWidth = config.maxWidth ?? Infinity;
  const maxHeight = config.maxHeight ?? Infinity;

  // Capture current window dimensions.
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  // Compute internal resolution by dividing display size by pixel scale.
  let width = Math.floor(displayWidth / pixelScale);
  let height = Math.floor(displayHeight / pixelScale);

  // Clamp dimensions to configured constraints.
  width = Math.max(minWidth, Math.min(maxWidth, width));
  height = Math.max(minHeight, Math.min(maxHeight, height));

  return { width, height, displayWidth, displayHeight, pixelScale };
}

/**
 * Apply the computed resolution to the canvas and context.
 * Sets internal dimensions, display size, and disables image smoothing.
 *
 * @param canvas - The canvas element to configure.
 * @param ctx - The 2D rendering context.
 * @param resolution - The computed resolution to apply.
 */
function applyResolution(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  resolution: InternalResolution
): void {
  // Set internal canvas resolution.
  canvas.width = resolution.width;
  canvas.height = resolution.height;

  // Set CSS display size for upscaling.
  canvas.style.width = `${resolution.displayWidth}px`;
  canvas.style.height = `${resolution.displayHeight}px`;

  // Match body dimensions to canvas display size.
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.width = `${resolution.displayWidth}px`;
  document.body.style.height = `${resolution.displayHeight}px`;

  // Disable smoothing for crisp pixel art.
  ctx.imageSmoothingEnabled = false;
}

/**
 * Configuration for canvas initialization.
 */
export interface CanvasConfig {
  /** The HTML canvas element to render into. */
  canvas: HTMLCanvasElement;

  /** Optional resolution configuration. */
  resolution?: ResolutionConfig;
}

/**
 * Initialize the canvas with the provided configuration.
 * Sets up the canvas, computes resolution, and stores canvas context.
 *
 * @param config - The canvas configuration.
 * @returns The initialized canvas context.
 * @throws Error if 2D context cannot be obtained.
 */
export function initCanvas(config: CanvasConfig): CanvasContext {
  // Destructure config options.
  const { canvas, resolution: resolutionConfig } = config;

  // Acquire 2D rendering context, throw if context creation fails.
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context.");
  }

  // Compute internal resolution from config.
  const resolution = computeResolution(resolutionConfig);

  // Apply resolution to canvas and context.
  applyResolution(canvas, ctx, resolution);

  // Store canvas context.
  context = { canvas, ctx, resolution };

  return context;
}

/**
 * Resize the canvas to match current window dimensions.
 * Recomputes resolution while preserving the current pixel scale.
 *
 * @param resolutionConfig - Optional resolution config overrides.
 * @returns The new computed resolution.
 * @throws Error if canvas has not been initialized.
 */
export function resizeCanvas(
  resolutionConfig?: ResolutionConfig
): InternalResolution {
  // Ensure canvas is initialized.
  if (!context) {
    throw new Error("Canvas not initialized.");
  }

  // Compute new resolution, preserving pixel scale if not overridden.
  const resolution = computeResolution(
    resolutionConfig ?? { pixelScale: context.resolution.pixelScale }
  );

  // Apply new resolution to canvas.
  applyResolution(context.canvas, context.ctx, resolution);

  // Update stored resolution.
  context.resolution = resolution;

  return resolution;
}

/**
 * Get the current canvas context.
 *
 * @returns The current canvas context.
 * @throws Error if canvas has not been initialized.
 */
export function getCanvasContext(): CanvasContext {
  // Ensure canvas is initialized.
  if (!context) {
    throw new Error("Canvas not initialized.");
  }

  return context;
}
