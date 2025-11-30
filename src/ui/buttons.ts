/**
 * Create a new button element with the specified label.
 *
 * @param label - The text to display on the button.
 * @returns The created button element.
 */
export function createButton(label: string): HTMLButtonElement {
  // Create button element and set its text.
  const button = document.createElement("button");
  button.textContent = label;

  return button;
}
