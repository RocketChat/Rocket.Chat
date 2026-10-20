// Usage: node perf/profile.mjs <out dir under perf/> <scenario> <n> [root 0|1]
// CPU-profiles one bench page load and prints self time grouped by package and by function, mapped through the
// bundle's source map (build the page with MINIFY=false).
import { readdirSync, readFileSync } from 'node:fs';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';

const here = import.meta.dirname;
const require = createRequire(join(here, '..', 'package.json'));
const { chromium } = require('playwright-core');
const { SourceMapConsumer } = require('source-map');

const [outDir, scenario, n, root = '1'] = process.argv.slice(2);
const dir = join(here, outDir);
const bundle = readdirSync(join(dir, 'assets')).find((f) => f.endsWith('.js'));
const map = await new SourceMapConsumer(JSON.parse(readFileSync(join(dir, 'assets', `${bundle}.map`), 'utf8')));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = await new Promise((ok) => {
	const s = createServer((req, res) => {
		const path = join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
		const file = existsSync(path) && statSync(path).isDirectory() ? join(path, 'index.html') : path;
		if (!existsSync(file)) return res.writeHead(404).end();
		res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
		createReadStream(file).pipe(res);
	});
	s.listen(0, '127.0.0.1', () => ok(s));
});

const browser = await chromium.launch();
const page = await browser.newPage();
const cdp = await page.context().newCDPSession(page);
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 100 });
const onlyUpdate = process.env.PHASE === 'update';
if (!onlyUpdate) await cdp.send('Profiler.start');
await page.goto(`http://127.0.0.1:${server.address().port}/?scenario=${scenario}&n=${n}&root=${root}${onlyUpdate ? '&pause=update' : ''}`);
if (onlyUpdate) {
	await page.waitForFunction(() => window.__paused === 'before-update', null, { timeout: 120000 });
	await cdp.send('Profiler.start');
	await page.evaluate(() => window.__resume());
	await page.waitForFunction(() => window.__paused === 'after-update', null, { timeout: 120000 });
}
const { profile } = await cdp.send('Profiler.stop');
if (onlyUpdate) await page.evaluate(() => window.__resume());
await page.waitForFunction(() => window.__result, null, { timeout: 120000 });
const result = await page.evaluate(() => window.__result);
await browser.close();
server.close();

// Self time per node from the sample list
const dt = new Map();
for (let i = 0; i < profile.samples.length; i++) {
	const id = profile.samples[i];
	dt.set(id, (dt.get(id) ?? 0) + (profile.timeDeltas[i + 1] ?? 0) / 1000);
}

const packageOf = (source) => {
	if (!source) return '(native/other)';
	const m = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(source);
	if (m) return m[1];
	if (source.includes('perf/head-dist') || source.includes('packages/fuselage/')) return '@rocket.chat/fuselage';
	return source.split('/').slice(-2).join('/');
};

const byPackage = new Map();
const byFunction = new Map();
let total = 0;
for (const node of profile.nodes) {
	const self = dt.get(node.id) ?? 0;
	if (!self) continue;
	const { url, lineNumber, columnNumber, functionName } = node.callFrame;
	if (!url.includes(bundle)) {
		const key = functionName || `(${url ? 'other script' : node.callFrame.functionName || 'program/gc/idle'})`;
		if (['(idle)', '(program)'].includes(functionName)) continue;
		byPackage.set('(native/other)', (byPackage.get('(native/other)') ?? 0) + self);
		byFunction.set(`${key} [native]`, (byFunction.get(`${key} [native]`) ?? 0) + self);
		total += self;
		continue;
	}
	const pos = map.originalPositionFor({ line: lineNumber + 1, column: columnNumber });
	const pkg = packageOf(pos.source);
	const fn = `${pos.name || functionName || '(anonymous)'} [${pkg}:${(pos.source ?? '').split('/').pop()}]`;
	byPackage.set(pkg, (byPackage.get(pkg) ?? 0) + self);
	byFunction.set(fn, (byFunction.get(fn) ?? 0) + self);
	total += self;
}

const top = (m, k) => [...m].sort((a, b) => b[1] - a[1]).slice(0, k);
console.log(`scenario=${scenario} n=${n} root=${root} result=${JSON.stringify(result)}`);
console.log(`total sampled JS ms (excluding idle/program): ${total.toFixed(1)}\n`);
console.log('by package:');
for (const [k, v] of top(byPackage, 12)) console.log(`  ${v.toFixed(1).padStart(7)} ms  ${((v / total) * 100).toFixed(1).padStart(5)}%  ${k}`);
console.log('\nby function (self):');
for (const [k, v] of top(byFunction, 30)) console.log(`  ${v.toFixed(1).padStart(7)} ms  ${((v / total) * 100).toFixed(1).padStart(5)}%  ${k}`);

// Inclusive time of selected functions, counting a function once per stack even when it recurses
const nameOf = (node) => {
	const { url, lineNumber, columnNumber, functionName } = node.callFrame;
	if (!url.includes(bundle)) return functionName;
	return map.originalPositionFor({ line: lineNumber + 1, column: columnNumber }).name || functionName;
};
const watched = (process.env.INCL ?? 'getSplitStyles,useSplitStyles,useThemeState,useComponentState,useMedia,flushDirectStyles,insertStyleRules,updateRules,renderWithHooks,commitRoot,useTheme,useProps')
	.split(',');
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const inclusive = new Map();
const walk = (id, active) => {
	const node = byId.get(id);
	const name = nameOf(node);
	const self = dt.get(id) ?? 0;
	const next = watched.includes(name) && !active.has(name) ? new Set(active).add(name) : active;
	for (const n of next) inclusive.set(n, (inclusive.get(n) ?? 0) + self);
	for (const c of node.children ?? []) walk(c, next);
};
walk(profile.nodes[0].id, new Set());
console.log('\ninclusive:');
for (const [k, v] of top(inclusive, 20)) console.log(`  ${v.toFixed(1).padStart(7)} ms  ${((v / total) * 100).toFixed(1).padStart(5)}%  ${k}`);
