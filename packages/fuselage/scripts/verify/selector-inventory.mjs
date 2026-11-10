// Usage: node scripts/verify/selector-inventory.mjs [rcx-class ...]            file:line:selector of rules outside a component targeting its classes
//        node scripts/verify/selector-inventory.mjs --check <baseline.json>    fail on a new override without `[class]` (all components)
//        node scripts/verify/selector-inventory.mjs --write <baseline.json>    record the current unprefixed overrides as the baseline
// An override of a migrated part must carry `[class]` so it keeps winning; the baseline stops unprefixed ones from growing.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values: opts, positionals } = parseArgs({
	allowPositionals: true,
	options: { check: { type: 'string' }, write: { type: 'string' } },
});

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const components = join(root, 'packages/fuselage/src/components');
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const folderOf = new Map(
	readdirSync(components, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		// The root class is the folder name kebab-cased (rcx-button-group) or just lowercased (rcx-navbar)
		.flatMap((d) => [`rcx-${kebab(d.name)}`, `rcx-${d.name.toLowerCase()}`].map((cls) => [cls, d.name])),
);
const classes = positionals.length ? positionals : [...folderOf.keys()];

const NOT_OVERRIDES = /\.(spec|test|stories)\.[tj]sx?$|\.d\.ts$|\/tests?\/|\/e2e\//;
const pattern = `\\.(${classes.join('|')})(--|__|[^A-Za-z0-9_-]|$)`;

// git grep exits 1 when nothing matches, which is an empty inventory rather than an error
const grepRows = () => {
	try {
		return execFileSync(
			'git',
			[
				'grep',
				'-nE',
				'-I',
				pattern,
				'--',
				...['apps', 'packages', 'ee'].flatMap((d) => [`${d}/**/*.css`, `${d}/**/*.scss`, `${d}/**/*.ts`, `${d}/**/*.tsx`]),
			],
			{ cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 },
		);
	} catch (error) {
		if (error.status === 1) return '';
		throw error;
	}
};

const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/;

const hits = [];
for (const row of grepRows().split('\n').filter(Boolean)) {
	const [, file, line, text] = /^([^:]+):(\d+):(.*)$/.exec(row);
	if (NOT_OVERRIDES.test(file) || COMMENT_LINE.test(text)) continue;
	for (const target of classes.filter((c) => new RegExp(`\\.${c}(--|__|[^A-Za-z0-9_-]|$)`).test(text))) {
		const own = folderOf.get(target);
		if (own && file.startsWith(`packages/fuselage/src/components/${own}/`)) continue;
		hits.push({ target, file, line: Number(line), selector: text.trim().slice(0, 140), unprefixed: !text.includes('[class]') });
	}
}

if (!opts.check && !opts.write) {
	for (const h of hits) console.log(`${h.file}:${h.line}:${h.selector}${h.unprefixed ? '' : '  [prefixed]'}`);
	console.log(`${hits.length} selectors target ${classes.length === 1 ? classes[0] : `${classes.length} component classes`}`);
	process.exit(0);
}

const current = {};
for (const h of hits.filter((x) => x.unprefixed)) (current[h.target] ??= []).push(`${h.file}: ${h.selector}`);
for (const list of Object.values(current)) list.sort();

if (opts.write) {
	writeFileSync(opts.write, `${JSON.stringify(current, null, '\t')}\n`);
	console.log(`baseline written to ${opts.write}`);
	process.exit(0);
}

const baseline = JSON.parse(readFileSync(opts.check, 'utf8'));
const occurrences = (list = [], entry) => list.filter((s) => s === entry).length;
// An entry counts as new when it occurs more often than in the baseline, so a copied selector is caught too
const fresh = Object.entries(current).flatMap(([cls, list]) =>
	[...new Set(list)].filter((s) => occurrences(list, s) > occurrences(baseline[cls], s)).map((s) => `${cls} ${s}`),
);
for (const f of fresh) console.error(`new unprefixed override: ${f}`);
if (fresh.length) {
	console.error('Add `[class]` to the selector (or, for a deliberate override, regenerate the baseline with --write).');
	process.exit(1);
}
console.log('selector inventory: no new unprefixed overrides');
