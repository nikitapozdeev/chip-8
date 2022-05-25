import { FONT_SPRITES } from "./font.js";
import Keyboard from "./keyboard.js";
import Speaker from './speaker.js';

const canvas = document.getElementById('chip8');
const context = canvas.getContext('2d');

const WIDTH = 64;
const HEIGHT = 32;
const BACK_COLOR = '#CADC9F';
const FORE_COLOR = '#306230';
const SCALE_FACTOR = 10;

canvas.width = WIDTH * SCALE_FACTOR;
canvas.height = HEIGHT * SCALE_FACTOR;
context.fillStyle = BACK_COLOR;
context.fillRect(0, 0, canvas.width, canvas.height);
context.scale(SCALE_FACTOR, SCALE_FACTOR);

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

    this.speed = 10;

    this.running = false;

    this.loadFont();

    this.speaker = new Speaker();
    this.keyboard = new Keyboard();
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
          context.fillStyle = FORE_COLOR;
        } else {
          context.fillStyle = BACK_COLOR;
        }
        context.fillRect(x, y, 1, 1);
      }
    }
  }

  start() {
    this.running = true;
    console.log('power on');

    const fps = 60;
    const rate = 1000 / fps;
    let lastTime;

    const step = (timestamp) => {
      if (lastTime) {
        const delta = timestamp - lastTime;
        // TODO: better solution
        if (delta.toFixed(2) >= rate.toFixed(2)) {
          this.tick();
        }
      }
      lastTime = timestamp;
      window.requestAnimationFrame(step);
    }
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
    if (this.dt > 0) {
      this.dt--;
    }

    if (this.st > 0) {
      this.st--;
    }
  }

  processAudio() {
    if (this.st > 0) {
      this.speaker.play();
    } else {
      this.speaker.stop();
    }
  }

  processInstruction() {
    const opcode = this.getOpCode();
    const addr = opcode & 0xFFF;
    const nibble = opcode & 0xF;
    const x = opcode >> 8 & 0xF;
    const y = opcode >> 4 & 0xF;
    const byte = opcode & 0xFF;
    
    /*if ((opcode & 0xF000) === 0x0000) {
      //this.sys(addr);
    } else*/ if (opcode === 0x00E0) {
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
      throw new Error('unknown command ' + opcode.toString(16).padStart(4, '0'))
    }
  }

  /** --------instructions-------- */
  sys(addr) {
    this.ip = addr;
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

  rndVx(x, byte) {
    const rnd = Math.ceil(Math.random() * 256);
    this.registers[x] = rnd & byte;
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
    const chip8Key = this.registers[x];
    if (this.keyboard.isKeyPressed(chip8Key)) {
      this.ip += 2;
    }
  }

  sknpVx(x) {
    const chip8Key = this.registers[x];
    if (!this.keyboard.isKeyPressed(chip8Key)) {
      this.ip += 2;
    }
  }

  ldVxDt(x) {
    this.registers[x] = this.dt;
  }

  ldVxK(x) {
    this.running = false;
    this.keyboard.waitForKeyPress((key) => {
      this.registers[x] = key;
      this.running = true;
    })
  }

  ldDtVx(x) {
    this.dt = this.registers[x];
  }

  ldStVx(x) {
    this.st = this.registers[x];
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
const clock = '/roms/Clock Program [Bill Fisher, 1981].ch8';
const delayTimer = '/roms/Delay Timer Test [Matthew Mikolay, 2010].ch8';
const life = '/roms/Life [GV Samways, 1980].ch8';
const mazeAlt = '/roms/Maze (alt) [David Winter, 199x].ch8';
const landing = '/roms/Landing.ch8';
const lunar = '/roms/Lunar Lander (Udo Pernisz, 1979).ch8';
const maze = '/roms/Maze [David Winter, 199x].ch8';
const stars = '/roms/Stars [Sergey Naydenov, 2010].ch8';
const particle = '/roms/Particle Demo [zeroZshadow, 2008].ch8';
const october = '/roms/octojam1title.ch8';
const october2 = '/roms/octojam2title.ch8';
const octopeg = '/roms/octopeg.ch8';
const superneatboy = '/roms/superneatboy.ch8';
const evening = '/roms/anEveningToDieFor.ch8';
const pong = '/roms/pong.ch8';
const audioTest = '/roms/chip8-test-rom-with-audio.ch8';
const breakout1 = '/roms/Breakout (Brix hack) [David Winter, 1997].ch8';
const breakout2 = '/roms/Brick (Brix hack, 1990).ch8';
const breakout3 = '/roms/Brix [Andreas Gustafsson, 1990].ch8';

const startBtn = document.getElementById('start');
startBtn.addEventListener('click', () => {
  const chip8 = new Chip8();
  const response = fetch(october2)
    .then(response => response.arrayBuffer())
    .then(buffer => new Uint8Array(buffer))
    .then(rom => {
      chip8.load(rom);
      chip8.start();
    });
  
    window.chip8 = chip8;
  })