/**
 * Core engine module.
 * Provides initialization, state management, and runtime control.
 */

import { initCanvas, resizeCanvas, CanvasContext } from "./canvas";
import { resizeLayers, markAllDirty } from "./layer";
import type { SpriteAtlasConfig } from "./sprites";

/**
 * Configuration for computing internal render resolution.
 * Controls how the engine scales pixel art to fit the display.
 */
export interface ResolutionConfig {
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

  /** Optional background color. Defaults to "#000". */
  backgroundColor?: string;
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

  /** The background color for clearing the canvas. */
  backgroundColor: string;
}

/** Singleton engine state, `null` until `init()` is called. */
let state: EngineState | null = null;

/** Whether the engine is running. */
let running = false;

/**
 * Initialize the engine with the provided configuration.
 * Sets up the canvas, computes resolution, and stores engine state.
 *
 * @param config - The engine configuration.
 * @returns The initialized engine state.
 */
export function init(config: EngineConfig): EngineState {
  // Initialize canvas.
  const canvasContext: CanvasContext = initCanvas({
    canvas: config.canvas,
    resolution: config.resolution,
  });

  // Build engine state from canvas context.
  state = {
    canvas: canvasContext.canvas,
    ctx: canvasContext.ctx,
    resolution: canvasContext.resolution,
    sprites: config.sprites,
    backgroundColor: config.backgroundColor ?? "#000",
  };

  return state;
}

/**
 * Get the current engine state.
 *
 * @returns The current engine state.
 * @throws Error if engine has not been initialized.
 */
export function getState(): EngineState {
  if (!state) {
    throw new Error("Engine not initialized.");
  }

  return state;
}

/**
 * Resize the engine to match current window dimensions.
 * Updates canvas, layers, and marks all layers dirty.
 *
 * @param resolutionConfig - Optional resolution config overrides.
 * @returns The new computed resolution.
 */
export function resize(
  resolutionConfig?: ResolutionConfig
): InternalResolution {
  if (!state) {
    throw new Error("Engine not initialized.");
  }

  // Resize canvas.
  const resolution = resizeCanvas(resolutionConfig);

  // Resize layers to match.
  resizeLayers();
  markAllDirty();

  // Update state.
  state.resolution = resolution;

  return resolution;
}

/**
 * Check if the engine is currently running.
 *
 * @returns True if running, false otherwise.
 */
export function isRunning(): boolean {
  return running;
}

/**
 * Set the engine running state.
 *
 * @param value - Whether the engine is running.
 */
export function setRunning(value: boolean): void {
  running = value;
}
