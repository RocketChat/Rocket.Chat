// Usage: node scripts/verify/story-classes.mjs <storybook-static> <out.json> [--jobs 4]   index story id -> rcx-* classes rendered
//        node scripts/verify/story-classes.mjs --diff <before.json> <after.json>        class-contract diff per story
// Exits 1 when a story could not be captured or none was found. The index feeds `--renders rcx-<component>` in story-ab / story-computed ("every story that renders the component").
import { readFileSync, writeFileSync } from 'node:fs';

import { cli, openStory, runPool, storyIds } from './lib.mjs';
import { serve } from './serve.mjs';

const { values: opts, positionals } = cli({ diff: { type: 'boolean', default: false } });

if (opts.diff) {
	const [before, after] = positionals.map((f) => JSON.parse(readFileSync(f, 'utf8')));
	let changed = 0;
	for (const id of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
		const [x, y] = [before[id], after[id]];
		if (!x || !y) {
			console.log(`${id}: story ${x ? 'removed' : 'added'}`);
			changed++;
			continue;
		}
		const removed = x.filter((c) => !y.includes(c));
		const added = y.filter((c) => !x.includes(c));
		if (!removed.length && !added.length) continue;
		changed++;
		console.log(`${id}: ${[...added.map((c) => `+${c}`), ...removed.map((c) => `-${c}`)].join(' ')}`);
	}
	console.log(`${changed} stories with a changed class contract`);
	process.exit(changed ? 1 : 0);
}

const [dir, out] = positionals;
const ids = storyIds(dir);
const server = await serve(dir);
const results = await runPool(ids, { jobs: opts.jobs, width: opts.width }, async (page, id) => {
	await openStory(page, server.url, id, opts.globals);
	return page.evaluate(() =>
		[
			...new Set(
				[...globalThis.document.body.querySelectorAll('*')].flatMap((el) =>
					[...el.classList].filter((c) => c.startsWith('rcx-') && !c.startsWith('rcx-css-')),
				),
			),
		].sort(),
	);
});

const index = {};
let failed = 0;
for (const id of ids) {
	const { value, error } = results.get(id);
	if (error) {
		failed++;
		console.log(`COULD NOT CAPTURE ${id}: ${error}`);
	} else index[id] = value;
}
writeFileSync(out, `${JSON.stringify(index, null, '\t')}\n`);
console.log(`${Object.keys(index).length} of ${ids.length} stories indexed to ${out}, ${failed} could not be captured`);
process.exitCode = !ids.length || failed ? 1 : 0;
server.close();
