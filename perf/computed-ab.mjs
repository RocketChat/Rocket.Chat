// Usage: node perf/computed-ab.mjs <out dir A> <out dir B> <scenario> [hover]
// Renders a few rows of a bench scenario in both builds and diffs every element's computed style, tag and rcx classes.
// With `hover`, hovers the first row before reading, so hover and group-hover rules are compared too.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const here = import.meta.dirname;
const require = createRequire(join(here, '..', 'package.json'));
const { chromium } = require('playwright-core');

const [dirA, dirB, scenario, hover] = process.argv.slice(2);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const serve = (dir) =>
	new Promise((ok) => {
		const server = createServer((req, res) => {
			const path = join(here, dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
			const file = existsSync(path) && statSync(path).isDirectory() ? join(path, 'index.html') : path;
			if (!existsSync(file)) return res.writeHead(404).end();
			res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
			createReadStream(file).pipe(res);
		});
		server.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }));
	});

const browser = await chromium.launch();
const snapshot = async (dir) => {
	const server = await serve(dir);
	const page = await browser.newPage();
	page.on('pageerror', (error) => console.log(`[${dir}] ${error.message}`));
	page.on('console', (message) => message.type() === 'error' && console.log(`[${dir}] ${message.text()}`));
	await page.goto(`${server.url}/?scenario=${scenario}&n=3&root=1`);
	await page.waitForFunction(() => window.__result);
	const error = await page.evaluate(() => window.__result.error);
	if (error) console.log(`[${dir}] ${error}`);
	if (hover) await page.hover('#root > * > *:first-child');
	const result = await page.evaluate(() =>
		[...document.querySelectorAll('#root *')].map((el) => {
			const style = getComputedStyle(el);
			return {
				tag: el.tagName,
				rcx: [...el.classList].filter((c) => c.startsWith('rcx-')).join(' '),
				style: Object.fromEntries([...style].map((p) => [p, style.getPropertyValue(p)])),
				box: JSON.stringify(el.getBoundingClientRect()),
			};
		}),
	);
	await page.close();
	server.close();
	return result;
};

const [a, b] = [await snapshot(dirA), await snapshot(dirB)];
let diffs = 0;
if (a.length !== b.length) console.log(`element count ${a.length} vs ${b.length}`);
for (let i = 0; i < Math.min(a.length, b.length); i++) {
	const [x, y] = [a[i], b[i]];
	const props = Object.keys(x.style).filter((p) => x.style[p] !== y.style[p]);
	if (x.tag !== y.tag || x.rcx !== y.rcx || x.box !== y.box || props.length) {
		diffs++;
		console.log(`#${i} ${x.tag}.${x.rcx}`, x.tag !== y.tag ? `tag ${y.tag}` : '', x.rcx !== y.rcx ? `rcx "${y.rcx}"` : '', x.box !== y.box ? 'box' : '');
		for (const p of props.slice(0, 8)) console.log(`   ${p}: ${x.style[p]} -> ${y.style[p]}`);
	}
}
console.log(`${a.length} elements, ${diffs} differ`);
await browser.close();
