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

  /** Callback when this area is clicked. */
  onClick: (x: number, y: number) => void;
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
 * Handle a click event on the canvas.
 */
function handlePointerClick(event: MouseEvent): void {
  const { x, y } = displayToGameCoords(event.clientX, event.clientY);

  // Find all areas containing the click point, if any.
  const hits = pointerAreas.filter((area) => isPointInArea(x, y, area));
  if (hits.length === 0) return;

  // Sort by layer descending (highest layer first).
  hits.sort((a, b) => b.layer - a.layer);

  // Trigger the topmost hit.
  hits[0].onClick(x, y);
}

/**
 * Handle mouse move to update cursor style.
 */
function handlePointerMove(event: MouseEvent): void {
  const { canvas } = getCanvasContext();
  const { x, y } = displayToGameCoords(event.clientX, event.clientY);

  // Check if cursor is over any pointer area.
  const isOverPointerArea = pointerAreas.some((area) =>
    isPointInArea(x, y, area)
  );

  canvas.style.cursor = isOverPointerArea ? "pointer" : "default";
}

/** Whether pointer listeners are attached. */
let active = false;

/**
 * Handle engine started event.
 * Attaches click and move listeners to the canvas.
 */
function handleEngineStarted(): void {
  if (active) return;

  const { canvas } = getCanvasContext();
  canvas.addEventListener("click", handlePointerClick);
  canvas.addEventListener("mousemove", handlePointerMove);

  active = true;
}

/**
 * Handle engine stopped event.
 * Removes listeners from the canvas.
 */
function handleEngineStopped(): void {
  if (!active) return;

  const { canvas } = getCanvasContext();
  canvas.removeEventListener("click", handlePointerClick);
  canvas.removeEventListener("mousemove", handlePointerMove);
  canvas.style.cursor = "default";

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
