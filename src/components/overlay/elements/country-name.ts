/**
 * Country name overlay element.
 * Renders the country name text.
 */

import { RenderContext } from "../../../engine/sprites";
import { BitmapFont, loadFont, drawText, measureText } from "../../../engine/text";

/** Font instance. */
let font: BitmapFont | null = null;

/** Current country name. */
let countryName = "The Netherlands";

/**
 * Load the font for the country name.
 */
export async function loadCountryName(): Promise<void> {
  font = await loadFont("/sprites/font.png", 16, 16, 16, 32, -7);
}

/**
 * Set the country name to display.
 *
 * @param name - The country name.
 */
export function setCountryName(name: string): void {
  countryName = name;
}

/**
 * Get the country name dimensions at a given scale.
 *
 * @param scale - The text scale.
 */
export function getCountryNameSize(scale = 1): { width: number; height: number } {
  if (!font) return { width: 0, height: 0 };
  return {
    width: measureText(font, countryName, scale),
    height: font.charHeight * scale,
  };
}

/**
 * Render the country name at a position.
 *
 * @param ctx - The rendering context.
 * @param x - X position.
 * @param y - Y position.
 * @param scale - Optional scale factor.
 * @param color - Optional text color.
 */
export function renderCountryName(
  ctx: RenderContext,
  x: number,
  y: number,
  scale = 1.5,
  color = "white"
): void {
  if (!font) return;
  drawText(ctx, font, countryName, x, y, scale, color);
}
