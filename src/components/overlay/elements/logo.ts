/**
 * Logo overlay element.
 * Renders the logo sprite.
 */

import { loadSprite, drawSprite, Sprite, RenderContext } from "../../../engine/sprites";

/** Logo sprite instance. */
let sprite: Sprite | null = null;

/**
 * Load the logo sprite.
 */
export async function loadLogo(): Promise<void> {
  sprite = await loadSprite("/sprites/logo.png");
}

/**
 * Get the logo dimensions.
 */
export function getLogoSize(): { width: number; height: number } {
  return {
    width: sprite?.width ?? 0,
    height: sprite?.height ?? 0,
  };
}

/**
 * Render the logo at a position.
 *
 * @param ctx - The rendering context.
 * @param x - X position.
 * @param y - Y position.
 * @param scale - Optional scale factor.
 */
export function renderLogo(
  ctx: RenderContext,
  x: number,
  y: number,
  scale = 1
): void {
  if (!sprite) return;
  drawSprite(ctx, sprite, x, y, scale);
}
