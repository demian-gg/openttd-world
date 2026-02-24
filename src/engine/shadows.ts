/**
 * Shadow rendering utility for per-element drop shadows.
 *
 * Renders individual elements onto a small offscreen canvas, then composites
 * them back with shadow settings applied. This avoids applying blur to the
 * entire viewport-sized layer canvas, keeping compositing fast.
 */

import type { RenderContext } from "./canvas";

/** A type representing shadow rendering configuration. */
export type ShadowConfig = {
  /** The shadow color. */
  color: string;

  /** The shadow blur radius for the soft pass. */
  blur: number;

  /** The shadow X offset in pixels. */
  offsetX: number;

  /** The shadow Y offset in pixels. */
  offsetY: number;

  /** The padding around elements on the shadow canvas. */
  padding: number;
};

let shadowCanvas: OffscreenCanvas | null = null;
let shadowContext: OffscreenCanvasRenderingContext2D | null = null;

/**
 * Ensures the shadow canvas exists and is large enough.
 *
 * Creates the canvas on first call, then grows it if a larger element is
 * encountered. The canvas never shrinks, so subsequent smaller elements
 * reuse the existing allocation.
 *
 * @note Grow-only strategy avoids repeated allocation for varying element
 * sizes within a single frame.
 *
 * @param width - The minimum required canvas width.
 * @param height - The minimum required canvas height.
 */
function ensureShadowCanvas(width: number, height: number): void {
  // Create the canvas on first use.
  if (!shadowCanvas || !shadowContext) {
    shadowCanvas = new OffscreenCanvas(width, height);
    const context = shadowCanvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get 2D context for shadow canvas.");
    }
    context.imageSmoothingEnabled = false;
    shadowContext = context;
    return;
  }

  // Grow to accommodate larger elements.
  if (shadowCanvas.width < width || shadowCanvas.height < height) {
    shadowCanvas.width = Math.max(shadowCanvas.width, width);
    shadowCanvas.height = Math.max(shadowCanvas.height, height);
    shadowContext.imageSmoothingEnabled = false;
  }
}

/**
 * Renders an element with a drop shadow using a shared offscreen canvas.
 *
 * The element is drawn onto a small offscreen canvas via the callback, then
 * composited onto the destination context with shadow settings applied. This
 * keeps per-element shadow blur cheap regardless of viewport size.
 *
 * @note Callers draw at `(config.padding, config.padding)` inside the
 * callback so the shadow has room to extend in all directions.
 *
 * @param context - The destination rendering context.
 * @param x - The element X position on the destination.
 * @param y - The element Y position on the destination.
 * @param width - The element width in pixels.
 * @param height - The element height in pixels.
 * @param config - The shadow rendering configuration.
 * @param renderContent - Callback that renders the element onto the shadow
 * canvas context.
 */
export function renderWithShadow(
  context: RenderContext,
  x: number,
  y: number,
  width: number,
  height: number,
  config: ShadowConfig,
  renderContent: (shadowContext: OffscreenCanvasRenderingContext2D) => void
): void {
  // Calculate the required shadow canvas size.
  const canvasWidth = width + config.padding * 2;
  const canvasHeight = height + config.padding * 2;

  // Ensure the shared canvas is large enough.
  ensureShadowCanvas(canvasWidth, canvasHeight);

  // Clear only the region used by this element.
  shadowContext!.clearRect(0, 0, canvasWidth, canvasHeight);

  // Render the element content onto the shadow canvas.
  renderContent(shadowContext!);

  // Draw the hard pass (no blur) and soft pass (with blur) in sequence.
  for (const blur of [0, config.blur]) {
    context.save();
    context.shadowColor = config.color;
    context.shadowBlur = blur;
    context.shadowOffsetX = config.offsetX;
    context.shadowOffsetY = config.offsetY;
    context.drawImage(
      shadowCanvas!,
      0,
      0,
      canvasWidth,
      canvasHeight,
      x - config.padding,
      y - config.padding,
      canvasWidth,
      canvasHeight
    );
    context.restore();
  }
}
