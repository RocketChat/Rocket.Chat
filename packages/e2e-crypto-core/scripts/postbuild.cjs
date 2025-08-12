#!/usr/bin/env node
/* Simple postbuild script: merge CJS artifacts into dist for dual package export mapping.
   For now we just rename dist-cjs/index.js -> dist/index.cjs (already configured) and copy d.ts if needed. */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const cjsDir = path.join(root, 'dist-cjs');
const distDir = path.join(root, 'dist');

if (!fs.existsSync(cjsDir)) process.exit(0);

const sourceIndex = path.join(cjsDir, 'index.js');
const targetIndex = path.join(distDir, 'index.cjs');
if (fs.existsSync(sourceIndex)) {
	fs.copyFileSync(sourceIndex, targetIndex);
	console.log('[postbuild] Wrote', path.relative(root, targetIndex));
}
