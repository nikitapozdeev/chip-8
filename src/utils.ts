export function createKeyboardEvent(type: string, keyCode: number) {
  const syntheticEvent = new KeyboardEvent(type, { keyCode: keyCode });
  window.dispatchEvent(syntheticEvent);
}
