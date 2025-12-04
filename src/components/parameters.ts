/**
 * Parameters component.
 * Renders an icon with text showing resolution parameters.
 */

import { Component, ComponentProps } from "../engine/components";
import {
  loadSprite,
  drawSprite,
  Sprite,
  RenderContext,
} from "../engine/sprites";
import { BitmapFont, loadFont, drawText } from "../engine/text";

/** Props for the parameters component. */
export interface ParametersProps {
  /** X position. */
  x: number;

  /** Y position. */
  y: number;
}

/**
 * Parameters component.
 * Displays resolution icon with resolution text.
 */
export class Parameters extends Component<ParametersProps & ComponentProps> {
  private icon: Sprite | null = null;
  private font: BitmapFont | null = null;

  constructor(props: ParametersProps & ComponentProps) {
    super(props);
  }

  async load(): Promise<void> {
    // Load icon and font in parallel.
    [this.icon, this.font] = await Promise.all([
      loadSprite("/sprites/resolution-icon.png"),
      loadFont("/sprites/font.png", 16, 16, 16, 32, -7),
    ]);
  }

  render(ctx: RenderContext): void {
    if (!this.icon || !this.font) return;

    const { x, y } = this.props;

    // Draw the resolution icon in white.
    drawSprite(ctx, this.icon, x, y, 1, "white");

    // Draw the resolution text to the right of the icon.
    const textX = x + this.icon.width * 0.5 + 12;
    drawText(ctx, this.font, "512x512", textX, y + 1, 1.125, "white");
  }
}
