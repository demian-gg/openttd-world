/**
 * Overlay component.
 * Manages and renders all UI overlay elements (logo, country name, resolution).
 */

import { Component, ComponentProps } from "../../engine/components";
import { RenderContext } from "../../engine/sprites";
import { getEngineState } from "../../engine/engine";

import { loadLogo, renderLogo, getLogoSize } from "./elements/logo";
import { loadCountryName, renderCountryName } from "./elements/country-name";
import {
  loadResolutionStepper,
  renderResolutionStepper,
} from "./elements/resolution-stepper";
import {
  loadSaveButton,
  renderSaveButton,
  getSaveButtonSize,
} from "./elements/save-button";

/** Breakpoint for mobile devices. */
const MOBILE_BREAKPOINT = 640;

/** Props for the overlay component. */
export interface OverlayProps {
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
 * Overlay component.
 * Renders UI elements positioned relative to the logo.
 */
export class Overlay extends Component<OverlayProps & ComponentProps> {
  constructor(props: OverlayProps & ComponentProps) {
    super({ ...defaultProps, ...props });
  }

  async load(): Promise<void> {
    // Load all overlay elements in parallel.
    await Promise.all([
      loadLogo(),
      loadCountryName(),
      loadResolutionStepper(),
      loadSaveButton(),
    ]);
  }

  /**
   * Get a responsive value based on screen width.
   */
  private getResponsive<T>(defaultVal: T, mobileVal: T): T {
    const { resolution } = getEngineState();
    return resolution.width <= MOBILE_BREAKPOINT ? mobileVal : defaultVal;
  }

  /**
   * Get the current margin based on screen size.
   */
  private getMargin(): number {
    const { margin, mobileMargin } = this.props as Required<OverlayProps>;
    return this.getResponsive(margin, mobileMargin);
  }

  render(ctx: RenderContext): void {
    const { resolution } = getEngineState();
    const margin = this.getMargin();
    const logoSize = getLogoSize();
    const saveButtonSize = getSaveButtonSize();

    // Logo position (top-left corner with margin).
    const logoX = margin;
    const logoY = margin;
    renderLogo(ctx, logoX, logoY);

    // Country name position (to the right of logo, vertically centered).
    const countryNameX = logoX + logoSize.width + 14;
    const countryNameY = logoY + 8;
    renderCountryName(ctx, countryNameX, countryNameY);

    // Resolution stepper position (below country name).
    const resolutionX = countryNameX + 8;
    const resolutionY = countryNameY + 30;
    renderResolutionStepper(ctx, resolutionX, resolutionY);

    // Save button position (top-right corner with margin).
    const saveButtonX = resolution.width - margin - saveButtonSize.width;
    const saveButtonY = margin + 6;
    renderSaveButton(ctx, saveButtonX, saveButtonY);
  }
}
