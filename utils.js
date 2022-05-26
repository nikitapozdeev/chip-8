export function createKeyboardEvent(type, keyCode) {
  const syntheticEvent = new KeyboardEvent(
    type, 
    { 'keyCode': keyCode }
  );
  window.dispatchEvent(syntheticEvent);
}