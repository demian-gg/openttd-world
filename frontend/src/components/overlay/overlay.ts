import {
  defineComponent,
  ComponentProps,
  markComponentForUpdate,
} from "../../engine/components";
import { RenderContext } from "../../engine/canvas";
import { getEngineState } from "../../engine/engine";
import { subscribeStore } from "../../engine/stores";
import { dirtyLayer } from "../../engine/layers";
import { isSmall, getResponsiveValue } from "../../engine/utils";
import { renderWithShadow, ShadowConfig } from "../../engine/shadows";
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

/** The shadow configuration for overlay elements. */
const overlayShadow: ShadowConfig = {
  color: "rgba(0, 0, 0, 0.5)",
  blur: 12,
  offsetX: 3,
  offsetY: 3,
  padding: 24,
};

/** The horizontal gap between the logo and zone name. */
const LOGO_ZONE_NAME_GAP = 14;

/** The vertical offset of the zone name from the logo top. */
const ZONE_NAME_VERTICAL_OFFSET = 8;

/** The horizontal inset of the resolution stepper from the zone name. */
const RESOLUTION_STEPPER_INSET = 8;

/** The vertical gap between the zone name and resolution stepper. */
const ZONE_NAME_RESOLUTION_GAP = 30;

/** The vertical offset of the buttons from the margin top. */
const BUTTONS_VERTICAL_OFFSET = 6;

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
    : currentMargin + BUTTONS_VERTICAL_OFFSET;

  return { x, y };
}

/**
 * Overlay component definition.
 * Renders UI elements positioned relative to the logo.
 */
export const { init: initOverlayComponent } = defineComponent<ComponentProps>({
  init(props) {
    // Track the previous zoom level for change detection.
    let previousZoom: number | null = null;

    // Subscribe to world map store changes.
    // Skip re-render on pan — only dirty when zoom changes.
    subscribeStore(WorldMapStore, (store) => {
      // Read the current zoom level.
      const currentZoom = store.getZoom();

      // Skip if zoom has not changed.
      if (currentZoom === previousZoom) return;

      // Update tracked zoom and trigger re-render.
      previousZoom = currentZoom;
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
    const zoneNameX = logoX + logoSize.width + LOGO_ZONE_NAME_GAP;
    const zoneNameY = logoY + ZONE_NAME_VERTICAL_OFFSET;
    const resolutionX = zoneNameX + RESOLUTION_STEPPER_INSET;
    const resolutionY = zoneNameY + ZONE_NAME_RESOLUTION_GAP;

    // Register resolution stepper pointer areas.
    ResolutionStepper.update({ x: resolutionX, y: resolutionY, layer });

    // Register button pointer areas.
    const pos = getButtonPositions();
    Buttons.update({ x: pos.x, y: pos.y, layer });
  },

  render(context: RenderContext, props) {
    const { resolution } = getEngineState();
    const currentMargin = getMargin();
    const logoSize = Logo.getSize();
    const zoomSliderSize = ZoomSlider.getSize();
    const isMobile = isSmall();

    // Render the logo at the top-left corner.
    const logoX = currentMargin;
    const logoY = currentMargin;
    renderWithShadow(
      context,
      logoX,
      logoY,
      logoSize.width,
      logoSize.height,
      overlayShadow,
      (shadowContext) => {
        Logo.render(shadowContext, {
          x: overlayShadow.padding,
          y: overlayShadow.padding,
        });
      }
    );

    // Render the zone name to the right of the logo.
    const zoneNameX = logoX + logoSize.width + LOGO_ZONE_NAME_GAP;
    const zoneNameY = logoY + ZONE_NAME_VERTICAL_OFFSET;
    const zoneNameSize = ZoneName.getSize();
    renderWithShadow(
      context,
      zoneNameX,
      zoneNameY,
      zoneNameSize.width,
      zoneNameSize.height,
      overlayShadow,
      (shadowContext) => {
        ZoneName.render(shadowContext, {
          x: overlayShadow.padding,
          y: overlayShadow.padding,
        });
      }
    );

    // Render the resolution stepper below the zone name.
    const resolutionX = zoneNameX + RESOLUTION_STEPPER_INSET;
    const resolutionY = zoneNameY + ZONE_NAME_RESOLUTION_GAP;
    const resolutionSize = ResolutionStepper.getSize();
    renderWithShadow(
      context,
      resolutionX,
      resolutionY,
      resolutionSize.width,
      resolutionSize.height,
      overlayShadow,
      (shadowContext) => {
        ResolutionStepper.render(shadowContext, {
          x: overlayShadow.padding,
          y: overlayShadow.padding,
          layer: props.layer,
        });
      }
    );

    // Render the buttons at calculated positions.
    const pos = getButtonPositions();
    const buttonSize = Buttons.getSize();
    renderWithShadow(
      context,
      pos.x,
      pos.y,
      buttonSize.width,
      buttonSize.height,
      overlayShadow,
      (shadowContext) => {
        Buttons.render(shadowContext, {
          x: overlayShadow.padding,
          y: overlayShadow.padding,
          layer: props.layer,
        });
      }
    );

    // Render the zoom slider (desktop only).
    if (!isMobile) {
      const zoomSliderX =
        resolution.width - currentMargin - zoomSliderSize.width;
      const zoomSliderY =
        resolution.height - currentMargin - zoomSliderSize.height;
      renderWithShadow(
        context,
        zoomSliderX,
        zoomSliderY,
        zoomSliderSize.width,
        zoomSliderSize.height,
        overlayShadow,
        (shadowContext) => {
          ZoomSlider.render(shadowContext, {
            x: overlayShadow.padding,
            y: overlayShadow.padding,
          });
        }
      );
    }

    // Render the selection hint without a shadow.
    // SelectionHint positions itself via resolution and uses
    // translucent text, so shadow compositing is skipped.
    SelectionHint.render(context, {});
  },
});
