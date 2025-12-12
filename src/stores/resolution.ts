/**
 * Resolution store.
 * Provides shared state for world map resolution selection.
 */

import { defineStore, StoreDefinition, notifyStore } from "../engine/stores";

/** Available resolution options. */
export const RESOLUTIONS = [
  "256x256",
  "512x512",
  "1024x1024",
  "2048x2048",
] as const;

/** Resolution type. */
export type Resolution = (typeof RESOLUTIONS)[number];

/** A type representing resolution store state. */
export type ResolutionStoreState = {
  /** Gets the current resolution. */
  getResolution: () => Resolution;

  /** Gets the current resolution index. */
  getResolutionIndex: () => number;

  /** Sets the resolution by value. */
  setResolution: (resolution: Resolution) => void;

  /** Steps up to the next resolution. */
  stepUp: () => void;

  /** Steps down to the previous resolution. */
  stepDown: () => void;
};

/** The current resolution index. */
let currentIndex = 2;

/**
 * Resolution store definition.
 */
export const {
  store: ResolutionStore,
  init: initResolutionStore,
  get: getResolutionStore,
}: StoreDefinition<ResolutionStoreState> = defineStore(() => ({
  getResolution() {
    return RESOLUTIONS[currentIndex];
  },
  getResolutionIndex() {
    return currentIndex;
  },
  setResolution(resolution: Resolution) {
    const index = RESOLUTIONS.indexOf(resolution);
    if (index !== -1) {
      currentIndex = index;
      notifyStore(ResolutionStore);
    }
  },
  stepUp() {
    currentIndex = (currentIndex + 1) % RESOLUTIONS.length;
    notifyStore(ResolutionStore);
  },
  stepDown() {
    currentIndex = (currentIndex - 1 + RESOLUTIONS.length) % RESOLUTIONS.length;
    notifyStore(ResolutionStore);
  },
}));
