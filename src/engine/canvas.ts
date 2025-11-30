import type {
  EngineConfig,
  EngineState,
  InternalResolution,
  ResolutionConfig,
} from "./types";

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
