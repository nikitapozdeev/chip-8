class Keyboard {
  constructor() {
    /**
     *     Key mapping
     *  1	2	3	C -> 1 2 3 4
     *  4	5	6	D -> Q W E R
     *  7	8	9	E -> A S D F
     *  A	0	B	F -> Z X C V
     */
    this.keyMap = {
      49: 0x1, 50: 0x2, 51: 0x3, 52: 0xC,
      81: 0x4, 87: 0x5, 69: 0x6, 82: 0xD,
      65: 0x7, 83: 0x8, 68: 0x9, 70: 0xE,
      90: 0xA, 88: 0x0, 67: 0xB, 68: 0xF,
    }
    this.pressedKeys = {};
    this.waitForKeyPressCallback = null;
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    window.addEventListener('keydown', this.onKeyDownEvent.bind(this))
    window.addEventListener('keyup', this.onKeyUpEvent.bind(this))
  }

  onKeyDownEvent({ keyCode }) {
    const chip8Key = this.keyMap[keyCode];
    if (chip8Key) {
      this.pressedKeys[chip8Key] = true;

      if (this.keyPressCallback) {
        this.keyPressCallback(chip8Key);
        this.keyPressCallback = null;
      }
    }
  }

  onKeyUpEvent({ keyCode }) {
    const chip8Key = this.keyMap[keyCode];
    if (chip8Key && this.pressedKeys[chip8Key]) {
      delete this.pressedKeys[chip8Key];
    }
  }

  isKeyPressed(chip8Key) {
    return this.pressedKeys[chip8Key] ? true : false;
  }

  waitForKeyPress(keyPressCallback) {
    this.waitForKeyPressCallback = keyPressCallback;
  }
}

export default Keyboard