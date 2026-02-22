import { defineStore, StoreDefinition, notifyStore } from "../engine/stores";

/** A type representing selection bounds in world coordinates. */
export type SelectionBounds = {
  startX: number;
  startY: number;
  endX: number;
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
}));
