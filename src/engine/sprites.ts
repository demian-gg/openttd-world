/**
 * Sprite loading and management.
 *
 * Rendering uses `CanvasRenderingContext2D.drawImage()` for all sprite
 * blitting. We do not use Bresenham or pixel-by-pixel drawing, Canvas handles
 * raster placement.
 *
 * ## Recommended Sprite Sizes
 *
 * Use power-of-two dimensions for optimal texture handling:
 * 8×8, 16×16, 32×32, 64×64, 128×128
 *
 * Keep all sprites in a single atlas when possible to minimize draw calls.
 * Atlas dimensions should also be power-of-two (256×256, 512×512, 1024×1024).
 */

import type { RenderContext } from "./canvas";

export type { RenderContext };

/**
 * Configuration for loading a sprite atlas.
 * Defines the source image and tile dimensions.
 */
export interface SpriteAtlasConfig {
  /** Path or URL to the sprite atlas image file. */
  src: string;

  /** Width of each tile in the atlas, in pixels. */
  tileWidth: number;

  /** Height of each tile in the atlas, in pixels. */
  tileHeight: number;
}

/** Represents a loaded sprite image ready for rendering. */
export interface Sprite {
  /** The loaded image element. */
  image: HTMLImageElement;

  /** Width of the sprite in pixels. */
  width: number;

  /** Height of the sprite in pixels. */
  height: number;
}

/** Represents a region within a sprite atlas. */
export interface SpriteRegion {
  /** X offset in the atlas, in pixels. */
  x: number;

  /** Y offset in the atlas, in pixels. */
  y: number;

  /** Width of the region in pixels. */
  width: number;

  /** Height of the region in pixels. */
  height: number;
}

/** Cache of loaded sprites keyed by source path. */
const spriteCache = new Map<string, Sprite>();

/**
 * Load a sprite image from the specified source path.
 * Returns cached sprite if already loaded.
 *
 * @param src - Path or URL to the sprite image file.
 * @returns Promise resolving to the loaded sprite.
 */
export async function loadSprite(src: string): Promise<Sprite> {
  // Return cached sprite if available.
  const cached = spriteCache.get(src);
  if (cached) {
    return cached;
  }

  // Create image element.
  const image = new Image();

  // Load image and wait for completion.
  const sprite = await new Promise<Sprite>((resolve, reject) => {
    // Handle successful load.
    image.onload = () => {
      const loaded: Sprite = {
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

      // Cache the loaded sprite.
      spriteCache.set(src, loaded);

      resolve(loaded);
    };

    // Handle load failure.
    image.onerror = () => {
      reject(new Error(`Failed to load sprite: ${src}`));
    };

    // Start loading.
    image.src = src;
  });

  return sprite;
}

/**
 * Load multiple sprites in parallel.
 *
 * @param sources - Array of paths or URLs to sprite image files.
 * @returns Promise resolving to array of loaded sprites.
 */
export async function loadSprites(sources: string[]): Promise<Sprite[]> {
  // Load all sprites concurrently.
  return Promise.all(sources.map(loadSprite));
}

/**
 * Draw a sprite to the canvas at the specified position.
 * Destination size is rounded to integers for crisp pixel art.
 *
 * @param ctx - The 2D rendering context (main or offscreen).
 * @param sprite - The sprite to draw.
 * @param x - X position in game pixels.
 * @param y - Y position in game pixels.
 * @param scale - Optional scale factor (default 1).
 */
export function drawSprite(
  ctx: RenderContext,
  sprite: Sprite,
  x: number,
  y: number,
  scale = 1
): void {
  // Round destination size to integers for crisp pixels.
  const w = Math.round(sprite.width * scale);
  const h = Math.round(sprite.height * scale);

  // Draw entire sprite at position, scaled.
  ctx.drawImage(sprite.image, x, y, w, h);
}

/**
 * Draw a region of a sprite atlas to the canvas.
 * Destination size is rounded to integers for crisp pixel art.
 *
 * @param ctx - The 2D rendering context (main or offscreen).
 * @param sprite - The sprite atlas to draw from.
 * @param region - The region within the atlas to draw.
 * @param x - X position in game pixels.
 * @param y - Y position in game pixels.
 * @param scale - Optional scale factor (default 1).
 */
export function drawSpriteRegion(
  ctx: RenderContext,
  sprite: Sprite,
  region: SpriteRegion,
  x: number,
  y: number,
  scale = 1
): void {
  // Round destination size to integers for crisp pixels.
  const w = Math.round(region.width * scale);
  const h = Math.round(region.height * scale);

  // Draw specified region at position, scaled.
  ctx.drawImage(
    sprite.image,
    region.x,
    region.y,
    region.width,
    region.height,
    x,
    y,
    w,
    h
  );
}

/**
 * Clear the sprite cache, releasing all loaded images.
 * Use when unloading a level or scene to free memory.
 */
export function clearSpriteCache(): void {
  // Clear all cached sprites.
  spriteCache.clear();
}
