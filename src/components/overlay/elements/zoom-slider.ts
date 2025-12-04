/**
 * Zoom slider overlay element.
 * Renders a zoom slider control.
 */

import {
  loadSprite,
  drawSprite,
  Sprite,
  RenderContext,
} from "../../../engine/sprites";

/** Slider sprite instance. */
let sprite: Sprite | null = null;

/**
 * Load the zoom slider sprite.
 */
export async function loadZoomSlider(): Promise<void> {
  sprite = await loadSprite("/sprites/zoom-slider.png");
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
    width: (sprite?.width ?? 0) * scale,
    height: (sprite?.height ?? 0) * scale,
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
  if (!sprite) return;
  drawSprite(ctx, sprite, x, y, scale);
}
