/**
 * Pointer handling for click/touch interactions.
 * Components register pointer areas each frame during render.
 */

import { getCanvasContext } from "./canvas";
import { engineEvents, EngineStartedEvent, EngineStoppedEvent } from "./engine";

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
 *
 * @param displayX - X in CSS pixels.
 * @param displayY - Y in CSS pixels.
 * @returns Coordinates in game pixels.
 */
function displayToGameCoords(
  displayX: number,
  displayY: number
): { x: number; y: number } {
  const { resolution } = getCanvasContext();
  const x = Math.floor(displayX / resolution.pixelScale);
  const y = Math.floor(displayY / resolution.pixelScale);
  return { x, y };
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

/** Whether pointer listeners are attached. */
let active = false;

/**
 * Handle engine started event.
 * Attaches pointer listeners to the canvas.
 */
function handleEngineStarted(): void {
  if (active) return;

  const { canvas } = getCanvasContext();
  canvas.addEventListener("mousedown", handlePointerDown);
  canvas.addEventListener("mousemove", handlePointerMove);
  canvas.addEventListener("mouseup", handlePointerUp);

  active = true;
}

/**
 * Handle engine stopped event.
 * Removes listeners from the canvas.
 */
function handleEngineStopped(): void {
  if (!active) return;

  const { canvas } = getCanvasContext();
  canvas.removeEventListener("mousedown", handlePointerDown);
  canvas.removeEventListener("mousemove", handlePointerMove);
  canvas.removeEventListener("mouseup", handlePointerUp);
  canvas.style.cursor = "default";
  dragState = null;

  active = false;
}

/**
 * Setup the pointer module.
 * Subscribes to engine lifecycle events.
 */
export function setupPointer(): void {
  engineEvents.addEventListener(EngineStartedEvent.type, handleEngineStarted);
  engineEvents.addEventListener(EngineStoppedEvent.type, handleEngineStopped);
}
