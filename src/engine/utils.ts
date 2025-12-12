/**
 * Utility functions for the engine.
 */

import { getEngineState } from "./engine";

/** Breakpoint for small devices (phones). */
export const BREAKPOINT_SMALL = 640;

/** Breakpoint for tablet devices. */
export const BREAKPOINT_TABLET = 768;

/** Breakpoint for desktop devices. */
export const BREAKPOINT_DESKTOP = 960;

/** Breakpoint for wide desktop displays. */
export const BREAKPOINT_WIDE_DESKTOP = 1440;

/** Breakpoint for ultra-wide displays. */
export const BREAKPOINT_ULTRA_WIDE = 1920;

/**
 * Checks if the current viewport is at or below a breakpoint.
 *
 * @param breakpoint - The breakpoint value to check against.
 *
 * @returns True if viewport width is at or below the breakpoint.
 */
export function isAtBreakpoint(breakpoint: number): boolean {
  const { resolution } = getEngineState();
  return resolution.width <= breakpoint;
}

/**
 * Checks if the current viewport is a small device (phone).
 *
 * @returns True if the viewport width is at or below the small breakpoint.
 */
export function isSmall(): boolean {
  return isAtBreakpoint(BREAKPOINT_SMALL);
}

/**
 * Checks if the current viewport is a tablet or smaller.
 *
 * @returns True if the viewport width is at or below the tablet breakpoint.
 */
export function isTablet(): boolean {
  return isAtBreakpoint(BREAKPOINT_TABLET);
}

/**
 * Checks if the current viewport is desktop or smaller.
 *
 * @returns True if the viewport width is at or below the desktop breakpoint.
 */
export function isDesktop(): boolean {
  return isAtBreakpoint(BREAKPOINT_DESKTOP);
}

/**
 * Gets a responsive value based on viewport width.
 *
 * Returns the value for the smallest matching breakpoint.
 *
 * @param values - Object with breakpoint keys and values.
 *
 * @returns The value for the current viewport size.
 */
export function getResponsiveValue<T>(values: {
  default: T;
  small?: T;
  tablet?: T;
  desktop?: T;
  wideDesktop?: T;
}): T {
  const { resolution } = getEngineState();
  const width = resolution.width;

  if (values.small !== undefined && width <= BREAKPOINT_SMALL) {
    return values.small;
  }
  if (values.tablet !== undefined && width <= BREAKPOINT_TABLET) {
    return values.tablet;
  }
  if (values.desktop !== undefined && width <= BREAKPOINT_DESKTOP) {
    return values.desktop;
  }
  if (values.wideDesktop !== undefined && width <= BREAKPOINT_WIDE_DESKTOP) {
    return values.wideDesktop;
  }

  return values.default;
}
