/**
 * Overlay component.
 * Manages and renders all UI overlay elements (logo, zone name, resolution).
 */

import {
  defineComponent,
  ComponentProps,
  markComponentForUpdate,
} from "../../engine/components";
import { RenderContext } from "../../engine/sprites";
import { getEngineState } from "../../engine/engine";
import { subscribeStore } from "../../engine/stores";
import { dirtyLayer } from "../../engine/layers";
import { isSmall, getResponsiveValue } from "../../engine/utils";
import { WorldMapStore } from "../../stores/world-map";
import { ResolutionStore } from "../../stores/resolution";
import { ZoneStore } from "../../stores/zone";
import { OverlayStore } from "../../stores/overlay";
import { SelectionStore } from "../../stores/selection";
import { loadElements } from "../../engine/elements";
import { Logo } from "./elements/logo";
import { ZoneName } from "./elements/zone-name";
import { ResolutionStepper } from "./elements/resolution-stepper";
import { Buttons } from "./elements/buttons";
import { ZoomSlider } from "./elements/zoom-slider";
import { SelectionHint } from "./elements/selection-hint";

/** The margin from screen edges. */
const MARGIN = 32;

/** The margin on mobile devices. */
const MOBILE_MARGIN = 16;

/** Gets the current margin based on viewport. */
function getMargin(): number {
  return getResponsiveValue({ default: MARGIN, small: MOBILE_MARGIN });
}

/** Calculates button positions based on current viewport. */
function getButtonPositions(): { x: number; y: number } {
  const { resolution } = getEngineState();
  const currentMargin = getMargin();
  const buttonSize = Buttons.getSize();
  const isMobile = isSmall();

  const x = isMobile
    ? (resolution.width - buttonSize.width) / 2
    : resolution.width - currentMargin - buttonSize.width;
  const y = isMobile
    ? resolution.height - currentMargin - buttonSize.height
    : currentMargin + 6;

  return { x, y };
}

/**
 * Overlay component definition.
 * Renders UI elements positioned relative to the logo.
 */
export const { init: initOverlayComponent } = defineComponent<ComponentProps>({
  init(props) {
    // Subscribe to world map store changes to update zoom slider.
    subscribeStore(WorldMapStore, () => {
      dirtyLayer(props.layer);
      markComponentForUpdate(props);
    });

    // Subscribe to resolution store changes to update stepper.
    subscribeStore(ResolutionStore, () => {
      dirtyLayer(props.layer);
      markComponentForUpdate(props);
    });

    // Subscribe to zone store changes to update zone name.
    subscribeStore(ZoneStore, () => {
      dirtyLayer(props.layer);
      markComponentForUpdate(props);
    });

    // Subscribe to overlay store changes to update hint visibility.
    subscribeStore(OverlayStore, () => {
      dirtyLayer(props.layer);
      markComponentForUpdate(props);
    });

    // Subscribe to selection store changes to update hint visibility.
    subscribeStore(SelectionStore, () => {
      dirtyLayer(props.layer);
      markComponentForUpdate(props);
    });
  },

  async load() {
    // Load all overlay elements in parallel.
    await loadElements([
      Logo,
      ZoneName,
      ResolutionStepper,
      Buttons,
      ZoomSlider,
      SelectionHint,
    ]);
  },

  pointerAreas(props) {
    const { layer } = props;
    const currentMargin = getMargin();
    const logoSize = Logo.getSize();

    // Calculate element positions.
    const logoX = currentMargin;
    const logoY = currentMargin;
    const zoneNameX = logoX + logoSize.width + 14;
    const zoneNameY = logoY + 8;
    const resolutionX = zoneNameX + 8;
    const resolutionY = zoneNameY + 30;

    // Register resolution stepper pointer areas.
    ResolutionStepper.update({ x: resolutionX, y: resolutionY, layer });

    // Register button pointer areas.
    const pos = getButtonPositions();
    Buttons.update({ x: pos.x, y: pos.y, layer });
  },

  render(ctx: RenderContext, props) {
    const { resolution } = getEngineState();
    const currentMargin = getMargin();
    const logoSize = Logo.getSize();
    const zoomSliderSize = ZoomSlider.getSize();
    const isMobile = isSmall();

    // Logo position (top-left corner with margin).
    const logoX = currentMargin;
    const logoY = currentMargin;
    Logo.render(ctx, { x: logoX, y: logoY });

    // Zone name position (to the right of logo, vertically centered).
    const zoneNameX = logoX + logoSize.width + 14;
    const zoneNameY = logoY + 8;
    ZoneName.render(ctx, { x: zoneNameX, y: zoneNameY });

    // Resolution stepper position (below zone name).
    const resolutionX = zoneNameX + 8;
    const resolutionY = zoneNameY + 30;
    ResolutionStepper.render(ctx, {
      x: resolutionX,
      y: resolutionY,
      layer: props.layer,
    });

    // Render buttons at calculated positions.
    const pos = getButtonPositions();
    Buttons.render(ctx, { x: pos.x, y: pos.y, layer: props.layer });

    // Zoom slider position (bottom-right corner, desktop only).
    if (!isMobile) {
      const zoomSliderX =
        resolution.width - currentMargin - zoomSliderSize.width;
      const zoomSliderY =
        resolution.height - currentMargin - zoomSliderSize.height;
      ZoomSlider.render(ctx, { x: zoomSliderX, y: zoomSliderY });
    }

    // Selection hint (centered at bottom, visible in select mode with no selection).
    SelectionHint.render(ctx, {});
  },
});
