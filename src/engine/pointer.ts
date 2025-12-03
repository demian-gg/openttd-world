/**
 * Pointer handling for click/touch interactions.
 * Components register pointer areas each frame during render.
 *
 * Supports both mouse and touch input:
 * - Mouse: click, drag, scroll wheel
 * - Touch: tap, single-finger drag, two-finger pinch-to-zoom
 */

import {
  engineEvents,
  EngineSetupEvent,
  EngineStartedEvent,
  EngineStoppedEvent,
} from "./events";
import { getCanvasContext } from "./canvas";

/** A pointer area registered by a component. */
export interface PointerArea {
  /** X position in game pixels. */
  x: number;

  /** Y position in game pixels. */
  y: number;

  /** Width in game pixels. */
  width: number;

  /** Height in game pixels. */
  height: number;

  /** Layer for z-ordering (higher = on top). */
  layer: number;

  /** Callback when this area is clicked (not fired if dragged). */
  onClick?: (x: number, y: number) => void;

  /** Callback when drag starts on this area. */
  onDragStart?: (x: number, y: number) => void;

  /** Callback while dragging. */
  onDrag?: (x: number, y: number, deltaX: number, deltaY: number) => void;

  /** Callback when drag ends. */
  onDragEnd?: (x: number, y: number) => void;

  /** Callback when scrolling over this area. */
  onScroll?: (x: number, y: number, deltaY: number) => void;
}

/** Registered pointer areas for the current frame. */
let pointerAreas: PointerArea[] = [];

/**
 * Clear all registered pointer areas.
 * Called at the start of each frame.
 */
export function clearPointerAreas(): void {
  pointerAreas = [];
}

/**
 * Register a pointer area for this frame.
 *
 * @param area - The pointer area to register.
 */
export function registerPointerArea(area: PointerArea): void {
  pointerAreas.push(area);
}

/**
 * Convert display coordinates to game pixel coordinates.
 * Since canvas is 1:1 with screen, this is just flooring.
 */
function displayToGameCoords(
  displayX: number,
  displayY: number
): { x: number; y: number } {
  return { x: Math.floor(displayX), y: Math.floor(displayY) };
}

/**
 * Check if a point is inside a pointer area.
 */
function isPointInArea(x: number, y: number, area: PointerArea): boolean {
  return (
    x >= area.x &&
    x < area.x + area.width &&
    y >= area.y &&
    y < area.y + area.height
  );
}

/**
 * Find the topmost hit area at a point.
 */
function findTopHitArea(x: number, y: number): PointerArea | null {
  const hits = pointerAreas.filter((area) => isPointInArea(x, y, area));
  if (hits.length === 0) return null;

  // Sort by layer descending (highest layer first).
  hits.sort((a, b) => b.layer - a.layer);
  return hits[0];
}

/** Minimum distance in game pixels to consider a drag vs click. */
const DRAG_THRESHOLD = 2;

/** Current drag state. */
let dragState: {
  area: PointerArea;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  isDragging: boolean;
} | null = null;

/**
 * Handle mouse down event on the canvas.
 */
function handlePointerDown(event: MouseEvent): void {
  const { x, y } = displayToGameCoords(event.clientX, event.clientY);
  const hitArea = findTopHitArea(x, y);

  if (hitArea && hitArea.onDrag) {
    // Only track drag state if the area supports dragging.
    dragState = {
      area: hitArea,
      startX: x,
      startY: y,
      lastX: x,
      lastY: y,
      isDragging: false,
    };
  }
}

/**
 * Handle mouse move to update cursor style and handle dragging.
 */
function handlePointerMove(event: MouseEvent): void {
  const { canvas } = getCanvasContext();
  const { x, y } = displayToGameCoords(event.clientX, event.clientY);

  // Handle drag in progress.
  if (dragState) {
    const distX = Math.abs(x - dragState.startX);
    const distY = Math.abs(y - dragState.startY);

    // Check if we've exceeded the drag threshold.
    if (
      !dragState.isDragging &&
      (distX > DRAG_THRESHOLD || distY > DRAG_THRESHOLD)
    ) {
      dragState.isDragging = true;
      dragState.area.onDragStart?.(dragState.startX, dragState.startY);
    }

    // Fire drag callback if dragging.
    if (dragState.isDragging) {
      const deltaX = x - dragState.lastX;
      const deltaY = y - dragState.lastY;
      dragState.area.onDrag?.(x, y, deltaX, deltaY);
      dragState.lastX = x;
      dragState.lastY = y;
    }

    // Show grabbing cursor while dragging.
    canvas.style.cursor = dragState.isDragging ? "grabbing" : "pointer";
    return;
  }

  // Update cursor based on hover.
  const isOverPointerArea = pointerAreas.some((area) =>
    isPointInArea(x, y, area)
  );
  canvas.style.cursor = isOverPointerArea ? "pointer" : "default";
}

/**
 * Handle mouse up event on the canvas.
 */
function handlePointerUp(event: MouseEvent): void {
  const { x, y } = displayToGameCoords(event.clientX, event.clientY);

  if (dragState) {
    if (dragState.isDragging) {
      // End drag.
      dragState.area.onDragEnd?.(x, y);
    } else {
      // Was a click on a draggable area (no significant movement).
      dragState.area.onClick?.(x, y);
    }
    dragState = null;
    return;
  }

  // Click on a non-draggable area.
  const hitArea = findTopHitArea(x, y);
  if (hitArea && !hitArea.onDrag) {
    hitArea.onClick?.(x, y);
  }
}

/**
 * Handle mouse wheel event on the canvas.
 */
function handleWheel(event: WheelEvent): void {
  const { x, y } = displayToGameCoords(event.clientX, event.clientY);
  const hitArea = findTopHitArea(x, y);

  if (hitArea?.onScroll) {
    event.preventDefault();
    hitArea.onScroll(x, y, event.deltaY);
  }
}

/** Whether pointer listeners are attached. */
let active = false;

/** Pinch zoom state for two-finger touch gestures. */
let pinchState: {
  /** Distance between fingers at gesture start, used to calculate zoom delta. */
  initialDistance: number;
  /** Center X of pinch in game coords, used as zoom anchor point. */
  centerX: number;
  /** Center Y of pinch in game coords, used as zoom anchor point. */
  centerY: number;
} | null = null;

/**
 * Calculate the distance between two touch points.
 * Used to detect pinch-to-zoom gesture magnitude.
 */
function getTouchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get the midpoint between two touch points.
 * This becomes the anchor point for pinch-to-zoom (zoom centers on this point).
 */
function getTouchCenter(touches: TouchList): { x: number; y: number } {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

/**
 * Handle touch start event.
 * Single finger initiates drag, two fingers initiate pinch-to-zoom.
 */
function handleTouchStart(event: TouchEvent): void {
  if (event.touches.length === 1) {
    // Single finger touch - behaves like mouse down for dragging.
    const touch = event.touches[0];
    const { x, y } = displayToGameCoords(touch.clientX, touch.clientY);
    const hitArea = findTopHitArea(x, y);

    if (hitArea && hitArea.onDrag) {
      dragState = {
        area: hitArea,
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        isDragging: false,
      };
    }
  } else if (event.touches.length === 2) {
    // Two fingers down - start pinch-to-zoom gesture.
    // Prevent default to stop browser's native pinch zoom.
    event.preventDefault();

    // Record initial finger distance and center point.
    // We'll compare against this to calculate zoom delta.
    const center = getTouchCenter(event.touches);
    const { x, y } = displayToGameCoords(center.x, center.y);

    pinchState = {
      initialDistance: getTouchDistance(event.touches),
      centerX: x,
      centerY: y,
    };

    // Cancel any in-progress single-finger drag since user switched to pinch.
    if (dragState?.isDragging) {
      dragState.area.onDragEnd?.(x, y);
    }
    dragState = null;
  }
}

/**
 * Handle touch move event.
 * Continues drag or pinch-to-zoom depending on finger count.
 */
function handleTouchMove(event: TouchEvent): void {
  if (event.touches.length === 1 && dragState) {
    // Single finger moving - handle as drag (panning the map).
    event.preventDefault();
    const touch = event.touches[0];
    const { x, y } = displayToGameCoords(touch.clientX, touch.clientY);

    // Check if finger has moved far enough to be considered a drag vs a tap.
    const distX = Math.abs(x - dragState.startX);
    const distY = Math.abs(y - dragState.startY);

    if (
      !dragState.isDragging &&
      (distX > DRAG_THRESHOLD || distY > DRAG_THRESHOLD)
    ) {
      dragState.isDragging = true;
      dragState.area.onDragStart?.(dragState.startX, dragState.startY);
    }

    // Fire drag callback with delta from last position.
    if (dragState.isDragging) {
      const deltaX = x - dragState.lastX;
      const deltaY = y - dragState.lastY;
      dragState.area.onDrag?.(x, y, deltaX, deltaY);
      dragState.lastX = x;
      dragState.lastY = y;
    }
  } else if (event.touches.length === 2 && pinchState) {
    // Two fingers moving - handle pinch-to-zoom.
    event.preventDefault();

    // Calculate how much the finger distance changed.
    // Ratio > 1 means fingers moved apart (zoom in).
    // Ratio < 1 means fingers moved together (zoom out).
    const newDistance = getTouchDistance(event.touches);
    const center = getTouchCenter(event.touches);
    const { x, y } = displayToGameCoords(center.x, center.y);

    // Convert pinch ratio to a scroll-like delta for the onScroll callback.
    // We invert it (initial/new) so spreading fingers = negative delta = zoom in.
    const scale = pinchState.initialDistance / newDistance;
    const deltaY = (scale - 1) * 100;

    // Fire scroll callback on the area under the pinch center.
    const hitArea = findTopHitArea(x, y);
    if (hitArea?.onScroll) {
      hitArea.onScroll(x, y, deltaY);
    }

    // Update baseline for next move event (makes zooming smooth/continuous).
    pinchState.initialDistance = newDistance;
    pinchState.centerX = x;
    pinchState.centerY = y;
  }
}

/**
 * Handle touch end and cancel events.
 * Ends drag or pinch gesture, fires click on tap.
 */
function handleTouchEnd(event: TouchEvent): void {
  if (event.touches.length === 0) {
    // All fingers lifted - gesture complete.
    if (dragState) {
      // Get the position of the finger that was lifted.
      const touch = event.changedTouches[0];
      const { x, y } = displayToGameCoords(touch.clientX, touch.clientY);

      if (dragState.isDragging) {
        // Was dragging - fire drag end.
        dragState.area.onDragEnd?.(x, y);
      } else {
        // Finger lifted without significant movement - treat as tap/click.
        dragState.area.onClick?.(x, y);
      }
      dragState = null;
    }
    pinchState = null;
  } else if (event.touches.length === 1) {
    // Went from 2 fingers to 1 - end pinch, could start new drag.
    pinchState = null;
  }
}

/**
 * Handle engine started event.
 * Attaches pointer listeners to the canvas.
 */
function handleEngineStarted(): void {
  if (active) return;

  const { canvas } = getCanvasContext();

  // Mouse events.
  canvas.addEventListener("mousedown", handlePointerDown);
  canvas.addEventListener("mousemove", handlePointerMove);
  canvas.addEventListener("mouseup", handlePointerUp);
  canvas.addEventListener("wheel", handleWheel, { passive: false });

  // Touch events (passive: false allows preventDefault for pinch-zoom).
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  canvas.addEventListener("touchend", handleTouchEnd);
  canvas.addEventListener("touchcancel", handleTouchEnd);

  active = true;
}

/**
 * Handle engine stopped event.
 * Removes listeners from the canvas.
 */
function handleEngineStopped(): void {
  if (!active) return;

  const { canvas } = getCanvasContext();

  // Mouse events.
  canvas.removeEventListener("mousedown", handlePointerDown);
  canvas.removeEventListener("mousemove", handlePointerMove);
  canvas.removeEventListener("mouseup", handlePointerUp);
  canvas.removeEventListener("wheel", handleWheel);

  // Touch events.
  canvas.removeEventListener("touchstart", handleTouchStart);
  canvas.removeEventListener("touchmove", handleTouchMove);
  canvas.removeEventListener("touchend", handleTouchEnd);
  canvas.removeEventListener("touchcancel", handleTouchEnd);

  canvas.style.cursor = "default";
  dragState = null;
  pinchState = null;

  active = false;
}

// Self-register on engine setup.
engineEvents.on(EngineSetupEvent, () => {
  engineEvents.on(EngineStartedEvent, handleEngineStarted);
  engineEvents.on(EngineStoppedEvent, handleEngineStopped);
});
