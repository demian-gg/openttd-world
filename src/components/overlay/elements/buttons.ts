/**
 * Buttons overlay element.
 */

import {
  loadSprite,
  drawAtlasSprite,
  Sprite,
  RenderContext,
} from "../../../engine/sprites";
import { defineElement } from "../../../engine/elements";
import { registerPointerArea } from "../../../engine/pointer";
import { dirtyLayer } from "../../../engine/layers";
import { getOverlayStore } from "../../../stores/overlay";

/** Button types available in the atlas. */
export type ButtonType = "save" | "pan-mode" | "select-mode";

/** Props for the buttons element. */
export interface ButtonsProps {
  x: number;
  y: number;
  layer: number;
  spacing?: number;
}

/** Size of each button tile in the atlas. */
const TILE_SIZE = 48;

/** Atlas layout: maps button type to row index (0-based). */
const BUTTON_ROWS: Record<ButtonType, number> = {
  save: 0,
  "pan-mode": 1,
  "select-mode": 2,
};

/** Sprite atlas instance. */
let atlas: Sprite | null = null;

/** Current state of each button. */
const buttonStates: Record<ButtonType, "idle" | "clicked"> = {
  save: "idle",
  "pan-mode": "idle",
  "select-mode": "idle",
};

/** Get the button type to show for mode toggle (shows current mode). */
function getModeToggleType(): ButtonType {
  // Show the current mode - the button acts as a status indicator.
  return getOverlayStore().getInteractionMode() === "pan"
    ? "pan-mode"
    : "select-mode";
}

/** Register a button's pointer area. */
function registerButton(
  type: ButtonType,
  x: number,
  y: number,
  layer: number,
  onClick?: () => void
): void {
  registerPointerArea({
    x,
    y,
    width: TILE_SIZE,
    height: TILE_SIZE,
    layer,
    cursor: "pointer",
    onPress: () => {
      buttonStates[type] = "clicked";
      dirtyLayer(layer);
    },
    onRelease: () => {
      buttonStates[type] = "idle";
      dirtyLayer(layer);
    },
    onClick: () => {
      onClick?.();
    },
  });
}

/** Render a single button. */
function renderSingleButton(
  ctx: RenderContext,
  type: ButtonType,
  x: number,
  y: number
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
    y
  );
}

/**
 * Buttons element definition.
 */
export const Buttons = defineElement<ButtonsProps>({
  async load() {
    atlas = await loadSprite("/sprites/buttons.png");
  },

  update(props) {
    const spacing = props.spacing ?? 8;
    const store = getOverlayStore();

    // Register mode toggle button.
    registerButton(getModeToggleType(), props.x, props.y, props.layer, () =>
      store.toggleInteractionMode()
    );

    // Register save button.
    registerButton("save", props.x + TILE_SIZE + spacing, props.y, props.layer);
  },

  render(ctx: RenderContext, props) {
    if (!atlas) return;
    const spacing = props.spacing ?? 10;

    // Render mode toggle button.
    renderSingleButton(ctx, getModeToggleType(), props.x, props.y);

    // Render save button.
    renderSingleButton(ctx, "save", props.x + TILE_SIZE + spacing, props.y);
  },

  getSize() {
    const spacing = 8;
    return {
      width: TILE_SIZE * 2 + spacing,
      height: TILE_SIZE,
    };
  },
});
