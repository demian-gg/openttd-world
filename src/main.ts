import { init, resize } from "./engine/canvas";
import { render } from "./engine/renderer";

import * as developerSprite from "./components/developer-sprite";

/** Component interface for loadable, renderable entities. */
interface Component {
  load?: () => Promise<void>;
  render: (ctx: CanvasRenderingContext2D) => void;
}

/** All active components. */
const components: Component[] = [developerSprite];

/** Engine state instance. */
const engine = init({
  canvas: createCanvas(),
  resolution: { pixelScale: 2 },
});

/** Create and attach canvas element to DOM. */
function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  return canvas;
}

/** Render the current frame. */
function renderFrame(): void {
  render(engine.ctx);
  for (const component of components) {
    component.render(engine.ctx);
  }
}

/** Handle window resize. */
function onResize(): void {
  resize();
  renderFrame();
}

/** Initialize and start the application. */
async function main(): Promise<void> {
  // Load all components with a load function.
  await Promise.all(components.map((c) => c.load?.()));

  window.addEventListener("resize", onResize);
  renderFrame();
}

main();
