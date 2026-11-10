// Usage: node scripts/verify/box-usage.mjs                    which component folders still use Box styling
//        node scripts/verify/box-usage.mjs --component Button  exit 1 if that component uses any of it
// Box, StylingBox, useStylingProps, Margins and FlexItem are what a migrated component must no longer touch.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const { values: opts } = parseArgs({ options: { component: { type: 'string' } } });

const NAMES = ['Box', 'StylingBox', 'useStylingProps', 'Margins', 'FlexItem'];
const root = join(import.meta.dirname, '../../src/components');
const SOURCE = /\.tsx?$/;
const NOT_SOURCE = /\.(spec|stories)\.tsx?$|\.d\.ts$/;

// One pass, so a quote inside a comment or `//` inside a string does not confuse the other
const COMMENTS_AND_STRINGS = /\/\*[\s\S]*?\*\/|\/\/.*$|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/gm;

const usage = (folder) => {
	const found = new Set();
	for (const file of readdirSync(join(root, folder), { recursive: true }).filter((f) => SOURCE.test(f) && !NOT_SOURCE.test(f))) {
		const text = readFileSync(join(root, folder, file), 'utf8').replace(COMMENTS_AND_STRINGS, '');
		for (const name of NAMES) if (new RegExp(`(?<![\\w.])${name}(?![\\w])`).test(text)) found.add(name);
	}
	return [...found];
};

if (opts.component && !existsSync(join(root, opts.component))) {
	console.error(`No component folder named ${opts.component} in src/components`);
	process.exit(2);
}

const folders = opts.component
	? [opts.component]
	: readdirSync(root, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name);
let used = 0;
for (const folder of folders) {
	const names = usage(folder);
	if (names.length) used++;
	console.log(`${folder}: ${names.length ? names.join(', ') : 'none'}`);
}
if (opts.component) process.exit(used ? 1 : 0);
console.log(`${used} of ${folders.length} components use Box styling`);
