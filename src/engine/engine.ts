/**
 * Core engine module.
 *
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
} from "./events";

// Import modules for side-effect registration.
import "./layers";
import "./compositor";
import "./pointer";
import "./stores";

/**
 * A type representing configuration passed to the engine setup function.
 *
 * Defines the canvas target and optional settings.
 */
export type EngineConfig = {
  /** The HTML canvas element to render into. */
  canvas: HTMLCanvasElement;

  /** The optional resolution configuration. */
  resolution?: CanvasResolutionConfig;

  /** The optional background color. Defaults to "#000". */
  backgroundColor?: string;

  /** The store initializers to run on engine setup. */
  stores?: Array<() => void>;

  /** The component registrations as [register, props] tuples. */
  components?: ComponentRegistration[];
};

/**
 * A type representing runtime state of the initialized engine.
 *
 * Contains references to canvas, context, and current settings.
 */
export type EngineState = {
  /** The HTML canvas element being rendered to. */
  canvas: HTMLCanvasElement;

  /** The 2D rendering context for the canvas. */
  ctx: CanvasRenderingContext2D;

  /** The current computed canvas resolution. */
  resolution: CanvasResolution;

  /** The background color for clearing the canvas. */
  backgroundColor: string;
};

/** The singleton engine state, null until init is called. */
let state: EngineState | null = null;

/** Whether the engine is currently running. */
let running = false;

/**
 * Starts the engine with the provided configuration.
 *
 * Sets up the canvas, loads components, and begins the render loop.
 *
 * @param config - The engine configuration.
 *
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
  canvasEvents.on(CanvasResizedEvent, (event) => {
    if (!state) return;
    state.resolution = event.resolution;
  });

  // Emit setup event so modules can self-register.
  engineEvents.emit(new EngineSetupEvent(config, canvasContext.resolution));

  // Register and load components.
  config.components?.forEach(([register, props]) => register(props));
  await loadComponents();

  // Start the engine.
  running = true;
  engineEvents.emit(new EngineStartedEvent());

  return state;
}

/**
 * Gets the current engine state.
 *
 * @returns The current engine state.
 */
export function getEngineState(): EngineState {
  if (!state) {
    throw new Error("Engine not initialized.");
  }

  return state;
}

/**
 * Checks if the engine is currently running.
 *
 * @returns True if running, false otherwise.
 */
export function isEngineRunning(): boolean {
  return running;
}

