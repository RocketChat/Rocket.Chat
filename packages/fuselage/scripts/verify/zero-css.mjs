// Usage: node scripts/verify/zero-css.mjs <storybook-static dir>
// Fails when a stylesheet of the build holds `[object Object]`: Tamagui compiles a value that nests a media key and a group key
// (or the reverse) to it without bailing, so the compiler stats don't catch it.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const findObjectValues = (dir) =>
	readdirSync(resolve(dir), { recursive: true })
		.filter((file) => file.endsWith('.css'))
		.flatMap((file) => {
			const count = readFileSync(join(resolve(dir), file), 'utf8').split('[object Object]').length - 1;
			return count ? [`${file}: ${count}`] : [];
		});

if (import.meta.main) {
	const [dir] = process.argv.slice(2);
	if (!dir) throw new Error('usage: zero-css.mjs <storybook-static dir>');
	const found = findObjectValues(dir);
	console.log(found.length ? `[object Object] in the stylesheets: ${found.join(', ')}` : 'no [object Object] in the stylesheets');
	process.exitCode = found.length ? 1 : 0;
}
