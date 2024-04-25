import { BACK_COLOR, FORE_COLOR, HEIGHT, WIDTH } from './constants';
import { FONT_SPRITES } from './font';
import Keyboard from './keyboard';
import Speaker from './speaker';

class Chip8 {
  private readonly context: CanvasRenderingContext2D;
  /**
   * RAM 4KB.
   */
  private readonly ram: Uint8Array;

  /**
   * Video memory.
   */
  private video: number[][];

  /**
   * 16 general purpose 8-bit registers.
   */
  private readonly V: Uint8Array;

  /**
   * Stack 16 levels by 16 bit.
   */
  private readonly stack: Uint16Array;

  /**
   * 16-bit register.
   * This register is generally used to store memory addresses,
   * so only the lowest (rightmost) 12 bits are usually used.
   */
  private I: number;

  /**
   * Instruction pointer or Program counter.
   */
  private PC: number;

  /**
   * Stack pointer point to the topmost level of the stack.
   */
  private SP: number;

  /**
   * Delay timer.
   */
  private DT: number;

  /**
   * Sound timer.
   */
  private ST: number;

  /**
   * Emulation speed;
   */
  private speed: number;

  private running: boolean;

  private readonly speaker: Speaker;

  private readonly keyboard: Keyboard;

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
    this.ram = new Uint8Array(4096);
    this.video = this.createVideo();
    this.V = new Uint8Array(16);
    this.stack = new Uint16Array(16);
    this.I = 0x0000;
    this.PC = 0x200;
    this.SP = -1;
    this.DT = 0;
    this.ST = 0;
    this.speed = 10;
    this.running = false;
    this.speaker = new Speaker();
    this.keyboard = new Keyboard();
    this.loadFont();
  }

  createVideo() {
    const buffer = [];
    const width = 64;
    const height = 32;
    for (let i = 0; i < height; i++) {
      const row = [];
      for (let j = 0; j < width; j++) {
        row[j] = 0;
      }
      buffer.push(row);
    }
    return buffer;
  }

  loadFont() {
    for (let byte = 0; byte < FONT_SPRITES.length; byte++) {
      this.ram[byte] = FONT_SPRITES[byte];
    }
  }

  draw() {
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (this.video[y][x] === 1) {
          this.context.fillStyle = FORE_COLOR;
        } else {
          this.context.fillStyle = BACK_COLOR;
        }
        this.context.fillRect(x, y, 1, 1);
      }
    }
  }

  start() {
    this.running = true;
    console.log('power on');

    const fps = 60;
    const rate = 1000 / fps;
    let lastTime: number | null = null;

    const step = (timestamp: number) => {
      if (lastTime) {
        const delta = timestamp - lastTime;
        // TODO: better solution
        if (delta.toFixed(2) >= rate.toFixed(2)) {
          this.tick();
        }
      }
      lastTime = timestamp;
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  tick() {
    for (let i = 0; i < this.speed; ++i) {
      if (this.running) {
        this.processInstruction();
      }
    }

    if (this.running) {
      this.updateTimers();
      this.processAudio();
      this.draw();
    }
  }

  updateTimers() {
    if (this.DT > 0) {
      this.DT--;
    }

    if (this.ST > 0) {
      this.ST--;
    }
  }

  processAudio() {
    if (this.ST > 0) {
      this.speaker.play();
    } else {
      this.speaker.stop();
    }
  }

  processInstruction() {
    const opcode = this.getOpCode();
    const addr = opcode & 0xfff;
    const nibble = opcode & 0xf;
    const x = (opcode >> 8) & 0xf;
    const y = (opcode >> 4) & 0xf;
    const byte = opcode & 0xff;

    /*if ((opcode & 0xF000) === 0x0000) {
      //this.sys(addr);
    } else*/ if (opcode === 0x00e0) {
      this.cls();
    } else if (opcode === 0x00ee) {
      this.ret();
    } else if ((opcode & 0xf000) === 0x1000) {
      this.jp(addr);
    } else if ((opcode & 0xf000) === 0x2000) {
      this.call(addr);
    } else if ((opcode & 0xf000) === 0x3000) {
      this.seVx(x, byte);
    } else if ((opcode & 0xf000) === 0x4000) {
      this.sneVx(x, byte);
    } else if ((opcode & 0xf000) === 0x5000) {
      this.seVxVy(x, y);
    } else if ((opcode & 0xf000) === 0x6000) {
      this.ldVx(x, byte);
    } else if ((opcode & 0xf000) === 0x7000) {
      this.addVx(x, byte);
    } else if ((opcode & 0xf00f) === 0x8000) {
      this.ldVxVy(x, y);
    } else if ((opcode & 0xf00f) === 0x8001) {
      this.orVxVy(x, y);
    } else if ((opcode & 0xf00f) === 0x8002) {
      this.andVxVy(x, y);
    } else if ((opcode & 0xf00f) === 0x8003) {
      this.xorVxVy(x, y);
    } else if ((opcode & 0xf00f) === 0x8004) {
      this.addVxVy(x, y);
    } else if ((opcode & 0xf00f) === 0x8005) {
      this.subVxVy(x, y);
    } else if ((opcode & 0xf00f) === 0x8006) {
      this.shrVx(x);
    } else if ((opcode & 0xf00f) === 0x8007) {
      this.subnVxVy(x, y);
    } else if ((opcode & 0xf00f) === 0x800e) {
      this.shlVx(x);
    } else if ((opcode & 0xf00f) === 0x9000) {
      this.sneVxVy(x, y);
    } else if ((opcode & 0xf000) === 0xa000) {
      this.ld(addr);
    } else if ((opcode & 0xf000) === 0xb000) {
      this.jpV0(addr);
    } else if ((opcode & 0xf000) === 0xc000) {
      this.rndVx(x, byte);
    } else if ((opcode & 0xf000) === 0xd000) {
      this.drwVxVy(x, y, nibble);
    } else if ((opcode & 0xf0ff) === 0xe09e) {
      this.skpVx(x);
    } else if ((opcode & 0xf0ff) === 0xe0a1) {
      this.sknpVx(x);
    } else if ((opcode & 0xf0ff) === 0xf007) {
      this.ldVxDt(x);
    } else if ((opcode & 0xf0ff) === 0xf00a) {
      this.ldVxK(x);
    } else if ((opcode & 0xf0ff) === 0xf015) {
      this.ldDtVx(x);
    } else if ((opcode & 0xf0ff) === 0xf018) {
      this.ldStVx(x);
    } else if ((opcode & 0xf0ff) === 0xf01e) {
      this.addIVx(x);
    } else if ((opcode & 0xf0ff) === 0xf029) {
      this.ldFVx(x);
    } else if ((opcode & 0xf0ff) === 0xf033) {
      this.ldBVx(x);
    } else if ((opcode & 0xf0ff) === 0xf055) {
      this.ldIVx(x);
    } else if ((opcode & 0xf0ff) === 0xf065) {
      this.ldVxI(x);
    } else {
      throw new Error('unknown command ' + opcode.toString(16).padStart(4, '0'));
    }
  }

  /** --------instructions-------- */
  sys(addr: number) {
    this.PC = addr;
  }

  cls() {
    this.video = this.createVideo();
  }

  ret() {
    if (this.SP === -1) {
      throw new Error('Stack underflow');
    }

    this.PC = this.stack[this.SP];
    this.SP--;
  }

  jp(addr: number) {
    this.PC = addr;
  }

  call(addr: number) {
    this.SP++;
    if (this.SP > this.stack.length) {
      throw new Error('Stack overflow');
    }

    this.stack[this.SP] = this.PC;
    this.PC = addr;
  }

  seVx(register: number, byte: number) {
    if (this.V[register] === byte) {
      this.PC += 2;
    }
  }

  sneVx(register: number, byte: number) {
    if (this.V[register] !== byte) {
      this.PC += 2;
    }
  }

  seVxVy(registerX: number, registerY: number) {
    if (this.V[registerX] === this.V[registerY]) {
      this.PC += 2;
    }
  }

  ldVx(register: number, byte: number) {
    this.V[register] = byte;
  }

  addVx(register: number, byte: number) {
    this.V[register] += byte;
  }

  ldVxVy(registerX: number, registerY: number) {
    this.V[registerX] = this.V[registerY];
  }

  orVxVy(registerX: number, registerY: number) {
    this.V[registerX] |= this.V[registerY];
  }

  andVxVy(registerX: number, registerY: number) {
    this.V[registerX] &= this.V[registerY];
  }

  xorVxVy(registerX: number, registerY: number) {
    this.V[registerX] ^= this.V[registerY];
  }

  addVxVy(registerX: number, registerY: number) {
    this.V[registerX] += this.V[registerY];
    if (this.V[registerX] > 0xff) {
      this.V[registerX] &= 0xff;
      this.V[0xf] = 1;
    } else {
      this.V[0xf] = 0;
    }
  }

  subVxVy(x: number, y: number) {
    if (this.V[x] > this.V[y]) {
      this.V[0xf] = 1;
    } else {
      this.V[0xf] = 0;
    }
    this.V[x] -= this.V[y];
  }

  shrVx(x: number) {
    if ((this.V[x] & 0x00ff) === 0x00ff) {
      this.V[0xf] = 1;
    } else {
      this.V[0xf] = 0;
    }
    this.V[x] = this.V[x] >> 1;
  }

  subnVxVy(x: number, y: number) {
    if (this.V[y] > this.V[x]) {
      this.V[0xf] = 1;
    } else {
      this.V[0xf] = 0;
    }
    this.V[y] -= this.V[x];
  }

  shlVx(x: number) {
    if ((this.V[x] & 0xff00) === 0xff00) {
      this.V[0xf] = 1;
    } else {
      this.V[0xf] = 0;
    }
    this.V[x] = this.V[x] << 1;
  }

  sneVxVy(x: number, y: number) {
    if (this.V[x] !== this.V[y]) {
      this.PC += 2;
    }
  }

  ld(addr: number) {
    this.I = addr;
  }

  jpV0(addr: number) {
    this.PC = addr + this.V[0];
  }

  rndVx(x: number, byte: number) {
    const rnd = Math.ceil(Math.random() * 256);
    this.V[x] = rnd & byte;
  }

  drwVxVy(x: number, y: number, nibble: number) {
    x = this.V[x];
    y = this.V[y];
    let collide = false;
    const sprite = this.ram.slice(this.I, this.I + nibble);

    for (let j = 0; j < sprite.length; j++) {
      const rowPixels = sprite[j].toString(2).padStart(8, '0').split('').map(Number);
      for (let i = 0; i < rowPixels.length; i++) {
        const row = y + j;
        const col = x + i;
        const pixelState = this.video[row % HEIGHT][col % WIDTH] ^ rowPixels[i];
        if (this.video[row % HEIGHT][col % WIDTH] === 1 && pixelState === 0) {
          collide = true;
        }

        this.video[row % HEIGHT][col % WIDTH] = pixelState;
        this.V[0xf] = collide ? 1 : 0;
      }
    }
  }

  skpVx(x: number) {
    const chip8Key = this.V[x];
    if (this.keyboard.isKeyPressed(chip8Key)) {
      this.PC += 2;
    }
  }

  sknpVx(x: number) {
    const chip8Key = this.V[x];
    if (!this.keyboard.isKeyPressed(chip8Key)) {
      this.PC += 2;
    }
  }

  ldVxDt(x: number) {
    this.V[x] = this.DT;
  }

  ldVxK(x: number) {
    this.running = false;
    this.keyboard.waitForKeyPress((key) => {
      this.V[x] = key;
      this.running = true;
    });
  }

  ldDtVx(x: number) {
    this.DT = this.V[x];
  }

  ldStVx(x: number) {
    this.ST = this.V[x];
  }

  addIVx(x: number) {
    this.I += this.V[x];
  }

  ldFVx(x: number) {
    this.I = this.V[x] * 5;
  }

  ldBVx(x: number) {
    let value = this.V[x];

    const a = Math.floor(value / 100);
    value = value - a * 100;
    const b = Math.floor(value / 10);
    value = value - b * 10;
    const c = Math.floor(value);

    this.ram[this.I] = a;
    this.ram[this.I + 1] = b;
    this.ram[this.I + 2] = c;
  }

  ldIVx(x: number) {
    for (let r = 0; r <= x; r++) {
      this.ram[this.I + r] = this.V[r];
    }
  }

  ldVxI(x: number) {
    for (let r = 0; r <= x; r++) {
      this.V[r] = this.ram[this.I + r];
    }
  }

  getOpCode() {
    const high = this.ram[this.PC++];
    const low = this.ram[this.PC++];
    return (high << 8) | low;
  }

  /**
   * Loads rom into RAM.
   */
  load(rom: Uint8Array) {
    for (let i = 0; i < rom.byteLength; i++) {
      this.ram[this.PC + i] = rom[i];
    }
  }
}

export default Chip8;
