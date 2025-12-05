/**
 * Overlay store.
 * Provides shared state for overlay UI interaction modes.
 */

import { defineStore, StoreDefinition, notifyStore } from "../engine/stores";

/** Available interaction modes. */
export type InteractionMode = "pan" | "select";

/** Overlay store state. */
export interface OverlayStoreState {
  /** Get the current interaction mode. */
  getInteractionMode: () => InteractionMode;

  /** Set the interaction mode. */
  setInteractionMode: (mode: InteractionMode) => void;

  /** Toggle between pan and select modes. */
  toggleInteractionMode: () => void;
}

/** Internal state. */
let interactionMode: InteractionMode = "pan";

/**
 * Overlay store definition.
 */
export const {
  store: OverlayStore,
  register: registerOverlayStore,
  get: getOverlayStore,
}: StoreDefinition<OverlayStoreState> = defineStore("overlay", () => ({
  getInteractionMode() {
    return interactionMode;
  },
  setInteractionMode(mode: InteractionMode) {
    interactionMode = mode;
    notifyStore(OverlayStore);
  },
  toggleInteractionMode() {
    interactionMode = interactionMode === "pan" ? "select" : "pan";
    notifyStore(OverlayStore);
  },
}));
