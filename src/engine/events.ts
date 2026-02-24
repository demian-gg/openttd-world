import type { CanvasResolution } from "./canvas";
import type { EngineConfig } from "./engine";

/** A type representing an event class constructor with static type property. */
type EventClass<T extends Event> = {
  new (...args: never[]): T;
  readonly type: string;
};

/** A typed event emitter with a nicer API than EventTarget. */
class EventEmitter {
  private target = new EventTarget();

  on<T extends Event>(
    eventClass: EventClass<T>,
    callback: (event: T) => void
  ): () => void {
    const listener = (event: Event) => callback(event as T);
    this.target.addEventListener(eventClass.type, listener);
    return () => this.target.removeEventListener(eventClass.type, listener);
  }

  emit(event: Event): void {
    this.target.dispatchEvent(event);
  }
}

/** A class representing an event fired when canvas resolution changes. */
export class CanvasResizedEvent extends Event {
  static readonly type = "canvasResized";

  constructor(public readonly resolution: CanvasResolution) {
    super(CanvasResizedEvent.type);
  }
}

/** A class representing an event fired when engine setup completes. */
export class EngineSetupEvent extends Event {
  static readonly type = "engineSetup";

  constructor(
    public readonly config: EngineConfig,
    public readonly resolution: CanvasResolution
  ) {
    super(EngineSetupEvent.type);
  }
}

/** A class representing an event fired when the engine starts. */
export class EngineStartedEvent extends Event {
  static readonly type = "engineStarted";

  constructor() {
    super(EngineStartedEvent.type);
  }
}

/** A class representing an event fired when the engine stops. */
export class EngineStoppedEvent extends Event {
  static readonly type = "engineStopped";

  constructor() {
    super(EngineStoppedEvent.type);
  }
}

export const canvasEvents = new EventEmitter();
export const engineEvents = new EventEmitter();
