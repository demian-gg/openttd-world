/**
 * Resolution stepper overlay element.
 */

import {
  loadSprite,
  drawSprite,
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

/** Props for the resolution stepper element. */
export interface ResolutionStepperProps {
  x: number;
  y: number;
  scale?: number;
  color?: string;
}

/** Icon sprite instance. */
let icon: Sprite | null = null;

/** Font instance. */
let font: BitmapFont | null = null;

/** Current resolution value. */
let resolution = "512x512";

/**
 * Set the resolution value to display.
 */
export function setResolution(value: string): void {
  resolution = value;
}

/**
 * Resolution stepper element definition.
 */
export const ResolutionStepper = defineElement<ResolutionStepperProps>(
  "resolution-stepper",
  {
    async load() {
      [icon, font] = await Promise.all([
        loadSprite("/sprites/resolution-icon.png"),
        loadFont("/sprites/font.png", 16, 16, 16, 32, -7),
      ]);
    },

    render(ctx: RenderContext, props) {
      if (!icon || !font) return;
      const scale = props.scale ?? 1.25;
      const color = props.color ?? "white";

      // Draw the resolution icon.
      drawSprite(ctx, icon, props.x, props.y, 1, color);

      // Draw the resolution text to the right of the icon.
      const textX = props.x + icon.width + 4;
      drawText(ctx, font, resolution, textX, props.y, scale, color);
    },

    getSize() {
      if (!icon || !font) return { width: 0, height: 0 };
      const scale = 1.125;
      const textWidth = measureText(font, resolution, scale);
      const gap = 12;
      return {
        width: icon.width + gap + textWidth,
        height: Math.max(icon.height, font.charHeight * scale),
      };
    },
  }
);
