/**
 * World map component.
 * Renders the world map sprite.
 */

import {
  loadSprite,
  drawSprite,
  Sprite,
  RenderContext,
} from "../engine/sprites";
import { Component, ComponentProps } from "../engine/components";
import { getEngineState } from "../engine/engine";
import { registerPointerArea } from "../engine/pointer";
import {
  setLayerPosition,
  setLayerScale,
  setLayerSize,
} from "../engine/layers";

/** Props for the world map component. */
export interface WorldMapProps extends ComponentProps {
  layer: number;

  /** X offset from center (0 = centered). */
  x: number;

  /** Y offset from center (0 = centered). */
  y: number;

  /** Initial zoom level. */
  zoom: number;
}

/** Default props. */
const defaultProps: WorldMapProps = {
  layer: 0,
  x: -150,
  y: 800,
  zoom: 3,
};

/**
 * World map component.
 * Renders the world map sprite at the specified position.
 */
export class WorldMap extends Component<WorldMapProps> {
  private sprite: Sprite | null = null;

  /** Current layer offset from dragging. */
  private offsetX = 0;
  private offsetY = 0;

  constructor(propsOverride?: Partial<WorldMapProps>) {
    super({ ...defaultProps, ...propsOverride });
    this.offsetX = this.props.x;
    this.offsetY = this.props.y;
  }

  async load(): Promise<void> {
    this.sprite = await loadSprite("/sprites/world-map.png");
  }

  update(): void {
    if (!this.sprite) return;

    const { resolution } = getEngineState();
    const { layer, zoom } = this.props;

    // Set layer size to sprite's natural size (not zoomed).
    setLayerSize(layer, this.sprite.width, this.sprite.height);

    // Let the compositor handle zoom via layer scale.
    setLayerScale(layer, zoom);

    // Update layer position.
    setLayerPosition(layer, this.offsetX, this.offsetY);

    // Register the entire viewport as a draggable area.
    registerPointerArea({
      x: 0,
      y: 0,
      width: resolution.width,
      height: resolution.height,
      layer,
      onDrag: (_x, _y, dx, dy) => {
        this.offsetX += dx;
        this.offsetY += dy;
      },
    });
  }

  render(ctx: RenderContext): void {
    // Ensure sprite is loaded.
    if (!this.sprite) return;

    // Draw the sprite at 1:1 scale (layer scale handles zoom).
    drawSprite(ctx, this.sprite, 0, 0);
  }
}
