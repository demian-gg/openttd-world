/**
 * Configuration for computing internal render resolution.
 * Controls how the engine scales pixel art to fit the display.
 */
export interface ResolutionConfig {
  /** Pixel scale factor for upscaling. A value of 2 renders at half resolution,
   * then upscales 2x. */
  pixelScale?: number;

  /** Minimum internal render width in game pixels. Prevents resolution from
   * dropping below this threshold. */
  minWidth?: number;

  /** Minimum internal render height in game pixels. Prevents resolution from
   * dropping below this threshold. */
  minHeight?: number;

  /** Maximum internal render width in game pixels. Caps resolution to prevent
   * excessive memory usage. */
  maxWidth?: number;

  /** Maximum internal render height in game pixels. Caps resolution to prevent
   * excessive memory usage. */
  maxHeight?: number;
}

/**
 * Computed internal resolution after applying pixel scaling and constraints.
 * Represents both the render target size and display size.
 */
export interface InternalResolution {
  /** Internal render width in game pixels. All game logic and rendering uses
   * this coordinate space. */
  width: number;

  /** Internal render height in game pixels. All game logic and rendering uses
   * this coordinate space. */
  height: number;

  /** Display width in CSS pixels. The canvas is stretched to this size
   * on screen. */
  displayWidth: number;

  /** Display height in CSS pixels. The canvas is stretched to this size
   * on screen. */
  displayHeight: number;

  /** The pixel scale factor used for this resolution. Stored for use during
   * resize operations. */
  pixelScale: number;
}

/**
 * Configuration for loading a sprite atlas.
 * Defines the source image and tile dimensions.
 */
export interface SpriteAtlasConfig {
  /** Path or URL to the sprite atlas image file. */
  src: string;

  /** Width of each tile in the atlas, in pixels. */
  tileWidth: number;

  /** Height of each tile in the atlas, in pixels. */
  tileHeight: number;
}

/**
 * Configuration passed to the engine init function.
 * Defines the canvas target and optional settings.
 */
export interface EngineConfig {
  /** The HTML canvas element to render into. Must be attached to the
   * DOM before init. */
  canvas: HTMLCanvasElement;

  /** Optional resolution configuration. If omitted, default pixel scale and
   * constraints are used. */
  resolution?: ResolutionConfig;

  /** Optional sprite atlas configuration. If provided, the atlas will be
   * loaded during init. */
  sprites?: SpriteAtlasConfig;
}

/**
 * Runtime state of the initialized engine.
 * Contains references to canvas, context, and current settings.
 */
export interface EngineState {
  /** The HTML canvas element being rendered to. */
  canvas: HTMLCanvasElement;

  /** The 2D rendering context for the canvas. */
  ctx: CanvasRenderingContext2D;

  /** The current computed internal resolution. */
  resolution: InternalResolution;

  /** The sprite atlas configuration, if provided. */
  sprites?: SpriteAtlasConfig;

  /** Whether the engine game loop is currently running. */
  running: boolean;
}
