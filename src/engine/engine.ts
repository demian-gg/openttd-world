/**
 * Core engine module.
 * Provides initialization, state management, and runtime control.
 */

import {
  initializeCanvas,
  CanvasContext,
  CanvasResolution,
  CanvasResolutionConfig,
} from "./canvas";
import { loadComponents, ComponentRegistration } from "./components";
import {
  canvasEvents,
  CanvasResizedEvent,
  engineEvents,
  EngineSetupEvent,
  EngineStartedEvent,
  EngineStoppedEvent,
} from "./events";
import { addLayerShadow } from "./layers";

// Import modules for side-effect registration.
import "./layers";
import "./compositor";
import "./pointer";
import "./stores";

// Re-export events for convenience.
export {
  engineEvents,
  EngineSetupEvent,
  EngineStartedEvent,
  EngineStoppedEvent,
};

/** Layer shadow configuration. */
export interface LayerShadowConfig {
  /** Layer to apply shadow to. */
  layer: number;
  /** Shadow color. */
  color: string;
  /** Shadow blur radius. */
  blur?: number;
  /** Shadow X offset. */
  offsetX?: number;
  /** Shadow Y offset. */
  offsetY?: number;
}

/**
 * Configuration passed to the engine setup function.
 * Defines the canvas target and optional settings.
 */
export interface EngineConfig {
  /** The HTML canvas element to render into. Must be attached to the DOM
   * before init. */
  canvas: HTMLCanvasElement;

  /** Optional resolution configuration. If omitted, default pixel scale and
   * constraints are used. */
  resolution?: CanvasResolutionConfig;

  /** Optional background color. Defaults to "#000". */
  backgroundColor?: string;

  /** Store initializers to run on engine setup. */
  stores?: Array<() => void>;

  /** Component registrations as [register, props] tuples. */
  components?: ComponentRegistration[];

  /** Layer shadow configurations. */
  layerShadows?: LayerShadowConfig[];
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

  /** The background color for clearing the canvas. */
  backgroundColor: string;
}

/** Singleton engine state, `null` until `init()` is called. */
let state: EngineState | null = null;

/** Whether the engine is running. */
let running = false;

/**
 * Start the engine with the provided configuration.
 * Sets up the canvas, loads components, and begins the render loop.
 *
 * @param config - The engine configuration.
 * @returns The initialized engine state.
 */
export async function startEngine(config: EngineConfig): Promise<EngineState> {
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
    backgroundColor: config.backgroundColor ?? "#000",
  };

  // Subscribe to canvas resize events to update engine state.
  canvasEvents.on(CanvasResizedEvent, (e) => {
    if (!state) return;
    state.resolution = e.resolution;
  });

  // Emit setup event so modules can self-register.
  engineEvents.emit(new EngineSetupEvent(config, canvasContext.resolution));

  // Register and load components.
  config.components?.forEach(([register, props]) => register(props));
  await loadComponents();

  // Apply layer shadows.
  config.layerShadows?.forEach((shadow) => {
    addLayerShadow(
      shadow.layer,
      shadow.color,
      shadow.blur ?? 0,
      shadow.offsetX ?? 0,
      shadow.offsetY ?? 0
    );
  });

  // Start the engine.
  running = true;
  engineEvents.emit(new EngineStartedEvent());

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
 * Stop the engine.
 * Emits EngineStoppedEvent for listeners like the compositor.
 */
export function stopEngine(): void {
  if (!running) return;
  running = false;
  engineEvents.emit(new EngineStoppedEvent());
}
