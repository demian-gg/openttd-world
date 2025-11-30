/**
 * Developer sprite component for testing.
 * Cycles through 10 sprites, switching every second, while zooming in and out.
 */

import {
  loadSprite,
  drawSpriteRegion,
  Sprite,
  SpriteRegion,
  RenderContext,
} from "../engine/sprites";

let spriteAtlas: Sprite | null = null;
let currentSpriteIndex = 0;

export const props = {
  layer: 0,

  /** Total number of sprites in the atlas. */
  spriteCount: 10,

  /** Tile size in pixels. */
  tileSize: 32,

  /** Number of columns in the atlas. */
  atlasColumns: 4,

  /** Interval between sprite changes in milliseconds. */
  changeInterval: 1000,

  /** Minimum scale for zoom animation. */
  minScale: 2,

  /** Maximum scale for zoom animation. */
  maxScale: 8,

  /** Duration of one zoom cycle in milliseconds. */
  zoomCycleMs: 3000,
};

/**
 * Load the developer sprite atlas and start the timer.
 * Must be called before render.
 *
 * @returns Promise resolving when atlas is loaded.
 */
export async function load(): Promise<void> {
  // Load and cache the atlas.
  spriteAtlas = await loadSprite("/sprites/developer.png");

  // Start cycling through sprites.
  setInterval(() => {
    currentSpriteIndex = (currentSpriteIndex + 1) % props.spriteCount;
  }, props.changeInterval);
}

/**
 * Render the developer sprite at top-left.
 *
 * @param ctx - The 2D rendering context (main or offscreen).
 */
export function render(ctx: RenderContext): void {
  // Skip if atlas not loaded.
  if (!spriteAtlas) {
    return;
  }

  // Compute column and row from index.
  const col = currentSpriteIndex % props.atlasColumns;
  const row = Math.floor(currentSpriteIndex / props.atlasColumns);

  // Compute region for current sprite.
  const region: SpriteRegion = {
    x: col * props.tileSize,
    y: row * props.tileSize,
    width: props.tileSize,
    height: props.tileSize,
  };

  // Compute animated scale using sin(t), oscillating between MIN and MAX.
  const t = (Date.now() % props.zoomCycleMs) / props.zoomCycleMs;
  const normalized = (Math.sin(t * Math.PI * 2) + 1) / 2;
  const scale = props.minScale + normalized * (props.maxScale - props.minScale);

  // Draw sprite region at top-left.
  drawSpriteRegion(ctx, spriteAtlas, region, 0, 0, scale);
}
