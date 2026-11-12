// Usage: node scripts/verify/dedupe-zero-css.mjs <storybook-static dir>
// Rewrites a zero-runtime Storybook build's `tamagui-zero.css` as the web client's build does: identical top-level rules
// (and `@media` blocks) keep only their last copy, which is the one that wins the cascade. Prints the rule count and gzip
// size before and after. Run it on a copy of a build and compare the two with story-ab.mjs to prove the stylesheet
// resolves the same.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const require = createRequire(join(import.meta.dirname, '../..', 'package.json'));
const postcss = require('postcss');

const [dir] = process.argv.slice(2);
if (!dir) {
	console.error('Usage: node scripts/verify/dedupe-zero-css.mjs <storybook-static dir>');
	process.exit(2);
}

const file = join(dir, 'tamagui-zero.css');
const css = readFileSync(file, 'utf8');

const root = postcss.parse(css);
const seen = new Set();
for (const node of [...root.nodes].reverse()) {
	const key = node.toString();
	if (seen.has(key)) node.remove();
	else seen.add(key);
}
const deduped = root.toString();

const rules = (source) => {
	let count = 0;
	postcss.parse(source).walkRules(() => count++);
	return count;
};
const gzip = (source) => gzipSync(source).length;
console.log(`rules ${rules(css)} -> ${rules(deduped)}`);
console.log(`bytes ${Buffer.byteLength(css)} -> ${Buffer.byteLength(deduped)}`);
console.log(`gzip ${gzip(css)} -> ${gzip(deduped)}`);

writeFileSync(file, deduped);
