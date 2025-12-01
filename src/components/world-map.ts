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

/** Props for the world map component. */
export interface WorldMapProps extends ComponentProps {
  layer: number;
  x: number;
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

  constructor(propsOverride?: Partial<WorldMapProps>) {
    super({ ...defaultProps, ...propsOverride });
  }

  async load(): Promise<void> {
    this.sprite = await loadSprite("/sprites/world-map.png");
  }

  render(ctx: RenderContext): void {
    if (!this.sprite) return;

    const { resolution } = getEngineState();
    const { x, y, zoom } = this.props;

    // Calculate scaled dimensions.
    const scaledWidth = Math.round(this.sprite.width * zoom);
    const scaledHeight = Math.round(this.sprite.height * zoom);

    // Center the map in the viewport with initial offsets.
    const centeredX = Math.round((resolution.width - scaledWidth) / 2) + x;
    const centeredY = Math.round((resolution.height - scaledHeight) / 2) + y;

    drawSprite(ctx, this.sprite, centeredX, centeredY, zoom);
  }
}
