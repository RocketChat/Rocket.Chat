// Usage: node perf/attr-count.mjs <out dir under perf/> <scenario> <css selector> [n]
// Counts the elements a bench scenario renders that match a selector, to check attributes survive a change.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const here = import.meta.dirname;
const require = createRequire(join(here, '..', 'package.json'));
const { chromium } = require('playwright-core');

const [dir, scenario, selector, n = '3'] = process.argv.slice(2);
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
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/?scenario=${scenario}&n=${n}&root=1`);
await page.waitForFunction(() => window.__result);
console.log(dir, selector, await page.evaluate((sel) => document.querySelectorAll(`#root ${sel}`).length, selector));
await browser.close();
server.close();
