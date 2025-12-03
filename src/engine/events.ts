/**
 * Engine event system.
 * Centralized event buses and event definitions.
 */

import type { CanvasResolution } from "./canvas";

/** Event class constructor type with static `type` property. */
type EventClass<T extends Event> = {
  new (...args: never[]): T;
  readonly type: string;
};

/** Typed event emitter with a nicer API than EventTarget. */
class EventEmitter {
  private target = new EventTarget();

  /** Subscribe to an event. */
  on<T extends Event>(
    eventClass: EventClass<T>,
    callback: (event: T) => void
  ): void {
    this.target.addEventListener(eventClass.type, (e) => callback(e as T));
  }

  /** Emit an event. */
  emit(event: Event): void {
    this.target.dispatchEvent(event);
  }
}

/** Event bus for canvas-related events. */
export const canvasEvents = new EventEmitter();

/** Event bus for engine lifecycle events. */
export const engineEvents = new EventEmitter();

/** Event fired when canvas resolution changes. */
export class CanvasResizedEvent extends Event {
  static readonly type = "canvasResized";
  constructor(public readonly resolution: CanvasResolution) {
    super(CanvasResizedEvent.type);
  }
}

/** Event fired when engine setup completes. Modules should self-register. */
export class EngineSetupEvent extends Event {
  static readonly type = "engineSetup";
  constructor(public readonly resolution: CanvasResolution) {
    super(EngineSetupEvent.type);
  }
}

/** Event fired when the engine starts. */
export class EngineStartedEvent extends Event {
  static readonly type = "engineStarted";
  constructor() {
    super(EngineStartedEvent.type);
  }
}

/** Event fired when the engine stops. */
export class EngineStoppedEvent extends Event {
  static readonly type = "engineStopped";
  constructor() {
    super(EngineStoppedEvent.type);
  }
}
