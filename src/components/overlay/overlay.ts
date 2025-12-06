/**
 * Overlay component.
 * Manages and renders all UI overlay elements (logo, country name, resolution).
 */

import { defineComponent, ComponentProps } from "../../engine/components";
import { RenderContext } from "../../engine/sprites";
import { getEngineState } from "../../engine/engine";
import { subscribeStore } from "../../engine/stores";
import { dirtyLayer } from "../../engine/layers";
import { isSmall, getResponsiveValue } from "../../engine/utils";
import { WorldMapStore } from "../../stores/world-map";
import { loadElements } from "../../engine/elements";

import { Logo } from "./elements/logo";
import { CountryName } from "./elements/country-name";
import { ResolutionStepper } from "./elements/resolution-stepper";
import { Buttons } from "./elements/buttons";
import { ZoomSlider } from "./elements/zoom-slider";

/** Margin from screen edges. */
const MARGIN = 32;

/** Margin on mobile devices. */
const MOBILE_MARGIN = 16;

/**
 * Get current margin based on viewport.
 */
function getMargin(): number {
  return getResponsiveValue({ default: MARGIN, small: MOBILE_MARGIN });
}

/**
 * Calculate button positions based on current viewport.
 */
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
    });
  },

  async load() {
    // Load all overlay elements in parallel.
    await loadElements([
      Logo,
      CountryName,
      ResolutionStepper,
      Buttons,
      ZoomSlider,
    ]);
  },

  update(props) {
    // Update button pointer areas.
    const { layer } = props;
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

    // Country name position (to the right of logo, vertically centered).
    const countryNameX = logoX + logoSize.width + 14;
    const countryNameY = logoY + 8;
    CountryName.render(ctx, { x: countryNameX, y: countryNameY });

    // Resolution stepper position (below country name).
    const resolutionX = countryNameX + 8;
    const resolutionY = countryNameY + 30;
    ResolutionStepper.render(ctx, { x: resolutionX, y: resolutionY });

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
  },
});
