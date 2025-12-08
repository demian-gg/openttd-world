/**
 * Zone name overlay element.
 * Displays the name of the currently hovered zone.
 */

import { RenderContext } from "../../../engine/sprites";
import {
  BitmapFont,
  loadFont,
  drawText,
  measureText,
} from "../../../engine/text";
import { defineElement } from "../../../engine/elements";
import { getZoneStore } from "../../../stores/zone";

/** Default text when no zone has been hovered. */
const DEFAULT_TEXT = "OpenTTD World";

/** Props for the zone name element. */
export interface ZoneNameProps {
  x: number;
  y: number;
  scale?: number;
  color?: string;
}

/** Font instance. */
let font: BitmapFont | null = null;

/**
 * Zone name element definition.
 */
export const ZoneName = defineElement<ZoneNameProps>({
  async load() {
    font = await loadFont("/sprites/font.png", 16, 16, 16, 32, -7);
    // Load zone map data.
    await getZoneStore().load();
  },

  render(ctx: RenderContext, props) {
    if (!font) return;
    const zoneName = getZoneStore().getZoneName() || DEFAULT_TEXT;
    drawText(
      ctx,
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
    const scale = 1.5;
    const zoneName = getZoneStore().getZoneName() || DEFAULT_TEXT;
    return {
      width: measureText(font, zoneName, scale),
      height: font.charHeight * scale,
    };
  },
});
