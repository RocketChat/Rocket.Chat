// node scripts/measure-button-reachable.mts: breaks ButtonFrame's lowered CSS down by slot, and measures the CSS of only the states `getButtonStates` can produce
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { computeRecipe, evaluate } from '../lowerStyled.ts';
import { resolveRecipe } from '../src/lowered/recipe.ts';

const root = join(import.meta.dirname, '..');
const id = join(root, 'src/components/Button/ButtonFrame.tsx');
const frames = (await evaluate(readFileSync(id, 'utf8'), id, ['ButtonFrame', 'getButtonStates'])) as Record<string, any>;
const sc = frames.ButtonFrame.staticConfig;
const { resolveStaticElement } = createRequire(join(root, 'package.json'))('@tamagui/web/static-resolve');
const { recipe, css, keys } = computeRecipe('ButtonFrame', sc, { ordered: true });

const byClass = new Map<string, number>();
for (const rule of css) {
	const m = rule.match(/\.(_[\w-]+)/);
	if (m) byClass.set(m[1], (byClass.get(m[1]) ?? 0) + rule.length);
}
const slotNames = Object.fromEntries(recipe.slotOf.map((slot, key) => [slot, keys[key].split('|')[0]]));
const rows = recipe.slots.map((table, i) => {
	const classes = new Set(Object.values(table).flatMap((c) => c.split(' ')));
	return { slot: slotNames[i], keys: Object.keys(table).length, classes };
});

// The props Button and IconButton can actually produce
const kinds = Object.keys(sc.variants.look).filter((look) => !/-(pressed|disabled)$/.test(look));
const segments = [
	undefined,
	...['first', 'middle', 'last', 'only'].flatMap((position) => [
		{ position },
		...Object.keys(sc.variants.ghost).map((variant) => ({ position, ghost: true, variant })),
	]),
];
const used = new Set<string>();
let combos = 0;
for (const kind of kinds)
	for (const disabled of [false, true])
		for (const pressed of [false, true])
			for (const segment of segments) {
				const states = Object.fromEntries(
					Object.entries(frames.getButtonStates(kind, disabled, segment, pressed)).filter(([, v]) => v !== undefined),
				);
				for (const size of [undefined, ...Object.keys(sc.variants.size)])
					for (const extra of [{}, { square: true }, { icon: true }, { compact: true }, { withBadge: true }, { squareSize: 'small' }]) {
						const props = { ...states, ...(size && { size }), ...extra };
						combos++;
						const { className } = resolveRecipe(recipe, props);
						const expected = String(resolveStaticElement({ id: 'x', staticConfig: sc, props }).className);
						if (className.split(' ').filter(Boolean).sort().join() !== expected.split(' ').filter(Boolean).sort().join())
							throw new Error(JSON.stringify(props));
						className.split(' ').forEach((c) => used.add(c));
					}
			}
const bytes = (classes: Iterable<string>) => [...classes].reduce((t, c) => t + (byClass.get(c) ?? 0), 0);
console.table(
	rows
		.map(({ slot, keys, classes }) => {
			const reachable = [...classes].filter((c) => used.has(c));
			return { slot, keys, classes: classes.size, bytes: bytes(classes), reachable: reachable.length, reachableBytes: bytes(reachable) };
		})
		.sort((a, b) => b.bytes - a.bytes)
		.slice(0, 6),
);
const report = (label: string, rules: string[]) => {
	const text = rules.join('\n');
	console.log(`${label}: ${rules.length} rules, ${text.length} B raw, ${gzipSync(text, { level: 9 }).length} B gzip`);
};
report('emitted', css);
report(
	`reachable from getButtonStates (${combos} prop sets, ${used.size} classes)`,
	css.filter((rule) => [...used].some((c) => c.startsWith('_') && rule.includes(`.${c}`))),
);
