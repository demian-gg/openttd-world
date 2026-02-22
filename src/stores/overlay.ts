/**
 * Overlay store.
 * Provides shared state for overlay UI interaction modes.
 */

import { defineStore, StoreDefinition, notifyStore } from "../engine/stores";

/** Available interaction modes. */
export type InteractionMode = "pan" | "select";

/** A type representing overlay store state. */
export type OverlayStoreState = {
  /** Gets the current interaction mode. */
  getInteractionMode: () => InteractionMode;

  /** Toggles between pan and select modes. */
  toggleInteractionMode: () => void;
};

/** The current interaction mode. */
let interactionMode: InteractionMode = "pan";

/**
 * Overlay store definition.
 */
export const {
  store: OverlayStore,
  init: initOverlayStore,
  get: getOverlayStore,
}: StoreDefinition<OverlayStoreState> = defineStore(() => ({
  getInteractionMode() {
    return interactionMode;
  },
  toggleInteractionMode() {
    interactionMode = interactionMode === "pan" ? "select" : "pan";
    notifyStore(OverlayStore);
  },
}));
