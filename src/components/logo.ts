/**
 * Logo component.
 * Renders the logo sprite in the top left corner.
 */

import { Component, ComponentProps } from "../engine/components";
import {
  loadSprite,
  drawSprite,
  Sprite,
  RenderContext,
} from "../engine/sprites";

/** Props for the logo component. */
export interface LogoProps {
  /** Padding from the top left corner. */
  padding?: number;

  /** Scale of the logo. */
  scale?: number;
}

/** Default props. */
const defaultProps = {
  padding: 32,
  scale: 1,
};

/**
 * Logo component.
 * Renders the logo sprite positioned in the top left corner.
 */
export class Logo extends Component<LogoProps & ComponentProps> {
  private sprite: Sprite | null = null;

  constructor(props: LogoProps & ComponentProps) {
    super({ ...defaultProps, ...props });
  }

  async load(): Promise<void> {
    this.sprite = await loadSprite("/sprites/logo.png");
  }

  render(ctx: RenderContext): void {
    if (!this.sprite) return;

    const { padding, scale } = this.props as Required<LogoProps>;

    ctx.save();
    ctx.translate(padding, padding);
    ctx.scale(scale, scale);
    drawSprite(ctx, this.sprite, 0, 0);
    ctx.restore();
  }
}
