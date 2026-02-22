import { RenderContext } from "../../../engine/canvas";
import { loadSprite, drawSprite, Sprite } from "../../../engine/sprites";
import { defineElement } from "../../../engine/elements";

/** A type representing props for the logo element. */
export type LogoProps = {
  /** The X position in pixels. */
  x: number;

  /** The Y position in pixels. */
  y: number;

  /** The optional scale factor. */
  scale?: number;
};

/** The logo sprite instance. */
let sprite: Sprite | null = null;

/**
 * Logo element definition.
 */
export const Logo = defineElement<LogoProps>({
  async load() {
    sprite = await loadSprite("/sprites/logo@64px.png");
  },

  render(context: RenderContext, props) {
    if (!sprite) return;
    drawSprite(context, sprite, props.x, props.y, props.scale ?? 1);
  },

  getSize() {
    return {
      width: sprite?.width ?? 0,
      height: sprite?.height ?? 0,
    };
  },
});
