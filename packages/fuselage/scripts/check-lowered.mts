// Lowers every allowlisted definition and checks each recipe against Tamagui: node scripts/check-lowered.mts [--tables]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { allowlist, lowerModule, stats, recipes } from '../lowerStyled.ts';

const root = join(import.meta.dirname, '..');
// The check is the point here, so a cached resolution doesn't count
process.env.LOWER_STYLED_CACHE = '0';
for (const file of Object.keys(allowlist)) {
	const id = join(root, file);
	await lowerModule(readFileSync(id, 'utf8'), id);
}
console.table(stats);
if (process.argv.includes('--tables')) {
	for (const [name, recipe] of Object.entries(recipes)) {
		const slots = Object.fromEntries(Object.entries(recipe.slotOf).map(([key, i]) => [i, key.split('|')[0]]));
		console.log(
			name,
			recipe.slots.map((table, i) => `${slots[i]}:${Object.keys(table).length}/${new Set(Object.values(table)).size}`).join(' '),
		);
	}
}
