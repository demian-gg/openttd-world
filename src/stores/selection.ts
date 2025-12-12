/**
 * Selection store.
 * Provides shared state for the selection tool.
 */

import { defineStore, StoreDefinition, notifyStore } from "../engine/stores";

/** A type representing selection bounds in world coordinates. */
export type SelectionBounds = {
  /** The start X in world pixels. */
  startX: number;

  /** The start Y in world pixels. */
  startY: number;

  /** The end X in world pixels. */
  endX: number;

  /** The end Y in world pixels. */
  endY: number;
};

/** A type representing selection store state. */
export type SelectionStoreState = {
  /** Whether user is currently dragging to create a selection. */
  isSelecting: () => boolean;

  /** Gets the current selection bounds (null if no selection). */
  getBounds: () => SelectionBounds | null;

  /** Starts a new selection at a point. */
  startSelection: (x: number, y: number) => void;

  /** Updates the selection end point. */
  updateSelection: (x: number, y: number) => void;

  /** Finishes the selection. */
  endSelection: () => void;

  /** Clears the current selection. */
  clearSelection: () => void;
};

/** Whether user is currently selecting. */
let selecting = false;

/** The current selection bounds. */
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
