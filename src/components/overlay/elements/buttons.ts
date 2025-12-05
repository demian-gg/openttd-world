/**
 * Buttons overlay element.
 * Renders buttons from a sprite atlas.
 */

import {
  loadSprite,
  drawAtlasSprite,
  Sprite,
  RenderContext,
} from "../../../engine/sprites";
import { getOverlayStore } from "../../../stores/overlay";

/** Button types available in the atlas. */
export type ButtonType = "save" | "pan-mode" | "select-mode";

/** Button states. */
export type ButtonState = "idle" | "clicked";

/** Sprite atlas instance. */
let atlas: Sprite | null = null;

/** Size of each button tile in the atlas. */
const TILE_SIZE = 32;

/** Atlas layout: maps button type to row index (1-based). */
const BUTTON_ROWS: Record<ButtonType, number> = {
  save: 1,
  "pan-mode": 2,
  "select-mode": 3,
};

/** Atlas layout: maps button state to column index (1-based). */
const STATE_COLUMNS: Record<ButtonState, number> = {
  idle: 1,
  clicked: 2,
};

/**
 * Load the buttons sprite atlas.
 */
export async function loadButtons(): Promise<void> {
  atlas = await loadSprite("/sprites/buttons.png");
}

/**
 * Get button dimensions.
 *
 * @param scale - Scale factor to apply.
 */
export function getButtonSize(scale = 1.5): { width: number; height: number } {
  return {
    width: TILE_SIZE * scale,
    height: TILE_SIZE * scale,
  };
}

/**
 * Render a button at a position.
 *
 * @param ctx - The rendering context.
 * @param type - The button type.
 * @param state - The button state.
 * @param x - X position.
 * @param y - Y position.
 * @param scale - Optional scale factor.
 */
export function renderButton(
  ctx: RenderContext,
  type: ButtonType,
  state: ButtonState,
  x: number,
  y: number,
  scale = 1.5
): void {
  if (!atlas) return;

  const col = STATE_COLUMNS[state];
  const row = BUTTON_ROWS[type];

  drawAtlasSprite(
    ctx,
    atlas,
    {
      x: (col - 1) * TILE_SIZE,
      y: (row - 1) * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
    x,
    y,
    scale
  );
}

/**
 * Render the mode toggle button at a position.
 * Shows pan-mode or select-mode based on current interaction mode.
 *
 * @param ctx - The rendering context.
 * @param x - X position.
 * @param y - Y position.
 * @param scale - Optional scale factor.
 */
export function renderModeToggle(
  ctx: RenderContext,
  x: number,
  y: number,
  scale = 1.5
): void {
  const interactionMode = getOverlayStore().getInteractionMode();
  const type: ButtonType =
    interactionMode === "pan" ? "pan-mode" : "select-mode";
  renderButton(ctx, type, "idle", x, y, scale);
}
