/**
 * World grid component.
 * Renders an isometric grid with 30 degree horizontal skew.
 * Sized at 2x the world map so it appears infinite.
 */

import { Component, ComponentProps } from "../engine/components";
import { RenderContext } from "../engine/sprites";
import {
  getLayer,
  setLayerSize,
  setLayerScale,
  setLayerPosition,
} from "../engine/layers";

/** World map dimensions (must match world-map.png). */
const MAP_WIDTH = 2176;
const MAP_HEIGHT = 1152;

/** Props for the world grid component. */
export interface WorldGridProps {
  /** Grid cell size in pixels. */
  cellSize?: number;

  /** Grid line color. */
  color?: string;

  /** Grid line opacity. */
  opacity?: number;

  /** Layer to follow for transforms. */
  tracksLayer?: number;
}

/** Default props. */
const defaultProps = {
  cellSize: 12,
  color: "#ffffff",
  opacity: 0.025,
};

/**
 * World grid component.
 * Renders an isometric grid (-30deg skew) at 2x map size.
 */
export class WorldGrid extends Component<WorldGridProps & ComponentProps> {
  constructor(props: WorldGridProps & ComponentProps) {
    super({ ...defaultProps, ...props });
  }

  update(): void {
    const { layer, tracksLayer } = this.props;

    // Set layer size to 2x map size.
    setLayerSize(layer, MAP_WIDTH * 2, MAP_HEIGHT * 2);

    // Copy transforms from tracked layer.
    if (tracksLayer !== undefined) {
      const target = getLayer(tracksLayer);
      setLayerScale(layer, target.scale);
      setLayerPosition(layer, target.x, target.y);
    }
  }

  render(ctx: RenderContext): void {
    const { cellSize, color, opacity } = this.props as Required<WorldGridProps>;

    // Grid canvas is 2x map size.
    const width = MAP_WIDTH * 2;
    const height = MAP_HEIGHT * 2;

    // -30 degree skew factor (tan(-30°) ≈ -0.577).
    const skewFactor = Math.tan(-Math.PI / 6);

    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;

    // Draw horizontal lines.
    for (let y = 0; y <= height; y += cellSize) {
      ctx.fillRect(0, y, width, 1);
    }

    // Draw skewed vertical lines.
    const extraWidth = Math.abs(height * skewFactor);
    const numVerticalLines = Math.ceil((width + extraWidth) / cellSize) + 2;

    for (let i = -numVerticalLines; i <= numVerticalLines; i++) {
      const startX = i * cellSize + MAP_WIDTH / 2;

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
