
const { execSync } = require('child_process');

console.log('Running npm-postinstall.js');

execSync('cp node_modules/katex/dist/katex.min.css app/katex/');

execSync('mkdir -p public/fonts/');
execSync('cp node_modules/katex/dist/fonts/* public/fonts/');

execSync('cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/');
