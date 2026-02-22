/**
 * Component system for registering and managing renderable entities.
 *
 * Components are defined using `defineComponent()` which provides a consistent
 * pattern matching the store system. Each component can use `createState()` for
 * local state management.
 */

import type { RenderContext } from "./canvas";

/** A type representing base props that all components must have. */
export type ComponentProps = {
  /** The layer for render ordering. Lower renders first. */
  layer: number;
};

/** A type representing a state container returned by createState. */
export type State<T> = {
  /** Gets the current value. */
  get: () => T;

  /** Sets a new value. */
  set: (value: T) => void;
};

/**
 * Creates a local state container for components.
 *
 * A simple get/set container for component-local state.
 *
 * @param initial - Initial value.
 *
 * @returns State container with get() and set().
 */
export function createState<T>(initial: T): State<T> {
  let value = initial;
  return {
    get: () => value,
    set: (newValue: T) => {
      value = newValue;
    },
  };
}

/** A type representing component lifecycle definition. */
export type ComponentLifecycle<P extends ComponentProps> = {
  /** The optional init function called once when component is registered. */
  init?: (props: P) => void;

  /** The optional async load function called before first render. */
  load?: () => Promise<void>;

  /**
   * The optional update function called when component state changes.
   *
   * Only called when the component is marked for update via store
   * subscriptions. Use for state-dependent logic like layer transforms.
   */
  update?: (props: P) => void;

  /**
   * The optional pointer areas function called every frame.
   *
   * Registers interactive areas for mouse/touch input. Called after pointer
   * areas are cleared, before rendering.
   */
  pointerAreas?: (props: P) => void;

  /** The render function called when layer is dirty. */
  render: (context: RenderContext, props: P) => void;
};

/** A type representing an internal component instance. */
type ComponentInstance<P extends ComponentProps> = {
  /** The component props. */
  props: P;

  /** The lifecycle hooks. */
  lifecycle: ComponentLifecycle<P>;

  /** Whether this component needs its update() called. */
  needsUpdate: boolean;
};

/** A type representing a component definition returned by defineComponent. */
export type ComponentDefinition<P extends ComponentProps> = {
  /** Initializes and registers a component instance. */
  init: (props: P) => void;
};

/** A type representing a component registration tuple for engine configuration. */
// The generic default uses `any` because engine config arrays hold heterogeneous
// component registrations whose concrete prop types are not known statically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentRegistration<P extends ComponentProps = any> = [
  (props: P) => void,
  P
];

/** The registered component instances. */
const instances: ComponentInstance<ComponentProps>[] = [];

/** Map from props to instance for quick lookup. */
const instancesByProps = new WeakMap<ComponentProps, ComponentInstance<ComponentProps>>();

/**
 * Defines a new component with a consistent structure.
 *
 * @param lifecycle - Object with optional load, update, and required render.
 *
 * @returns Component definition with register function.
 */
export function defineComponent<P extends ComponentProps>(
  lifecycle: ComponentLifecycle<P>
): ComponentDefinition<P> {
  return {
    init: (props: P) => {
      // Call init if defined.
      lifecycle.init?.(props);

      // Register component instance.
      const instance: ComponentInstance<ComponentProps> = {
        props,
        lifecycle: lifecycle as ComponentLifecycle<ComponentProps>,
        needsUpdate: true,
      };
      instances.push(instance);
      instancesByProps.set(props, instance);
    },
  };
}

/**
 * Loads all registered components that have a load function.
 *
 * @returns Promise that resolves when all components are loaded.
 */
export async function loadComponents(): Promise<void> {
  await Promise.all(instances.map((instance) => instance.lifecycle.load?.()));
}

/**
 * Updates components that have been marked for update.
 *
 * Only calls update() on components where needsUpdate is true. Components
 * are marked for update when their subscribed stores notify changes.
 */
export function updateComponents(): void {
  for (const instance of instances) {
    if (instance.needsUpdate) {
      instance.lifecycle.update?.(instance.props);
      instance.needsUpdate = false;
    }
  }
}

/**
 * Registers pointer areas for all components.
 *
 * Called every frame after pointer areas are cleared. This is separate from
 * update() because pointer areas must be re-registered every frame.
 */
export function registerComponentPointerAreas(): void {
  for (const instance of instances) {
    instance.lifecycle.pointerAreas?.(instance.props);
  }
}

/**
 * Marks a component for update on the next frame.
 *
 * Call this when store state changes that affects the component.
 *
 * @param props - The component props used during registration.
 */
export function markComponentForUpdate(props: ComponentProps): void {
  const instance = instancesByProps.get(props);
  if (instance) {
    instance.needsUpdate = true;
  }
}

/**
 * Gets all registered component instances for rendering.
 *
 * @returns Array of objects with props and render function.
 */
export function getComponents(): Array<{
  props: ComponentProps;
  render: (context: RenderContext) => void;
}> {
  return instances.map((instance) => ({
    props: instance.props,
    render: (context: RenderContext) =>
      instance.lifecycle.render(context, instance.props),
  }));
}

/**
 * Creates a type-safe component registration for engine configuration.
 *
 * Components are registered with the engine at startup. Each component
 * specifies a layer for render ordering (lower layers render first).
 *
 * @param init - The component's init function from defineComponent().
 * @param props - Props to pass to the component, must include layer.
 *
 * @returns A registration tuple for the engine's components array.
 */
export function component<P extends ComponentProps>(
  init: (props: P) => void,
  props: P
): ComponentRegistration<P> {
  return [init, props];
}
