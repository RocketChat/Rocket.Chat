// Lowers every allowlisted definition and checks each recipe against Tamagui: node scripts/check-lowered.mts [--tables]
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { allowlist, checkCallSites, lowerModule, stats, recipes } from '../lowerStyled.ts';

const root = join(import.meta.dirname, '..');
// The check is the point here, so a cached resolution doesn't count
process.env.LOWER_STYLED_CACHE = '0';
for (const file of Object.keys(allowlist)) {
	const id = join(root, file);
	await lowerModule(readFileSync(id, 'utf8'), id);
}
for (const file of readdirSync(join(root, 'src'), { recursive: true }) as string[]) {
	if (/\.tsx?$/.test(file)) await checkCallSites(readFileSync(join(root, 'src', file), 'utf8'), join(root, 'src', file));
}
console.table(stats);
if (process.argv.includes('--tables')) {
	for (const [name, { recipe, keys }] of Object.entries(recipes)) {
		const slots = Object.fromEntries(recipe.slotOf.map((slot, key) => [slot, keys[key].split('|')[0]]));
		console.log(
			name,
			recipe.slots.map((table, i) => `${slots[i]}:${Object.keys(table).length}/${new Set(Object.values(table)).size}`).join(' '),
		);
	}
}
