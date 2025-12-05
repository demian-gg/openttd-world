/**
 * Zoom slider overlay element.
 * Renders a zoom slider control with a movable knob.
 */

import {
  loadSprite,
  drawAtlasSprite,
  Sprite,
  RenderContext,
} from "../../../engine/sprites";
import { getWorldMapStore } from "../../../stores/world-map";

/** Slider sprite atlas instance. */
let atlas: Sprite | null = null;

/** Slider dimensions. */
const SLIDER_WIDTH = 26;
const SLIDER_HEIGHT = 222;

/** Knob dimensions. */
const KNOB_SIZE = 26;

/** Padding at top and bottom of track to limit knob range. */
const TRACK_PADDING = 32;

/**
 * Load the zoom slider sprite atlas.
 */
export async function loadZoomSlider(): Promise<void> {
  atlas = await loadSprite("/sprites/zoom-slider.png");
}

/**
 * Get the current zoom level as a normalized value (0-1).
 *
 * @returns Zoom level from 0 (min) to 1 (max).
 */
export function getZoomLevel(): number {
  return getWorldMapStore().getZoomNormalized();
}

/**
 * Set the zoom level from a normalized value (0-1).
 *
 * @param level - Zoom level from 0 (min) to 1 (max).
 */
export function setZoomLevel(level: number): void {
  getWorldMapStore().setZoomNormalized(level);
}

/**
 * Get the zoom slider dimensions.
 *
 * @param scale - Scale factor to apply.
 */
export function getZoomSliderSize(scale = 1): {
  width: number;
  height: number;
} {
  return {
    width: SLIDER_WIDTH * scale,
    height: SLIDER_HEIGHT * scale,
  };
}

/**
 * Render the zoom slider at a position.
 *
 * @param ctx - The rendering context.
 * @param x - X position.
 * @param y - Y position.
 * @param scale - Optional scale factor.
 */
export function renderZoomSlider(
  ctx: RenderContext,
  x: number,
  y: number,
  scale = 1
): void {
  if (!atlas) return;

  // Draw the slider track.
  drawAtlasSprite(
    ctx,
    atlas,
    { x: 0, y: 0, width: SLIDER_WIDTH, height: SLIDER_HEIGHT },
    x,
    y,
    scale
  );

  // Get zoom level from context.
  const zoomLevel = getZoomLevel();

  // Calculate knob position based on zoom level.
  // zoomLevel 0 = bottom, zoomLevel 1 = top.
  // Apply padding to limit the knob travel range.
  const paddingScaled = TRACK_PADDING * scale;
  const trackHeight = (SLIDER_HEIGHT - KNOB_SIZE) * scale - paddingScaled * 2;
  const knobY = y + paddingScaled + trackHeight * (1 - zoomLevel);

  // Draw the knob.
  drawAtlasSprite(
    ctx,
    atlas,
    { x: SLIDER_WIDTH, y: 0, width: KNOB_SIZE, height: KNOB_SIZE },
    x,
    knobY,
    scale
  );
}
