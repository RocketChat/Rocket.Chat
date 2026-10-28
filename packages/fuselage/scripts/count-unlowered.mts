// Ratchets: styled() definitions not in the lowering allowlist, and @tamagui/* modules in the production web bundle.
// node scripts/count-unlowered.mts --max <definitions> --max-modules <modules>
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { build } from 'vite';

import { allowlist } from '../lowerStyled.ts';

const root = join(import.meta.dirname, '..');
const arg = (name: string) => {
	const i = process.argv.indexOf(name);
	return i === -1 ? Infinity : Number(process.argv[i + 1]);
};

const files = (readdirSync(join(root, 'src'), { recursive: true }) as string[]).filter(
	(file) => /\.tsx?$/.test(file) && !/\.(stories|spec)\./.test(file),
);
let definitions = 0;
for (const file of files) {
	const names = [...readFileSync(join(root, 'src', file), 'utf8').matchAll(/(?:const|let)\s+(\w+)\s*=\s*styled\(/g)].map((m) => m[1]);
	const lowered = allowlist[`src/${file}`] ?? {};
	definitions += names.filter((name) => !(name in lowered)).length;
}

const output = (await build({
	root,
	mode: 'production',
	logLevel: 'silent',
	build: { write: false, minify: false },
})) as { output: { modules?: Record<string, { renderedLength: number }> }[] }[];
const tamagui = new Set<string>();
for (const { output: chunks } of output) {
	for (const chunk of chunks) {
		for (const [id, { renderedLength }] of Object.entries(chunk.modules ?? {})) {
			if (renderedLength > 0 && id.includes('/node_modules/@tamagui/')) tamagui.add(id);
		}
	}
}

console.log(`styled() definitions not lowered: ${definitions}\n@tamagui/* modules in the web bundle: ${tamagui.size}`);
const maxDefinitions = arg('--max');
const maxModules = arg('--max-modules');
if (definitions > maxDefinitions || tamagui.size > maxModules) {
	console.error(`Over the ratchet (max ${maxDefinitions} definitions, ${maxModules} modules); both only go down.`);
	process.exit(1);
}
