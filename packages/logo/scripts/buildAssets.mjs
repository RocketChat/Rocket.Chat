import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import prettier from 'prettier';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import sharp from 'sharp';

import RocketChatLogo from '../dist/cjs/RocketChatLogo/index.js';

const distDir = fileURLToPath(new URL('../dist/', import.meta.url));

const html = ReactDOMServer.renderToStaticMarkup(React.createElement(RocketChatLogo.default));

const prettySvg = await prettier.format(html, { parser: 'html' });

fs.writeFileSync(`${distDir}logo.svg`, prettySvg);

await sharp(Buffer.from(prettySvg), { density: 450 }).resize({ width: 1000 }).png().toFile(`${distDir}logo.png`);
