/**
 * Selection component.
 * Renders overlay and selection cutout when in select mode.
 */

import {
  defineComponent,
  ComponentProps,
  markComponentForUpdate,
} from "../engine/components";
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
import { getZoneStore } from "../stores/zone";

/** The skew angle in degrees for isometric-style selection. */
const SKEW_ANGLE = -30;

/** The overlay opacity when in select mode. */
const OVERLAY_OPACITY = 0.5;

/** The selection line opacity in pan mode. */
const PAN_MODE_SELECTION_OPACITY = 0.25;

/** The Earth's circumference at the equator in km. */
const EARTH_CIRCUMFERENCE_KM = 40075;

/** The maximum selection area in km². */
const MAX_AREA_KM_SQ = 10_000_000;

/** A type representing selection bounds. */
type SelectionBounds = {
  /** The start X coordinate. */
  startX: number;

  /** The start Y coordinate. */
  startY: number;

  /** The end X coordinate. */
  endX: number;

  /** The end Y coordinate. */
  endY: number;
};

/**
 * Draws a dashed line using filled pixels (no anti-aliasing).
 *
 * Uses Bresenham's line algorithm for pixel-perfect diagonal lines.
 *
 * @param ctx - The rendering context.
 * @param x1 - The start X coordinate.
 * @param y1 - The start Y coordinate.
 * @param x2 - The end X coordinate.
 * @param y2 - The end Y coordinate.
 * @param color - The line color.
 */
function drawDashedLine(
  ctx: RenderContext,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
): void {
  const DASH_LENGTH = 4;
  const GAP_LENGTH = 4;

  ctx.fillStyle = color;

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

/**
 * Calculates skewed corner positions for a selection.
 *
 * @param bounds - The selection bounds.
 *
 * @returns The skewed corner positions.
 */
function calculateSkewedCorners(bounds: SelectionBounds): {
  tlX: number;
  tlY: number;
  trX: number;
  trY: number;
  brX: number;
  brY: number;
  blX: number;
  blY: number;
} {
  const { startX, startY, endX, endY } = bounds;

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
  return {
    tlX: selX,
    tlY: selY,
    trX: selX + selWidth,
    trY: selY,
    brX: selX + selWidth + selHeight * skewFactor,
    brY: selY + selHeight,
    blX: selX + selHeight * skewFactor,
    blY: selY + selHeight,
  };
}

/**
 * Renders just the selection border.
 *
 * @param ctx - The rendering context.
 * @param bounds - The selection bounds.
 * @param borderColor - The border color.
 */
function renderSelectionBorder(
  ctx: RenderContext,
  bounds: SelectionBounds,
  borderColor: string = "white"
): void {
  const { tlX, tlY, trX, trY, brX, brY, blX, blY } =
    calculateSkewedCorners(bounds);

  // Draw all four edges with shadow and white line.
  const edges: [number, number, number, number][] = [
    [tlX, tlY, trX, trY],
    [trX, trY, brX, brY],
    [brX, brY, blX, blY],
    [blX, blY, tlX, tlY],
  ];

  // Draw shadows first.
  for (const [x1, y1, x2, y2] of edges) {
    drawDashedLine(ctx, x1 + 1, y1 + 1, x2 + 1, y2 + 1, "rgba(0, 0, 0, 0.5)");
  }

  // Draw borders.
  for (const [x1, y1, x2, y2] of edges) {
    drawDashedLine(ctx, x1, y1, x2, y2, borderColor);
  }
}

/**
 * Renders selection with cutout effect (used in select mode).
 *
 * @param ctx - The rendering context.
 * @param bounds - The selection bounds.
 * @param borderColor - The border color.
 */
function renderSelectionCutout(
  ctx: RenderContext,
  bounds: SelectionBounds,
  borderColor: string = "white"
): void {
  const { tlX, tlY, trX, trY, brX, brY, blX, blY } =
    calculateSkewedCorners(bounds);

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

  // Draw the border.
  ctx.globalCompositeOperation = "source-over";
  renderSelectionBorder(ctx, bounds, borderColor);
}

/**
 * Calculates the maximum selection size in pixels for a given sprite width.
 *
 * @param spriteWidth - The sprite width in pixels.
 *
 * @returns The maximum size in pixels.
 */
function getMaxSizePixels(spriteWidth: number): number {
  const kmPerPixel = EARTH_CIRCUMFERENCE_KM / spriteWidth;
  const maxSideKm = Math.sqrt(MAX_AREA_KM_SQ);
  return maxSideKm / kmPerPixel;
}

/**
 * Checks if selection is at the maximum size limit.
 *
 * @param bounds - The selection bounds.
 * @param spriteWidth - The sprite width in pixels.
 *
 * @returns True if at maximum size.
 */
function isAtMaxSize(bounds: SelectionBounds, spriteWidth: number): boolean {
  const { startX, startY, endX, endY } = bounds;
  const dx = endX - startX;
  const dy = endY - startY;
  const sizePixels = Math.max(Math.abs(dx), Math.abs(dy));
  const maxSizePixels = getMaxSizePixels(spriteWidth);
  // Use small tolerance for floating point comparison.
  return sizePixels >= maxSizePixels - 0.5;
}

/**
 * Converts screen coordinates to world coordinates (pixels in the sprite).
 *
 * Accounts for zoom, centering, and offset.
 *
 * @param screenX - The screen X coordinate.
 * @param screenY - The screen Y coordinate.
 * @param viewportWidth - The viewport width.
 * @param viewportHeight - The viewport height.
 *
 * @returns The world coordinates.
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
      // Subscribe to relevant stores to redraw and update when needed.
      subscribeStore(OverlayStore, () => {
        dirtyLayer(props.layer);
        markComponentForUpdate(props);
      });

      subscribeStore(SelectionStore, () => {
        dirtyLayer(props.layer);
        markComponentForUpdate(props);
      });

      subscribeStore(WorldMapStore, () => {
        markComponentForUpdate(props);
      });
    },

    update(props) {
      const { layer } = props;
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
    },

    pointerAreas(props) {
      const mode = getOverlayStore().getInteractionMode();

      // Only register pointer area in select mode.
      if (mode !== "select") return;

      const { resolution } = getEngineState();
      const { layer } = props;
      const selectionStore = getSelectionStore();
      const worldMapStore = getWorldMapStore();
      const { width: spriteWidth } = worldMapStore.getSpriteSize();

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

          // Clamp selection to max size.
          const bounds = selectionStore.getBounds();
          if (bounds) {
            const maxSize = getMaxSizePixels(spriteWidth);
            const dx = world.x - bounds.startX;
            const dy = world.y - bounds.startY;
            const size = Math.max(Math.abs(dx), Math.abs(dy));

            if (size > maxSize) {
              // Clamp to max size while preserving direction.
              const dirX = dx >= 0 ? 1 : -1;
              const dirY = dy >= 0 ? 1 : -1;
              world.x = bounds.startX + maxSize * dirX;
              world.y = bounds.startY + maxSize * dirY;
            }
          }

          selectionStore.updateSelection(world.x, world.y);
        },

        onDragEnd: () => {
          selectionStore.endSelection();

          // Center the map on the selection.
          const bounds = selectionStore.getBounds();
          if (bounds) {
            const { startX, startY, endX, endY } = bounds;

            // Calculate adjusted end position (same logic as rendering).
            const dx = endX - startX;
            const dy = endY - startY;
            const size = Math.max(Math.abs(dx), Math.abs(dy));
            const dirX = dx >= 0 ? 1 : -1;
            const dirY = dy >= 0 ? 1 : -1;
            const adjustedEndX = startX + size * dirX;
            const adjustedEndY = startY + size * dirY;

            // Find geometric center of selection.
            const geometricCenterX = (startX + adjustedEndX) / 2;
            const centerY = (startY + adjustedEndY) / 2;

            // Account for skew: the visual center is offset horizontally.
            // At mid-height, the skew offset is (height/2) * skewFactor.
            const selHeight = size * dirY;
            const skewFactor = Math.tan((SKEW_ANGLE * Math.PI) / 180);
            const skewOffset = (selHeight / 2) * skewFactor;
            const centerX = geometricCenterX + skewOffset;

            worldMapStore.centerOnWorld(centerX, centerY);
          }
        },

        // Middle mouse button for panning in select mode.
        onMiddleDrag: (_x, _y, dx, dy) => {
          worldMapStore.pan(dx, dy);
        },

        // Allow scroll to zoom even in select mode.
        onScroll: (x, y, deltaY) => {
          worldMapStore.zoomAtPoint(x, y, deltaY);
        },

        // Track zone on hover.
        onHover: (x, y) => {
          getZoneStore().updateFromScreenPosition(
            x,
            y,
            resolution.width,
            resolution.height
          );
        },
      });
    },

    render(ctx: RenderContext) {
      const mode = getOverlayStore().getInteractionMode();
      const bounds = getSelectionStore().getBounds();
      const { width: spriteWidth, height: spriteHeight } =
        getWorldMapStore().getSpriteSize();
      ctx.save();

      // Determine if at max size and set border color.
      const atLimit = bounds ? isAtMaxSize(bounds, spriteWidth) : false;
      const borderColor = atLimit ? "rgba(255, 196, 0, 1)" : "white";

      // In pan mode, only render selection if it exists (with reduced opacity).
      if (mode === "pan") {
        if (!bounds) return;
        ctx.save();
        ctx.globalAlpha = PAN_MODE_SELECTION_OPACITY;
        renderSelectionBorder(ctx, bounds, borderColor);
        ctx.restore();
        return;
      }

      // In select mode, render overlay and selection.
      if (mode !== "select") return;

      // Draw semi-transparent overlay (in world/sprite coordinates).
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${OVERLAY_OPACITY})`;
      ctx.fillRect(0, 0, spriteWidth, spriteHeight);

      // If we have a selection, cut it out and draw border.
      if (bounds) {
        renderSelectionCutout(ctx, bounds, borderColor);
      }

      ctx.restore();
    },
  }
);
