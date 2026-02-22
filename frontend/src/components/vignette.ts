import { defineComponent, ComponentProps } from "../engine/components";
import { RenderContext } from "../engine/canvas";
import { getEngineState } from "../engine/engine";
import { getResponsiveValue } from "../engine/utils";

/**
 * Vignette component definition.
 *
 * Renders a radial gradient vignette effect.
 */
export const { init: initVignetteComponent } = defineComponent<ComponentProps>({
  render(context: RenderContext) {
    const { resolution } = getEngineState();
    const opacity = getResponsiveValue({ default: 0.35, small: 0.2 });
    const { width, height } = resolution;

    // Calculate center point.
    const centerX = width / 2;
    const centerY = height / 2;

    // Use diagonal distance to ensure gradient reaches all four corners.
    const cornerRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    // Start fade at 60% to keep center clear while darkening edges.
    const innerRadius = cornerRadius * 0.6;

    // Save context state.
    context.save();
    context.globalAlpha = opacity;

    // Squash vertically to turn circular gradient into an oval.
    context.translate(centerX, centerY);
    context.scale(1, 0.75);
    context.translate(-centerX, -centerY);

    // Create gradient between two concentric circles.
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      innerRadius,
      centerX,
      centerY,
      cornerRadius
    );
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(1, "#000000");

    // Fill oversized rect to cover edge cases from transforms.
    context.fillStyle = gradient;
    context.fillRect(-width, -height, width * 3, height * 3);

    // Restore context state.
    context.restore();
  },
});
