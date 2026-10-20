// Usage: node perf/run-bench.mjs <runs> [scenarios comma separated]
// Mounts N instances of each scenario on develop's and the branch's Fuselage, in fresh Chromium pages, and prints
// the median of each metric. The branch runs twice: without a FuselageProvider above (each component mounts its own,
// as in the Fuselage Storybook) and with one at the root (as in the app).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const here = import.meta.dirname;
const require = createRequire(join(here, '..', 'package.json'));
const { chromium } = require('playwright-core');

const runs = Number(process.argv[2] ?? 7);
const sizes = { box: 300, button: 300, buttonStyled: 300, messageStyled: 300, messageFull: 150, buttonGroup: 300, tag: 300, item: 200, message: 150 };
const scenarios = (process.argv[3] ?? Object.keys(sizes).join(',')).split(',');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
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

const variants = (process.env.VARIANTS ?? 'develop:out-base:0,branch provider per component:out-head:0,branch root provider:out-head:1')
	.split(',')
	.map((v) => {
		const [name, dir, root] = v.split(':');
		return { name, dir, root: Number(root) };
	});

const dirs = [...new Set(variants.map((v) => v.dir))];
const servers = Object.fromEntries(await Promise.all(dirs.map(async (d) => [d, await serve(join(here, d))])));
const browser = await chromium.launch();

const once = async (variant, scenario) => {
	const page = await browser.newPage();
	const errors = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto(`${servers[variant.dir].url}/?scenario=${scenario}&n=${Number(process.env.N) || sizes[scenario]}&root=${variant.root}`);
	await page.waitForFunction(() => window.__result, null, { timeout: 60000 });
	const result = await page.evaluate(() => window.__result);
	await page.close();
	if (result.error || errors.length) throw new Error(`${variant.name} ${scenario}: ${result.error ?? errors.join('; ')}`);
	return result;
};

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

for (const scenario of scenarios) {
	const results = {};
	for (let i = 0; i < runs; i++) {
		// Rotate the order so no variant always runs on a warmer machine
		for (const variant of [...variants.slice(i % 3), ...variants.slice(0, i % 3)]) {
			(results[variant.name] ??= []).push(await once(variant, scenario));
		}
	}
	console.log(`\n### ${scenario} (n=${sizes[scenario]}, median of ${runs})\n`);
	console.log(`| metric | ${variants.map((v) => v.name).join(' | ')} |\n|---|${variants.map(() => '---').join('|')}|`);
	for (const metric of Object.keys(results[variants[0].name][0])) {
		const values = variants.map((v) => median(results[v.name].map((r) => r[metric])));
		const base = values[0];
		console.log(
			`| ${metric} | ${values.map((v, j) => `${Number.isInteger(v) ? v : v.toFixed(1)}${j && base ? ` (${(((v - base) / base) * 100).toFixed(0)}%)` : ''}`).join(' | ')} |`,
		);
	}
}

await browser.close();
for (const s of Object.values(servers)) s.close();
