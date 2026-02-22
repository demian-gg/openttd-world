import { RenderContext } from "../../../engine/canvas";
import {
  BitmapFont,
  loadFont,
  drawText,
  measureText,
} from "../../../engine/text";
import { defineElement } from "../../../engine/elements";
import { getZoneStore } from "../../../stores/zone";

/** A type representing props for the zone name element. */
export type ZoneNameProps = {
  /** The X position in pixels. */
  x: number;

  /** The Y position in pixels. */
  y: number;

  /** The optional scale factor. */
  scale?: number;

  /** The optional text color. */
  color?: string;
};

/** The default text when no zone has been hovered. */
const DEFAULT_TEXT = "OpenTTD World";

/** The font instance. */
let font: BitmapFont | null = null;

/**
 * Zone name element definition.
 */
export const ZoneName = defineElement<ZoneNameProps>({
  async load() {
    // Load font sprite.
    font = await loadFont("/sprites/font@16px.png", 16, 16, 16, 32, -7);

    // Load zone map data.
    await getZoneStore().load();
  },

  render(context: RenderContext, props) {
    if (!font) return;

    // Get current zone name or default.
    const zoneName = getZoneStore().getZoneName() || DEFAULT_TEXT;

    // Draw the zone name text.
    drawText(
      context,
      font,
      zoneName,
      props.x,
      props.y,
      props.scale ?? 1.5,
      props.color ?? "white"
    );
  },

  getSize() {
    if (!font) return { width: 0, height: 0 };

    // Calculate dimensions based on current zone name.
    const scale = 1.5;
    const zoneName = getZoneStore().getZoneName() || DEFAULT_TEXT;
    return {
      width: measureText(font, zoneName, scale),
      height: font.charHeight * scale,
    };
  },
});
