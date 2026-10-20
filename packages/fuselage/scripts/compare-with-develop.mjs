#!/usr/bin/env node
/**
 * Compares this branch's Fuselage with another ref (default `origin/develop`): bundle sizes, and the cost of
 * rendering Storybook stories in Chromium (time to render, style recalculation, layout, script, heap, live CSS).
 *
 * Usage (from the repo root, after `yarn install` and building Fuselage's workspace dependencies):
 *   node packages/fuselage/scripts/compare-with-develop.mjs [--base origin/develop] [--stories <regex>] [--runs 5] [--skip-build]
 */
/* global document -- read inside `page.evaluate`, which runs in the browser */
import { execFileSync } from 'node:child_process';
import { cpSync, createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const { values: args } = parseArgs({
	options: {
		'base': { type: 'string', default: 'origin/develop' },
		'stories': {
			type: 'string',
			default: '^(inputs-button|inputs-inputbox|data-display-tag|navigation-item|message-message|data-display-table|navigation-sidebar)--',
		},
		'runs': { type: 'string', default: '5' },
		'skip-build': { type: 'boolean', default: false },
	},
});

const repo = resolve(import.meta.dirname, '../../..');
const work = join(tmpdir(), 'fuselage-compare');
const require = createRequire(join(repo, 'package.json'));
const { chromium } = require('playwright-core');

// Fuselage's own Vite and Storybook versions, which differ from the ones hoisted to the repo root
const fuselageRequire = createRequire(join(repo, 'packages/fuselage/package.json'));
const binOf = (name, bin) => {
	const manifest = fuselageRequire.resolve(`${name}/package.json`);
	const { bin: bins } = JSON.parse(readFileSync(manifest, 'utf8'));
	return join(dirname(manifest), typeof bins === 'string' ? bins : bins[bin]);
};

const run = (cmd, cmdArgs, cwd, env = {}) =>
	execFileSync(cmd, cmdArgs, { cwd, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, ...env } });

const build = (root, name) => {
	const pkg = join(root, 'packages/fuselage');
	console.error(`building ${name}…`);
	run(process.execPath, [binOf('vite', 'vite'), 'build', '--mode', 'production'], pkg);
	run(process.execPath, [binOf('storybook', 'storybook'), 'build', '--quiet', '-o', join(work, `${name}-storybook`)], pkg, {
		NODE_ENV: 'production',
	});
	rmSync(join(work, `${name}-dist`), { recursive: true, force: true });
	cpSync(join(pkg, 'dist'), join(work, `${name}-dist`), { recursive: true });
};

const prepareBase = () => {
	const base = join(work, 'base');
	if (existsSync(base)) execFileSync('git', ['-C', repo, 'worktree', 'remove', '--force', base]);
	execFileSync('git', ['-C', repo, 'fetch', '-q', 'origin', args.base.replace(/^origin\//, '')]);
	execFileSync('git', ['-C', repo, 'worktree', 'add', '-q', '--detach', base, args.base]);
	// The base reuses this checkout's dependencies, which are a superset of what it needs
	symlinkSync(join(repo, 'node_modules'), join(base, 'node_modules'));
	if (existsSync(join(repo, 'packages/fuselage/node_modules'))) {
		symlinkSync(join(repo, 'packages/fuselage/node_modules'), join(base, 'packages/fuselage/node_modules'));
	}
	return base;
};

const sizes = (dist) => {
	const file = (name) => {
		const buffer = readFileSync(join(dist, name));
		return { raw: buffer.length, gzip: gzipSync(buffer).length, brotli: brotliCompressSync(buffer).length };
	};
	return { 'fuselage.production.js': file('fuselage.production.js'), 'fuselage.css': file('fuselage.css') };
};

const MIME = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
	'.png': 'image/png',
};
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

const measure = async (browser, url, storyId) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	const cdp = await context.newCDPSession(page);
	await cdp.send('Performance.enable');
	const start = performance.now();
	await page.goto(`${url}/iframe.html?id=${storyId}&viewMode=story`, { waitUntil: 'load' });
	await page.waitForFunction(() => (document.querySelector('#storybook-root')?.childElementCount ?? 0) > 0);
	await page.evaluate(() => document.fonts.ready);
	const renderMs = performance.now() - start;
	const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]));
	const css = await page.evaluate(() => {
		let rules = 0;
		let bytes = 0;
		for (const sheet of document.styleSheets) {
			try {
				for (const rule of sheet.cssRules) {
					rules++;
					bytes += rule.cssText.length;
				}
			} catch {
				// cross-origin sheet
			}
		}
		return { rules, bytes };
	});
	await context.close();
	return {
		'render ms': renderMs,
		'style recalc ms': metrics.RecalcStyleDuration * 1000,
		'layout ms': metrics.LayoutDuration * 1000,
		'script ms': metrics.ScriptDuration * 1000,
		'heap MB': metrics.JSHeapUsedSize / 2 ** 20,
		'css rules': css.rules,
		'css kB': css.bytes / 1024,
	};
};

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const delta = (base, head) => (base ? `${(((head - base) / base) * 100).toFixed(1)}%` : 'n/a');
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

mkdirSync(work, { recursive: true });
if (!args['skip-build']) {
	build(repo, 'head');
	build(prepareBase(), 'base');
	execFileSync('git', ['-C', repo, 'worktree', 'remove', '--force', join(work, 'base')]);
}
const head = { dist: join(work, 'head-dist'), storybook: join(work, 'head-storybook') };
const base = { dist: join(work, 'base-dist'), storybook: join(work, 'base-storybook') };

console.log(`\n## Bundle size (${args.base} → HEAD)\n`);
console.log('| file | metric | base | head | delta |\n|---|---|---|---|---|');
const [baseSizes, headSizes] = [sizes(base.dist), sizes(head.dist)];
for (const file of Object.keys(headSizes)) {
	for (const metric of ['raw', 'gzip', 'brotli']) {
		const [b, h] = [baseSizes[file][metric] / 1024, headSizes[file][metric] / 1024];
		console.log(`| ${file} | ${metric} kB | ${b.toFixed(1)} | ${h.toFixed(1)} | ${delta(b, h)} |`);
	}
}

const index = JSON.parse(readFileSync(join(base.storybook, 'index.json'), 'utf8'));
const headIndex = JSON.parse(readFileSync(join(head.storybook, 'index.json'), 'utf8'));
const pattern = new RegExp(args.stories);
const stories = Object.values(index.entries)
	.filter((entry) => entry.type === 'story' && pattern.test(entry.id) && headIndex.entries[entry.id])
	.map((entry) => entry.id);

const runs = Number(args.runs);
const browser = await chromium.launch();
const [baseServer, headServer] = await Promise.all([serve(base.storybook), serve(head.storybook)]);
const totals = { base: {}, head: {} };

console.log(`\n## Story render cost (median of ${runs} cold runs, ${stories.length} stories)\n`);
console.log('| story | metric | base | head | delta |\n|---|---|---|---|---|');
for (const storyId of stories) {
	const samples = { base: [], head: [] };
	for (let i = 0; i < runs; i++) {
		// Alternate the order so neither side always runs with a warmer machine
		const order = i % 2 ? ['head', 'base'] : ['base', 'head'];
		for (const side of order) {
			samples[side].push(await measure(browser, (side === 'base' ? baseServer : headServer).url, storyId));
		}
	}
	for (const metric of Object.keys(samples.base[0])) {
		const [b, h] = [median(samples.base.map((s) => s[metric])), median(samples.head.map((s) => s[metric]))];
		(totals.base[metric] ??= []).push(b);
		(totals.head[metric] ??= []).push(h);
		console.log(`| ${storyId} | ${metric} | ${fmt(b)} | ${fmt(h)} | ${delta(b, h)} |`);
	}
}

console.log('\n## Totals across stories (sum of medians)\n');
console.log('| metric | base | head | delta |\n|---|---|---|---|');
for (const metric of Object.keys(totals.base)) {
	const [b, h] = [totals.base[metric].reduce((x, y) => x + y, 0), totals.head[metric].reduce((x, y) => x + y, 0)];
	console.log(`| ${metric} | ${fmt(b)} | ${fmt(h)} | ${delta(b, h)} |`);
}

await browser.close();
baseServer.close();
headServer.close();
