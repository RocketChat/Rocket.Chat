// Usage: node scripts/verify/css-hacks.mjs                       per-file counts of hand-written rules and CSS hacks
//        node scripts/verify/css-hacks.mjs --check <baseline.json>   fail when any count grows
//        node scripts/verify/css-hacks.mjs --write <baseline.json>   record the current counts as the baseline
// Counts only ever go down as components move off hand-written styles.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';

import scss from 'postcss-scss';

const { values: opts } = parseArgs({ options: { check: { type: 'string' }, write: { type: 'string' } } });

const pkg = join(import.meta.dirname, '../..');
const files = readdirSync(join(pkg, 'src/components'), { recursive: true })
	.filter((f) => /\.s?css$/.test(f))
	.map((f) => join('src/components', f))
	.sort();

const bare = (selector) => selector.replace(/\([^)]*\)/g, '()');
const count = (file) => {
	const c = { rules: 0, nested: 0, combinators: 0, important: 0, specificityBumps: 0, negativeMargins: 0, displayContents: 0 };
	// Interpolation in selectors trips the parser
	let source = readFileSync(join(pkg, file), 'utf8');
	while (/#\{[^{}]*\}/.test(source)) source = source.replaceAll(/#\{[^{}]*\}/g, 'x');
	scss.parse(source).walk((node) => {
		if (node.type === 'rule') {
			c.rules++;
			if (node.parent.type === 'rule') c.nested++;
			if (node.selectors.some((s) => /[\s>+~]/.test(bare(s).trim()))) c.combinators++;
			if (/\[class\]|(\.[\w-]+)\1(?![\w-])|:(is|where)\(/.test(node.selector)) c.specificityBumps++;
		} else if (node.type === 'decl') {
			if (node.important) c.important++;
			if (/^margin/.test(node.prop) && /(^|[\s(,*])-[^\s-]/.test(node.value)) c.negativeMargins++;
			if (node.prop === 'display' && node.value === 'contents') c.displayContents++;
		}
	});
	return c;
};

const current = Object.fromEntries(files.map((f) => [relative('src/components', f), count(f)]));

if (opts.write) {
	writeFileSync(opts.write, `${JSON.stringify(current, null, '\t')}\n`);
	console.log(`baseline written to ${opts.write}`);
} else if (opts.check) {
	const baseline = JSON.parse(readFileSync(opts.check, 'utf8'));
	const grown = Object.entries(current).flatMap(([file, counts]) =>
		Object.entries(counts)
			.filter(([metric, n]) => n > (baseline[file]?.[metric] ?? 0))
			.map(([metric, n]) => `${file}: ${metric} ${baseline[file]?.[metric] ?? 0} -> ${n}`),
	);
	for (const g of grown) console.error(`css hack grew: ${g}`);
	if (grown.length) process.exit(1);
	console.log('css-hacks: no count grew');
} else {
	const total = {};
	for (const [file, counts] of Object.entries(current)) {
		console.log(
			`${file}: ${Object.entries(counts)
				.map(([k, v]) => `${k}=${v}`)
				.join(' ')}`,
		);
		for (const [k, v] of Object.entries(counts)) total[k] = (total[k] ?? 0) + v;
	}
	console.log(
		`total: ${Object.entries(total)
			.map(([k, v]) => `${k}=${v}`)
			.join(' ')}`,
	);
}
