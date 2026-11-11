// Usage: node scripts/verify/perf-bench.mjs <storybook-static A> <storybook-static B> [runs=20]
// Times mounting and updating 150 Message rows and 200 Sidebar items (the `Benchmarks/Lists` stories) in two production
// Storybook builds, with the CPU throttled. Sides alternate and the lead side flips every run (A B, B A, ...) so drift and order effects hit both alike; each run is a fresh
// page. Prints the median of each side, the change, and the spread (interquartile range over median, IQR) as the noise floor:
// a change inside the spread is noise. For a floor between builds, pass the same build twice (two captures of `develop`).
// Measured floor, one build against itself at 20 runs and 4x throttle: IQR 3.0% to 8.1%, change between -0.5% and +1.1%.
// BENCH_CPU_THROTTLE sets the slowdown factor (default 4).
// A zero-runtime build is benched with its `tamagui-zero.css` deduped on a temporary copy, as the web client serves it: Storybook
// keeps every module's copy of each atomic rule, and style recalculation then costs more per extra frame module than the app
// pays. BENCH_DEDUPE=0 benches the build as it is.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { serve } from './serve.mjs';

const require = createRequire(join(import.meta.dirname, '../..', 'package.json'));
const { chromium } = require('playwright-core');

const [argA, argB, runsArg = '20'] = process.argv.slice(2);
const runs = Number(runsArg);
const throttle = Number(process.env.BENCH_CPU_THROTTLE ?? 4);
if (!argA || !argB || !(runs >= 1)) {
	console.error('Usage: node scripts/verify/perf-bench.mjs <storybook-static A> <storybook-static B> [runs=20]');
	process.exit(2);
}

const asServed = (dir) => {
	if (process.env.BENCH_DEDUPE === '0' || !existsSync(join(dir, 'tamagui-zero.css'))) return dir;
	const copy = mkdtempSync(join(tmpdir(), 'perf-bench-'));
	cpSync(dir, copy, { recursive: true });
	execFileSync('node', [join(import.meta.dirname, 'dedupe-zero-css.mjs'), copy], { stdio: 'ignore' });
	return copy;
};
const [dirA, dirB] = [asServed(argA), asServed(argB)];

const benchStories = (dir) => {
	const { entries } = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
	return Object.values(entries).filter((entry) => entry.type === 'story' && entry.title === 'Benchmarks/Lists');
};

const quantile = (sorted, q) => {
	const position = (sorted.length - 1) * q;
	const below = Math.floor(position);
	return sorted[below] + (sorted[Math.ceil(position)] - sorted[below]) * (position - below);
};
const stats = (samples) => {
	const sorted = [...samples].sort((a, b) => a - b);
	const median = quantile(sorted, 0.5);
	return { median, spread: (quantile(sorted, 0.75) - quantile(sorted, 0.25)) / median };
};

if (!benchStories(dirA).length) {
	console.error('Build A has no Benchmarks/Lists stories; both builds must have them.');
	process.exit(1);
}

const missing = benchStories(dirA).filter((story) => !benchStories(dirB).some((other) => other.id === story.id));
if (missing.length) {
	console.error(
		`Build B has no story ${missing.map((story) => story.id).join(', ')}; both builds must have the same Benchmarks/Lists stories.`,
	);
	process.exit(1);
}

const servers = { A: await serve(dirA), B: await serve(dirB) };
const browser = await chromium.launch();

const measure = async (base, id) => {
	const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
	try {
		const cdp = await page.context().newCDPSession(page);
		await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
		await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`);
		await page.waitForFunction(() => globalThis.__bench, undefined, { timeout: 30000 });
		await page.evaluate(() => globalThis.document.fonts.ready);
		return await page.evaluate(() => {
			const { mount, update } = globalThis.__bench;
			// The first mount and update pay for lazy initialisation that the app has already done by then.
			mount();
			update();
			return { mount: mount(), update: update() };
		});
	} finally {
		await page.close();
	}
};

const results = [];
for (const story of benchStories(dirA)) {
	const samples = { A: { mount: [], update: [] }, B: { mount: [], update: [] } };
	for (let run = 0; run < runs; run++) {
		for (const side of run % 2 ? ['B', 'A'] : ['A', 'B']) {
			const { mount, update } = await measure(servers[side].url, story.id);
			samples[side].mount.push(mount);
			samples[side].update.push(update);
		}
	}
	for (const metric of ['mount', 'update']) {
		const [a, b] = [stats(samples.A[metric]), stats(samples.B[metric])];
		results.push({
			'story': story.name,
			metric,
			'A median ms': a.median.toFixed(1),
			'B median ms': b.median.toFixed(1),
			'B vs A': `${((b.median / a.median - 1) * 100).toFixed(1)}%`,
			'IQR A': `${(a.spread * 100).toFixed(1)}%`,
			'IQR B': `${(b.spread * 100).toFixed(1)}%`,
		});
	}
}

console.log(`CPU throttle ${throttle}x, ${runs} interleaved runs`);
console.table(results);

await browser.close();
servers.A.close();
servers.B.close();
for (const [arg, dir] of [
	[argA, dirA],
	[argB, dirB],
])
	if (arg !== dir) rmSync(dir, { recursive: true, force: true });
