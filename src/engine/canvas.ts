import type { SpriteAtlasConfig } from "./sprites";

/**
 * Configuration for computing internal render resolution.
 * Controls how the engine scales pixel art to fit the display.
 */
export interface ResolutionConfig {
  /** Pixel scale factor for upscaling. A value of 2 renders at half resolution,
   * then upscales 2x. */
  pixelScale?: number;

  /** Minimum internal render width in game pixels. Prevents resolution from
   * dropping below this threshold. */
  minWidth?: number;

  /** Minimum internal render height in game pixels. Prevents resolution from
   * dropping below this threshold. */
  minHeight?: number;

  /** Maximum internal render width in game pixels. Caps resolution to prevent
   * excessive memory usage. */
  maxWidth?: number;

  /** Maximum internal render height in game pixels. Caps resolution to prevent
   * excessive memory usage. */
  maxHeight?: number;
}

/**
 * Computed internal resolution after applying pixel scaling and constraints.
 * Represents both the render target size and display size.
 */
export interface InternalResolution {
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
 * Configuration passed to the engine init function.
 * Defines the canvas target and optional settings.
 */
export interface EngineConfig {
  /** The HTML canvas element to render into. Must be attached to the DOM
   * before init. */
  canvas: HTMLCanvasElement;

  /** Optional resolution configuration. If omitted, default pixel scale and
   * constraints are used. */
  resolution?: ResolutionConfig;

  /** Optional sprite atlas configuration. If provided, the atlas will be
   * loaded during init. */
  sprites?: SpriteAtlasConfig;
}

/**
 * Runtime state of the initialized engine.
 * Contains references to canvas, context, and current settings.
 */
export interface EngineState {
  /** The HTML canvas element being rendered to. */
  canvas: HTMLCanvasElement;

  /** The 2D rendering context for the canvas. */
  ctx: CanvasRenderingContext2D;

  /** The current computed internal resolution. */
  resolution: InternalResolution;

  /** The sprite atlas configuration, if provided. */
  sprites?: SpriteAtlasConfig;

  /** Whether the engine game loop is currently running. */
  running: boolean;
}

/** Singleton engine state, `null` until `init()` is called. */
let state: EngineState | null = null;

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
 * Initialize the engine with the provided configuration.
 * Sets up the canvas, computes resolution, and stores engine state.
 *
 * @param config - The engine configuration.
 * @returns The initialized engine state.
 * @throws Error if 2D context cannot be obtained.
 */
export function init(config: EngineConfig): EngineState {
  // Destructure config options.
  const { canvas, resolution: resolutionConfig, sprites } = config;

  // Acquire 2D rendering context, throw if context creation fails.
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context.");
  }

  // Compute internal resolution from config.
  const resolution = computeResolution(resolutionConfig);

  // Apply resolution to canvas and context.
  applyResolution(canvas, ctx, resolution);

  // Store engine state.
  state = { canvas, ctx, resolution, sprites, running: false };

  return state;
}

/**
 * Resize the canvas to match current window dimensions.
 * Recomputes resolution while preserving the current pixel scale.
 *
 * @param resolutionConfig - Optional resolution config overrides.
 * @returns The new computed resolution.
 * @throws Error if engine has not been initialized.
 */
export function resize(
  resolutionConfig?: ResolutionConfig
): InternalResolution {
  // Ensure engine is initialized.
  if (!state) {
    throw new Error("Engine not initialized.");
  }

  // Compute new resolution, preserving pixel scale if not overridden.
  const resolution = computeResolution(
    resolutionConfig ?? { pixelScale: state.resolution.pixelScale }
  );

  // Apply new resolution to canvas.
  applyResolution(state.canvas, state.ctx, resolution);

  // Update stored resolution.
  state.resolution = resolution;

  return resolution;
}

/**
 * Get the current engine state.
 *
 * @returns The current engine state.
 * @throws Error if engine has not been initialized.
 */
export function getState(): EngineState {
  // Ensure engine is initialized.
  if (!state) {
    throw new Error("Engine not initialized.");
  }

  return state;
}
