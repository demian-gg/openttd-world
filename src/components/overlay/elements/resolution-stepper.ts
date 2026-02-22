/**
 * Resolution stepper overlay element.
 */

import { RenderContext } from "../../../engine/canvas";
import { loadSprite, drawAtlasSprite, Sprite } from "../../../engine/sprites";
import {
  BitmapFont,
  loadFont,
  drawText,
  measureText,
} from "../../../engine/text";
import { defineElement } from "../../../engine/elements";
import { registerPointerArea } from "../../../engine/pointer";
import { dirtyLayer } from "../../../engine/layers";
import { getResolutionStore } from "../../../stores/resolution";

/** A type representing props for the resolution stepper element. */
export type ResolutionStepperProps = {
  /** The X position in pixels. */
  x: number;

  /** The Y position in pixels. */
  y: number;

  /** The layer for rendering. */
  layer: number;

  /** The optional text color. */
  color?: string;
};

/** The tile size in the atlas. */
const TILE_SIZE = 18;

/** The atlas sprite instance. */
let atlas: Sprite | null = null;

/** The font instance. */
let font: BitmapFont | null = null;

/**
 * Resolution stepper element definition.
 */
export const ResolutionStepper = defineElement<ResolutionStepperProps>({
  async load() {
    [atlas, font] = await Promise.all([
      loadSprite("/sprites/resolution-stepper@18px.png"),
      loadFont("/sprites/font@16px.png", 16, 16, 16, 32, -7),
    ]);
  },

  update(props) {
    if (!atlas || !font) return;

    const store = getResolutionStore();
    const resolution = store.getResolution();

    // Calculate stepper icon position.
    const textX = props.x + TILE_SIZE + 4;
    const textWidth = measureText(font, resolution);
    const stepperX = textX + textWidth - 4;

    // Register stepper as single clickable area (cycles through resolutions).
    registerPointerArea({
      x: stepperX,
      y: props.y,
      width: TILE_SIZE,
      height: TILE_SIZE,
      layer: props.layer,
      cursor: "pointer",
      onClick: () => {
        store.stepUp();
        dirtyLayer(props.layer);
      },
    });
  },

  render(ctx: RenderContext, props) {
    if (!atlas || !font) return;
    const color = props.color ?? "white";
    const resolution = getResolutionStore().getResolution();

    // Draw the resolution icon (first tile in atlas).
    drawAtlasSprite(
      ctx,
      atlas,
      { x: 0, y: 0, width: TILE_SIZE, height: TILE_SIZE },
      props.x,
      props.y,
      1,
      color
    );

    // Draw the resolution text to the right of the icon.
    const textX = props.x + TILE_SIZE + 2;
    const textY = props.y + (TILE_SIZE - font.charHeight) / 2;
    drawText(ctx, font, resolution, textX, textY, 1, color);

    // Draw the stepper icon (second tile in atlas) to the right of text.
    const textWidth = measureText(font, resolution);
    const stepperX = textX + textWidth - 4;
    drawAtlasSprite(
      ctx,
      atlas,
      { x: TILE_SIZE, y: 0, width: TILE_SIZE, height: TILE_SIZE },
      stepperX,
      props.y,
      1,
      color
    );
  },

  getSize() {
    if (!atlas || !font) return { width: 0, height: 0 };
    const resolution = getResolutionStore().getResolution();
    const textWidth = measureText(font, resolution);
    const gap = 4;
    return {
      width: TILE_SIZE + gap + textWidth + gap + TILE_SIZE,
      height: Math.max(TILE_SIZE, font.charHeight),
    };
  },
});
