import Chip8 from './chip8.js';
import { createKeyboardEvent } from './utils.js';
import roms from '../assets/data/roms.json';
import './style.css';

const chip8 = new Chip8();

function loadRom(romName) {
  fetch(`./roms/${romName}.ch8`)
    .then(response => response.arrayBuffer())
    .then(buffer => new Uint8Array(buffer))
    .then(rom => {
      chip8.load(rom);
      chip8.start();
    });
}

function renderRoms() {
  const romsElements = roms.map(rom => {
    return `<div class='rom' data-key='${rom}'>${rom}</div>`;
  }).join('');

  const romsContainerElement = document.getElementById('roms');
  romsContainerElement.insertAdjacentHTML('beforeend', romsElements);

  romsContainerElement.addEventListener('click', (event) => {
    if (event.target.classList.contains('rom')) {
      const key = event.target.getAttribute('data-key');
      loadRom(key);
    }
  });
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

renderRoms();
setupOnScreenKeyboard();
