import Chip8 from './chip8';
import { createKeyboardEvent } from './utils';
import roms from '../assets/data/roms.json';
import './style.css';
import { BACK_COLOR, HEIGHT, SCALE_FACTOR, WIDTH } from './constants';

const canvas = document.getElementById('chip8') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas not found');
}

const context = canvas.getContext('2d');
if (!context) {
  throw new Error('Cant get 2d context');
}

canvas.width = WIDTH * SCALE_FACTOR;
canvas.height = HEIGHT * SCALE_FACTOR;
context.fillStyle = BACK_COLOR;
context.fillRect(0, 0, canvas.width, canvas.height);
context.scale(SCALE_FACTOR, SCALE_FACTOR);

const isValidEventTarget = (eventTarget: EventTarget | null): eventTarget is HTMLElement => {
  return eventTarget instanceof HTMLElement;
};

const loadRom = (romName: string) => {
  const chip8 = new Chip8(context);
  fetch(`./roms/${romName}.ch8`)
    .then((response) => response.arrayBuffer())
    .then((buffer) => new Uint8Array(buffer))
    .then((rom) => {
      chip8.load(rom);
      chip8.start();
    });
};

function renderRoms() {
  const romsElements = roms
    .map((rom) => {
      return `<div class='rom' data-key='${rom}'>${rom}</div>`;
    })
    .join('');

  const romsContainerElement = document.getElementById('roms');
  if (!romsContainerElement) {
    return;
  }

  romsContainerElement.insertAdjacentHTML('beforeend', romsElements);

  romsContainerElement.addEventListener('click', ({ target }) => {
    if (!isValidEventTarget(target)) {
      return;
    }

    if (target.classList.contains('rom')) {
      const key = target.getAttribute('data-key');
      if (key) {
        loadRom(key);
      }
    }
  });
}

// register listeners for on-screen keyboard
function setupOnScreenKeyboard() {
  const keyboardElement = document.getElementById('keyboard');
  if (!keyboardElement) {
    return;
  }

  const keyboardKeyClass = 'keyboard__key';
  const keyboardDataAttr = 'data-key';

  keyboardElement.addEventListener('mousedown', ({ target }) => {
    if (!isValidEventTarget(target)) {
      return;
    }

    if (target.classList.contains(keyboardKeyClass)) {
      const key = target.getAttribute(keyboardDataAttr);
      if (key) {
        createKeyboardEvent('keydown', key.charCodeAt(0));
      }
    }
  });

  keyboardElement.addEventListener('mouseup', ({ target }) => {
    if (!isValidEventTarget(target)) {
      return;
    }

    if (target.classList.contains(keyboardKeyClass)) {
      const key = target.getAttribute(keyboardDataAttr);
      if (key) {
        createKeyboardEvent('keyup', key.charCodeAt(0));
      }
    }
  });
}

renderRoms();
setupOnScreenKeyboard();
