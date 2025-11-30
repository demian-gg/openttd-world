/**
 * Developer sprite component for testing.
 * Cycles through 10 sprites, switching every second, while zooming in and out.
 */

import {
  loadSprite,
  drawSpriteRegion,
  Sprite,
  SpriteRegion,
} from "../engine/sprites";

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

/** Minimum scale for zoom animation. */
const MIN_SCALE = 2;

/** Maximum scale for zoom animation. */
const MAX_SCALE = 8;

/** Duration of one zoom cycle in milliseconds. */
const ZOOM_CYCLE_MS = 3000;

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
 * Render the developer sprite at top-left.
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

  // Compute animated scale using sin(t), oscillating between MIN and MAX.
  const t = (Date.now() % ZOOM_CYCLE_MS) / ZOOM_CYCLE_MS;
  const normalized = (Math.sin(t * Math.PI * 2) + 1) / 2;
  const scale = MIN_SCALE + normalized * (MAX_SCALE - MIN_SCALE);

  // Draw sprite region at top-left.
  drawSpriteRegion(ctx, atlas, region, 0, 0, scale);
}
