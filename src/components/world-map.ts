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

/**
 * Viewport width breakpoints mapped to minimum zoom levels.
 * Smaller screens can zoom out more, larger screens are more restricted.
 */
const MIN_ZOOM_BREAKPOINTS: [number, number][] = [
  [480, 2], // Mobile
  [768, 2], // Tablet
  [1280, 2.5], // Desktop
  [1920, 2.5], // Large desktop
  [Infinity, 2.75], // Ultrawide
];

/** Maximum zoom level. */
const MAX_ZOOM = 4;

/**
 * Get minimum zoom level for a given viewport width.
 */
function getMinZoomForViewport(width: number): number {
  for (const [breakpoint, minZoom] of MIN_ZOOM_BREAKPOINTS) {
    if (width <= breakpoint) {
      return minZoom;
    }
  }
  return MIN_ZOOM_BREAKPOINTS[MIN_ZOOM_BREAKPOINTS.length - 1][1];
}

/** Props for the world map component. */
export interface WorldMapProps {
  /** X offset from center (0 = centered). */
  x?: number;

  /** Y offset from center (0 = centered). */
  y?: number;

  /** Initial zoom level. */
  zoom?: number;
}

/** Default props. */
const defaultProps = {
  x: -150,
  y: 800,
  zoom: 3,
};

/**
 * World map component.
 * Renders the world map sprite at the specified position.
 */
export class WorldMap extends Component<WorldMapProps & ComponentProps> {
  private sprite: Sprite | null = null;

  /** Current layer offset from dragging. */
  private offsetX = 0;
  private offsetY = 0;

  /** Current zoom level. */
  private zoom: number;

  constructor(props: WorldMapProps & ComponentProps) {
    super({ ...defaultProps, ...props });
    this.offsetX = this.props.x!;
    this.offsetY = this.props.y!;
    this.zoom = this.props.zoom!;
  }

  /** Clamp offset values to keep the map covering the viewport. */
  private clampOffset(): void {
    if (!this.sprite) return;

    const { resolution } = getEngineState();

    // Calculate the scaled sprite dimensions.
    const scaledWidth = this.sprite.width * this.zoom;
    const scaledHeight = this.sprite.height * this.zoom;

    // Calculate how much the map extends beyond the viewport on each side.
    // If map is larger than viewport, we can pan until the edge aligns with
    // viewport edge. If map is smaller than viewport (shouldn't happen with
    // proper zoom limits), clamp to 0.
    const excessWidth = Math.max(0, scaledWidth - resolution.width) / 2;
    const excessHeight = Math.max(0, scaledHeight - resolution.height) / 2;

    this.offsetX = Math.max(-excessWidth, Math.min(excessWidth, this.offsetX));
    this.offsetY = Math.max(
      -excessHeight,
      Math.min(excessHeight, this.offsetY)
    );
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
        const { resolution } = getEngineState();

        // Calculate min zoom: largest of breakpoint limit and map coverage requirements.
        const minZoom = Math.max(
          getMinZoomForViewport(resolution.width),
          resolution.width / this.sprite!.width,
          resolution.height / this.sprite!.height
        );

        // Apply zoom: scroll up = zoom in, scroll down = zoom out.
        const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(
          minZoom,
          Math.min(MAX_ZOOM, this.zoom * zoomFactor)
        );

        // Adjust offset to keep the point under cursor fixed during zoom.
        const cursorFromCenterX = x - resolution.width / 2;
        const cursorFromCenterY = y - resolution.height / 2;
        const zoomRatio = newZoom / this.zoom;
        this.offsetX =
          cursorFromCenterX - (cursorFromCenterX - this.offsetX) * zoomRatio;
        this.offsetY =
          cursorFromCenterY - (cursorFromCenterY - this.offsetY) * zoomRatio;

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
