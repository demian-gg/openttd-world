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

  /** Zoom at a specific screen point. */
  zoomAtPoint: (x: number, y: number, deltaY: number) => void;

  /** Update viewport dimensions (recalculates min zoom). */
  updateViewport: (width: number, height: number) => void;

  /** Set the sprite dimensions for offset clamping. */
  setSpriteSize: (width: number, height: number) => void;
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
  register: registerWorldMapStore,
  get: getWorldMapStore,
}: StoreDefinition<WorldMapStoreState> = defineStore("world-map", () => ({
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
}));
