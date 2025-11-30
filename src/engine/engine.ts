/**
 * Core engine module.
 * Provides initialization, state management, and runtime control.
 */

import {
  initializeCanvas,
  CanvasContext,
  CanvasResolution,
  CanvasResolutionConfig,
  canvasEvents,
  CanvasResizedEvent,
} from "./canvas";
import { initializeLayers } from "./layer";
import type { SpriteAtlasConfig } from "./sprites";

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
  resolution?: CanvasResolutionConfig;

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

  /** The current computed canvas resolution. */
  resolution: CanvasResolution;

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
export function initializeEngine(config: EngineConfig): EngineState {
  // Initialize canvas.
  const canvasContext: CanvasContext = initializeCanvas({
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

  // Initialize layers with current resolution.
  initializeLayers(canvasContext.resolution);

  // Subscribe to canvas resize events to update engine state.
  canvasEvents.addEventListener(CanvasResizedEvent.type, (e) => {
    if (!state) return;
    state.resolution = (e as CanvasResizedEvent).resolution;
  });

  return state;
}

/**
 * Get the current engine state.
 *
 * @returns The current engine state.
 * @throws Error if engine has not been initialized.
 */
export function getEngineState(): EngineState {
  if (!state) {
    throw new Error("Engine not initialized.");
  }

  return state;
}

/**
 * Check if the engine is currently running.
 *
 * @returns True if running, false otherwise.
 */
export function isEngineRunning(): boolean {
  return running;
}

/**
 * Set the engine running state.
 *
 * @param value - Whether the engine is running.
 */
export function setEngineRunning(value: boolean): void {
  running = value;
}
