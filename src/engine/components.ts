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
    set: (v: T) => {
      value = v;
    },
  };
}

/** A type representing component lifecycle definition. */
export type ComponentLifecycle<P extends ComponentProps> = {
  /** The optional init function called once when component is registered. */
  init?: (props: P) => void;

  /** The optional async load function called before first render. */
  load?: () => Promise<void>;

  /** The optional update function called each frame. */
  update?: (props: P) => void;

  /** The render function called when layer is dirty. */
  render: (ctx: RenderContext, props: P) => void;
};

/** A type representing an internal component instance. */
type ComponentInstance<P extends ComponentProps> = {
  /** The component props. */
  props: P;

  /** The lifecycle hooks. */
  lifecycle: ComponentLifecycle<P>;
};

/** A type representing a component definition returned by defineComponent. */
export type ComponentDefinition<P extends ComponentProps> = {
  /** Initializes and registers a component instance. */
  init: (props: P) => void;
};

/** The registered component instances. */
const instances: ComponentInstance<ComponentProps>[] = [];

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
      instances.push({
        props,
        lifecycle: lifecycle as ComponentLifecycle<ComponentProps>,
      });
    },
  };
}

/**
 * Loads all registered components that have a load function.
 *
 * @returns Promise that resolves when all components are loaded.
 */
export async function loadComponents(): Promise<void> {
  await Promise.all(instances.map((c) => c.lifecycle.load?.()));
}

/** Updates all registered components that have an update function. */
export function updateComponents(): void {
  for (const instance of instances) {
    instance.lifecycle.update?.(instance.props);
  }
}

/**
 * Gets all registered component instances for rendering.
 *
 * @returns Array of objects with props and render function.
 */
export function getComponents(): Array<{
  props: ComponentProps;
  render: (ctx: RenderContext) => void;
}> {
  return instances.map((instance) => ({
    props: instance.props,
    render: (ctx: RenderContext) =>
      instance.lifecycle.render(ctx, instance.props),
  }));
}

/**
 * Clears all registered components.
 *
 * Useful for cleanup between scenes or tests.
 */
export function clearComponents(): void {
  instances.length = 0;
}

/** A type representing a component registration tuple for engine configuration. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentRegistration<P extends ComponentProps = any> = [
  (props: P) => void,
  P
];

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
