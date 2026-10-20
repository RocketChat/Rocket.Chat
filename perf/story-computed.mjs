// Usage: node perf/story-computed.mjs <storybook-static A> <storybook-static B> <story id> [max elements]
// Diffs tag, rcx classes and computed styles of every element a story renders in two Storybook builds.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const require = createRequire(join(import.meta.dirname, '..', 'package.json'));
const { chromium } = require('playwright-core');

const [dirA, dirB, id, max = '6'] = process.argv.slice(2);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const serve = (dir) =>
	new Promise((ok) => {
		const server = createServer((req, res) => {
			const path = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
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
	const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
	await page.goto(`${server.url}/iframe.html?id=${id}&viewMode=story`);
	await page.waitForSelector('#storybook-root > *', { timeout: 15000 });
	const result = await page.evaluate(() =>
		[...document.querySelectorAll('#storybook-root *')].map((el) => {
			const style = getComputedStyle(el);
			return {
				tag: el.tagName,
				rcx: [...el.classList].filter((c) => c.startsWith('rcx-') && !c.startsWith('rcx-css-')).join(' '),
				style: Object.fromEntries([...style].map((p) => [p, style.getPropertyValue(p)])),
			};
		}),
	);
	await page.close();
	server.close();
	return result;
};

const [a, b] = [await snapshot(dirA), await snapshot(dirB)];
let shown = 0;
if (a.length !== b.length) console.log(`element count ${a.length} vs ${b.length}`);
for (let i = 0; i < Math.min(a.length, b.length) && shown < Number(max); i++) {
	const [x, y] = [a[i], b[i]];
	const props = Object.keys(x.style).filter((p) => x.style[p] !== y.style[p] && !/origin$/.test(p));
	if (x.tag !== y.tag || x.rcx !== y.rcx || props.length) {
		shown++;
		console.log(`#${i} ${x.tag}.${x.rcx}`, x.rcx !== y.rcx ? `-> rcx "${y.rcx}"` : '');
		for (const p of props.slice(0, 8)) console.log(`   ${p}: ${x.style[p]} -> ${y.style[p]}`);
	}
}
await browser.close();
