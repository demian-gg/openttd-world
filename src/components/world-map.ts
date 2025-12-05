/**
 * World map component.
 * Renders the world map sprite.
 */

import {
  loadSprite,
  drawSprite,
  Sprite,
  RenderContext,
} from "../engine/sprites";
import {
  defineComponent,
  ComponentProps,
  createState,
} from "../engine/components";
import { getEngineState } from "../engine/engine";
import { registerPointerArea } from "../engine/pointer";
import {
  setLayerPosition,
  setLayerScale,
  setLayerSize,
} from "../engine/layers";
import { getWorldMapStore } from "../stores/world-map";

/** Props for the world map component. */
export interface WorldMapProps extends ComponentProps {}

/** Component state. */
const sprite = createState<Sprite | null>(null);

/**
 * World map component definition.
 */
export const { register: registerWorldMap } = defineComponent<WorldMapProps>(
  "world-map",
  {
    async load() {
      const loadedSprite = await loadSprite("/sprites/world-map.png");
      sprite.set(loadedSprite);

      // Set sprite dimensions in store.
      const store = getWorldMapStore();
      store.setSpriteSize(loadedSprite.width, loadedSprite.height);
    },

    update(props) {
      const currentSprite = sprite.get();
      if (!currentSprite) return;

      const { resolution } = getEngineState();
      const { layer } = props;
      const store = getWorldMapStore();

      // Update viewport dimensions in store.
      store.updateViewport(resolution.width, resolution.height);

      // Set layer size to sprite's natural size (not zoomed).
      setLayerSize(layer, currentSprite.width, currentSprite.height);

      // Let the compositor handle zoom via layer scale.
      setLayerScale(layer, store.getZoom());

      // Update layer position.
      setLayerPosition(layer, store.getOffsetX(), store.getOffsetY());

      // Register the entire viewport as a draggable/scrollable area.
      registerPointerArea({
        x: 0,
        y: 0,
        width: resolution.width,
        height: resolution.height,
        layer,
        cursor: "move",
        onDrag: (_x, _y, dx, dy) => store.pan(dx, dy),
        onScroll: (x, y, deltaY) => store.zoomAtPoint(x, y, deltaY),
      });
    },

    render(ctx: RenderContext) {
      const currentSprite = sprite.get();
      if (!currentSprite) return;
      drawSprite(ctx, currentSprite, 0, 0);
    },
  }
);
