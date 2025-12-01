/**
 * Developer sprite component for testing.
 * Cycles through sprites, switching every second, while zooming in and out.
 */

import {
  loadSprite,
  drawSpriteRegion,
  Sprite,
  SpriteRegion,
  RenderContext,
} from "../engine/sprites";
import { Component, ComponentProps } from "../engine/components";
import { setLayerScale } from "../engine/layers";

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

  /** Minimum scale for zoom animation. */
  minScale: number;

  /** Maximum scale for zoom animation. */
  maxScale: number;

  /** Duration of one zoom cycle in milliseconds. */
  zoomCycleMs: number;
}

/** Default props. */
const defaultProps: DeveloperSpriteProps = {
  layer: 0,
  spriteCount: 10,
  tileSize: 32,
  atlasColumns: 4,
  changeInterval: 1000,
  minScale: 2,
  maxScale: 8,
  zoomCycleMs: 3000,
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

    // Compute column and row from index.
    const col = this.currentSpriteIndex % this.props.atlasColumns;
    const row = Math.floor(this.currentSpriteIndex / this.props.atlasColumns);

    // Compute region for current sprite.
    const region: SpriteRegion = {
      x: col * this.props.tileSize,
      y: row * this.props.tileSize,
      width: this.props.tileSize,
      height: this.props.tileSize,
    };

    // Compute animated scale using sin(t), oscillating between MIN and MAX.
    const t = (Date.now() % this.props.zoomCycleMs) / this.props.zoomCycleMs;
    const normalized = (Math.sin(t * Math.PI * 2) + 1) / 2;
    const scale =
      this.props.minScale +
      normalized * (this.props.maxScale - this.props.minScale);

    // Apply scale to the layer.
    setLayerScale(this.props.layer, scale);

    // Draw sprite region at top-left (no sprite scaling, layer handles it).
    drawSpriteRegion(ctx, this.spriteAtlas, region, 0, 0);
  }
}
