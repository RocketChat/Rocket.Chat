// Usage: node scripts/verify/pseudo-check.mjs <storybook-static> <story id> <selector> [wait ms]
// Reports whether storybook-addon-pseudo-states pinned the state: the element's classes and a few computed styles over time.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const require = createRequire(join(import.meta.dirname, '../..', 'package.json'));
const { chromium } = require('playwright-core');

const [dir, id, selector, wait = '2000'] = process.argv.slice(2);
const MIME = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.woff2': 'font/woff2',
	'.svg': 'image/svg+xml',
};
const server = await new Promise((ok) => {
	const s = createServer((req, res) => {
		const path = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
		const file = existsSync(path) && statSync(path).isDirectory() ? join(path, 'index.html') : path;
		if (!existsSync(file)) return res.writeHead(404).end();
		res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
		createReadStream(file).pipe(res);
	});
	s.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${s.address().port}`, close: () => s.close() }));
});
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
