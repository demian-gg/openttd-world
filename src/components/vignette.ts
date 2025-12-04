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
  opacity: 0.35,
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

    // Prepare for scaling the vignette to create an oval shape.
    // We scale it differently viewport aspect ratios:
    // - Wide screens: squash vertically to keep vignette covering corners.
    // - Tall screens: squash horizontally to avoid excessive vignette width
    const aspectRatio = width / height;
    const directions = {
      horizontal: { scaleX: 0.8, scaleY: 1 },
      vertical: { scaleX: 1, scaleY: 0.5 },
    };
    const chosenDirection = aspectRatio > 1.5 ? "vertical" : "horizontal";
    const { scaleX, scaleY } = directions[chosenDirection];

    // Scale by moving origin to center, scaling, then moving back.
    // This ensures the vignette remains centered after scaling.
    ctx.translate(centerX, centerY);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-centerX, -centerY);

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
