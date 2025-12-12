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
import { getSelectionStore } from "../../../stores/selection";

/** Button types available in the atlas. */
export type ButtonType =
  | "save-disallowed"
  | "save-allowed"
  | "pan-mode"
  | "select-mode";

/** A type representing props for the buttons element. */
export type ButtonsProps = {
  /** The X position in pixels. */
  x: number;

  /** The Y position in pixels. */
  y: number;

  /** The layer for rendering. */
  layer: number;

  /** The optional spacing between buttons. */
  spacing?: number;
};

/** The size of each button tile in the atlas. */
const TILE_SIZE = 48;

/** The atlas layout: maps button type to row index (0-based). */
const BUTTON_ROWS: Record<ButtonType, number> = {
  "save-disallowed": 0,
  "save-allowed": 1,
  "pan-mode": 2,
  "select-mode": 3,
};

/** The sprite atlas instance. */
let atlas: Sprite | null = null;

/** The current state of each button. */
const buttonStates: Record<ButtonType, "idle" | "clicked"> = {
  "save-disallowed": "idle",
  "save-allowed": "idle",
  "pan-mode": "idle",
  "select-mode": "idle",
};

/** Gets the button type to show for mode toggle (shows current mode). */
function getModeToggleType(): ButtonType {
  // Show the current mode - the button acts as a status indicator.
  return getOverlayStore().getInteractionMode() === "pan"
    ? "pan-mode"
    : "select-mode";
}

/** Gets the save button type based on selection state. */
function getSaveButtonType(): ButtonType {
  const bounds = getSelectionStore().getBounds();
  return bounds !== null ? "save-allowed" : "save-disallowed";
}

/** Registers a button's pointer area. */
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

/** Renders a single button. */
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
    atlas = await loadSprite("/sprites/buttons@48px.png");
  },

  update(props) {
    const spacing = props.spacing ?? 8;
    const store = getOverlayStore();

    // Register mode toggle button.
    registerButton(getModeToggleType(), props.x, props.y, props.layer, () =>
      store.toggleInteractionMode()
    );

    // Register save button.
    registerButton(
      getSaveButtonType(),
      props.x + TILE_SIZE + spacing,
      props.y,
      props.layer
    );
  },

  render(ctx: RenderContext, props) {
    if (!atlas) return;
    const spacing = props.spacing ?? 10;

    // Render mode toggle button.
    renderSingleButton(ctx, getModeToggleType(), props.x, props.y);

    // Render save button.
    renderSingleButton(
      ctx,
      getSaveButtonType(),
      props.x + TILE_SIZE + spacing,
      props.y
    );
  },

  getSize() {
    const spacing = 8;
    return {
      width: TILE_SIZE * 2 + spacing,
      height: TILE_SIZE,
    };
  },
});
