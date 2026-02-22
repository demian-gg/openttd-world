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

/** A type representing a loaded sprite image ready for rendering. */
export type Sprite = {
  /** The loaded image element. */
  image: HTMLImageElement;

  /** The width of the sprite in pixels. */
  width: number;

  /** The height of the sprite in pixels. */
  height: number;
};

/** A type representing a region within a sprite atlas. */
export type SpriteRegion = {
  /** The X offset in the atlas, in pixels. */
  x: number;

  /** The Y offset in the atlas, in pixels. */
  y: number;

  /** The width of the region in pixels. */
  width: number;

  /** The height of the region in pixels. */
  height: number;
};

/** The cache of loaded sprites keyed by source path. */
const spriteCache = new Map<string, Sprite>();

/** The temporary recoloring canvas for sprite colorization. */
let recolorCanvas: OffscreenCanvas | null = null;

/** The temporary recoloring canvas context. */
let recolorContext: OffscreenCanvasRenderingContext2D | null = null;

/**
 * Gets or creates the temporary recoloring canvas.
 *
 * Resizes if needed to fit the sprite.
 *
 * @param width - Minimum width needed.
 * @param height - Minimum height needed.
 *
 * @returns The temporary recoloring canvas context.
 */
export function getRecolorCanvas(
  width: number,
  height: number
): OffscreenCanvasRenderingContext2D {
  if (!recolorCanvas || !recolorContext) {
    recolorCanvas = new OffscreenCanvas(width, height);
    recolorContext = recolorCanvas.getContext("2d")!;
    recolorContext.imageSmoothingEnabled = false;
  }

  // Resize if needed.
  if (recolorCanvas.width < width || recolorCanvas.height < height) {
    recolorCanvas.width = Math.max(recolorCanvas.width, width);
    recolorCanvas.height = Math.max(recolorCanvas.height, height);
    recolorContext.imageSmoothingEnabled = false;
  }

  return recolorContext;
}

/**
 * Applies a color tint to a region of the temporary recoloring canvas.
 *
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
  if (!recolorContext) return;

  // Apply color using source-in composite mode.
  recolorContext.globalCompositeOperation = "source-in";
  recolorContext.fillStyle = color;
  recolorContext.fillRect(0, 0, width, height);
  recolorContext.globalCompositeOperation = "source-over";
}

/**
 * Draws from the temporary recoloring canvas to a destination context.
 *
 * @param context - The destination rendering context.
 * @param srcWidth - Source width in recoloring canvas.
 * @param srcHeight - Source height in recoloring canvas.
 * @param destX - Destination X position.
 * @param destY - Destination Y position.
 * @param destWidth - Destination width.
 * @param destHeight - Destination height.
 */
export function drawFromRecolorCanvas(
  context: RenderContext,
  srcWidth: number,
  srcHeight: number,
  destX: number,
  destY: number,
  destWidth: number,
  destHeight: number
): void {
  if (!recolorCanvas) return;

  // Draw the recolored content to destination.
  context.drawImage(
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

/**
 * Loads a sprite image from the specified source path.
 *
 * Returns cached sprite if already loaded.
 *
 * @param src - Path or URL to the sprite image file.
 *
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
 * Draws a sprite to the canvas at the specified position.
 *
 * Destination size is rounded to integers for crisp pixel art.
 *
 * @param context - The 2D rendering context (main or offscreen).
 * @param sprite - The sprite to draw.
 * @param x - X position in game pixels.
 * @param y - Y position in game pixels.
 * @param scale - Optional scale factor (default 1).
 * @param color - Optional color tint to apply.
 */
export function drawSprite(
  context: RenderContext,
  sprite: Sprite,
  x: number,
  y: number,
  scale = 1,
  color?: string
): void {
  // Round position and size to integers for crisp pixels.
  const pixelX = Math.round(x);
  const pixelY = Math.round(y);
  const scaledWidth = Math.round(sprite.width * scale);
  const scaledHeight = Math.round(sprite.height * scale);

  // If no color, draw directly.
  if (!color) {
    context.drawImage(sprite.image, pixelX, pixelY, scaledWidth, scaledHeight);
    return;
  }

  // Draw to recoloring canvas, apply color, then draw to destination.
  const recolor = getRecolorCanvas(sprite.width, sprite.height);
  recolor.clearRect(0, 0, sprite.width, sprite.height);
  recolor.drawImage(sprite.image, 0, 0);
  applyColorTint(sprite.width, sprite.height, color);
  drawFromRecolorCanvas(context, sprite.width, sprite.height, pixelX, pixelY, scaledWidth, scaledHeight);
}

/**
 * Draws a region of a sprite atlas to the canvas.
 *
 * Destination size is rounded to integers for crisp pixel art.
 *
 * @param context - The 2D rendering context (main or offscreen).
 * @param sprite - The sprite atlas to draw from.
 * @param region - The region within the atlas to draw.
 * @param x - X position in game pixels.
 * @param y - Y position in game pixels.
 * @param scale - Optional scale factor (default 1).
 * @param color - Optional color tint to apply.
 */
export function drawAtlasSprite(
  context: RenderContext,
  sprite: Sprite,
  region: SpriteRegion,
  x: number,
  y: number,
  scale = 1,
  color?: string
): void {
  // Round position and size to integers for crisp pixels.
  const pixelX = Math.round(x);
  const pixelY = Math.round(y);
  const scaledWidth = Math.round(region.width * scale);
  const scaledHeight = Math.round(region.height * scale);

  // If no color, draw directly.
  if (!color) {
    context.drawImage(
      sprite.image,
      region.x,
      region.y,
      region.width,
      region.height,
      pixelX,
      pixelY,
      scaledWidth,
      scaledHeight
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
  drawFromRecolorCanvas(context, region.width, region.height, pixelX, pixelY, scaledWidth, scaledHeight);
}

