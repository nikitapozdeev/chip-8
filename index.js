import Chip8 from './chip8.js';
import { createKeyboardEvent } from './utils.js';

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

let chip8 = null;

const startBtn = document.getElementById('start');
startBtn.addEventListener('click', () => {
  chip8 = new Chip8();
  const response = fetch(breakout1)
    .then(response => response.arrayBuffer())
    .then(buffer => new Uint8Array(buffer))
    .then(rom => {
      chip8.load(rom);
      chip8.start();
    });
  
    window.chip8 = chip8;
  });

// register listeners for on-screen keyboard
function setupOnScreenKeyboard() {
  const keyboardElement = document.getElementById('keyboard');
  const keyboardKeyClass = 'keyboard__key';
  const keyboardDataAttr = 'data-key';

  keyboardElement.addEventListener('mousedown', (event) => {
    if (event.target.classList.contains(keyboardKeyClass)) {
      const key = event.target.getAttribute(keyboardDataAttr);
      createKeyboardEvent('keydown', key.charCodeAt(0));
    }
  });

  keyboardElement.addEventListener('mouseup', (event) => {
    if (event.target.classList.contains(keyboardKeyClass)) {
      const key = event.target.getAttribute(keyboardDataAttr);
      createKeyboardEvent('keyup', key.charCodeAt(0));
    }
  });
}

setupOnScreenKeyboard();