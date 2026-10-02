import * as fs from 'node:fs';

import prettier from 'prettier';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import sharp from 'sharp';

import RocketChatLogo from '../dist/cjs/RocketChatLogo/index.js';

const html = ReactDOMServer.renderToStaticMarkup(React.createElement(RocketChatLogo.default));

const prettySvg = await prettier.format(html, { parser: 'html' });

fs.writeFileSync('./dist/logo.svg', prettySvg);

await sharp(Buffer.from(prettySvg), { density: 450 }).resize({ width: 1000 }).png().toFile('./dist/logo.png');
