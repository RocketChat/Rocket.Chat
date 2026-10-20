// Usage: node perf/reveal-check.mjs <out dir under perf/>
// Reads the first row's hover-revealed actions at rest, hovered and focused, to check the reveal really happens.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const here = import.meta.dirname;
const require = createRequire(join(here, '..', 'package.json'));
const { chromium } = require('playwright-core');

const [dir] = process.argv.slice(2);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = await new Promise((ok) => {
	const s = createServer((req, res) => {
		const path = join(here, dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
		const file = existsSync(path) && statSync(path).isDirectory() ? join(path, 'index.html') : path;
		if (!existsSync(file)) return res.writeHead(404).end();
		res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
		createReadStream(file).pipe(res);
	});
	s.listen(0, '127.0.0.1', () => ok(s));
});
const browser = await chromium.launch();
const read = async (action) => {
	const page = await browser.newPage();
	await page.goto(`http://127.0.0.1:${server.address().port}/?scenario=itemActions&n=3&root=1`);
	await page.waitForFunction(() => window.__result);
	if (action === 'hover') await page.hover('.rcx-item');
	if (action === 'focus') await page.focus('.rcx-item button');
	await page.waitForTimeout(500);
	const value = await page.evaluate(() => {
		const actions = getComputedStyle(document.querySelector('.rcx-item__actions--reveal-hover'));
		return `opacity=${actions.opacity} columns=${actions.gridTemplateColumns}`;
	});
	await page.close();
	return value;
};
for (const action of ['rest', 'hover', 'focus']) console.log(dir, action, await read(action));
await browser.close();
server.close();
