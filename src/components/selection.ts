/**
 * Selection component.
 * Renders overlay and selection cutout when in select mode.
 */

import {
  defineComponent,
  ComponentProps,
  markComponentForUpdate,
} from "../engine/components";
import { RenderContext } from "../engine/canvas";
import { getEngineState } from "../engine/engine";
import { registerPointerArea } from "../engine/pointer";
import { subscribeStore } from "../engine/stores";
import {
  dirtyLayer,
  setLayerPosition,
  setLayerScale,
  setLayerSize,
} from "../engine/layers";
import { screenToWorld } from "../engine/utils";
import { getOverlayStore, OverlayStore } from "../stores/overlay";
import {
  getSelectionStore,
  SelectionStore,
  SelectionBounds,
} from "../stores/selection";
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

/**
 * Draws a dashed line using filled pixels (no anti-aliasing).
 *
 * Uses Bresenham's line algorithm for pixel-perfect diagonal lines.
 *
 * @param ctx - The rendering context.
 * @param startX - The start X coordinate.
 * @param startY - The start Y coordinate.
 * @param endX - The end X coordinate.
 * @param endY - The end Y coordinate.
 * @param color - The line color.
 */
function drawDashedLine(
  ctx: RenderContext,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string
): void {
  const DASH_LENGTH = 4;
  const GAP_LENGTH = 4;

  ctx.fillStyle = color;

  let x = Math.round(startX);
  let y = Math.round(startY);
  const roundedEndX = Math.round(endX);
  const roundedEndY = Math.round(endY);

  const deltaX = Math.abs(roundedEndX - x);
  const deltaY = Math.abs(roundedEndY - y);
  const stepX = x < roundedEndX ? 1 : -1;
  const stepY = y < roundedEndY ? 1 : -1;
  let error = deltaX - deltaY;

  let pixelCount = 0;
  const dashCycle = DASH_LENGTH + GAP_LENGTH;

  while (true) {
    if (pixelCount % dashCycle < DASH_LENGTH) {
      ctx.fillRect(x, y, 1, 1);
    }
    pixelCount++;

    if (x === roundedEndX && y === roundedEndY) break;

    const doubledError = 2 * error;
    if (doubledError > -deltaY) {
      error -= deltaY;
      x += stepX;
    }
    if (doubledError < deltaX) {
      error += deltaX;
      y += stepY;
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
  topLeftX: number;
  topLeftY: number;
  topRightX: number;
  topRightY: number;
  bottomRightX: number;
  bottomRightY: number;
  bottomLeftX: number;
  bottomLeftY: number;
} {
  const { startX, startY, endX, endY } = bounds;

  // Calculate size (enforce 1:1 ratio).
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const size = Math.max(Math.abs(deltaX), Math.abs(deltaY));

  // Determine direction.
  const directionX = deltaX >= 0 ? 1 : -1;
  const directionY = deltaY >= 0 ? 1 : -1;

  // Calculate selection rectangle dimensions.
  const selectionX = startX;
  const selectionY = startY;
  const selWidth = size * directionX;
  const selHeight = size * directionY;

  // Calculate skew factor.
  const skewFactor = Math.tan((SKEW_ANGLE * Math.PI) / 180);

  // Calculate skewed corner positions.
  return {
    topLeftX: selectionX,
    topLeftY: selectionY,
    topRightX: selectionX + selWidth,
    topRightY: selectionY,
    bottomRightX: selectionX + selWidth + selHeight * skewFactor,
    bottomRightY: selectionY + selHeight,
    bottomLeftX: selectionX + selHeight * skewFactor,
    bottomLeftY: selectionY + selHeight,
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
  const {
    topLeftX, topLeftY,
    topRightX, topRightY,
    bottomRightX, bottomRightY,
    bottomLeftX, bottomLeftY,
  } = calculateSkewedCorners(bounds);

  // Draw all four edges with shadow and white line.
  const edges: [number, number, number, number][] = [
    [topLeftX, topLeftY, topRightX, topRightY],
    [topRightX, topRightY, bottomRightX, bottomRightY],
    [bottomRightX, bottomRightY, bottomLeftX, bottomLeftY],
    [bottomLeftX, bottomLeftY, topLeftX, topLeftY],
  ];

  // Draw shadows first.
  for (const [startX, startY, endX, endY] of edges) {
    drawDashedLine(ctx, startX + 1, startY + 1, endX + 1, endY + 1, "rgba(0, 0, 0, 0.5)");
  }

  // Draw borders.
  for (const [startX, startY, endX, endY] of edges) {
    drawDashedLine(ctx, startX, startY, endX, endY, borderColor);
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
  const {
    topLeftX, topLeftY,
    topRightX, topRightY,
    bottomRightX, bottomRightY,
    bottomLeftX, bottomLeftY,
  } = calculateSkewedCorners(bounds);

  // Cut out selection from overlay.
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(topLeftX, topLeftY);
  ctx.lineTo(topRightX, topRightY);
  ctx.lineTo(bottomRightX, bottomRightY);
  ctx.lineTo(bottomLeftX, bottomLeftY);
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
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const sizePixels = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  const maxSizePixels = getMaxSizePixels(spriteWidth);
  // Use small tolerance for floating point comparison.
  return sizePixels >= maxSizePixels - 0.5;
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
            const deltaX = world.x - bounds.startX;
            const deltaY = world.y - bounds.startY;
            const size = Math.max(Math.abs(deltaX), Math.abs(deltaY));

            if (size > maxSize) {
              // Clamp to max size while preserving direction.
              const directionX = deltaX >= 0 ? 1 : -1;
              const directionY = deltaY >= 0 ? 1 : -1;
              world.x = bounds.startX + maxSize * directionX;
              world.y = bounds.startY + maxSize * directionY;
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
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const size = Math.max(Math.abs(deltaX), Math.abs(deltaY));
            const directionX = deltaX >= 0 ? 1 : -1;
            const directionY = deltaY >= 0 ? 1 : -1;
            const adjustedEndX = startX + size * directionX;
            const adjustedEndY = startY + size * directionY;

            // Find geometric center of selection.
            const geometricCenterX = (startX + adjustedEndX) / 2;
            const centerY = (startY + adjustedEndY) / 2;

            // Account for skew: the visual center is offset horizontally.
            // At mid-height, the skew offset is (height/2) * skewFactor.
            const selHeight = size * directionY;
            const skewFactor = Math.tan((SKEW_ANGLE * Math.PI) / 180);
            const skewOffset = (selHeight / 2) * skewFactor;
            const centerX = geometricCenterX + skewOffset;

            worldMapStore.centerOnWorld(centerX, centerY);
          }
        },

        // Handle middle mouse button for panning in select mode.
        onMiddleDrag: (_x, _y, deltaX, deltaY) => {
          worldMapStore.pan(deltaX, deltaY);
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
