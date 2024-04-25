type KeyPressCallback = (key: number) => void;

class Keyboard {
  /**
   *     Key mapping
   *  1	2	3	C -> 1 2 3 4
   *  4	5	6	D -> Q W E R
   *  7	8	9	E -> A S D F
   *  A	0	B	F -> Z X C V
   */
  private readonly keyMap: Record<number, number> = {
    49: 0x1,
    50: 0x2,
    51: 0x3,
    52: 0xc,
    81: 0x4,
    87: 0x5,
    69: 0x6,
    82: 0xd,
    65: 0x7,
    83: 0x8,
    68: 0x9,
    70: 0xe,
    90: 0xa,
    88: 0x0,
    67: 0xb,
    86: 0xf,
  } as const;

  private pressedKeys: Set<number> = new Set();

  private waitForKeyPressCallback: KeyPressCallback | null = null;

  constructor() {
    this.subscribeToEvents();
  }

  private subscribeToEvents = () => {
    window.addEventListener('keydown', this.onKeyDownEvent.bind(this));
    window.addEventListener('keyup', this.onKeyUpEvent.bind(this));
  };

  onKeyDownEvent({ keyCode }: KeyboardEvent) {
    const chip8Key = this.keyMap[keyCode];
    if (chip8Key) {
      this.pressedKeys.add(chip8Key);

      if (this.waitForKeyPressCallback) {
        this.waitForKeyPressCallback(chip8Key);
        this.waitForKeyPressCallback = null;
      }
    }
  }

  onKeyUpEvent({ keyCode }: KeyboardEvent) {
    const chip8Key = this.keyMap[keyCode];
    if (chip8Key && this.pressedKeys.has(chip8Key)) {
      this.pressedKeys.delete(chip8Key);
    }
  }

  isKeyPressed(chip8Key: number) {
    return this.pressedKeys.has(chip8Key);
  }

  waitForKeyPress(keyPressCallback: KeyPressCallback) {
    this.waitForKeyPressCallback = keyPressCallback;
  }
}

export default Keyboard;
