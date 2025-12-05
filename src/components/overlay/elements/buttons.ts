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
  scale?: number;
  spacing?: number;
}

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
const buttonStates: Record<ButtonType, "idle" | "clicked"> = {
  save: "idle",
  "pan-mode": "idle",
  "select-mode": "idle",
};

/** Get the button type to show for mode toggle (shows what clicking will do). */
function getModeToggleType(): ButtonType {
  // Show the opposite mode - clicking will switch to it.
  return getOverlayStore().getInteractionMode() === "pan"
    ? "select-mode"
    : "pan-mode";
}

/** Register a button's pointer area. */
function registerButton(
  type: ButtonType,
  x: number,
  y: number,
  layer: number,
  scale: number,
  onClick?: () => void
): void {
  const size = TILE_SIZE * scale;
  registerPointerArea({
    x,
    y,
    width: size,
    height: size,
    layer,
    cursor: "pointer",
    onPress: () => {
      buttonStates[type] = "clicked";
      dirtyLayer(layer);
    },
    onRelease: () => {
      buttonStates[type] = "idle";
      dirtyLayer(layer);
      onClick?.();
    },
  });
}

/** Render a single button. */
function renderSingleButton(
  ctx: RenderContext,
  type: ButtonType,
  x: number,
  y: number,
  scale: number
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
 * Buttons element definition.
 */
export const Buttons = defineElement<ButtonsProps>("buttons", {
  async load() {
    atlas = await loadSprite("/sprites/buttons.png");
  },

  update(props) {
    const scale = props.scale ?? 1.5;
    const spacing = props.spacing ?? 8;
    const buttonSize = TILE_SIZE * scale;
    const store = getOverlayStore();

    // Register mode toggle button.
    registerButton(
      getModeToggleType(),
      props.x,
      props.y,
      props.layer,
      scale,
      () => store.toggleInteractionMode()
    );

    // Register save button.
    registerButton(
      "save",
      props.x + buttonSize + spacing,
      props.y,
      props.layer,
      scale
    );
  },

  render(ctx: RenderContext, props) {
    if (!atlas) return;
    const scale = props.scale ?? 1.5;
    const spacing = props.spacing ?? 10;
    const buttonSize = TILE_SIZE * scale;

    // Render mode toggle button.
    renderSingleButton(ctx, getModeToggleType(), props.x, props.y, scale);

    // Render save button.
    renderSingleButton(
      ctx,
      "save",
      props.x + buttonSize + spacing,
      props.y,
      scale
    );
  },

  getSize() {
    const scale = 1.5;
    const spacing = 8;
    return {
      width: TILE_SIZE * scale * 2 + spacing,
      height: TILE_SIZE * scale,
    };
  },
});
