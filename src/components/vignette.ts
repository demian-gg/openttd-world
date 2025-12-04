/**
 * Vignette component.
 * Renders a dark vignette effect around the edges of the screen.
 */

import { Component, ComponentProps } from "../engine/components";
import { RenderContext } from "../engine/sprites";
import { getEngineState } from "../engine/engine";

/** Props for the vignette component. */
export interface VignetteProps {
  /** Vignette color. */
  color?: string;

  /** Maximum opacity at the edges. */
  opacity?: number;
}

/** Default props. */
const defaultProps = {
  color: "#000000",
  opacity: 0.4,
};

/**
 * Vignette component.
 * Renders a radial gradient vignette effect.
 */
export class Vignette extends Component<VignetteProps & ComponentProps> {
  constructor(props: VignetteProps & ComponentProps) {
    super({ ...defaultProps, ...props });
  }

  render(ctx: RenderContext): void {
    const { resolution } = getEngineState();
    const { color, opacity } = this.props as Required<VignetteProps>;

    const { width, height } = resolution;
    const centerX = width / 2;
    const centerY = height / 2;

    // Use diagonal distance to corners so gradient reaches all corners.
    const cornerRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    const innerRadius = cornerRadius * 0.6;

    ctx.save();
    ctx.globalAlpha = opacity;

    // Create radial gradient from center to corners.
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      innerRadius,
      centerX,
      centerY,
      cornerRadius
    );

    // Transparent in the center, solid at edges.
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(1, color);

    // Fill a large area to ensure vignette covers entire viewport
    // regardless of camera transforms.
    ctx.fillStyle = gradient;
    ctx.fillRect(-width, -height, width * 3, height * 3);

    ctx.restore();
  }
}
