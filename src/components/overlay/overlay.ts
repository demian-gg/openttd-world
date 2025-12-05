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

import { loadLogo, renderLogo, getLogoSize } from "./elements/logo";
import { loadCountryName, renderCountryName } from "./elements/country-name";
import {
  loadResolutionStepper,
  renderResolutionStepper,
} from "./elements/resolution-stepper";
import {
  loadButtons,
  renderButton,
  renderModeToggle,
  registerButtonPointerArea,
  registerModeTogglePointerArea,
  getButtonSize,
} from "./elements/buttons";
import {
  loadZoomSlider,
  renderZoomSlider,
  getZoomSliderSize,
} from "./elements/zoom-slider";

/** Props for the overlay component. */
export interface OverlayProps extends ComponentProps {
  /** Base margin from screen edges. */
  margin?: number;

  /** Margin on mobile devices. */
  mobileMargin?: number;
}

/** Default props. */
const defaultProps = {
  margin: 32,
  mobileMargin: 16,
};

/**
 * Calculate button positions based on current viewport.
 */
function getButtonPositions(props: OverlayProps): {
  modeToggleX: number;
  modeToggleY: number;
  saveButtonX: number;
  saveButtonY: number;
} {
  const { resolution } = getEngineState();
  const margin = props.margin ?? defaultProps.margin;
  const mobileMargin = props.mobileMargin ?? defaultProps.mobileMargin;
  const currentMargin = getResponsiveValue({
    default: margin,
    small: mobileMargin,
  });
  const buttonSize = getButtonSize();
  const buttonSpacing = 8;
  const isMobile = isSmall();

  const totalButtonsWidth = buttonSize.width * 2 + buttonSpacing;
  const buttonsStartX = isMobile
    ? (resolution.width - totalButtonsWidth) / 2
    : resolution.width - currentMargin - totalButtonsWidth;
  const buttonsY = isMobile
    ? resolution.height - currentMargin - buttonSize.height
    : currentMargin + 6;

  return {
    modeToggleX: buttonsStartX,
    modeToggleY: buttonsY,
    saveButtonX: buttonsStartX + buttonSize.width + buttonSpacing,
    saveButtonY: buttonsY,
  };
}

/**
 * Overlay component definition.
 * Renders UI elements positioned relative to the logo.
 */
export const { register: registerOverlay } = defineComponent<OverlayProps>(
  "overlay",
  {
    init(props) {
      // Subscribe to world map store changes to update zoom slider.
      subscribeStore(WorldMapStore, () => {
        dirtyLayer(props.layer);
      });
    },

    async load() {
      // Load all overlay elements in parallel.
      await Promise.all([
        loadLogo(),
        loadCountryName(),
        loadResolutionStepper(),
        loadButtons(),
        loadZoomSlider(),
      ]);
    },

    update(props) {
      // Register button pointer areas every frame.
      const { layer } = props;
      const pos = getButtonPositions(props);

      registerModeTogglePointerArea(pos.modeToggleX, pos.modeToggleY, layer);
      registerButtonPointerArea(
        "save",
        pos.saveButtonX,
        pos.saveButtonY,
        layer
      );
    },

    render(ctx: RenderContext, props) {
      const { resolution } = getEngineState();
      const margin = props.margin ?? defaultProps.margin;
      const mobileMargin = props.mobileMargin ?? defaultProps.mobileMargin;
      const currentMargin = getResponsiveValue({
        default: margin,
        small: mobileMargin,
      });
      const logoSize = getLogoSize();
      const zoomSliderSize = getZoomSliderSize();
      const isMobile = isSmall();

      // Logo position (top-left corner with margin).
      const logoX = currentMargin;
      const logoY = currentMargin;
      renderLogo(ctx, logoX, logoY);

      // Country name position (to the right of logo, vertically centered).
      const countryNameX = logoX + logoSize.width + 14;
      const countryNameY = logoY + 8;
      renderCountryName(ctx, countryNameX, countryNameY);

      // Resolution stepper position (below country name).
      const resolutionX = countryNameX + 8;
      const resolutionY = countryNameY + 30;
      renderResolutionStepper(ctx, resolutionX, resolutionY);

      // Render buttons at calculated positions.
      const pos = getButtonPositions(props);
      renderModeToggle(ctx, pos.modeToggleX, pos.modeToggleY);
      renderButton(ctx, "save", pos.saveButtonX, pos.saveButtonY);

      // Zoom slider position (bottom-right corner, desktop only).
      if (!isMobile) {
        const zoomSliderX =
          resolution.width - currentMargin - zoomSliderSize.width;
        const zoomSliderY =
          resolution.height - currentMargin - zoomSliderSize.height;
        renderZoomSlider(ctx, zoomSliderX, zoomSliderY);
      }
    },
  }
);
