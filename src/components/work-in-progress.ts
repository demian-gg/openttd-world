/**
 * Work-in-progress component.
 *
 * Renders a semi-transparent overlay with a centered work-in-progress sprite.
 * Blocks all click-through interaction.
 */

import {
  defineComponent,
  ComponentProps,
  createState,
} from "../engine/components";
import {
  loadSprite,
  drawSprite,
  Sprite,
  RenderContext,
} from "../engine/sprites";
import { getEngineState } from "../engine/engine";
import { registerPointerArea } from "../engine/pointer";

/** The overlay opacity. */
const OVERLAY_OPACITY = 0.75;

/** Component state. */
const sprite = createState<Sprite | null>(null);

/**
 * Work-in-progress component definition.
 */
export const { init: initWorkInProgressComponent } =
  defineComponent<ComponentProps>({
    async load() {
      const loadedSprite = await loadSprite("/sprites/work-in-progress.png");
      sprite.set(loadedSprite);
    },

    pointerAreas(props) {
      const { resolution } = getEngineState();
      const { layer } = props;

      // Register full-screen pointer area to block all interactions.
      registerPointerArea({
        x: 0,
        y: 0,
        width: resolution.width,
        height: resolution.height,
        layer,
        cursor: "default",
      });
    },

    render(ctx: RenderContext) {
      const { resolution } = getEngineState();
      const { width, height } = resolution;

      // Draw semi-transparent black overlay.
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${OVERLAY_OPACITY})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Draw centered sprite.
      const currentSprite = sprite.get();
      if (currentSprite) {
        const spriteX = Math.round((width - currentSprite.width) / 2);
        const spriteY = Math.round((height - currentSprite.height) / 2);
        drawSprite(ctx, currentSprite, spriteX, spriteY);
      }
    },
  });
