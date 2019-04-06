
const { execSync } = require('child_process');

console.log('Running npm-postinstall.js');

execSync('cp node_modules/katex/dist/katex.min.css app/katex/');

execSync('mkdir -p public/fonts/');
execSync('cp node_modules/katex/dist/fonts/* public/fonts/');

execSync('cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/');

execSync('mkdir -p public/packages/emojione/assets/sprites/24');
execSync('mkdir -p public/packages/emojione/assets/sprites/64');
execSync('cp node_modules/emojione-assets/sprites/emojione-sprite-24-*.png  public/packages/emojione/assets/sprites/24/');
execSync('cp node_modules/emojione-assets/sprites/emojione-sprite-64-*.png  public/packages/emojione/assets/sprites/64/');
