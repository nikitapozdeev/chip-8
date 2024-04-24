import { readdir, writeFile } from 'fs';
import { resolve, parse } from 'path';

const sourcePath = resolve(__dirname, '../roms');
const destinationPath = resolve(__dirname, '../assets/data/roms.json');

readdir(sourcePath, (_, files) => {
  const roms = files
    .filter(file => file.endsWith('.ch8'))
    .map(file => parse(file).name);
    const json = JSON.stringify(roms);
  writeFile(destinationPath, json, 'utf8', () => {});
});