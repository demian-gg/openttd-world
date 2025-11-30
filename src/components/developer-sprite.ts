/**
 * Developer sprite component for testing.
 * Renders a centered developer icon on the canvas.
 */

import { loadSprite, drawSprite, Sprite } from "../engine/sprites";
import { getState } from "../engine/canvas";

/** Cached sprite instance. */
let sprite: Sprite | null = null;

/**
 * Load the developer sprite.
 * Must be called before render.
 *
 * @returns Promise resolving when sprite is loaded.
 */
export async function load(): Promise<void> {
  // Load and cache the sprite.
  sprite = await loadSprite("/sprites/developer.png");
}

/**
 * Render the developer sprite centered on canvas.
 *
 * @param ctx - The 2D rendering context.
 */
export function render(ctx: CanvasRenderingContext2D): void {
  // Skip if sprite not loaded.
  if (!sprite) {
    return;
  }

  // Get current resolution for centering.
  const { resolution } = getState();

  // Compute centered position.
  const x = Math.floor((resolution.width - sprite.width) / 2);
  const y = Math.floor((resolution.height - sprite.height) / 2);

  // Draw sprite at center.
  drawSprite(ctx, sprite, x, y);
}
