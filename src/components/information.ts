/**
 * Information component.
 * Renders text at a specified position.
 */

import { Component, ComponentProps } from "../engine/components";
import { RenderContext } from "../engine/sprites";
import { BitmapFont, loadFont, drawText } from "../engine/text";

/** Props for the information component. */
export interface InformationProps {
  /** X position of the text. */
  x: number;

  /** Y position of the text. */
  y: number;
}

/**
 * Information component.
 * Displays text information on the screen.
 */
export class Information extends Component<InformationProps & ComponentProps> {
  private font: BitmapFont | null = null;

  constructor(props: InformationProps & ComponentProps) {
    super(props);
  }

  async load(): Promise<void> {
    // Load a bitmap font (16x16 characters, 16 per row, starting at ASCII 32).
    this.font = await loadFont("/sprites/font.png", 16, 16, 16, 32, -7);
  }

  render(ctx: RenderContext): void {
    if (!this.font) return;

    const { x, y } = this.props;

    drawText(ctx, this.font, "The Netherlands", x, y, 1.5, "white");
  }
}
