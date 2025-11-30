/**
 * Developer sprite component for testing.
 * Renders a centered developer icon from the sprite atlas.
 * Cycles through 10 sprites, switching every second.
 */

import {
  loadSprite,
  drawSpriteRegion,
  Sprite,
  SpriteRegion,
} from "../engine/sprites";
import { getState } from "../engine/canvas";

/** Cached sprite atlas. */
let atlas: Sprite | null = null;

/** Current sprite index (0-9). */
let currentIndex = 0;

/** Total number of sprites in the atlas. */
const SPRITE_COUNT = 10;

/** Tile size in pixels. */
const TILE_SIZE = 32;

/** Number of columns in the atlas. */
const ATLAS_COLUMNS = 4;

/** Interval between sprite changes in milliseconds. */
const CHANGE_INTERVAL = 1000;

/**
 * Load the developer sprite atlas and start the timer.
 * Must be called before render.
 *
 * @returns Promise resolving when atlas is loaded.
 */
export async function load(): Promise<void> {
  // Load and cache the atlas.
  atlas = await loadSprite("/sprites/developer.png");

  // Start cycling through sprites.
  setInterval(() => {
    currentIndex = (currentIndex + 1) % SPRITE_COUNT;
  }, CHANGE_INTERVAL);
}

/**
 * Render the developer sprite centered on canvas.
 *
 * @param ctx - The 2D rendering context.
 */
export function render(ctx: CanvasRenderingContext2D): void {
  // Skip if atlas not loaded.
  if (!atlas) {
    return;
  }

  // Compute column and row from index.
  const col = currentIndex % ATLAS_COLUMNS;
  const row = Math.floor(currentIndex / ATLAS_COLUMNS);

  // Compute region for current sprite.
  const region: SpriteRegion = {
    x: col * TILE_SIZE,
    y: row * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
  };

  // Get current resolution for centering.
  const { resolution } = getState();

  // Compute centered position.
  const x = Math.floor((resolution.width - region.width) / 2);
  const y = Math.floor((resolution.height - region.height) / 2);

  // Draw sprite region at center.
  drawSpriteRegion(ctx, atlas, region, x, y);
}
