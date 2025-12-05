/**
 * Component system for registering and managing renderable entities.
 *
 * Components are defined using `defineComponent()` which provides a consistent
 * pattern matching the store system. Each component can use `createState()` for
 * local state management.
 *
 * @example
 * ```typescript
 * const sprite = createState<Sprite | null>(null);
 *
 * export const { register: registerWorldMap } = defineComponent<WorldMapProps>(
 *   "world-map",
 *   {
 *     async load() {
 *       sprite.set(await loadSprite("/sprites/world-map.png"));
 *     },
 *     render(ctx, props) {
 *       if (sprite.get()) drawSprite(ctx, sprite.get()!, 0, 0);
 *     },
 *   }
 * );
 * ```
 */

import type { RenderContext } from "./canvas";

/** Base props that all components must have. */
export interface ComponentProps {
  /** Layer for render ordering. Lower renders first. */
  layer: number;
}

/** State container returned by createState. */
export interface State<T> {
  /** Get the current value. */
  get: () => T;
  /** Set a new value. */
  set: (value: T) => void;
}

/**
 * Create a local state container for components.
 * A simple get/set container for component-local state.
 *
 * @param initial - Initial value.
 * @returns State container with get() and set().
 *
 * @example
 * ```typescript
 * const count = createState(0);
 * count.set(count.get() + 1);
 * ```
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

/** Component lifecycle definition. */
export interface ComponentLifecycle<P extends ComponentProps> {
  /** Optional init function called once when component is registered. */
  init?: (props: P) => void;

  /** Optional async load function called before first render. */
  load?: () => Promise<void>;

  /** Optional update function called each frame. */
  update?: (props: P) => void;

  /** Render function called when layer is dirty. */
  render: (ctx: RenderContext, props: P) => void;
}

/** Internal component instance. */
interface ComponentInstance<P extends ComponentProps> {
  /** Component name for debugging. */
  name: string;

  /** Component props. */
  props: P;

  /** Lifecycle hooks. */
  lifecycle: ComponentLifecycle<P>;
}

/** Component definition returned by defineComponent. */
export interface ComponentDefinition<P extends ComponentProps> {
  /** Create and register a component instance. */
  register: (props: P) => void;
}

/** Registered component instances. */
const instances: ComponentInstance<ComponentProps>[] = [];

/**
 * Define a new component with a consistent structure.
 *
 * @param name - Name of the component (for debugging).
 * @param lifecycle - Object with optional load, update, and required render.
 * @returns Component definition with register function.
 *
 * @example
 * ```typescript
 * const sprite = createState<Sprite | null>(null);
 *
 * export const { register: registerVignette } = defineComponent<VignetteProps>(
 *   "vignette",
 *   {
 *     async load() {
 *       sprite.set(await loadSprite("/sprites/vignette.png"));
 *     },
 *     render(ctx, props) {
 *       // Draw using props.layer, props.color, etc.
 *     },
 *   }
 * );
 *
 * // In main.ts:
 * registerVignette({ layer: 1, color: "#000" });
 * ```
 */
export function defineComponent<P extends ComponentProps>(
  name: string,
  lifecycle: ComponentLifecycle<P>
): ComponentDefinition<P> {
  return {
    register: (props: P) => {
      // Call init if defined.
      lifecycle.init?.(props);

      instances.push({
        name,
        props,
        lifecycle: lifecycle as ComponentLifecycle<ComponentProps>,
      });
    },
  };
}

/**
 * Load all registered components that have a load function.
 *
 * @returns Promise that resolves when all components are loaded.
 */
export async function loadComponents(): Promise<void> {
  await Promise.all(instances.map((c) => c.lifecycle.load?.()));
}

/**
 * Update all registered components that have an update function.
 */
export function updateComponents(): void {
  for (const instance of instances) {
    instance.lifecycle.update?.(instance.props);
  }
}

/**
 * Get all registered component instances for rendering.
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
 * Clear all registered components.
 * Useful for cleanup between scenes or tests.
 */
export function clearComponents(): void {
  instances.length = 0;
}
