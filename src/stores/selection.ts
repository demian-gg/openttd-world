/**
 * Selection store.
 * Provides shared state for the selection tool.
 */

import { defineStore, StoreDefinition, notifyStore } from "../engine/stores";

/** Selection bounds in world coordinates. */
export interface SelectionBounds {
  /** Start X in world pixels. */
  startX: number;
  /** Start Y in world pixels. */
  startY: number;
  /** End X in world pixels. */
  endX: number;
  /** End Y in world pixels. */
  endY: number;
}

/** Selection store state. */
export interface SelectionStoreState {
  /** Whether user is currently dragging to create a selection. */
  isSelecting: () => boolean;

  /** Get the current selection bounds (null if no selection). */
  getBounds: () => SelectionBounds | null;

  /** Start a new selection at a point. */
  startSelection: (x: number, y: number) => void;

  /** Update the selection end point. */
  updateSelection: (x: number, y: number) => void;

  /** Finish the selection. */
  endSelection: () => void;

  /** Clear the current selection. */
  clearSelection: () => void;
}

/** Internal state. */
let selecting = false;
let bounds: SelectionBounds | null = null;

/**
 * Selection store definition.
 */
export const {
  store: SelectionStore,
  init: initSelectionStore,
  get: getSelectionStore,
}: StoreDefinition<SelectionStoreState> = defineStore(() => ({
  isSelecting() {
    return selecting;
  },

  getBounds() {
    return bounds;
  },

  startSelection(x: number, y: number) {
    selecting = true;
    bounds = { startX: x, startY: y, endX: x, endY: y };
    notifyStore(SelectionStore);
  },

  updateSelection(x: number, y: number) {
    if (!bounds) return;
    bounds.endX = x;
    bounds.endY = y;
    notifyStore(SelectionStore);
  },

  endSelection() {
    selecting = false;
    notifyStore(SelectionStore);
  },

  clearSelection() {
    selecting = false;
    bounds = null;
    notifyStore(SelectionStore);
  },
}));
