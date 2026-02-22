/**
 * Element system for sub-components owned by parent components.
 *
 * Elements are similar to components but don't register with the engine.
 * They are owned and orchestrated by a parent component.
 */

import type { RenderContext } from "./canvas";

/** A type representing element lifecycle definition. */
export type ElementLifecycle<P> = {
  /** The optional async load function called before first render. */
  load?: () => Promise<void>;

  /** The optional update function called each frame by parent. */
  update?: (props: P) => void;

  /** The render function called by parent. */
  render: (context: RenderContext, props: P) => void;

  /** The function to get element dimensions. */
  getSize: () => { width: number; height: number };
};

/** A type representing an element definition returned by defineElement. */
export type Element<P> = {
  /** The optional async load function. */
  load?: () => Promise<void>;

  /** The update function (no-op if not defined). */
  update: (props: P) => void;

  /** The render function. */
  render: (context: RenderContext, props: P) => void;

  /** Gets element dimensions. */
  getSize: () => { width: number; height: number };
};

/**
 * Defines a new element with a consistent structure.
 *
 * @param lifecycle - Object with optional load, update, getSize and required render.
 *
 * @returns Element definition.
 */
export function defineElement<P>(lifecycle: ElementLifecycle<P>): Element<P> {
  return {
    load: lifecycle.load,
    update: (props: P) => lifecycle.update?.(props),
    render: (context: RenderContext, props: P) => lifecycle.render(context, props),
    getSize: lifecycle.getSize,
  };
}

/**
 * Loads multiple elements in parallel.
 * 
 * The array uses `any` because parent components load heterogeneous elements
 * whose concrete prop types are not known at this call site.
 *
 * @param elements - Array of elements to load.
 *
 * @returns Promise that resolves when all elements are loaded.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadElements(elements: Element<any>[]): Promise<void> {
  await Promise.all(elements.map((element) => element.load?.()));
}
