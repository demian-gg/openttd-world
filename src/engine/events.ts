/**
 * Engine event system.
 * Centralized event buses and event definitions.
 */

import type { CanvasResolution } from "./canvas";
import type { EngineConfig } from "./engine";

/** A type representing an event class constructor with static type property. */
type EventClass<T extends Event> = {
  new (...args: never[]): T;
  readonly type: string;
};

/** A typed event emitter with a nicer API than EventTarget. */
class EventEmitter {
  /** The underlying event target. */
  private target = new EventTarget();

  /** Subscribes to an event. */
  on<T extends Event>(
    eventClass: EventClass<T>,
    callback: (event: T) => void
  ): void {
    this.target.addEventListener(eventClass.type, (e) => callback(e as T));
  }

  /** Emits an event. */
  emit(event: Event): void {
    this.target.dispatchEvent(event);
  }
}

/** The event bus for canvas-related events. */
export const canvasEvents = new EventEmitter();

/** The event bus for engine lifecycle events. */
export const engineEvents = new EventEmitter();

/** A class representing an event fired when canvas resolution changes. */
export class CanvasResizedEvent extends Event {
  /** The event type identifier. */
  static readonly type = "canvasResized";

  /** Creates a new canvas resized event. */
  constructor(public readonly resolution: CanvasResolution) {
    super(CanvasResizedEvent.type);
  }
}

/** A class representing an event fired when engine setup completes. */
export class EngineSetupEvent extends Event {
  /** The event type identifier. */
  static readonly type = "engineSetup";

  /** Creates a new engine setup event. */
  constructor(
    public readonly config: EngineConfig,
    public readonly resolution: CanvasResolution
  ) {
    super(EngineSetupEvent.type);
  }
}

/** A class representing an event fired when the engine starts. */
export class EngineStartedEvent extends Event {
  /** The event type identifier. */
  static readonly type = "engineStarted";

  /** Creates a new engine started event. */
  constructor() {
    super(EngineStartedEvent.type);
  }
}

/** A class representing an event fired when the engine stops. */
export class EngineStoppedEvent extends Event {
  /** The event type identifier. */
  static readonly type = "engineStopped";

  /** Creates a new engine stopped event. */
  constructor() {
    super(EngineStoppedEvent.type);
  }
}
