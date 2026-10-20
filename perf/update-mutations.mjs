// Usage: node perf/update-mutations.mjs <out dir under perf/> <scenario> [n]
// Counts the DOM attribute mutations an update makes, and shows a sample of class names that changed.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const here = import.meta.dirname;
const require = createRequire(join(here, '..', 'package.json'));
const { chromium } = require('playwright-core');

const [dir, scenario, n = '3'] = process.argv.slice(2);
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
await page.goto(`http://127.0.0.1:${server.address().port}/?scenario=${scenario}&n=${n}&root=1&pause=update`);
await page.waitForFunction(() => window.__paused === 'before-update');
await page.evaluate(() => {
	window.__mutations = [];
	new MutationObserver((records) => window.__mutations.push(...records.map((r) => ({ type: r.type, attr: r.attributeName, old: r.oldValue, now: r.target.getAttribute?.(r.attributeName) }))))
		.observe(document.getElementById('root'), { subtree: true, attributes: true, attributeOldValue: true, childList: true, characterData: true });
	window.__resume();
});
await page.waitForFunction(() => window.__paused === 'after-update');
const mutations = await page.evaluate(() => window.__mutations);
const counts = {};
for (const m of mutations) counts[`${m.type}${m.attr ? `:${m.attr}` : ''}`] = (counts[`${m.type}${m.attr ? `:${m.attr}` : ''}`] ?? 0) + 1;
console.log(dir, scenario, counts);
for (const m of mutations.filter((m) => m.attr === 'class').slice(0, 4)) console.log(`  - ${m.old}\n  + ${m.now}`);
await browser.close();
server.close();
