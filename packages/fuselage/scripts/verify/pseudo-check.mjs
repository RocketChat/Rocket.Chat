// Usage: node scripts/verify/pseudo-check.mjs <storybook-static> <story id> <selector> [wait ms]
// Reports whether storybook-addon-pseudo-states pinned the state: the element's classes and a few computed styles over time.
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { serve } from './serve.mjs';

const require = createRequire(join(import.meta.dirname, '../..', 'package.json'));
const { chromium } = require('playwright-core');

const [dir, id, selector, wait = '2000'] = process.argv.slice(2);
const server = await serve(dir);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${server.url}/iframe.html?id=${id}&viewMode=story`);
await page.waitForSelector('#storybook-root > *', { state: 'attached' });
const read = () =>
	page.evaluate((sel) => {
		const el = globalThis.document.querySelector(sel);
		if (!el) return 'not found';
		const cs = globalThis.getComputedStyle(el);
		return {
			className: el.className,
			radius: cs.borderTopLeftRadius,
			outline: cs.outlineStyle,
			bg: cs.backgroundColor,
			boxShadow: cs.boxShadow.slice(0, 40),
		};
	}, selector);
console.log('at load', JSON.stringify(await read()));
await page.waitForTimeout(Number(wait));
console.log(`after ${wait}ms`, JSON.stringify(await read()));
await browser.close();
server.close();
