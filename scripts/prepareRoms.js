const fs = require('fs');
const path = require('path');

const sourcePath = path.resolve(__dirname, '../roms');
const destinationPath = path.resolve(__dirname, '../assets/data/roms.json');

fs.readdir(sourcePath, (_, files) => {
  const roms = files
    .filter(file => file.endsWith('.ch8'))
    .map(file => path.parse(file).name);
    const json = JSON.stringify(roms);
  fs.writeFile(destinationPath, json, 'utf8', () => {});
});