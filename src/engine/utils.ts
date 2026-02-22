/**
 * Utility functions for the engine.
 */

import { getEngineState } from "./engine";
import { getWorldMapStore } from "../stores/world-map";

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
function isAtBreakpoint(breakpoint: number): boolean {
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

/**
 * Converts screen coordinates to world (sprite) coordinates.
 *
 * Accounts for zoom, centering, and offset.
 *
 * @param screenX - The screen X coordinate.
 * @param screenY - The screen Y coordinate.
 * @param viewportWidth - The viewport width.
 * @param viewportHeight - The viewport height.
 *
 * @returns The world coordinates.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } {
  const store = getWorldMapStore();
  const zoom = store.getZoom();
  const offsetX = store.getOffsetX();
  const offsetY = store.getOffsetY();
  const { width: spriteWidth, height: spriteHeight } = store.getSpriteSize();

  // Calculate where the map is drawn on screen.
  const scaledWidth = spriteWidth * zoom;
  const scaledHeight = spriteHeight * zoom;
  const mapX = Math.round((viewportWidth - scaledWidth) / 2) + offsetX;
  const mapY = Math.round((viewportHeight - scaledHeight) / 2) + offsetY;

  // Convert screen position to world position.
  const worldX = (screenX - mapX) / zoom;
  const worldY = (screenY - mapY) / zoom;

  return { x: worldX, y: worldY };
}
