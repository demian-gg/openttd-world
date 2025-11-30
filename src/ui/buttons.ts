export function createButton(label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = label;
  return button;
}
