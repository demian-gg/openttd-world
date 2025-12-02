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

  /** Minimum zoom level. */
  minZoom?: number;

  /** Maximum zoom level. */
  maxZoom?: number;
}

/** Default props. */
const defaultProps: WorldMapProps = {
  layer: 0,
  x: -150,
  y: 800,
  zoom: 3,
  minZoom: 2,
  maxZoom: 4,
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

  /** Current zoom level. */
  private zoom: number;

  constructor(propsOverride?: Partial<WorldMapProps>) {
    super({ ...defaultProps, ...propsOverride });
    this.offsetX = this.props.x;
    this.offsetY = this.props.y;
    this.zoom = this.props.zoom;
  }

  /** Clamp offset values to keep the map within viewable bounds. */
  private clampOffset(): void {
    if (!this.sprite) return;

    // Calculate the scaled sprite dimensions.
    const scaledWidth = this.sprite.width * this.zoom;
    const scaledHeight = this.sprite.height * this.zoom;

    // Calculate bounds: the map edge should not go past the center.
    const maxOffsetX = scaledWidth / 2;
    const minOffsetX = -scaledWidth / 2;
    const maxOffsetY = scaledHeight / 2;
    const minOffsetY = -scaledHeight / 2;

    this.offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, this.offsetX));
    this.offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, this.offsetY));
  }

  async load(): Promise<void> {
    this.sprite = await loadSprite("/sprites/world-map.png");
  }

  update(): void {
    if (!this.sprite) return;

    const { resolution } = getEngineState();
    const { layer } = this.props;

    // Set layer size to sprite's natural size (not zoomed).
    setLayerSize(layer, this.sprite.width, this.sprite.height);

    // Let the compositor handle zoom via layer scale.
    setLayerScale(layer, this.zoom);

    // Update layer position.
    setLayerPosition(layer, this.offsetX, this.offsetY);

    // Register the entire viewport as a draggable/scrollable area.
    registerPointerArea({
      x: 0,
      y: 0,
      width: resolution.width,
      height: resolution.height,
      layer,
      onDrag: (_x, _y, dx, dy) => {
        this.offsetX += dx;
        this.offsetY += dy;
        this.clampOffset();
      },
      onScroll: (x, y, deltaY) => {
        // Zoom in when scrolling up, out when scrolling down.
        const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(
          this.props.minZoom!,
          Math.min(this.props.maxZoom!, this.zoom * zoomFactor)
        );

        // Calculate cursor position relative to viewport center.
        const { resolution } = getEngineState();
        const cursorFromCenterX = x - resolution.width / 2;
        const cursorFromCenterY = y - resolution.height / 2;

        // Adjust offset so the point under cursor stays fixed.
        // The point under cursor in world coords: (cursorFromCenter - offset) / zoom
        // After zoom change, we want the same world point under cursor.
        const scale = newZoom / this.zoom;
        this.offsetX =
          cursorFromCenterX - (cursorFromCenterX - this.offsetX) * scale;
        this.offsetY =
          cursorFromCenterY - (cursorFromCenterY - this.offsetY) * scale;

        this.zoom = newZoom;
        this.clampOffset();
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
