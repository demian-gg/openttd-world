/**
 * Resolution stepper overlay element.
 */

import {
  loadSprite,
  drawAtlasSprite,
  Sprite,
  RenderContext,
} from "../../../engine/sprites";
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

/** Props for the resolution stepper element. */
export interface ResolutionStepperProps {
  x: number;
  y: number;
  layer: number;
  color?: string;
}

/** Atlas sprite instance. */
let atlas: Sprite | null = null;

/** Font instance. */
let font: BitmapFont | null = null;

/** Tile size in the atlas. */
const TILE_SIZE = 18;

/**
 * Resolution stepper element definition.
 */
export const ResolutionStepper = defineElement<ResolutionStepperProps>({
  async load() {
    [atlas, font] = await Promise.all([
      loadSprite("/sprites/resolution-stepper.png"),
      loadFont("/sprites/font.png", 16, 16, 16, 32, -7),
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

    // Register upper half of stepper (step up).
    registerPointerArea({
      x: stepperX,
      y: props.y,
      width: TILE_SIZE,
      height: TILE_SIZE / 2,
      layer: props.layer,
      cursor: "pointer",
      onClick: () => {
        store.stepUp();
        dirtyLayer(props.layer);
      },
    });

    // Register lower half of stepper (step down).
    registerPointerArea({
      x: stepperX,
      y: props.y + TILE_SIZE / 2,
      width: TILE_SIZE,
      height: TILE_SIZE / 2,
      layer: props.layer,
      cursor: "pointer",
      onClick: () => {
        store.stepDown();
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
