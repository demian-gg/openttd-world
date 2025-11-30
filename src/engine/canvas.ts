/**
 * Canvas initialization and resolution management.
 * Handles canvas setup, resolution scaling, and context configuration.
 */

/** Event target for canvas events. */
export const canvasEvents = new EventTarget();

/** Event fired when canvas resolution changes. */
export class CanvasResizedEvent extends Event {
  static readonly type = "canvasResized";
  constructor(public readonly resolution: CanvasResolution) {
    super(CanvasResizedEvent.type);
  }
}

/**
 * Configuration for computing canvas resolution.
 * Controls how the engine scales pixel art to fit the display.
 */
export interface CanvasResolutionConfig {
  /** Pixel scale factor for upscaling. A value of 2 renders at half resolution,
   * then upscales 2x. */
  pixelScale?: number;

  /** Maximum internal render width in game pixels. Caps resolution to prevent
   * excessive memory usage. */
  maxWidth?: number;

  /** Maximum internal render height in game pixels. Caps resolution to prevent
   * excessive memory usage. */
  maxHeight?: number;
}

/**
 * Computed canvas resolution after applying pixel scaling and constraints.
 * Represents both the render target size and display size.
 */
export interface CanvasResolution {
  /** Internal render width in game pixels. All game logic and rendering uses
   * this coordinate space. */
  width: number;

  /** Internal render height in game pixels. All game logic and rendering uses
   * this coordinate space. */
  height: number;

  /** Display width in CSS pixels. The canvas is stretched to this size on
   * screen. */
  displayWidth: number;

  /** Display height in CSS pixels. The canvas is stretched to this size on
   * screen. */
  displayHeight: number;

  /** The pixel scale factor used for this resolution. Stored for use during
   * resize operations. */
  pixelScale: number;
}

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
  resolution: CanvasResolution;
}

/** Singleton canvas context, `null` until `initCanvas()` is called. */
let context: CanvasContext | null = null;

/** Default pixel scale factor for upscaling. */
const DEFAULT_PIXEL_SCALE = 2;

/**
 * Compute the internal render resolution based on window size and config.
 * Applies pixel scaling and clamps to max constraints if provided.
 *
 * @param config - Optional resolution configuration overrides.
 * @returns The computed internal resolution.
 */
function computeCanvasResolution(
  config: CanvasResolutionConfig = {}
): CanvasResolution {
  // Extract config values with defaults.
  const pixelScale = config.pixelScale ?? DEFAULT_PIXEL_SCALE;
  const maxWidth = config.maxWidth ?? Infinity;
  const maxHeight = config.maxHeight ?? Infinity;

  // Capture current window dimensions.
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;

  // Compute internal resolution by dividing display size by pixel scale.
  let width = Math.floor(displayWidth / pixelScale);
  let height = Math.floor(displayHeight / pixelScale);

  // Clamp dimensions to max constraints if provided.
  width = Math.min(maxWidth, width);
  height = Math.min(maxHeight, height);

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
function applyCanvasResolution(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  resolution: CanvasResolution
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
  resolution?: CanvasResolutionConfig;
}

/**
 * Initialize the canvas with the provided configuration.
 * Sets up the canvas, computes resolution, and stores canvas context.
 *
 * @param config - The canvas configuration.
 * @returns The initialized canvas context.
 * @throws Error if 2D context cannot be obtained.
 */
export function initializeCanvas(config: CanvasConfig): CanvasContext {
  // Destructure config options.
  const { canvas, resolution: resolutionConfig } = config;

  // Acquire 2D rendering context, throw if context creation fails.
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
 * Resize the canvas to match current window dimensions.
 * Recomputes resolution while preserving the current pixel scale.
 *
 * @param resolutionConfig - Optional resolution config overrides.
 * @returns The new computed resolution.
 * @throws Error if canvas has not been initialized.
 */
export function handleCanvasResize(
  resolutionConfig?: CanvasResolutionConfig
): CanvasResolution {
  // Ensure canvas is initialized.
  if (!context) {
    throw new Error("Canvas not initialized.");
  }

  // Compute new resolution, preserving pixel scale if not overridden.
  const resolution = computeCanvasResolution(
    resolutionConfig ?? { pixelScale: context.resolution.pixelScale }
  );

  // Apply new resolution to canvas.
  applyCanvasResolution(context.canvas, context.ctx, resolution);

  // Update stored resolution.
  context.resolution = resolution;

  // Emit resize event.
  canvasEvents.dispatchEvent(new CanvasResizedEvent(resolution));

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
