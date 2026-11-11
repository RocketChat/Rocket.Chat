// Writes the style values of a component's Tamagui frames into the module that declares them.
//
//   yarn generate:frame-values          rewrite the generated section of every target
//   yarn generate:frame-values --check  fail if one is stale or a module holds a raw length (what `yarn lint` runs)
//
// Tamagui's compiler reads a `styled()` definition from the source of its module and skips one it cannot read, so the
// values cannot be computed there or imported. They are computed here from `@rocket.chat/fuselage-tokens`, under the
// custom properties Fuselage already reads for them, and written between markers as value constants; the `styled()` call
// that uses them is written by hand below the section.
//
// Each module in `scripts/frame-values/` default-exports the `Target[]` of one component. The shared code lives in
// `scripts/frame-values/lib/`, which the glob does not enter.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import prettier from 'prettier';

import { moduleProblems, spacingProperties, stylesheetProblems, transformProblems } from './frame-values/lib/check.mts';
import { markers } from './frame-values/lib/markers.mts';
import type { Target } from './frame-values/lib/target.mts';

const check = process.argv.includes('--check');
const frameValuesDir = join(import.meta.dirname, 'frame-values');
const srcDir = join(import.meta.dirname, '../src');
let stale = false;

const sourcesIn = (directory: string, pattern: RegExp) =>
	readdirSync(directory, { recursive: true, encoding: 'utf8' })
		.filter((name) => pattern.test(name) && !/\.(?:test|spec)\./.test(name))
		.map((name) => ({ name, text: readFileSync(join(directory, name), 'utf8') }));

const moduleNames = readdirSync(frameValuesDir).filter((name) => name.endsWith('.mts'));

if (check) {
	const generators = sourcesIn(frameValuesDir, /\.mts$/);
	const sources = sourcesIn(srcDir, /\.(?:css|tsx?)$/);

	for (const { name, text } of generators) {
		for (const problem of moduleProblems(`scripts/frame-values/${name}`, text)) {
			console.error(problem);
			stale = true;
		}
	}

	const properties = spacingProperties([...generators, ...sources].map(({ text }) => text));
	// Only a stylesheet that already has a generated section is held to it: the others belong to components not yet migrated
	for (const { name, text } of sources.filter(({ name, text }) => name.endsWith('.css') && text.includes('/* generated '))) {
		for (const problem of stylesheetProblems(name, text, properties)) {
			console.error(problem);
			stale = true;
		}
	}
}

const targets = (
	await Promise.all(moduleNames.map(async (name) => (await import(pathToFileURL(join(frameValuesDir, name)).href)).default as Target[]))
).flat();

for (const { file, generate, css, section } of targets) {
	const source = readFileSync(file, 'utf8');
	const [START, END] = markers(css, section);
	const start = source.indexOf(START);
	const end = source.indexOf(END);

	if (start === -1 || end === -1) {
		throw new Error(`${file} has no generated section: add the ${START} and ${END} markers`);
	}

	const config = (await prettier.resolveConfig(file)) ?? {};
	const body = await prettier.format(generate(), { ...config, parser: css ? 'css' : 'typescript' });
	if (check) {
		for (const problem of transformProblems(file, body)) {
			console.error(problem);
			stale = true;
		}
	}

	const next = `${source.slice(0, start)}${START}\n\n${body}\n${source.slice(end)}`;

	if (next !== source) {
		if (check) {
			console.error(`${file} is out of date: run \`yarn generate:frame-values\``);
			stale = true;
		} else {
			writeFileSync(file, next);
		}
	}
}

process.exit(stale ? 1 : 0);
