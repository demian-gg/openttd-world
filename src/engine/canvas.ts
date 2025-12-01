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
 */
export interface CanvasResolutionConfig {
  /** Maximum internal render width in game pixels. Caps resolution to prevent
   * excessive memory usage. */
  maxWidth?: number;

  /** Maximum internal render height in game pixels. Caps resolution to prevent
   * excessive memory usage. */
  maxHeight?: number;
}

/**
 * Computed canvas resolution.
 * Canvas is always 1:1 with screen pixels for crisp rendering.
 */
export interface CanvasResolution {
  /** Canvas width in pixels. */
  width: number;

  /** Canvas height in pixels. */
  height: number;
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

/**
 * Compute the canvas resolution based on window size and config.
 *
 * @param config - Optional resolution configuration overrides.
 * @returns The computed resolution.
 */
function computeCanvasResolution(
  config: CanvasResolutionConfig = {}
): CanvasResolution {
  const maxWidth = config.maxWidth ?? Infinity;
  const maxHeight = config.maxHeight ?? Infinity;

  // Use window dimensions, clamped to max constraints.
  const width = Math.min(maxWidth, window.innerWidth);
  const height = Math.min(maxHeight, window.innerHeight);

  return { width, height };
}

/**
 * Apply the computed resolution to the canvas and context.
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
 *
 * @param resolutionConfig - Optional resolution config overrides.
 * @returns The new computed resolution.
 * @throws Error if canvas has not been initialized.
 */
export function handleCanvasResize(
  resolutionConfig?: CanvasResolutionConfig
): CanvasResolution {
  if (!context) {
    throw new Error("Canvas not initialized.");
  }

  const resolution = computeCanvasResolution(resolutionConfig);
  applyCanvasResolution(context.canvas, context.ctx, resolution);
  context.resolution = resolution;

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
