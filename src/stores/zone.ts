/**
 * Zone store.
 * Loads zone map and provides zone detection from screen coordinates.
 * Zones include countries, territories, oceans, and seas.
 */

import { defineStore, StoreDefinition, notifyStore } from "../engine/stores";
import { getWorldMapStore } from "./world-map";

/** Zone store state. */
export interface ZoneStoreState {
  /** Load the zone map image. */
  load: () => Promise<void>;

  /** Update the hovered zone based on screen coordinates. */
  updateFromScreenPosition: (
    screenX: number,
    screenY: number,
    viewportWidth: number,
    viewportHeight: number
  ) => void;

  /** Get the currently hovered zone name. */
  getZoneName: () => string;

  /** Clear the current zone (e.g., when pointer leaves). */
  clearZone: () => void;
}

/** The zone map image data for pixel sampling. */
let zoneMapData: ImageData | null = null;
let mapWidth = 0;
let mapHeight = 0;

/** Currently detected zone name. */
let currentZoneName = "";

/** Pending zone name (waiting for debounce). */
let pendingZoneName = "";

/** Debounce timer for zone name updates. */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounce delay in milliseconds. */
const DEBOUNCE_DELAY = 50;

/** Map of numeric color codes to zone names. */
let zones: Map<number, string> | null = null;

/**
 * Parse a hex color string to a number.
 */
function parseHexColor(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

/**
 * Load zone data from JSON file.
 */
async function loadZonesData(): Promise<void> {
  if (zones) return;

  const response = await fetch("/data/zones.json");
  if (!response.ok) {
    throw new Error("Failed to load zones data");
  }

  const data: Record<string, string> = await response.json();
  zones = new Map();

  for (const [hex, name] of Object.entries(data)) {
    zones.set(parseHexColor(hex), name);
  }
}

/**
 * Get zone name from color code.
 */
function getZoneName(code: number): string {
  if (!zones) return "";
  return zones.get(code) ?? "";
}

/**
 * Load the zone map and extract pixel data for sampling.
 */
async function loadZoneMap(): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Create offscreen canvas to extract pixel data.
      const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      zoneMapData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
      mapWidth = img.naturalWidth;
      mapHeight = img.naturalHeight;
      resolve();
    };

    img.onerror = () => {
      reject(new Error("Failed to load zone map"));
    };

    img.src = "/sprites/zone-map.png";
  });
}

/**
 * Convert screen coordinates to world (sprite) coordinates.
 */
function screenToWorld(
  screenX: number,
  screenY: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } {
  const store = getWorldMapStore();
  const zoom = store.getZoom();
  const offsetX = store.getOffsetX();
  const offsetY = store.getOffsetY();
  const { width: spriteWidth, height: spriteHeight } = store.getSpriteSize();

  // Calculate where the map is drawn on screen.
  const scaledWidth = spriteWidth * zoom;
  const scaledHeight = spriteHeight * zoom;
  const mapX = Math.round((viewportWidth - scaledWidth) / 2) + offsetX;
  const mapY = Math.round((viewportHeight - scaledHeight) / 2) + offsetY;

  // Convert screen position to world position.
  const worldX = (screenX - mapX) / zoom;
  const worldY = (screenY - mapY) / zoom;

  return { x: worldX, y: worldY };
}

/**
 * Sample the zone map at the given world coordinates.
 * Returns the color code encoded in the RGB value.
 */
function sampleZoneCode(worldX: number, worldY: number): number {
  if (!zoneMapData) return 0;

  // Round to pixel coordinates.
  const px = Math.floor(worldX);
  const py = Math.floor(worldY);

  // Bounds check.
  if (px < 0 || px >= mapWidth || py < 0 || py >= mapHeight) {
    return 0;
  }

  // Get pixel index (RGBA, 4 bytes per pixel).
  const idx = (py * mapWidth + px) * 4;
  const r = zoneMapData.data[idx];
  const g = zoneMapData.data[idx + 1];
  const b = zoneMapData.data[idx + 2];

  // Combine RGB to get zone code.
  return (r << 16) | (g << 8) | b;
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
    await Promise.all([loadZoneMap(), loadZonesData()]);
  },

  updateFromScreenPosition(
    screenX: number,
    screenY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    const world = screenToWorld(
      screenX,
      screenY,
      viewportWidth,
      viewportHeight
    );
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

  clearZone() {
    if (currentZoneName !== "") {
      currentZoneName = "";
      notifyStore(ZoneStore);
    }
  },
}));
