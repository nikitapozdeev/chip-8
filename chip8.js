import { FONT_SPRITES } from "./font.js";

const canvas = document.getElementById('chip8');
const context = canvas.getContext('2d');

const WIDTH = 64;
const HEIGHT = 32;

const scaleFactor = 4;
// canvas.width *= scaleFactor;
// canvas.height *= scaleFactor;
context.fillStyle = '#000';
context.fillRect(0, 0, canvas.width, canvas.height);
context.scale(scaleFactor, scaleFactor);

class Chip8 {
  constructor() {
    /**
     * RAM 4KB.
     */
    this.ram = new Uint8Array(4096);

    /**
     * Video memory.
     */
    this.video = this.createVideo();

    /**
     * 16 general purpose 8-bit registers.
     */
    this.registers = new Uint8Array(16);

    /**
     * 16-bit register. 
     * This register is generally used to store memory addresses, 
     * so only the lowest (rightmost) 12 bits are usually used.
     */
    this.I = 0x0000;

    /**
     * Stack 16 levels by 16 bit.
     */
    this.stack = new Uint16Array(16);
    
    /**
     * Instruction pointer or Program counter.
     */
    this.ip = 0x200;

    /**
     * Stack pointer point to the topmost level of the stack.
     */
    this.sp = -1;

    /**
     * Delay timer.
     */
    this.dt = 0;  

    /**
     * Sound timer.
     */
    this.st = 0;

    this.running = false;

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
          context.fillStyle = '#FFF';
        } else {
          context.fillStyle = '#000';
        }
        context.fillRect(x, y, 1, 1);
      }
    }
  }

  start() {
    this.running = true;
    console.log('power on');
  }

  tick() {
    if (!this.running) {
      return;
    }

    const opcode = this.getOpCode();
    const addr = opcode & 0xFFF;
    const nibble = opcode & 0xF;
    const x = opcode >> 8 & 0xF;
    const y = opcode >> 4 & 0xF;
    const byte = opcode & 0xFF;
    
    // TODO: remove 
    console.log((this.ip - 2).toString(16).padStart(4, '0') + ' ' + opcode.toString(16))

    if ((opcode & 0x0FFF) === 0x0FFF) {
      this.sys(addr);
    } else if (opcode === 0x00E0) {
      this.cls();
    } else if (opcode === 0x00EE) {
      this.ret();
    } else if ((opcode & 0xF000) === 0x1000) {
      this.jp(addr);
    } else if ((opcode & 0xF000) === 0x2000) {
      this.call(addr);
    } else if ((opcode & 0xF000) === 0x3000) {
      this.seVx(x, byte);
    } else if ((opcode & 0xF000) === 0x4000) {
      this.sneVx(x, byte);
    } else if ((opcode & 0xF000) === 0x5000) {
      this.seVxVy(x, y);
    } else if ((opcode & 0xF000) === 0x6000) {
      this.ldVx(x, byte);
    } else if ((opcode & 0xF000) === 0x7000) {
      this.addVx(x, byte);
    } else if ((opcode & 0xF00F) === 0x8000) {
      this.ldVxVy(x, y);
    } else if ((opcode & 0xF00F) === 0x8001) {
      this.orVxVy(x, y);
    } else if ((opcode & 0xF00F) === 0x8002) {
      this.andVxVy(x, y);
    } else if ((opcode & 0xF00F) === 0x8003) {
      this.xorVxVy(x, y);
    } else if ((opcode & 0xF00F) === 0x8004) {
      this.addVxVy(x, y);
    } else if ((opcode & 0xF00F) === 0x8005) {
      this.subVxVy(x, y);
    } else if ((opcode & 0xF00F) === 0x8006) {
      this.shrVx(x);
    } else if ((opcode & 0xF00F) === 0x8007) {
      this.subnVxVy(x, y);
    } else if ((opcode & 0xF00F) === 0x800E) {
      this.shlVx(x);
    } else if ((opcode & 0xF00F) === 0x9000) {
      this.sneVxVy(x, y);
    } else if ((opcode & 0xF000) === 0xA000) {
      this.ld(addr);
    } else if ((opcode & 0xF000) === 0xB000) {
      this.jpV0(addr);
    } else if ((opcode & 0xF000) === 0xC000) {
      this.rndVx(x, byte);
    } else if ((opcode & 0xF000) === 0xD000) {
      this.drwVxVy(x, y, nibble);
    } else if ((opcode & 0xF0FF) === 0xE09E) {
      this.skpVx(x);
    } else if ((opcode & 0xF0FF) === 0xE0A1) {
      this.sknpVx(x);
    } else if ((opcode & 0xF0FF) === 0xF007) {
      this.ldVxDt(x);
    } else if ((opcode & 0xF0FF) === 0xF00A) {
      this.ldVxK(x);
    } else if ((opcode & 0xF0FF) === 0xF015) {
      this.ldDtVx(x);
    } else if ((opcode & 0xF0FF) === 0xF018) {
      this.ldStVx(x);
    } else if ((opcode & 0xF0FF) === 0xF01E) {
      this.addIVx(x);
    } else if ((opcode & 0xF0FF) === 0xF029) {
      this.ldFVx(x);
    } else if ((opcode & 0xF0FF) === 0xF033) {
      this.ldBVx(x);
    } else if ((opcode & 0xF0FF) === 0xF055) {
      this.ldIVx(x);
    } else if ((opcode & 0xF0FF) === 0xF065) {
      this.ldVxI(x);
    } else {
      throw new Error('unknown command')
    }

    // TODO: remove, this is for debug only
    this.draw();
  }

  /** --------instructions-------- */
  sys(addr) {
    //this.ip = addr;
  }
  
  cls() {
    this.video = this.createVideo();
  }

  ret() {
    if (this.sp === -1) {
      throw new Error("Stack underflow");
    }

    this.ip = this.stack[this.sp];
    this.sp--;
  }

  jp(addr) {
    this.ip = addr;
  }
  
  call(addr) {
    this.sp++;
    if (this.sp > this.stack.length) {
      throw new Error("Stack overflow");
    }

    this.stack[this.sp] = this.ip;
    this.ip = addr;
  }

  seVx(register, byte) {
    if (this.registers[register] === byte) {
      this.ip += 2;
    }
  }

  sneVx(register , byte) {
    if (this.registers[register] !== byte) {
      this.ip += 2;
    }
  }

  seVxVy(registerX, registerY) {
    if (this.registers[registerX] === this.registers[registerY]) {
      this.ip += 2;
    }
  }

  ldVx(register, byte) {
    this.registers[register] = byte;
  }

  addVx(register, byte) {
    this.registers[register] += byte;
  }

  ldVxVy(registerX, registerY) {
    this.registers[registerX] = this.registers[registerY];
  }

  orVxVy(registerX, registerY) {
    this.registers[registerX] |= this.registers[registerY];
  }

  andVxVy(registerX, registerY) {
    this.registers[registerX] &= this.registers[registerY];
  }

  xorVxVy(registerX, registerY) {
    this.registers[registerX] ^= this.registers[registerY];
  }

  addVxVy(registerX, registerY) {
    this.registers[registerX] += this.registers[registerY];
    if (this.registers[registerX] > 0xFF) {
      this.registers[registerX] &= 0xFF;
      this.registers[0xF] = 1;
    } else {
      this.registers[0xF] = 0;
    }
  }

  subVxVy(x, y) {
    if (this.registers[x] > this.registers[y]) {
      this.registers[0xF] = 1;
    } else {
      this.registers[0xF] = 0;
    }
    this.registers[x] -= this.registers[y];
  }

  shrVx(x) {
    if ((this.registers[x] & 0x00FF) === 0x00FF) {
      this.registers[0xF] = 1;
    } else {
      this.registers[0xF] = 0;
    }
    this.registers[x] = (this.registers[x] >> 1);
  }

  subnVxVy(x, y) {
    if (this.registers[y] > this.registers[x]) {
      this.registers[0xF] = 1;
    } else {
      this.registers[0xF] = 0;
    }
    this.registers[y] -= this.registers[x];
  }

  shlVx(x) {
    if ((this.registers[x] & 0xFF00) === 0xFF00) {
      this.registers[0xF] = 1;
    } else {
      this.registers[0xF] = 0;
    }
    this.registers[x] = (this.registers[x] << 1);
  }

  sneVxVy(x, y) {
    if (this.registers[x] !== this.registers[y]) {
      this.ip += 2;
    }
  }

  ld(addr) {
    this.I = addr;
  }

  jpV0(addr) {
    this.pc = addr + this.registers[0];
  }

  rndVx(x) {
    const byte = Math.ceil(Math.random() * 256);
    this.registers[x] &= byte;
  }

  drwVxVy(x, y, nibble) {
    x = this.registers[x];
    y = this.registers[y];
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
        this.registers[0xF] = collide ? 1 : 0;
      }
    }
  }

  skpVx(x) {
    // TODO implement
  }

  sknpVx(x) {
    // TODO implement
  }

  ldVxDt(x) {
    // TODO implement
  }

  ldVxK(x, key) {
    // TODO implement
    // stop execution until keypress
    this.running = false;
  }

  ldDtVx(x) {
    // TODO implement
  }

  ldStVx(x) {
    // TODO implement
  }

  addIVx(x) {
    this.I += this.registers[x];
  }

  ldFVx(x) {
    this.I = this.registers[x] * 5;
  }

  ldBVx(x) {
    let value = this.registers[x];

    const a = Math.floor(value / 100);
    value = value - a * 100;
    const b = Math.floor(value / 10);
    value = value - b * 10;
    const c = Math.floor(value);

    this.ram[this.I] = a;
    this.ram[this.I + 1] = b;
    this.ram[this.I + 2] = c;
  }

  ldIVx(x) {
    for (let r = 0; r <= x; r++) {
      this.ram[this.I + r] = this.registers[r];
    }
  }

  ldVxI(x) {
    for (let r = 0; r <= x; r++) {
      this.registers[r] = this.ram[this.I + r];
    }
  }

  getOpCode() {
    const high = this.ram[this.ip++];
    const low = this.ram[this.ip++];
    return high << 8 | low
  }

  /**
   * Loads rom into RAM.
   * @param {Uint8Array} rom
   */
  load(rom) {
    for (let i = 0; i < rom.byteLength; i++) {
      this.ram[this.ip + i] = rom[i];
    }
  }
}

const ibmLogo = '/roms/IBM Logo.ch8';
const chip8Pic = '/roms/chip8-picture.ch8';
const chip8Logo = '/roms/Chip8 emulator Logo [Garstyciuks].ch8';
const testOpcode = '/roms/test_opcode.ch8';
const hello = '/roms/BMP Viewer - Hello (C8 example) [Hap, 2005].ch8';
const random = '/roms/Random Number Test [Matthew Mikolay, 2010].ch8';
const division = '/roms/Division Test [Sergey Naydenov, 2010].ch8';

const chip8 = new Chip8();
const response = fetch(division)
  .then(response => response.arrayBuffer())
  .then(buffer => new Uint8Array(buffer))
  .then(rom => {
    chip8.load(rom);
    chip8.start();
  })

  window.chip8 = chip8;

setInterval(() => {
  chip8.tick();
}, 0)