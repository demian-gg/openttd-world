/**
 * Bitmap font rendering system.
 * Loads fonts as sprite atlases and renders text character by character.
 */

import { RenderContext } from "./canvas";
import {
  getRecolorCanvas,
  applyColorTint,
  drawFromRecolorCanvas,
} from "./sprites";

/**
 * A type representing a loaded bitmap font.
 *
 * The font sprite is a grid of characters in ASCII order (starting from
 * firstChar).
 */
export type BitmapFont = {
  /** The font sprite image. */
  image: HTMLImageElement;

  /** The width of each character cell in pixels. */
  charWidth: number;

  /** The height of each character cell in pixels. */
  charHeight: number;

  /** The number of characters per row in the sprite. */
  charsPerRow: number;

  /** The first ASCII character in the font (usually 32 for space). */
  firstChar: number;

  /** The character spacing adjustment (can be negative for tighter spacing). */
  spacing: number;
};

/**
 * Loads a bitmap font from a sprite atlas.
 *
 * @param path - Path to the font sprite image.
 * @param charWidth - Width of each character cell.
 * @param charHeight - Height of each character cell.
 * @param charsPerRow - Number of characters per row in the sprite.
 * @param firstChar - First ASCII character in the font (default: 32 for space).
 * @param spacing - Character spacing adjustment (default: 0).
 *
 * @returns Promise that resolves to the loaded font.
 */
export async function loadFont(
  path: string,
  charWidth: number,
  charHeight: number,
  charsPerRow: number,
  firstChar = 32,
  spacing = 0
): Promise<BitmapFont> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    // Resolve promise when image is loaded.
    image.onload = () => {
      resolve({
        image,
        charWidth,
        charHeight,
        charsPerRow,
        firstChar,
        spacing,
      });
    };

    // Reject promise on load error.
    image.onerror = () => {
      reject(new Error(`Failed to load font: ${path}`));
    };

    // Set image source to make browser preload the image.
    image.src = path;
  });
}

/**
 * Measures the width of a text string in pixels.
 *
 * @param font - The bitmap font to use.
 * @param text - The text to measure.
 * @param scale - Optional scale factor (default: 1).
 *
 * @returns Width in pixels.
 */
export function measureText(font: BitmapFont, text: string, scale = 1): number {
  if (text.length === 0) return 0;
  const baseWidth =
    text.length * font.charWidth + (text.length - 1) * font.spacing;
  return baseWidth * scale;
}

/**
 * Draws text using a bitmap font.
 *
 * @param ctx - The rendering context.
 * @param font - The bitmap font to use.
 * @param text - The text to draw.
 * @param x - X position (left edge).
 * @param y - Y position (top edge).
 * @param scale - Optional scale factor (default: 1).
 * @param color - Optional color to tint the text (e.g., "#fff" or "white").
 */
export function drawText(
  ctx: RenderContext,
  font: BitmapFont,
  text: string,
  x: number,
  y: number,
  scale = 1,
  color?: string
): void {
  const { charHeight } = font;

  // If no color specified, draw directly.
  if (!color) {
    drawTextDirect(ctx, font, text, x, y, scale);
    return;
  }

  // Calculate text dimensions at base scale (for recoloring canvas).
  const baseWidth = measureText(font, text, 1);
  const baseHeight = charHeight;

  // Get recoloring canvas for colorization.
  const recolor = getRecolorCanvas(baseWidth, baseHeight);

  // Clear the area we'll use.
  recolor.clearRect(0, 0, baseWidth, baseHeight);

  // Draw text to recoloring canvas at origin.
  // No scale, we only scale when drawing to main.
  drawTextDirect(recolor, font, text, 0, 0, 1);

  // Apply color tint.
  applyColorTint(baseWidth, baseHeight, color);

  // Draw colorized text to main context with scaling.
  const destWidth = Math.floor(baseWidth * scale);
  const destHeight = Math.floor(baseHeight * scale);
  drawFromRecolorCanvas(
    ctx,
    baseWidth,
    baseHeight,
    Math.floor(x),
    Math.floor(y),
    destWidth,
    destHeight
  );
}

/**
 * Draws text directly without colorization.
 *
 * Internal helper function.
 *
 * @param ctx - The rendering context.
 * @param font - The bitmap font to use.
 * @param text - The text to draw.
 * @param x - X position (left edge).
 * @param y - Y position (top edge).
 * @param scale - Optional scale factor (default: 1).
 */
function drawTextDirect(
  ctx: RenderContext,
  font: BitmapFont,
  text: string,
  x: number,
  y: number,
  scale = 1
): void {
  const { image, charWidth, charHeight, charsPerRow, firstChar, spacing } =
    font;

  const scaledCharWidth = charWidth * scale;
  const scaledCharHeight = charHeight * scale;
  const scaledSpacing = spacing * scale;

  let cursorX = x;
  for (const char of text) {
    const charCode = char.charCodeAt(0);
    const charIndex = charCode - firstChar;

    // Skip characters not in the font.
    if (charIndex < 0) {
      cursorX += scaledCharWidth + scaledSpacing;
      continue;
    }

    // Calculate source position in the sprite atlas.
    const srcX = (charIndex % charsPerRow) * charWidth;
    const srcY = Math.floor(charIndex / charsPerRow) * charHeight;

    // Draw the character with scaling.
    ctx.drawImage(
      image,
      srcX,
      srcY,
      charWidth,
      charHeight,
      Math.floor(cursorX),
      Math.floor(y),
      Math.floor(scaledCharWidth),
      Math.floor(scaledCharHeight)
    );

    // Add spacing and advance cursor.
    cursorX += scaledCharWidth + scaledSpacing;
  }
}

/**
 * Draws text centered horizontally at a position.
 *
 * @param ctx - The rendering context.
 * @param font - The bitmap font to use.
 * @param text - The text to draw.
 * @param centerX - X position to center on.
 * @param y - Y position (top edge).
 * @param scale - Optional scale factor (default: 1).
 * @param color - Optional color to tint the text.
 */
export function drawTextCentered(
  ctx: RenderContext,
  font: BitmapFont,
  text: string,
  centerX: number,
  y: number,
  scale = 1,
  color?: string
): void {
  const width = measureText(font, text, scale);
  drawText(ctx, font, text, centerX - width / 2, y, scale, color);
}

/**
 * Draws text aligned to the right.
 *
 * @param ctx - The rendering context.
 * @param font - The bitmap font to use.
 * @param text - The text to draw.
 * @param rightX - X position for right edge.
 * @param y - Y position (top edge).
 * @param scale - Optional scale factor (default: 1).
 * @param color - Optional color to tint the text.
 */
export function drawTextRight(
  ctx: RenderContext,
  font: BitmapFont,
  text: string,
  rightX: number,
  y: number,
  scale = 1,
  color?: string
): void {
  const width = measureText(font, text, scale);
  drawText(ctx, font, text, rightX - width, y, scale, color);
}
