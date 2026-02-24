import { SelectionBounds } from "./stores/selection";
import { getWorldMapStore } from "./stores/world-map";

/** The cached heightmap image bitmap. */
let heightmapImage: ImageBitmap | null = null;

/** Loads and caches the heightmap image. */
async function loadHeightmap(): Promise<ImageBitmap> {
  // Return the cached image if available.
  if (heightmapImage) return heightmapImage;

  // Fetch and decode the heightmap sprite.
  const response = await fetch("/sprites/height-map.png");
  const blob = await response.blob();
  heightmapImage = await createImageBitmap(blob);
  return heightmapImage;
}

/**
 * Crops a region from the heightmap and downloads it as a PNG.
 *
 * @param bounds - The selection bounds in sprite pixel coords.
 *
 * @param resolution - The output image size in pixels (square).
 */
export async function requestHeightmap(
  bounds: SelectionBounds,
  resolution: number
): Promise<void> {
  const heightmap = await loadHeightmap();
  const { width: spriteWidth, height: spriteHeight } =
    getWorldMapStore().getSpriteSize();

  // Enforce 1:1 ratio matching the renderer (selection.ts:117-132).
  const deltaX = bounds.endX - bounds.startX;
  const deltaY = bounds.endY - bounds.startY;
  const size = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  const directionX = deltaX >= 0 ? 1 : -1;
  const directionY = deltaY >= 0 ? 1 : -1;
  const adjustedEndX = bounds.startX + size * directionX;
  const adjustedEndY = bounds.startY + size * directionY;
  const minX = Math.min(bounds.startX, adjustedEndX);
  const maxX = Math.max(bounds.startX, adjustedEndX);
  const minY = Math.min(bounds.startY, adjustedEndY);
  const maxY = Math.max(bounds.startY, adjustedEndY);

  // Scale from sprite pixel coords to heightmap pixel coords.
  const scaleX = heightmap.width / spriteWidth;
  const scaleY = heightmap.height / spriteHeight;
  const sourceX = Math.max(0, Math.round(minX * scaleX));
  const sourceY = Math.max(0, Math.round(minY * scaleY));
  const sourceWidth = Math.min(
    Math.round((maxX - minX) * scaleX),
    heightmap.width - sourceX
  );
  const sourceHeight = Math.min(
    Math.round((maxY - minY) * scaleY),
    heightmap.height - sourceY
  );

  // Crop and scale to the requested resolution.
  const canvas = new OffscreenCanvas(resolution, resolution);
  const context = canvas.getContext("2d")!;
  context.imageSmoothingEnabled = false;
  context.drawImage(
    heightmap,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    resolution,
    resolution
  );

  // Download the cropped heightmap as a PNG.
  const blob = await canvas.convertToBlob({ type: "image/png" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `heightmap-${resolution}x${resolution}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
