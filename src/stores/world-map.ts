/**
 * World map store.
 * Provides shared state for world map zoom and position.
 */

import { defineStore, StoreDefinition, notifyStore } from "../engine/stores";
import {
  BREAKPOINT_SMALL,
  BREAKPOINT_TABLET,
  BREAKPOINT_DESKTOP,
  BREAKPOINT_ULTRA_WIDE,
} from "../engine/utils";

/** Viewport width breakpoints mapped to minimum zoom levels. */
const MIN_ZOOM_BREAKPOINTS: [number, number][] = [
  [BREAKPOINT_SMALL, 2], // Mobile
  [BREAKPOINT_TABLET, 2], // Tablet
  [BREAKPOINT_DESKTOP, 2.5], // Desktop
  [BREAKPOINT_ULTRA_WIDE, 2.5], // Large desktop
  [Infinity, 2.75], // Ultrawide
];

/** Maximum zoom level. */
const MAX_ZOOM = 4;

/**
 * Get minimum zoom level for a given viewport width.
 */
function getMinZoomForViewport(width: number): number {
  for (const [breakpoint, minZoom] of MIN_ZOOM_BREAKPOINTS) {
    if (width <= breakpoint) {
      return minZoom;
    }
  }
  return MIN_ZOOM_BREAKPOINTS[MIN_ZOOM_BREAKPOINTS.length - 1][1];
}

/** World map store state. */
export interface WorldMapStoreState {
  /** Get the current zoom level. */
  getZoom: () => number;

  /** Get the normalized zoom level (0-1). */
  getZoomNormalized: () => number;

  /** Set the normalized zoom level (0-1). */
  setZoomNormalized: (level: number) => void;

  /** Get the X offset from center. */
  getOffsetX: () => number;

  /** Get the Y offset from center. */
  getOffsetY: () => number;

  /** Pan the map by a delta. */
  pan: (dx: number, dy: number) => void;

  /** Center the map on a world position (in sprite pixels). */
  centerOnWorld: (worldX: number, worldY: number) => void;

  /** Zoom at a specific screen point. */
  zoomAtPoint: (x: number, y: number, deltaY: number) => void;

  /** Update viewport dimensions (recalculates min zoom). */
  updateViewport: (width: number, height: number) => void;

  /** Set the sprite dimensions for offset clamping. */
  setSpriteSize: (width: number, height: number) => void;

  /** Get the sprite dimensions. */
  getSpriteSize: () => { width: number; height: number };
}

/** Internal state. */
let zoom = 3;
let minZoom = 2;
let offsetX = -100;
let offsetY = 800;
let spriteWidth = 0;
let spriteHeight = 0;
let viewportWidth = 0;
let viewportHeight = 0;

/** Animation state. */
let animationId: number | null = null;
let animationStartTime = 0;
let animationStartX = 0;
let animationStartY = 0;
let animationTargetX = 0;
let animationTargetY = 0;
let animationStartZoom = 0;
let animationTargetZoom = 0;
const ANIMATION_DURATION_MS = 400;

/** Ease-out cubic function for smooth deceleration. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Clamp offset values to keep the map covering the viewport. */
function clampOffset(): void {
  if (spriteWidth === 0 || spriteHeight === 0) return;
  if (viewportWidth === 0 || viewportHeight === 0) return;

  // Calculate the scaled sprite dimensions.
  const scaledWidth = spriteWidth * zoom;
  const scaledHeight = spriteHeight * zoom;

  // Calculate how much the map extends beyond the viewport on each side.
  const excessWidth = Math.max(0, scaledWidth - viewportWidth) / 2;
  const excessHeight = Math.max(0, scaledHeight - viewportHeight) / 2;

  offsetX = Math.max(-excessWidth, Math.min(excessWidth, offsetX));
  offsetY = Math.max(-excessHeight, Math.min(excessHeight, offsetY));
}

/** Update min zoom based on viewport and sprite size. */
function updateMinZoom(): void {
  if (spriteWidth === 0 || spriteHeight === 0) return;
  if (viewportWidth === 0 || viewportHeight === 0) return;

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
    const clampedLevel = Math.max(0, Math.min(1, level));
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
    // At target zoom, we want the world position centered on screen.
    // spriteLeft = viewportWidth/2 + targetOffsetX - (spriteWidth * targetZoom) / 2
    // worldScreenX = spriteLeft + worldX * targetZoom = viewportWidth/2 (centered)
    // Solving: targetOffsetX = (spriteWidth * targetZoom) / 2 - worldX * targetZoom
    //                        = targetZoom * (spriteWidth / 2 - worldX)
    const targetOffsetX = targetZoom * (spriteWidth / 2 - worldX);
    const targetOffsetY = targetZoom * (spriteHeight / 2 - worldY);

    // Set up animation.
    animationStartTime = performance.now();
    animationStartX = offsetX;
    animationStartY = offsetY;
    animationTargetX = targetOffsetX;
    animationTargetY = targetOffsetY;
    animationStartZoom = zoom;
    animationTargetZoom = targetZoom;

    // Animation loop.
    const animate = (currentTime: number) => {
      const elapsed = currentTime - animationStartTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const easedProgress = easeOutCubic(progress);

      zoom =
        animationStartZoom +
        (animationTargetZoom - animationStartZoom) * easedProgress;
      offsetX =
        animationStartX + (animationTargetX - animationStartX) * easedProgress;
      offsetY =
        animationStartY + (animationTargetY - animationStartY) * easedProgress;
      clampOffset();
      notifyStore(WorldMapStore);

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

    zoom = newZoom;
    clampOffset();
    notifyStore(WorldMapStore);
  },
  updateViewport(width: number, height: number) {
    viewportWidth = width;
    viewportHeight = height;
    updateMinZoom();
    clampOffset();
  },
  setSpriteSize(width: number, height: number) {
    spriteWidth = width;
    spriteHeight = height;
    updateMinZoom();
    notifyStore(WorldMapStore);
  },
  getSpriteSize() {
    return { width: spriteWidth, height: spriteHeight };
  },
}));
