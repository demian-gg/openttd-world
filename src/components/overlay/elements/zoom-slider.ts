/**
 * Zoom slider overlay element.
 */

import {
  loadSprite,
  drawAtlasSprite,
  Sprite,
  RenderContext,
} from "../../../engine/sprites";
import { defineElement } from "../../../engine/elements";
import { getWorldMapStore } from "../../../stores/world-map";

/** A type representing props for the zoom slider element. */
export type ZoomSliderProps = {
  /** The X position in pixels. */
  x: number;

  /** The Y position in pixels. */
  y: number;

  /** The optional scale factor. */
  scale?: number;
};

/** The slider sprite atlas instance. */
let atlas: Sprite | null = null;

/** The slider width in pixels. */
const SLIDER_WIDTH = 26;

/** The slider height in pixels. */
const SLIDER_HEIGHT = 222;

/** The knob size in pixels. */
const KNOB_SIZE = 26;

/** The track padding in pixels. */
const TRACK_PADDING = 32;

/**
 * Zoom slider element definition.
 */
export const ZoomSlider = defineElement<ZoomSliderProps>({
  async load() {
    atlas = await loadSprite("/sprites/zoom-slider@26px.png");
  },

  render(ctx: RenderContext, props) {
    if (!atlas) return;
    const scale = props.scale ?? 1;

    // Draw the slider track.
    drawAtlasSprite(
      ctx,
      atlas,
      { x: 0, y: 0, width: SLIDER_WIDTH, height: SLIDER_HEIGHT },
      props.x,
      props.y,
      scale
    );

    // Calculate knob position based on zoom level (0 = bottom, 1 = top).
    const zoomLevel = getWorldMapStore().getZoomNormalized();
    const paddingScaled = TRACK_PADDING * scale;
    const trackHeight = (SLIDER_HEIGHT - KNOB_SIZE) * scale - paddingScaled * 2;
    const knobY = props.y + paddingScaled + trackHeight * (1 - zoomLevel);

    // Draw the knob.
    drawAtlasSprite(
      ctx,
      atlas,
      { x: SLIDER_WIDTH, y: 0, width: KNOB_SIZE, height: KNOB_SIZE },
      props.x,
      knobY,
      scale
    );
  },

  getSize() {
    return { width: SLIDER_WIDTH, height: SLIDER_HEIGHT };
  },
});
