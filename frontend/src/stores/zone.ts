/**
 * Zone store.
 *
 * Loads zone map and provides zone detection from screen coordinates.
 * Zones include countries, territories, oceans, and seas.
 */

import { defineStore, StoreDefinition, notifyStore } from "../engine/stores";
import { screenToWorld } from "../engine/utils";

/** A type representing zone store state. */
export type ZoneStoreState = {
  /** Loads the zone map image. */
  load: () => Promise<void>;

  /** Updates the hovered zone based on screen coordinates. */
  updateFromScreenPosition: (
    screenX: number,
    screenY: number,
    viewportWidth: number,
    viewportHeight: number
  ) => void;

  /** Gets the currently hovered zone name. */
  getZoneName: () => string;
};

/** The debounce delay in milliseconds. */
const DEBOUNCE_DELAY = 50;

/** The zone map image data for pixel sampling. */
let zoneMapData: ImageData | null = null;

/** The zone map width in pixels. */
let mapWidth = 0;

/** The zone map height in pixels. */
let mapHeight = 0;

/** The currently detected zone name. */
let currentZoneName = "";

/** The pending zone name (waiting for debounce). */
let pendingZoneName = "";

/** The debounce timer for zone name updates. */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** The map of numeric color codes to zone names. */
let zones: Map<number, string> | null = null;

/**
 * Parses a hex color string to a number.
 *
 * @param hex - The hex color string (e.g., "#ff0000").
 *
 * @returns The numeric color value.
 */
function parseHexColor(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

/**
 * Loads zone data from JSON file.
 */
async function loadZonesData(): Promise<void> {
  if (zones) return;

  // Fetch zone data.
  const response = await fetch("/data/zones.json");
  if (!response.ok) {
    throw new Error("Failed to load zones data");
  }

  // Parse JSON and build lookup map.
  const data: Record<string, string> = await response.json();
  zones = new Map();

  for (const [hex, name] of Object.entries(data)) {
    zones.set(parseHexColor(hex), name);
  }
}

/**
 * Gets zone name from color code.
 *
 * @param code - The numeric color code.
 *
 * @returns The zone name or empty string if not found.
 */
function getZoneName(code: number): string {
  if (!zones) return "";
  return zones.get(code) ?? "";
}

/**
 * Loads the zone map and extracts pixel data for sampling.
 */
async function loadZoneMap(): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      // Create offscreen canvas to extract pixel data.
      const canvas = new OffscreenCanvas(image.naturalWidth, image.naturalHeight);
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Extract image data for pixel sampling.
      context.drawImage(image, 0, 0);
      zoneMapData = context.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
      mapWidth = image.naturalWidth;
      mapHeight = image.naturalHeight;
      resolve();
    };

    image.onerror = () => {
      reject(new Error("Failed to load zone map"));
    };

    image.src = "/sprites/zone-map.png";
  });
}

/**
 * Samples the zone map at the given world coordinates.
 *
 * @param worldX - The world X coordinate.
 * @param worldY - The world Y coordinate.
 *
 * @returns The color code encoded in the RGB value.
 */
function sampleZoneCode(worldX: number, worldY: number): number {
  if (!zoneMapData) return 0;

  // Round to pixel coordinates.
  const pixelX = Math.floor(worldX);
  const pixelY = Math.floor(worldY);

  // Check bounds.
  if (pixelX < 0 || pixelX >= mapWidth || pixelY < 0 || pixelY >= mapHeight) {
    return 0;
  }

  // Get pixel index (RGBA, 4 bytes per pixel).
  const index = (pixelY * mapWidth + pixelX) * 4;
  const red = zoneMapData.data[index];
  const green = zoneMapData.data[index + 1];
  const blue = zoneMapData.data[index + 2];

  // Combine RGB to get zone code.
  return (red << 16) | (green << 8) | blue;
}

/**
 * Zone store definition.
 */
export const {
  store: ZoneStore,
  init: initZoneStore,
  get: getZoneStore,
}: StoreDefinition<ZoneStoreState> = defineStore(() => ({
  async load() {
    // Load both zone map and zone data in parallel.
    await Promise.all([loadZoneMap(), loadZonesData()]);
  },

  updateFromScreenPosition(
    screenX: number,
    screenY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    // Convert screen coordinates to world coordinates.
    const world = screenToWorld(
      screenX,
      screenY,
      viewportWidth,
      viewportHeight
    );

    // Sample zone at world position.
    const code = sampleZoneCode(world.x, world.y);
    const name = getZoneName(code);

    // Show "Waters" for unassigned areas (#000000), otherwise show zone name.
    const displayName = name || "Waters";

    // Skip if same as pending name (already waiting to update).
    if (displayName === pendingZoneName) return;

    pendingZoneName = displayName;

    // Clear any existing timer.
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new debounced update.
    debounceTimer = setTimeout(() => {
      if (pendingZoneName !== currentZoneName) {
        currentZoneName = pendingZoneName;
        notifyStore(ZoneStore);
      }
      debounceTimer = null;
    }, DEBOUNCE_DELAY);
  },

  getZoneName() {
    return currentZoneName;
  },
}));
