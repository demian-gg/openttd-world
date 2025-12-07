/**
 * Selection component.
 * Renders overlay and selection cutout when in select mode.
 */

import { defineComponent, ComponentProps } from "../engine/components";
import { RenderContext } from "../engine/sprites";
import { getEngineState } from "../engine/engine";
import { registerPointerArea } from "../engine/pointer";
import { subscribeStore } from "../engine/stores";
import {
  dirtyLayer,
  setLayerPosition,
  setLayerScale,
  setLayerSize,
} from "../engine/layers";
import { getOverlayStore, OverlayStore } from "../stores/overlay";
import { getSelectionStore, SelectionStore } from "../stores/selection";
import { getWorldMapStore, WorldMapStore } from "../stores/world-map";

/** Skew angle in degrees for isometric-style selection. */
const SKEW_ANGLE = -30;

/** Overlay opacity when in select mode. */
const OVERLAY_OPACITY = 0.5;

/**
 * Convert screen coordinates to world coordinates (pixels in the sprite).
 * Accounts for zoom, centering, and offset.
 */
function screenToWorld(
  screenX: number,
  screenY: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } {
  const store = getWorldMapStore();
  const zoom = store.getZoom();
  const offsetX = store.getOffsetX();
  const offsetY = store.getOffsetY();
  const { width: spriteWidth, height: spriteHeight } = store.getSpriteSize();

  // Calculate where the map is drawn on screen (matching compositor logic).
  const scaledWidth = spriteWidth * zoom;
  const scaledHeight = spriteHeight * zoom;
  const mapX = Math.round((viewportWidth - scaledWidth) / 2) + offsetX;
  const mapY = Math.round((viewportHeight - scaledHeight) / 2) + offsetY;

  // Convert screen position to world position.
  const worldX = (screenX - mapX) / zoom;
  const worldY = (screenY - mapY) / zoom;

  return { x: worldX, y: worldY };
}

/**
 * Selection component definition.
 */
export const { init: initSelectionComponent } = defineComponent<ComponentProps>(
  {
    init(props) {
      // Subscribe to relevant stores to redraw when needed.
      subscribeStore(OverlayStore, () => {
        dirtyLayer(props.layer);
      });

      subscribeStore(SelectionStore, () => {
        dirtyLayer(props.layer);
      });

      subscribeStore(WorldMapStore, () => {
        dirtyLayer(props.layer);
      });
    },

    update(props) {
      const mode = getOverlayStore().getInteractionMode();
      if (mode !== "select") return;

      const { resolution } = getEngineState();
      const { layer } = props;
      const selectionStore = getSelectionStore();
      const worldMapStore = getWorldMapStore();
      const { width: spriteWidth, height: spriteHeight } =
        worldMapStore.getSpriteSize();

      // Match the world-map layer transforms so we render at same resolution.
      setLayerSize(layer, spriteWidth, spriteHeight);
      setLayerScale(layer, worldMapStore.getZoom());
      setLayerPosition(
        layer,
        worldMapStore.getOffsetX(),
        worldMapStore.getOffsetY()
      );

      // Register full-screen pointer area for selection.
      registerPointerArea({
        x: 0,
        y: 0,
        width: resolution.width,
        height: resolution.height,
        layer,
        cursor: "crosshair",
        cursorMiddleDragging: "move",

        onDragStart: (x, y) => {
          const world = screenToWorld(
            x,
            y,
            resolution.width,
            resolution.height
          );
          selectionStore.startSelection(world.x, world.y);
        },

        onDrag: (x, y) => {
          const world = screenToWorld(
            x,
            y,
            resolution.width,
            resolution.height
          );
          selectionStore.updateSelection(world.x, world.y);
        },

        onDragEnd: () => {
          selectionStore.endSelection();
        },

        // Middle mouse button for panning in select mode.
        onMiddleDrag: (_x, _y, dx, dy) => {
          worldMapStore.pan(dx, dy);
        },

        // Allow scroll to zoom even in select mode.
        onScroll: (x, y, deltaY) => {
          worldMapStore.zoomAtPoint(x, y, deltaY);
        },
      });
    },

    render(ctx: RenderContext) {
      const mode = getOverlayStore().getInteractionMode();
      if (mode !== "select") return;

      const { width: spriteWidth, height: spriteHeight } =
        getWorldMapStore().getSpriteSize();
      const bounds = getSelectionStore().getBounds();

      // Draw semi-transparent overlay (in world/sprite coordinates).
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${OVERLAY_OPACITY})`;
      ctx.fillRect(0, 0, spriteWidth, spriteHeight);

      // If we have a selection, cut it out.
      if (bounds) {
        // Bounds are already in world coordinates, no conversion needed.
        const startX = bounds.startX;
        const startY = bounds.startY;
        const endX = bounds.endX;
        const endY = bounds.endY;

        // Calculate size (enforce 1:1 ratio).
        const dx = endX - startX;
        const dy = endY - startY;
        const size = Math.max(Math.abs(dx), Math.abs(dy));

        // Determine direction.
        const dirX = dx >= 0 ? 1 : -1;
        const dirY = dy >= 0 ? 1 : -1;

        // Calculate selection rectangle dimensions.
        const selX = startX;
        const selY = startY;
        const selWidth = size * dirX;
        const selHeight = size * dirY;

        // Calculate skew factor.
        const skewFactor = Math.tan((SKEW_ANGLE * Math.PI) / 180);

        // Calculate skewed corner positions.
        // Skew is relative to the selection's top edge, not absolute Y.
        const tlX = selX;
        const tlY = selY;
        const trX = selX + selWidth;
        const trY = selY;
        const brX = selX + selWidth + selHeight * skewFactor;
        const brY = selY + selHeight;
        const blX = selX + selHeight * skewFactor;
        const blY = selY + selHeight;

        // Cut out selection from overlay.
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(tlX, tlY);
        ctx.lineTo(trX, trY);
        ctx.lineTo(brX, brY);
        ctx.lineTo(blX, blY);
        ctx.closePath();
        ctx.fill();

        // Helper to draw a dashed line using filled pixels (no anti-aliasing).
        // Uses Bresenham's line algorithm for pixel-perfect diagonal lines.
        const DASH_LENGTH = 4;
        const GAP_LENGTH = 4;

        function drawDashedLine(
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          color: string
        ): void {
          ctx.fillStyle = color;

          // Round to integers for pixel-perfect drawing.
          let x = Math.round(x1);
          let y = Math.round(y1);
          const endX = Math.round(x2);
          const endY = Math.round(y2);

          const dx = Math.abs(endX - x);
          const dy = Math.abs(endY - y);
          const sx = x < endX ? 1 : -1;
          const sy = y < endY ? 1 : -1;
          let err = dx - dy;

          let pixelCount = 0;
          const dashCycle = DASH_LENGTH + GAP_LENGTH;

          while (true) {
            // Draw pixel if in dash phase (not gap phase).
            if (pixelCount % dashCycle < DASH_LENGTH) {
              ctx.fillRect(x, y, 1, 1);
            }
            pixelCount++;

            if (x === endX && y === endY) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
              err -= dy;
              x += sx;
            }
            if (e2 < dx) {
              err += dx;
              y += sy;
            }
          }
        }

        // Draw all four edges with shadow and white line.
        ctx.globalCompositeOperation = "source-over";
        const edges: [number, number, number, number][] = [
          [tlX, tlY, trX, trY],
          [trX, trY, brX, brY],
          [brX, brY, blX, blY],
          [blX, blY, tlX, tlY],
        ];

        // Draw shadows first.
        for (const [x1, y1, x2, y2] of edges) {
          drawDashedLine(x1 + 1, y1 + 1, x2 + 1, y2 + 1, "rgba(0, 0, 0, 0.5)");
        }

        // Draw white borders.
        for (const [x1, y1, x2, y2] of edges) {
          drawDashedLine(x1, y1, x2, y2, "white");
        }
      }

      ctx.restore();
    },
  }
);
