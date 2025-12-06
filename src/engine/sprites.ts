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
 * Atlas dimensions should also be power-of-two:
 * 256×256, 512×512, 1024×1024
 */

import type { RenderContext } from "./canvas";

export type { RenderContext };

/** Temporary recoloring canvas for sprite colorization. */
let recolorCanvas: OffscreenCanvas | null = null;
let recolorCtx: OffscreenCanvasRenderingContext2D | null = null;

/**
 * Get or create the temporary recoloring canvas.
 * Resizes if needed to fit the sprite.
 *
 * @param width - Minimum width needed.
 * @param height - Minimum height needed.
 * @returns The temporary recoloring canvas context.
 */
export function getRecolorCanvas(
  width: number,
  height: number
): OffscreenCanvasRenderingContext2D {
  if (!recolorCanvas || !recolorCtx) {
    recolorCanvas = new OffscreenCanvas(width, height);
    recolorCtx = recolorCanvas.getContext("2d")!;
    recolorCtx.imageSmoothingEnabled = false;
  }

  // Resize if needed.
  if (recolorCanvas.width < width || recolorCanvas.height < height) {
    recolorCanvas.width = Math.max(recolorCanvas.width, width);
    recolorCanvas.height = Math.max(recolorCanvas.height, height);
    recolorCtx.imageSmoothingEnabled = false;
  }

  return recolorCtx;
}

/**
 * Apply a color tint to a region of the temporary recoloring canvas.
 * Uses source-in composite to replace color while keeping alpha.
 *
 * @param width - Width of the region.
 * @param height - Height of the region.
 * @param color - The color to apply.
 */
export function applyColorTint(
  width: number,
  height: number,
  color: string
): void {
  if (!recolorCtx) return;
  recolorCtx.globalCompositeOperation = "source-in";
  recolorCtx.fillStyle = color;
  recolorCtx.fillRect(0, 0, width, height);
  recolorCtx.globalCompositeOperation = "source-over";
}

/**
 * Draw from the temporary recoloring canvas to a destination context.
 *
 * @param ctx - The destination rendering context.
 * @param srcWidth - Source width in recoloring canvas.
 * @param srcHeight - Source height in recoloring canvas.
 * @param destX - Destination X position.
 * @param destY - Destination Y position.
 * @param destWidth - Destination width.
 * @param destHeight - Destination height.
 */
export function drawFromRecolorCanvas(
  ctx: RenderContext,
  srcWidth: number,
  srcHeight: number,
  destX: number,
  destY: number,
  destWidth: number,
  destHeight: number
): void {
  if (!recolorCanvas) return;
  ctx.drawImage(
    recolorCanvas,
    0,
    0,
    srcWidth,
    srcHeight,
    destX,
    destY,
    destWidth,
    destHeight
  );
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
 * @param color - Optional color tint to apply.
 */
export function drawSprite(
  ctx: RenderContext,
  sprite: Sprite,
  x: number,
  y: number,
  scale = 1,
  color?: string
): void {
  // Round position and size to integers for crisp pixels.
  const px = Math.round(x);
  const py = Math.round(y);
  const w = Math.round(sprite.width * scale);
  const h = Math.round(sprite.height * scale);

  // If no color, draw directly.
  if (!color) {
    ctx.drawImage(sprite.image, px, py, w, h);
    return;
  }

  // Draw to recoloring canvas, apply color, then draw to destination.
  const recolor = getRecolorCanvas(sprite.width, sprite.height);
  recolor.clearRect(0, 0, sprite.width, sprite.height);
  recolor.drawImage(sprite.image, 0, 0);
  applyColorTint(sprite.width, sprite.height, color);
  drawFromRecolorCanvas(ctx, sprite.width, sprite.height, px, py, w, h);
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
 * @param color - Optional color tint to apply.
 */
export function drawAtlasSprite(
  ctx: RenderContext,
  sprite: Sprite,
  region: SpriteRegion,
  x: number,
  y: number,
  scale = 1,
  color?: string
): void {
  // Round position and size to integers for crisp pixels.
  const px = Math.round(x);
  const py = Math.round(y);
  const w = Math.round(region.width * scale);
  const h = Math.round(region.height * scale);

  // If no color, draw directly.
  if (!color) {
    ctx.drawImage(
      sprite.image,
      region.x,
      region.y,
      region.width,
      region.height,
      px,
      py,
      w,
      h
    );
    return;
  }

  // Draw to recoloring canvas, apply color, then draw to destination.
  const recolor = getRecolorCanvas(region.width, region.height);
  recolor.clearRect(0, 0, region.width, region.height);
  recolor.drawImage(
    sprite.image,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    region.width,
    region.height
  );
  applyColorTint(region.width, region.height, color);
  drawFromRecolorCanvas(ctx, region.width, region.height, px, py, w, h);
}

/**
 * Clear the sprite cache, releasing all loaded images.
 * Use when unloading a level or scene to free memory.
 */
export function clearSpriteCache(): void {
  // Clear all cached sprites.
  spriteCache.clear();
}
