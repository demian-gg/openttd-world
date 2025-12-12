/**
 * World map store.
 *
 * Provides shared state for world map zoom and position.
 */

import { defineStore, StoreDefinition, notifyStore } from "../engine/stores";
import {
  BREAKPOINT_SMALL,
  BREAKPOINT_TABLET,
  BREAKPOINT_DESKTOP,
  BREAKPOINT_ULTRA_WIDE,
} from "../engine/utils";

/** A type representing world map store state. */
export type WorldMapStoreState = {
  /** Gets the current zoom level. */
  getZoom: () => number;

  /** Gets the normalized zoom level (0-1). */
  getZoomNormalized: () => number;

  /** Sets the normalized zoom level (0-1). */
  setZoomNormalized: (level: number) => void;

  /** Gets the X offset from center. */
  getOffsetX: () => number;

  /** Gets the Y offset from center. */
  getOffsetY: () => number;

  /** Pans the map by a delta. */
  pan: (dx: number, dy: number) => void;

  /** Centers the map on a world position (in sprite pixels). */
  centerOnWorld: (worldX: number, worldY: number) => void;

  /** Zooms at a specific screen point. */
  zoomAtPoint: (x: number, y: number, deltaY: number) => void;

  /** Updates viewport dimensions (recalculates min zoom). */
  updateViewport: (width: number, height: number) => void;

  /** Sets the sprite dimensions for offset clamping. */
  setSpriteSize: (width: number, height: number) => void;

  /** Gets the sprite dimensions. */
  getSpriteSize: () => { width: number; height: number };
};

/** The viewport width breakpoints mapped to minimum zoom levels. */
const MIN_ZOOM_BREAKPOINTS: [number, number][] = [
  [BREAKPOINT_SMALL, 2], // Mobile
  [BREAKPOINT_TABLET, 2], // Tablet
  [BREAKPOINT_DESKTOP, 2.5], // Desktop
  [BREAKPOINT_ULTRA_WIDE, 2.5], // Large desktop
  [Infinity, 2.75], // Ultrawide
];

/** The maximum zoom level. */
const MAX_ZOOM = 4;

/** The animation duration in milliseconds. */
const ANIMATION_DURATION_MS = 400;

/** The current zoom level. */
let zoom = 3;

/** The minimum zoom level. */
let minZoom = 2;

/** The current X offset from center. */
let offsetX = -100;

/** The current Y offset from center. */
let offsetY = 800;

/** The sprite width in pixels. */
let spriteWidth = 0;

/** The sprite height in pixels. */
let spriteHeight = 0;

/** The viewport width in pixels. */
let viewportWidth = 0;

/** The viewport height in pixels. */
let viewportHeight = 0;

/** The animation frame request ID. */
let animationId: number | null = null;

/** The animation start timestamp. */
let animationStartTime = 0;

/** The animation start X position. */
let animationStartX = 0;

/** The animation start Y position. */
let animationStartY = 0;

/** The animation target X position. */
let animationTargetX = 0;

/** The animation target Y position. */
let animationTargetY = 0;

/** The animation start zoom level. */
let animationStartZoom = 0;

/** The animation target zoom level. */
let animationTargetZoom = 0;

/**
 * Gets the minimum zoom level for a given viewport width.
 *
 * @param width - The viewport width.
 *
 * @returns The minimum zoom level.
 */
function getMinZoomForViewport(width: number): number {
  for (const [breakpoint, minZoom] of MIN_ZOOM_BREAKPOINTS) {
    if (width <= breakpoint) {
      return minZoom;
    }
  }
  return MIN_ZOOM_BREAKPOINTS[MIN_ZOOM_BREAKPOINTS.length - 1][1];
}

/**
 * Applies ease-out cubic interpolation for smooth deceleration.
 *
 * @param t - The interpolation parameter (0-1).
 *
 * @returns The eased value.
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Clamps offset values to keep the map covering the viewport.
 */
function clampOffset(): void {
  if (spriteWidth === 0 || spriteHeight === 0) return;
  if (viewportWidth === 0 || viewportHeight === 0) return;

  // Calculate the scaled sprite dimensions.
  const scaledWidth = spriteWidth * zoom;
  const scaledHeight = spriteHeight * zoom;

  // Calculate how much the map extends beyond the viewport on each side.
  const excessWidth = Math.max(0, scaledWidth - viewportWidth) / 2;
  const excessHeight = Math.max(0, scaledHeight - viewportHeight) / 2;

  // Clamp offset to keep map covering viewport.
  offsetX = Math.max(-excessWidth, Math.min(excessWidth, offsetX));
  offsetY = Math.max(-excessHeight, Math.min(excessHeight, offsetY));
}

/**
 * Updates the minimum zoom based on viewport and sprite size.
 */
function updateMinZoom(): void {
  if (spriteWidth === 0 || spriteHeight === 0) return;
  if (viewportWidth === 0 || viewportHeight === 0) return;

  // Calculate minimum zoom to cover viewport.
  minZoom = Math.max(
    getMinZoomForViewport(viewportWidth),
    viewportWidth / spriteWidth,
    viewportHeight / spriteHeight
  );

  // Clamp current zoom to new min.
  if (zoom < minZoom) {
    zoom = minZoom;
  }
}

/**
 * World map store definition.
 */
export const {
  store: WorldMapStore,
  init: initWorldMapStore,
  get: getWorldMapStore,
}: StoreDefinition<WorldMapStoreState> = defineStore(() => ({
  getZoom() {
    return zoom;
  },
  getZoomNormalized() {
    return (zoom - minZoom) / (MAX_ZOOM - minZoom);
  },
  setZoomNormalized(level: number) {
    // Clamp level to valid range.
    const clampedLevel = Math.max(0, Math.min(1, level));

    // Convert normalized level to zoom value.
    zoom = minZoom + clampedLevel * (MAX_ZOOM - minZoom);
    clampOffset();
    notifyStore(WorldMapStore);
  },
  getOffsetX() {
    return offsetX;
  },
  getOffsetY() {
    return offsetY;
  },
  pan(dx: number, dy: number) {
    // Apply delta to offset.
    offsetX += dx;
    offsetY += dy;
    clampOffset();
    notifyStore(WorldMapStore);
  },
  centerOnWorld(worldX: number, worldY: number) {
    // Cancel any existing animation.
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    // Target zoom is max zoom.
    const targetZoom = MAX_ZOOM;

    // Calculate target offset at the target zoom level.
    const targetOffsetX = targetZoom * (spriteWidth / 2 - worldX);
    const targetOffsetY = targetZoom * (spriteHeight / 2 - worldY);

    // Set up animation state.
    animationStartTime = performance.now();
    animationStartX = offsetX;
    animationStartY = offsetY;
    animationTargetX = targetOffsetX;
    animationTargetY = targetOffsetY;
    animationStartZoom = zoom;
    animationTargetZoom = targetZoom;

    // Animation loop.
    const animate = (currentTime: number) => {
      // Calculate animation progress.
      const elapsed = currentTime - animationStartTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const easedProgress = easeOutCubic(progress);

      // Interpolate values.
      zoom =
        animationStartZoom +
        (animationTargetZoom - animationStartZoom) * easedProgress;
      offsetX =
        animationStartX + (animationTargetX - animationStartX) * easedProgress;
      offsetY =
        animationStartY + (animationTargetY - animationStartY) * easedProgress;
      clampOffset();
      notifyStore(WorldMapStore);

      // Continue or finish animation.
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        animationId = null;
      }
    };

    animationId = requestAnimationFrame(animate);
  },
  zoomAtPoint(x: number, y: number, deltaY: number) {
    // Apply zoom: scroll up = zoom in, scroll down = zoom out.
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(minZoom, Math.min(MAX_ZOOM, zoom * zoomFactor));

    // Adjust offset to keep the point under cursor fixed during zoom.
    const cursorFromCenterX = x - viewportWidth / 2;
    const cursorFromCenterY = y - viewportHeight / 2;
    const zoomRatio = newZoom / zoom;
    offsetX = cursorFromCenterX - (cursorFromCenterX - offsetX) * zoomRatio;
    offsetY = cursorFromCenterY - (cursorFromCenterY - offsetY) * zoomRatio;

    // Apply new zoom and clamp.
    zoom = newZoom;
    clampOffset();
    notifyStore(WorldMapStore);
  },
  updateViewport(width: number, height: number) {
    // Update viewport dimensions.
    viewportWidth = width;
    viewportHeight = height;
    updateMinZoom();
    clampOffset();
  },
  setSpriteSize(width: number, height: number) {
    // Update sprite dimensions.
    spriteWidth = width;
    spriteHeight = height;
    updateMinZoom();
    notifyStore(WorldMapStore);
  },
  getSpriteSize() {
    return { width: spriteWidth, height: spriteHeight };
  },
}));
