// Usage: node scripts/verify/dod.mjs <Component> [--before <storybook-static>] [--after <storybook-static>] [--dts <base ref>]
// Runs the Definition-of-Done checks for one component and prints the evidence as a markdown table. The A/B checks need
// both Storybook builds; the .d.ts diff builds two refs, so it only runs when a base ref is given (compared with HEAD).
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values: opts, positionals } = parseArgs({
	allowPositionals: true,
	options: { before: { type: 'string' }, after: { type: 'string' }, dts: { type: 'string' } },
});
const [component] = positionals;
if (!component) throw new Error('usage: dod.mjs <Component> [--before dir] [--after dir] [--dts ref]');

const cls = `rcx-${component.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
const here = (file) => join(import.meta.dirname, file);
const tmp = (name) => join(process.env.TMPDIR ?? '/tmp', `dod-${component}-${name}`);

const run = (script, args) => {
	const { status, stdout, stderr } = spawnSync('node', [here(script), ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });
	const lines = `${stdout}${stderr}`.trim().split('\n');
	return { ok: status === 0, detail: lines.at(-1).replaceAll('|', '/') };
};

const rows = [];
const add = (gate, check, outcome) =>
	rows.push(`| ${gate} | ${check} | ${outcome.skipped ?? (outcome.ok ? 'pass' : 'FAIL')} | ${outcome.detail} |`);
const unavailable = { skipped: 'not yet available', detail: '' };
const needsBuilds = { skipped: 'not run', detail: 'needs --before and --after' };

add('G0', 'characterization specs', unavailable);
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
add('G5', 'size', unavailable);
add('G5', 'perf bench', unavailable);

console.log(`| Gate | Check | Result | Detail |\n|---|---|---|---|\n${rows.join('\n')}`);
