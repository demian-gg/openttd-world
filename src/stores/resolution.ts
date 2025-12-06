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

/** Resolution store state. */
export interface ResolutionStoreState {
  /** Get the current resolution. */
  getResolution: () => Resolution;

  /** Get the current resolution index. */
  getResolutionIndex: () => number;

  /** Set the resolution by value. */
  setResolution: (resolution: Resolution) => void;

  /** Step up to the next resolution. */
  stepUp: () => void;

  /** Step down to the previous resolution. */
  stepDown: () => void;
}

/** Internal state. */
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
