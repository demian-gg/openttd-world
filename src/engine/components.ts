/**
 * Component system for registering and managing renderable entities.
 */

import type { RenderContext } from "./canvas";

/**
 * Component interface for loadable, renderable entities.
 * Components are the building blocks of the game — sprites, UI elements, etc.
 */
export interface Component {
  /** Optional configurable properties. */
  props?: Record<string, unknown> & Partial<Record<"layer", number>>;

  /** Optional async load function called before first render. */
  load?: () => Promise<void>;

  /** Render function called each frame. */
  render: (ctx: RenderContext) => void;
}

/** Registered components. */
const components: Component[] = [];

/**
 * Register a component for rendering.
 *
 * @param component - The component to register.
 */
export function registerComponent(component: Component): void {
  components.push(component);
}

/**
 * Register multiple components for rendering.
 *
 * @param newComponents - Array of components to register.
 */
export function registerComponents(newComponents: Component[]): void {
  components.push(...newComponents);
}

/**
 * Load all registered components that have a load function.
 *
 * @returns Promise that resolves when all components are loaded.
 */
export async function loadComponents(): Promise<void> {
  await Promise.all(components.map((c) => c.load?.()));
}

/**
 * Get all registered components.
 *
 * @returns Array of registered components.
 */
export function getComponents(): Component[] {
  return components;
}
