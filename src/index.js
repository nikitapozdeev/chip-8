import Chip8 from './chip8.js';
import { createKeyboardEvent } from './utils.js';
import roms from '../assets/data/roms.json';
import './style.css';

let chip8 = null;

const startBtn = document.getElementById('start');
startBtn.addEventListener('click', () => {
  chip8 = new Chip8();
  const response = fetch('./roms/octojam1title.ch8')
    .then(response => response.arrayBuffer())
    .then(buffer => new Uint8Array(buffer))
    .then(rom => {
      chip8.load(rom);
      chip8.start();
    });
  
    window.chip8 = chip8;
  });

function setupRomsShelf() {
  console.log(roms);
}

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

setupRomsShelf();
setupOnScreenKeyboard();
