// Tries to lower every styled() definition in src/components, without changing anything, and reports what each
// would emit and why the others can't be lowered yet: node scripts/measure-lowered.mts [--json out.json]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { computeRecipe, evaluate } from '../lowerStyled.ts';

const root = join(import.meta.dirname, '..');
const files = (readdirSync(join(root, 'src/components'), { recursive: true }) as string[]).filter(
	(file) => file.endsWith('.tsx') && !file.includes('.stories.') && !file.includes('.spec.'),
);

const rows: Record<string, unknown>[] = [];
const allRules = new Set<string>();
const allRecipes: string[] = [];
for (const file of files) {
	const id = join(root, 'src/components', file);
	const code = readFileSync(id, 'utf8');
	const names = [...code.matchAll(/(?:const|let)\s+(\w+)\s*=\s*styled\(/g)].map((m) => m[1]);
	if (!names.length) continue;
	let frames: Record<string, { staticConfig: Record<string, unknown> }>;
	try {
		frames = await evaluate(code, id, names);
	} catch (error) {
		for (const name of names) rows.push({ name: `${file}#${name}`, error: `evaluate: ${(error as Error).message.split('\n')[0]}` });
		continue;
	}
	for (const name of names) {
		try {
			const { recipe, css, resolutions } = computeRecipe(name, frames[name].staticConfig, { ordered: true, limit: 50000 });
			const json = JSON.stringify(recipe);
			css.forEach((rule) => allRules.add(rule));
			allRecipes.push(json);
			rows.push({
				name: `${file}#${name}`,
				resolutions,
				rules: css.length,
				css: css.join('').length,
				cssGzip: gzipSync(css.join('\n')).length,
				recipe: json.length,
				recipeGzip: gzipSync(json).length,
			});
		} catch (error) {
			rows.push({ name: `${file}#${name}`, error: (error as Error).message.split('\n')[0].replace(/^lowerStyled: \w+: /, '') });
		}
	}
}

const ok = rows.filter((row) => !row.error);
const sum = (key: string) => ok.reduce((total, row) => total + (row[key] as number), 0);
console.log(`definitions ${rows.length}, lowered ${ok.length}, blocked ${rows.length - ok.length}`);
console.log(`css ${sum('css')} B raw (${sum('rules')} rules), recipes ${sum('recipe')} B raw`);
const dedupedCss = `@layer fuselage{${[...allRules].join('')}}`;
console.log(`css deduped ${dedupedCss.length} B raw (${allRules.size} rules), gzip ${gzipSync(dedupedCss, { level: 9 }).length}; recipes together gzip ${gzipSync(allRecipes.join(','), { level: 9 }).length}`);
const noButton = new Set(ok.filter((row) => !String(row.name).includes('ButtonFrame#ButtonFrame')).map((row) => row.name));
console.log(`without ButtonFrame: css ${ok.filter((row) => noButton.has(row.name)).reduce((t, r) => t + (r.css as number), 0)} B raw summed`);
const byReason = new Map<string, number>();
for (const row of rows.filter((r) => r.error)) {
	const reason = String(row.error).replace(/`[^`]*`/g, '`…`').replace(/\{.*$/, '').slice(0, 90);
	byReason.set(reason, (byReason.get(reason) ?? 0) + 1);
}
console.table([...byReason].sort((a, b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count })));
console.table(ok.sort((a, b) => (b.css as number) - (a.css as number)).slice(0, 15));
const out = process.argv[process.argv.indexOf('--json') + 1];
if (process.argv.includes('--json')) writeFileSync(out, JSON.stringify(rows, null, 1));
