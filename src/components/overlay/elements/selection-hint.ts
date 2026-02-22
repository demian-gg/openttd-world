/**
 * Selection hint overlay element.
 * Displays a hint message when in select mode with no selection.
 */

import { RenderContext } from "../../../engine/canvas";
import {
  BitmapFont,
  loadFont,
  drawText,
  measureText,
} from "../../../engine/text";
import { defineElement } from "../../../engine/elements";
import { getEngineState } from "../../../engine/engine";
import { isSmall } from "../../../engine/utils";
import { getOverlayStore } from "../../../stores/overlay";
import { getSelectionStore } from "../../../stores/selection";

/** A type representing props for the selection hint element. */
export type SelectionHintProps = {
  /** The optional scale factor. */
  scale?: number;

  /** The optional text color. */
  color?: string;
};

/** The hint text to display. */
const HINT_TEXT = "Click and drag to select an area";

/** The font instance. */
let font: BitmapFont | null = null;

/** Checks if the hint should be visible. */
function shouldShow(): boolean {
  const mode = getOverlayStore().getInteractionMode();
  const bounds = getSelectionStore().getBounds();
  return mode === "select" && bounds === null;
}

/**
 * Selection hint element definition.
 */
export const SelectionHint = defineElement<SelectionHintProps>({
  async load() {
    font = await loadFont("/sprites/font@16px.png", 16, 16, 16, 32, -7);
  },

  render(ctx: RenderContext, props) {
    if (!font || !shouldShow()) return;

    const { resolution } = getEngineState();
    const isMobile = isSmall();
    const scale = props.scale ?? (isMobile ? 1.25 : 1.5);
    const color = props.color ?? "rgba(255, 255, 255, 0.7)";

    // Calculate centered position at bottom of screen.
    const textWidth = measureText(font, HINT_TEXT, scale);
    const x = (resolution.width - textWidth) / 2;
    const y = resolution.height - 120;

    drawText(ctx, font, HINT_TEXT, x, y, scale, color);
  },

  getSize() {
    if (!font) return { width: 0, height: 0 };
    const scale = 1;
    return {
      width: measureText(font, HINT_TEXT, scale),
      height: font.charHeight * scale,
    };
  },
});
