// Usage: node scripts/verify/dod.mjs <Component> [--before <storybook-static>] [--after <storybook-static>] [--dts <base ref>] [--size <json>] [--perf]
// Runs the Definition-of-Done checks for one component and prints the evidence as a markdown table. The A/B checks need
// both Storybook builds; the .d.ts diff builds two refs, so it only runs when a base ref is given (compared with HEAD).
// G0 runs the component's characterization stories in jest, and in the --after build when given. G5 size reads a report written
// by `node vite/sizeReport.mjs --json` in apps/meteor; perf runs the bench between --before and --after when --perf is passed.
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values: opts, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		before: { type: 'string' },
		after: { type: 'string' },
		dts: { type: 'string' },
		size: { type: 'string' },
		perf: { type: 'boolean' },
	},
});
const [component] = positionals;
if (!component) throw new Error('usage: dod.mjs <Component> [--before dir] [--after dir] [--dts ref]');

const cls = `rcx-${component.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
const here = (file) => join(import.meta.dirname, file);
const tmp = (name) => join(process.env.TMPDIR ?? '/tmp', `dod-${component}-${name}`);

const exec = (command, args, lastLine = true) => {
	const { status, stdout, stderr } = spawnSync(command, args, {
		encoding: 'utf8',
		maxBuffer: 1 << 28,
		cwd: join(import.meta.dirname, '../..'),
	});
	const output = `${stdout}${stderr}`.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g'), '').trim();
	return { ok: status === 0, output, detail: (lastLine ? output.split('\n').at(-1) : output).replaceAll('|', '/') };
};
const run = (script, args) => exec('node', [here(script), ...args]);

const characterization = (dir) =>
	readdirSync(dir, { withFileTypes: true, recursive: true }).filter((entry) => entry.name === `${component}.characterization.stories.tsx`);

const g0 = () => {
	if (!characterization(join(import.meta.dirname, '../../src')).length)
		return { skipped: 'not run', detail: 'no characterization stories' };
	const jest = exec('yarn', ['jest', 'src/testing/stories.spec.tsx', '-t', `${component}.characterization`]);
	const jestTests = jest.output.match(/Tests:.*$/m)?.[0] ?? jest.output.split('\n').at(-1);
	if (!opts.after) return { ok: jest.ok, detail: `jest: ${jestTests}` };
	const zero = exec('node', [join(import.meta.dirname, '../test-stories.mjs'), opts.after, `${component}.characterization`]);
	const zeroTests = zero.output.match(/Tests:.*$/m)?.[0] ?? zero.output.split('\n').at(-1);
	return { ok: jest.ok && zero.ok, detail: `jest: ${jestTests}; zero storybook: ${zeroTests}` };
};

const size = () => {
	if (!opts.size) return { skipped: 'not run', detail: 'pass --size <json> from: node vite/sizeReport.mjs --json <file> (apps/meteor)' };
	const { totals } = JSON.parse(readFileSync(opts.size, 'utf8'));
	const kB = (n) => (n / 1000).toFixed(1);
	return {
		skipped: 'reported',
		detail: `JS ${kB(totals.js.gzip)} kB gzip, CSS ${kB(totals.css.gzip)} kB gzip; judge against the batch budget (+25 kB gzip JS)`,
	};
};

// The bench prints "B vs A" and the noise (IQR over median) of each side; a change is judged only when it exceeds the noise.
const perf = () => {
	if (!opts.perf) return { skipped: 'not run', detail: 'pass --perf with --before and --after' };
	if (!opts.before || !opts.after) return { skipped: 'not run', detail: '--perf needs --before and --after' };
	const bench = exec('node', [here('perf-bench.mjs'), opts.before, opts.after], false);
	if (!bench.ok) return { ok: false, detail: bench.output.split('\n').at(-1) };
	const budget = 10;
	const parsed = [
		...bench.output.matchAll(
			/│\s*\d+\s*│\s*'([^']+)'\s*│\s*'(\w+)'\s*│\s*'([\d.]+)'\s*│\s*'([\d.]+)'\s*│\s*'(-?[\d.]+)%'\s*│\s*'([\d.]+)%'\s*│\s*'([\d.]+)%'/g,
		),
	];
	if (!parsed.length) return { ok: false, detail: 'could not parse the bench output' };
	let ok = true;
	const parts = parsed.map(([, story, metric, , , change, noiseA, noiseB]) => {
		const [delta, noise] = [Number(change), Math.max(Number(noiseA), Number(noiseB))];
		let verdict = 'within budget';
		if (delta > budget) verdict = delta <= noise ? 'over budget, inside noise' : 'OVER BUDGET';
		if (verdict === 'OVER BUDGET') ok = false;
		return `${story} ${metric} ${delta >= 0 ? '+' : ''}${delta}% (IQR ${noise}%): ${verdict}`;
	});
	return { ok, detail: parts.join('; ') };
};

const rows = [];
const add = (gate, check, outcome) =>
	rows.push(`| ${gate} | ${check} | ${outcome.skipped ?? (outcome.ok ? 'pass' : 'FAIL')} | ${outcome.detail} |`);
const needsBuilds = { skipped: 'not run', detail: 'needs --before and --after' };

add('G0', 'characterization specs', g0());
add('G2', 'no Box styling', run('box-usage.mjs', ['--component', component]));
add('G2', 'CSS-hack ratchet', run('css-hacks.mjs', ['--check', here('css-hacks.baseline.json')]));
add('G3', `selector inventory (${cls})`, run('selector-inventory.mjs', ['--check', here('selector-inventory.baseline.json')]));

if (opts.before && opts.after) {
	const [indexBefore, indexAfter] = [tmp('before.json'), tmp('after.json')];
	run('story-classes.mjs', [opts.before, indexBefore]);
	run('story-classes.mjs', [opts.after, indexAfter]);
	const filter = ['--renders', cls, '--class-index', indexBefore];
	add('G3', 'class contract diff', run('story-classes.mjs', ['--diff', indexBefore, indexAfter]));
	add('G3', 'pixel A/B (stories rendering the component)', run('story-ab.mjs', [opts.before, opts.after, '', ...filter]));
	add('G3', 'computed-style A/B, dark', run('story-computed.mjs', [opts.before, opts.after, '', ...filter, '--globals', 'theme:dark']));
	add('G3', 'computed-style A/B, RTL', run('story-computed.mjs', [opts.before, opts.after, '', ...filter, '--globals', 'direction:rtl']));
} else for (const check of ['class contract diff', 'pixel A/B', 'computed-style A/B']) add('G3', check, needsBuilds);

add('G4', '.d.ts diff', opts.dts ? run('dts-diff.mjs', [opts.dts, 'HEAD']) : { skipped: 'not run', detail: 'pass --dts <base ref>' });
add('G5', 'size', size());
add('G5', 'perf bench', perf());

console.log(`| Gate | Check | Result | Detail |\n|---|---|---|---|\n${rows.join('\n')}`);
