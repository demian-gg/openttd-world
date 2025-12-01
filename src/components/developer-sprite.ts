/**
 * Developer sprite component for testing.
 * Cycles through sprites, switching every second, while zooming in and out.
 */

import {
  loadSprite,
  drawAtlasSprite,
  Sprite,
  SpriteRegion,
  RenderContext,
} from "../engine/sprites";
import { Component, ComponentProps } from "../engine/components";
import { getEngineState } from "../engine/engine";
import { registerPointerArea } from "../engine/pointer";

/** Props for the developer sprite component. */
export interface DeveloperSpriteProps extends ComponentProps {
  /** Layer for render ordering. */
  layer: number;

  /** Total number of sprites in the atlas. */
  spriteCount: number;

  /** Tile size in pixels. */
  tileSize: number;

  /** Number of columns in the atlas. */
  atlasColumns: number;

  /** Interval between sprite changes in milliseconds. */
  changeInterval: number;

  /** Scale factor for rendering. */
  scale: number;
}

/** Default props. */
const defaultProps: DeveloperSpriteProps = {
  layer: 0,
  spriteCount: 10,
  tileSize: 32,
  atlasColumns: 4,
  changeInterval: 1000,
  scale: 3,
};

/**
 * Developer sprite component for testing.
 * Cycles through sprites while zooming in and out.
 */
export class DeveloperSprite extends Component<DeveloperSpriteProps> {
  private spriteAtlas: Sprite | null = null;
  private currentSpriteIndex = 0;

  constructor(propsOverride?: Partial<DeveloperSpriteProps>) {
    super({ ...defaultProps, ...propsOverride });
  }

  async load(): Promise<void> {
    // Load and cache the atlas.
    this.spriteAtlas = await loadSprite("/sprites/developer.png");

    // Start cycling through sprites.
    setInterval(() => {
      this.currentSpriteIndex =
        (this.currentSpriteIndex + 1) % this.props.spriteCount;
    }, this.props.changeInterval);
  }

  render(ctx: RenderContext): void {
    // Skip if atlas not loaded.
    if (!this.spriteAtlas) return;

    const { resolution } = getEngineState();
    const { scale } = this.props;
    const scaledTile = Math.round(this.props.tileSize * scale);
    const gridSize = 3;
    const totalSize = scaledTile * gridSize;

    // Center the grid in viewport.
    const startX = Math.round((resolution.width - totalSize) / 2);
    const startY = Math.round((resolution.height - totalSize) / 2);

    // Draw 3x3 grid of sprites.
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const spriteIndex =
          (this.currentSpriteIndex + row * gridSize + col) %
          this.props.spriteCount;
        const atlasCol = spriteIndex % this.props.atlasColumns;
        const atlasRow = Math.floor(spriteIndex / this.props.atlasColumns);

        const region: SpriteRegion = {
          x: atlasCol * this.props.tileSize,
          y: atlasRow * this.props.tileSize,
          width: this.props.tileSize,
          height: this.props.tileSize,
        };

        const x = startX + col * scaledTile;
        const y = startY + row * scaledTile;

        drawAtlasSprite(ctx, this.spriteAtlas, region, x, y, scale);

        // Register pointer area for this sprite.
        registerPointerArea({
          x,
          y,
          width: scaledTile,
          height: scaledTile,
          layer: this.props.layer,
          onClick: () => {
            console.log(
              `Clicked sprite at grid [${row}, ${col}], index ${spriteIndex}`
            );
          },
        });
      }
    }
  }
}
