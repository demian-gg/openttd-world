/**
 * Buttons overlay element.
 * Renders interactive buttons from a sprite atlas.
 */

import {
  loadSprite,
  drawAtlasSprite,
  Sprite,
  RenderContext,
} from "../../../engine/sprites";
import { registerPointerArea } from "../../../engine/pointer";
import { dirtyLayer } from "../../../engine/layers";
import { getOverlayStore } from "../../../stores/overlay";

/** Button types available in the atlas. */
export type ButtonType = "save" | "pan-mode" | "select-mode";

/** Button states. */
type ButtonState = "idle" | "clicked";

/** Size of each button tile in the atlas. */
const TILE_SIZE = 32;

/** Atlas layout: maps button type to row index (0-based). */
const BUTTON_ROWS: Record<ButtonType, number> = {
  save: 0,
  "pan-mode": 1,
  "select-mode": 2,
};

/** Sprite atlas instance. */
let atlas: Sprite | null = null;

/** Current state of each button. */
const buttonStates: Record<ButtonType, ButtonState> = {
  save: "idle",
  "pan-mode": "idle",
  "select-mode": "idle",
};

/**
 * Load the buttons sprite atlas.
 */
export async function loadButtons(): Promise<void> {
  atlas = await loadSprite("/sprites/buttons.png");
}

/**
 * Get button dimensions.
 */
export function getButtonSize(scale = 1.5): { width: number; height: number } {
  return { width: TILE_SIZE * scale, height: TILE_SIZE * scale };
}

/**
 * Get the current button type for mode toggle based on interaction mode.
 */
function getModeToggleType(): ButtonType {
  return getOverlayStore().getInteractionMode() === "pan"
    ? "pan-mode"
    : "select-mode";
}

/**
 * Register a button's pointer area for press/release detection.
 */
export function registerButtonPointerArea(
  type: ButtonType,
  x: number,
  y: number,
  layer: number,
  scale = 1.5
): void {
  const { width, height } = getButtonSize(scale);
  registerPointerArea({
    x,
    y,
    width,
    height,
    layer,
    onPress: () => {
      buttonStates[type] = "clicked";
      dirtyLayer(layer);
    },
    onRelease: () => {
      buttonStates[type] = "idle";
      dirtyLayer(layer);
    },
  });
}

/**
 * Register the mode toggle button's pointer area.
 */
export function registerModeTogglePointerArea(
  x: number,
  y: number,
  layer: number,
  scale = 1.5
): void {
  registerButtonPointerArea(getModeToggleType(), x, y, layer, scale);
}

/**
 * Render a button at a position.
 */
export function renderButton(
  ctx: RenderContext,
  type: ButtonType,
  x: number,
  y: number,
  scale = 1.5
): void {
  if (!atlas) return;

  const row = BUTTON_ROWS[type];
  const col = buttonStates[type] === "idle" ? 0 : 1;

  drawAtlasSprite(
    ctx,
    atlas,
    {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
    x,
    y,
    scale
  );
}

/**
 * Render the mode toggle button based on current interaction mode.
 */
export function renderModeToggle(
  ctx: RenderContext,
  x: number,
  y: number,
  scale = 1.5
): void {
  renderButton(ctx, getModeToggleType(), x, y, scale);
}
