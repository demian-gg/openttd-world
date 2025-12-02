/**
 * World grid component.
 * Renders an isometric grid with 30 degree horizontal skew.
 */

import { Component, ComponentProps } from "../engine/components";
import { RenderContext } from "../engine/sprites";

/** Props for the world grid component. */
export interface WorldGridProps extends ComponentProps {
  layer: number;

  /** Grid cell size in pixels. */
  cellSize: number;

  /** Grid line color. */
  color: string;

  /** Grid line opacity. */
  opacity: number;
}

/** Default props. */
const defaultProps: WorldGridProps = {
  layer: 0,
  cellSize: 12,
  color: "#ffffff",
  opacity: 0.025,
};

/**
 * World grid component.
 * Renders an isometric grid with 30 degree skew.
 */
export class WorldGrid extends Component<WorldGridProps> {
  constructor(propsOverride?: Partial<WorldGridProps>) {
    super({ ...defaultProps, ...propsOverride });
  }

  render(ctx: RenderContext): void {
    const { cellSize, color, opacity } = this.props;

    // Get the layer's canvas dimensions (not viewport).
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // -30 degree skew factor (tan(-30°) ≈ -0.577).
    const skewFactor = Math.tan(-Math.PI / 6);

    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    // Draw horizontal lines using fillRect for crisp pixels.
    for (let y = 0; y <= height; y += cellSize) {
      const yPos = Math.floor(y);
      ctx.fillRect(0, yPos, width, 1);
    }

    // Draw skewed vertical lines using Bresenham-style pixel stepping.
    const extraWidth = Math.abs(height * skewFactor);
    const numVerticalLines = Math.ceil((width + extraWidth) / cellSize);

    for (let i = -numVerticalLines; i <= numVerticalLines * 2; i++) {
      const startX = Math.floor(i * cellSize);

      // Draw pixel by pixel along the skewed line.
      for (let y = 0; y < height; y++) {
        const x = Math.floor(startX + y * skewFactor);
        if (x >= 0 && x < width) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    ctx.restore();
  }
}
