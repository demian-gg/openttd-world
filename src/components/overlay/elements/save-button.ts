/**
 * Save button overlay element.
 * Renders a save/download button.
 */

import {
  loadSprite,
  drawSprite,
  Sprite,
  RenderContext,
} from "../../../engine/sprites";

/** Button sprite instance. */
let sprite: Sprite | null = null;

/**
 * Load the save button sprite.
 */
export async function loadSaveButton(): Promise<void> {
  sprite = await loadSprite("/sprites/save-button.png");
}

/**
 * Get the save button dimensions.
 *
 * @param scale - Scale factor to apply.
 */
export function getSaveButtonSize(scale = 1.5): {
  width: number;
  height: number;
} {
  return {
    width: (sprite?.width ?? 0) * scale,
    height: (sprite?.height ?? 0) * scale,
  };
}

/**
 * Render the save button at a position.
 *
 * @param ctx - The rendering context.
 * @param x - X position.
 * @param y - Y position.
 * @param scale - Optional scale factor.
 */
export function renderSaveButton(
  ctx: RenderContext,
  x: number,
  y: number,
  scale = 1.5
): void {
  if (!sprite) return;
  drawSprite(ctx, sprite, x, y, scale);
}
