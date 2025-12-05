/**
 * Element system for sub-components owned by parent components.
 *
 * Elements are similar to components but don't register with the engine.
 * They are owned and orchestrated by a parent component.
 *
 * @example
 * ```typescript
 * const sprite = createState<Sprite | null>(null);
 *
 * export const Logo = defineElement<LogoProps>("logo", {
 *   async load() {
 *     sprite.set(await loadSprite("/sprites/logo.png"));
 *   },
 *   render(ctx, props) {
 *     drawSprite(ctx, sprite.get()!, props.x, props.y);
 *   },
 *   getSize() {
 *     return { width: 64, height: 64 };
 *   },
 * });
 *
 * // In parent component:
 * async load() {
 *   await loadElements([Logo, Buttons, ZoomSlider]);
 * }
 *
 * render(ctx, props) {
 *   Logo.render(ctx, { x: 32, y: 32 });
 * }
 * ```
 */

import type { RenderContext } from "./canvas";

/** Element lifecycle definition. */
export interface ElementLifecycle<P> {
  /** Optional async load function called before first render. */
  load?: () => Promise<void>;

  /** Optional update function called each frame by parent. */
  update?: (props: P) => void;

  /** Render function called by parent. */
  render: (ctx: RenderContext, props: P) => void;

  /** Function to get element dimensions. */
  getSize: () => { width: number; height: number };
}

/** Element definition returned by defineElement. */
export interface Element<P> {
  /** Element name for debugging. */
  name: string;

  /** Optional async load function. */
  load?: () => Promise<void>;

  /** Update function (no-op if not defined). */
  update: (props: P) => void;

  /** Render function. */
  render: (ctx: RenderContext, props: P) => void;

  /** Get element dimensions. */
  getSize: () => { width: number; height: number };
}

/**
 * Define a new element with a consistent structure.
 *
 * @param name - Name of the element (for debugging).
 * @param lifecycle - Object with optional load, update, getSize and required render.
 * @returns Element definition.
 */
export function defineElement<P>(
  name: string,
  lifecycle: ElementLifecycle<P>
): Element<P> {
  return {
    name,
    load: lifecycle.load,
    update: (props: P) => lifecycle.update?.(props),
    render: (ctx: RenderContext, props: P) => lifecycle.render(ctx, props),
    getSize: lifecycle.getSize,
  };
}

/**
 * Load multiple elements in parallel.
 *
 * @param elements - Array of elements to load.
 * @returns Promise that resolves when all elements are loaded.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadElements(elements: Element<any>[]): Promise<void> {
  await Promise.all(elements.map((e) => e.load?.()));
}
