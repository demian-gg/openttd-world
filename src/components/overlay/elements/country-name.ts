/**
 * Country name overlay element.
 */

import { RenderContext } from "../../../engine/sprites";
import {
  BitmapFont,
  loadFont,
  drawText,
  measureText,
} from "../../../engine/text";
import { defineElement } from "../../../engine/elements";

/** Props for the country name element. */
export interface CountryNameProps {
  x: number;
  y: number;
  scale?: number;
  color?: string;
}

/** Font instance. */
let font: BitmapFont | null = null;

/** Current country name. */
let countryName = "The Netherlands";

/**
 * Set the country name to display.
 */
export function setCountryName(name: string): void {
  countryName = name;
}

/**
 * Country name element definition.
 */
export const CountryName = defineElement<CountryNameProps>("country-name", {
  async load() {
    font = await loadFont("/sprites/font.png", 16, 16, 16, 32, -7);
  },

  render(ctx: RenderContext, props) {
    if (!font) return;
    drawText(
      ctx,
      font,
      countryName,
      props.x,
      props.y,
      props.scale ?? 1.5,
      props.color ?? "white"
    );
  },

  getSize() {
    if (!font) return { width: 0, height: 0 };
    const scale = 1.5;
    return {
      width: measureText(font, countryName, scale),
      height: font.charHeight * scale,
    };
  },
});
