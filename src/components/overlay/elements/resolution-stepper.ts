/**
 * Resolution stepper overlay element.
 * Renders a resolution icon with resolution text.
 */

import {
  loadSprite,
  drawSprite,
  Sprite,
  RenderContext,
} from "../../../engine/sprites";
import {
  BitmapFont,
  loadFont,
  drawText,
  measureText,
} from "../../../engine/text";

/** Icon sprite instance. */
let icon: Sprite | null = null;

/** Font instance. */
let font: BitmapFont | null = null;

/** Current resolution value. */
let resolution = "512x512";

/**
 * Load the icon and font for the resolution stepper.
 */
export async function loadResolutionStepper(): Promise<void> {
  [icon, font] = await Promise.all([
    loadSprite("/sprites/resolution-icon.png"),
    loadFont("/sprites/font.png", 16, 16, 16, 32, -7),
  ]);
}

/**
 * Set the resolution value to display.
 *
 * @param value - The resolution string (e.g., "512x512").
 */
export function setResolution(value: string): void {
  resolution = value;
}

/**
 * Get the resolution stepper dimensions at a given scale.
 *
 * @param scale - The text scale.
 */
export function getResolutionStepperSize(scale = 1.125): {
  width: number;
  height: number;
} {
  if (!icon || !font) return { width: 0, height: 0 };
  const textWidth = measureText(font, resolution, scale);
  const iconWidth = icon.width;
  const gap = 12;
  return {
    width: iconWidth + gap + textWidth,
    height: Math.max(icon.height, font.charHeight * scale),
  };
}

/**
 * Render the resolution stepper at a position.
 *
 * @param ctx - The rendering context.
 * @param x - X position.
 * @param y - Y position.
 * @param scale - Optional text scale factor.
 * @param color - Optional color for icon and text.
 */
export function renderResolutionStepper(
  ctx: RenderContext,
  x: number,
  y: number,
  scale = 1.25,
  color = "white"
): void {
  if (!icon || !font) return;

  // Draw the resolution icon.
  drawSprite(ctx, icon, x, y, 1, color);

  // Draw the resolution text to the right of the icon.
  const textX = x + icon.width + 4;
  drawText(ctx, font, resolution, textX, y, scale, color);
}
