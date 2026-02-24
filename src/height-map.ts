import { SelectionBounds } from "./stores/selection";
import { getWorldMapStore } from "./stores/world-map";

/** The skew angle in degrees, matching selection.ts. */
const SKEW_ANGLE = -30;

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
 * Crops a skewed region from the heightmap, unskews it,
 * and downloads the result as a PNG.
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

  // Normalize to top-left origin with positive dimensions.
  const selectionWidth = size * directionX;
  const selectionHeight = size * directionY;
  const topLeftX = Math.min(bounds.startX, bounds.startX + selectionWidth);
  const topLeftY = Math.min(bounds.startY, bounds.startY + selectionHeight);
  const width = Math.abs(selectionWidth);
  const height = Math.abs(selectionHeight);

  // Build an affine transform that maps the skewed parallelogram
  // in heightmap pixel space to an unskewed rectangle on the canvas.
  const skewFactor = Math.tan((SKEW_ANGLE * Math.PI) / 180);
  const scaleX = heightmap.width / spriteWidth;
  const scaleY = heightmap.height / spriteHeight;
  const horizontalScale = resolution / width;
  const counterSkew = -horizontalScale * skewFactor;
  const verticalScale = resolution / height;

  // Crop, unskew, and scale to the requested resolution.
  const canvas = new OffscreenCanvas(resolution, resolution);
  const context = canvas.getContext("2d")!;
  context.imageSmoothingEnabled = false;
  context.setTransform(
    horizontalScale / scaleX,
    0,
    counterSkew / scaleY,
    verticalScale / scaleY,
    -horizontalScale * topLeftX - counterSkew * topLeftY,
    -verticalScale * topLeftY
  );
  context.drawImage(heightmap, 0, 0);

  // Download the unskewed heightmap as a PNG.
  const blob = await canvas.convertToBlob({ type: "image/png" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `heightmap-${resolution}x${resolution}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
