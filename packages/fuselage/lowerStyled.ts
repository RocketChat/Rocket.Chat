import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { runInThisContext } from 'node:vm';

import { build } from 'esbuild';
import { parseAst, type Plugin } from 'vite';

import { resolveRecipe, slotTuples, type Recipe } from './src/lowered/recipe.ts';

// Run with Node's type stripping from the Storybook loader, so only erasable syntax here

type Node = { type: string; start: number; end: number; [key: string]: unknown };
type Flat = Record<string, unknown>;
type StaticConfig = Record<string, any>;

type Options = {
	/**
	 * Variants a caller sets apply in declaration order instead of prop order, so the build resolves one order per
	 * combination instead of every permutation.
	 */
	ordered?: boolean;
	/** Fails past this many resolutions (a measuring run's guard). */
	limit?: number;
};

/** The definitions lowered, by module and binding; everything else keeps the Tamagui runtime. */
export const allowlist: Record<string, Record<string, Options>> = {
	'src/components/Message/MessageName.tsx': { MessageNameFrame: {} },
	'src/components/ButtonGroup/ButtonGroup.tsx': { ButtonGroupFrame: {} },
	'src/components/Button/ButtonFrame.tsx': { ButtonFrame: { ordered: true }, ButtonContent: {} },
};

const root = import.meta.dirname;
const require = createRequire(join(root, 'package.json'));

const walk = (node: unknown, visit: (n: Node, parent: Node | undefined) => void, parent?: Node) => {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		node.forEach((child) => walk(child, visit, parent));
		return;
	}
	const n = node as Node;
	if (typeof n.type === 'string') visit(n, parent);
	for (const [key, child] of Object.entries(n)) {
		if (key !== 'type') walk(child, visit, typeof n.type === 'string' ? n : parent);
	}
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;

const flatten = (style: Record<string, unknown>): Flat => {
	const out: Flat = {};
	for (const [key, value] of Object.entries(style)) {
		if (value === undefined) continue;
		if (isPlainObject(value)) for (const [state, v] of Object.entries(value)) out[`${key}|${state}`] = v;
		else out[key] = value;
	}
	return out;
};

const unflatten = (flat: Flat) => {
	const out: Record<string, any> = {};
	for (const [key, value] of Object.entries(flat)) {
		const [prop, state] = key.split('|');
		if (state === undefined) out[prop] = value;
		else (out[prop] ??= {})[state] = value;
	}
	return out;
};

/** A variant's value as a caller passes it: `true` and `false` are booleans. */
const variantValue = (key: string) => (key === 'true' || key === 'false' ? key === 'true' : key);

const permutations = <T>(items: T[]): T[][] =>
	items.length <= 1
		? [items]
		: items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));

/**
 * Computes the recipe of one evaluated frame and the atomic CSS its classes need. Every class and rule comes from
 * Tamagui's static resolver run on the real frame: each reachable combination of the variants touching a slot, in every
 * order a caller can pass them, is resolved and its class filed under the key the recipe computes for those props at
 * runtime. One key reached with two different classes fails the build.
 */
export const computeRecipe = (name: string, sc: StaticConfig, options: Options = {}) => {
	const { resolveStaticElement } = require('@tamagui/web/static-resolve');
	const rules = new Map<string, string[]>();
	const fail = (message: string): never => {
		throw new Error(`lowerStyled: ${name}: ${message}`);
	};
	const resolve = (props: Record<string, unknown>, staticConfig = sc) => {
		const result = resolveStaticElement({ id: name, staticConfig, props });
		if (!result.ok) fail(`${result.bailout.reason}: ${result.bailout.message}`);
		for (const rule of result.rules ?? []) rules.set(rule.identifier, rule.rules);
		return result;
	};
	const isStyleKey = (key: string) => key in (sc.validStyles ?? {}) || key.startsWith('$') || /Style$/.test(key);

	const values: Record<string, string[]> = {};
	const valueIndex = (key: string, value: unknown) => {
		const json = JSON.stringify(value);
		values[key] ??= [];
		const own = values[key];
		const found = own.indexOf(json);
		return found === -1 ? own.push(json) - 1 : found;
	};

	const baseFlat: Flat = {};
	const defaults: [string, unknown][] = [];
	let tag = 'div';
	for (const [key, value] of Object.entries(sc.defaultProps ?? {})) {
		if (key === 'render') {
			if (typeof value !== 'string') fail('a computed `render` default');
			tag = value as string;
		} else if (sc.variants && key in sc.variants) defaults.push([key, value]);
		else if (isStyleKey(key)) Object.assign(baseFlat, flatten({ [key]: value }));
		else if (typeof value === 'function') fail(`function default \`${key}\``);
		else defaults.push([key, value]);
	}
	if (sc.context) fail('a styled context');

	const entries: [Flat, string][] = [];
	const variants: Record<string, Record<string, number>> = {};
	const domains: Record<string, unknown[]> = {};
	// A computed variant (Tamagui's own `Text.numberOfLines`) has no finite domain; the recipe drops its prop
	const dropped: string[] = [];
	for (const [variant, domain] of Object.entries((sc.variants ?? {}) as Record<string, unknown>)) {
		if (typeof domain === 'function') {
			dropped.push(variant);
			continue;
		}
		if (!isPlainObject(domain)) return fail(`variant \`${variant}\` is not a value map`);
		variants[variant] = {};
		domains[variant] = [];
		for (const [key, style] of Object.entries(domain)) {
			if (key.startsWith(':') || key === '...') fail(`variant \`${variant}\` has a computed value \`${key}\``);
			if (!isPlainObject(style)) return fail(`variant \`${variant}.${key}\` is not a style object`);
			const { className, ...rest } = style;
			for (const k of Object.keys(rest)) if (!isStyleKey(k)) fail(`variant \`${variant}.${key}\` sets the non-style prop \`${k}\``);
			variants[variant][key] = entries.push([flatten(rest), typeof className === 'string' ? className : '']) - 1;
			domains[variant].push(variantValue(key));
		}
	}

	// Slots: Tamagui's class groups, found by resolving each key alone on a frame with no defaults or variants
	const bare = { ...sc, variants: undefined, defaultProps: {}, defaultVariants: undefined };
	const sample: Flat = { ...baseFlat };
	for (const [set] of entries) for (const [k, v] of Object.entries(set)) sample[k] ??= v;
	const groupOf = new Map<string, string[]>();
	for (const [key, value] of Object.entries(sample)) {
		const groups = Object.keys(resolve(unflatten({ [key]: value }), bare).classNames ?? {});
		if (!groups.length) fail(`\`${key}\` resolves to no class`);
		groupOf.set(key, groups);
	}
	const touchedGroups = new Set(entries.flatMap(([set]) => Object.keys(set)).flatMap((key) => groupOf.get(key)!));
	const slotGroups: string[][] = [];
	for (const groups of groupOf.values()) {
		if (!groups.some((g) => touchedGroups.has(g))) continue;
		const merged = slotGroups.filter((slot) => slot.some((g) => groups.includes(g)));
		for (const m of merged) slotGroups.splice(slotGroups.indexOf(m), 1);
		slotGroups.push([...new Set([...merged.flat(), ...groups])]);
	}
	const slotOf: Record<string, number> = {};
	for (const [key, groups] of groupOf) {
		const index = slotGroups.findIndex((slot) => slot.includes(groups[0]));
		if (index !== -1) slotOf[key] = index;
	}

	const keys = Object.keys(slotOf);
	const pairs = (style: Flat) =>
		Object.entries(style)
			.filter(([key]) => key in slotOf)
			.flatMap(([key, value]) => [keys.indexOf(key), valueIndex(key, value)]);
	const recipe: Recipe = {
		name: sc.displayName ?? name,
		tag,
		defaults,
		base: pairs(baseFlat),
		baseClass: '',
		variants,
		entries: entries.map(([set, className]) => [pairs(set), className]),
		slotOf: keys.map((key) => slotOf[key]),
		slots: slotGroups.map(() => ({})),
		...(options.ordered && { ordered: true }),
		...(dropped.length && { dropped }),
	};

	// The base: host class and every slot no variant touches
	const plain = resolve({});
	const variantClassNames = new Set(entries.flatMap(([, className]) => className.split(' ')));
	const touchedClassNames = new Set(slotGroups.flat().map((g) => plain.classNames?.[g]));
	recipe.baseClass = String(plain.className ?? '')
		.split(' ')
		.filter((c) => c && !variantClassNames.has(c) && !touchedClassNames.has(c))
		.join(' ');

	// Variants touching the same slot form a cluster; one resolution serves every slot of a cluster
	const variantNames = Object.keys(variants);
	const touches = (variant: string, slot: number) =>
		Object.values(variants[variant]).some((e) => Object.keys(entries[e][0]).some((k) => slotOf[k] === slot));
	const clusters: { variants: string[]; slots: number[] }[] = [];
	slotGroups.forEach((_, slot) => {
		const own = variantNames.filter((v) => touches(v, slot));
		const merged = clusters.filter((c) => c.variants.some((v) => own.includes(v)));
		for (const m of merged) clusters.splice(clusters.indexOf(m), 1);
		clusters.push({
			variants: [...new Set([...merged.flatMap((c) => c.variants), ...own])],
			slots: [...merged.flatMap((c) => c.slots), slot],
		});
	});

	let resolutions = 0;
	const defaultNames = new Set(defaults.map(([key]) => key));
	const visit = (slots: number[], props: Record<string, unknown>) => {
		const { tuples } = slotTuples(recipe, props);
		const result = resolve(props);
		if (++resolutions > (options.limit ?? Infinity)) fail(`more than ${options.limit} resolutions`);
		for (const slot of slots) {
			const classes = slotGroups[slot]
				.map((g) => result.classNames?.[g])
				.filter(Boolean)
				.join(' ');
			const seen = recipe.slots[slot][tuples[slot]];
			if (seen !== undefined && seen !== classes) fail(`key ${tuples[slot]} maps to "${seen}" and "${classes}" (${JSON.stringify(props)})`);
			recipe.slots[slot][tuples[slot]] = classes;
		}
	};
	for (const cluster of clusters) {
		// A default keeps its place in the props; a caller's own variants follow, in any order
		const fixed = cluster.variants.filter((v) => defaultNames.has(v));
		const free = cluster.variants.filter((v) => !defaultNames.has(v));
		const pickFree = (i: number, props: Record<string, unknown>, chosen: [string, unknown][]) => {
			if (i === free.length) {
				for (const order of options.ordered
					? [chosen.sort((x, y) => variantNames.indexOf(x[0]) - variantNames.indexOf(y[0]))]
					: permutations(chosen))
					visit(cluster.slots, { ...props, ...Object.fromEntries(order) });
				return;
			}
			pickFree(i + 1, props, chosen);
			for (const value of domains[free[i]]) pickFree(i + 1, props, [...chosen, [free[i], value]]);
		};
		const pickFixed = (i: number, props: Record<string, unknown>) => {
			if (i === fixed.length) return pickFree(0, props, []);
			for (const value of [...domains[fixed[i]], null]) pickFixed(i + 1, { ...props, [fixed[i]]: value });
		};
		pickFixed(0, {});
	}

	const used = new Set([recipe.baseClass, ...recipe.slots.flatMap((table) => Object.values(table))].flatMap((c) => c.split(' ')));
	for (const c of used) if (c.startsWith('_') && !rules.has(c)) fail(`no rules for ${c}`);
	const css = [...rules].filter(([identifier]) => used.has(identifier)).flatMap(([, list]) => list);
	return { recipe, css, resolutions, keys };
};

/**
 * Renders prop combinations through the recipe and through Tamagui, and throws on the first difference in classes,
 * inline style or the attributes passed through: no props, every variant value, every pair of variant values (in both
 * orders unless `ordered`) and `runs` random combinations of any number of variants.
 */
export const checkRecipe = (name: string, sc: StaticConfig, recipe: Recipe, runs = 300) => {
	const { resolveStaticElement } = require('@tamagui/web/static-resolve');
	let seed = 1;
	const random = () => {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};
	const names = Object.keys(recipe.variants);
	const valuesOf = (variant: string) => Object.keys(sc.variants[variant]).map(variantValue);
	const pick = (variant: string) => {
		const values = valuesOf(variant);
		return values[Math.floor(random() * values.length)];
	};
	const cases: Record<string, unknown>[] = [{}, ...names.flatMap((variant) => valuesOf(variant).map((value) => ({ [variant]: value })))];
	for (const [i, a] of names.entries()) {
		for (const b of names.slice(i + 1)) {
			for (const x of valuesOf(a)) {
				for (const y of valuesOf(b)) {
					cases.push({ [a]: x, [b]: y });
					if (!recipe.ordered) cases.push({ [b]: y, [a]: x });
				}
			}
		}
	}
	for (let i = 0; i < runs; i++) {
		const shuffled = [...names].sort(() => (recipe.ordered ? 0 : random() - 0.5)).filter(() => random() < 0.5);
		cases.push(Object.fromEntries(shuffled.map((variant) => [variant, pick(variant)])));
	}

	const sorted = (className: string | undefined) => (className ?? '').split(/\s+/).filter(Boolean).sort().join(' ');
	for (const [i, variantProps] of cases.entries()) {
		// Every other case also passes an attribute through, to compare what reaches the element
		const props = i % 2 ? { ...variantProps, id: 'checked' } : variantProps;
		const expected = resolveStaticElement({ id: name, staticConfig: sc, props });
		if (!expected.ok) throw new Error(`lowerStyled: ${name} ${JSON.stringify(props)}: ${expected.bailout?.message}`);
		const actual = resolveRecipe(recipe, props);
		const { className: _, style: __, ...attributes } = (expected.viewProps ?? {}) as Record<string, unknown>;
		const differences = [
			sorted(expected.className) !== sorted(actual.className) &&
				`classes\n  tamagui ${sorted(expected.className)}\n  recipe  ${sorted(actual.className)}`,
			expected.style && Object.keys(expected.style).length > 0 && `inline style ${JSON.stringify(expected.style)}`,
			JSON.stringify(Object.entries(attributes).sort()) !== JSON.stringify(Object.entries(actual.dom).sort()) &&
				`attributes\n  tamagui ${JSON.stringify(attributes)}\n  recipe  ${JSON.stringify(actual.dom)}`,
		].filter(Boolean);
		if (differences.length) throw new Error(`lowerStyled: ${name} ${JSON.stringify(props)}: ${differences.join('\n')}`);
	}
	return cases.length;
};

/** Bundles a module with the Fuselage config, so it can run against the real `@tamagui/web`. */
const bundle = async (code: string, id: string, names: string[]) => {
	const result = await build({
		stdin: {
			contents: `import ${JSON.stringify(join(root, 'src/tamagui.config.ts'))};\n${code}\nexport const __lowered__ = { ${names.join(', ')} };`,
			resolveDir: id.slice(0, id.lastIndexOf('/')),
			sourcefile: id,
			loader: 'tsx',
		},
		bundle: true,
		write: false,
		platform: 'node',
		format: 'cjs',
		jsx: 'automatic',
		logLevel: 'silent',
		external: ['react', 'react-dom', 'react/*', '@tamagui/*'],
		loader: { '.css': 'empty', '.svg': 'empty', '.woff2': 'empty' },
	});
	return result.outputFiles[0].text;
};

const run = (bundled: string, id: string) => {
	const module = { exports: {} as { __lowered__: Record<string, { staticConfig: StaticConfig }> } };
	(runInThisContext(`(function (require, module, exports) {\n${bundled}\n})`) as (...args: unknown[]) => void)(
		createRequire(id),
		module,
		module.exports,
	);
	return module.exports.__lowered__;
};

/** Evaluates a module with the real `@tamagui/web`, returning the named frames. */
export const evaluate = async (code: string, id: string, names: string[]) => run(await bundle(code, id, names), id);

type Lowered = { recipe: Recipe; keys: string[]; css: string[]; stats: Record<string, number> };

const cacheDir = join(root, 'node_modules/.cache/fuselage-lowered');
let toolchain: string | undefined;
/**
 * What a resolution depends on besides the module's bundle: this plugin, the recipe runtime, and the version and patch
 * of every `@tamagui/*` package, read from the lockfile because Tamagui's own cache in `node_modules/.cache/tamagui`
 * survives a patch change.
 */
const toolchainHash = () => {
	toolchain ??= createHash('sha1')
		.update(readFileSync(join(root, 'lowerStyled.ts')))
		.update(readFileSync(join(root, 'src/lowered/recipe.ts')))
		.update(
			readFileSync(join(root, '../../yarn.lock'), 'utf8')
				.split('\n\n')
				.filter((block) => block.startsWith('"@tamagui/'))
				.join('\n\n'),
		)
		.digest('hex');
	return toolchain;
};

/**
 * Resolves and checks the named definitions of a module, or reads them from the cache. The key is the module's bundle
 * (its source, the Fuselage config, the tokens and everything else it imports), `NODE_ENV` and the toolchain; `LOWER_STYLED_CACHE=0`
 * always resolves.
 */
const lowerDefinitions = async (code: string, id: string, names: string[]): Promise<Record<string, Lowered>> => {
	const bundled = await bundle(code, id, names);
	const file = join(
		cacheDir,
		`${createHash('sha1').update(toolchainHash()).update(String(process.env.NODE_ENV)).update(id).update(bundled).digest('hex')}.json`,
	);
	const useCache = process.env.LOWER_STYLED_CACHE !== '0';
	if (useCache && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));

	const options = allowlist[relative(root, id)];
	const frames = run(bundled, id);
	const results: Record<string, Lowered> = {};
	for (const name of names) {
		const { staticConfig } = frames[name];
		const started = performance.now();
		const { recipe, css, resolutions, keys } = computeRecipe(name, staticConfig, options[name]);
		const checked = checkRecipe(name, staticConfig, recipe);
		results[name] = {
			recipe,
			keys,
			css,
			stats: {
				resolutions,
				checked,
				ms: Math.round(performance.now() - started),
				cssBytes: css.join('').length,
				rules: css.length,
				recipeBytes: JSON.stringify(recipe).length,
			},
		};
	}
	if (useCache) {
		mkdirSync(cacheDir, { recursive: true });
		writeFileSync(file, JSON.stringify(results));
	}
	return results;
};

let extended: Set<string> | undefined;
/** Frames some `styled()` call extends; they stay Tamagui frames until those are lowered too. */
const extendedFrames = () => {
	if (extended) return extended;
	extended = new Set();
	for (const file of readdirSync(join(root, 'src'), { recursive: true }) as string[]) {
		if (!file.endsWith('.tsx')) continue;
		for (const match of readFileSync(join(root, 'src', file), 'utf8').matchAll(/styled\((\w+)/g)) extended.add(match[1]);
	}
	return extended;
};

export const stats: Record<string, Record<string, number>> = {};
export const recipes: Record<string, Lowered> = {};

const cssFile = join(root, '.lowered/lowered.css');
const moduleRules = new Map<string, string[]>();
let othersLowered: Promise<unknown> | undefined;

const rulesOf = (lowered: Record<string, Lowered>) => Object.values(lowered).flatMap((definition) => definition.css);

/**
 * Writes the rules of every lowered module to the one stylesheet they all import, so the bundle holds each rule once.
 * The modules not transformed yet are lowered from disk first: the bundler reads the stylesheet as soon as the first
 * module imports it.
 */
const writeCss = async (id: string, rules: string[]) => {
	moduleRules.set(id, rules);
	othersLowered ??= Promise.all(
		Object.entries(allowlist).map(async ([file, allowed]) => {
			const other = join(root, file);
			if (other === id) return;
			const lowered = await lowerDefinitions(readFileSync(other, 'utf8'), other, Object.keys(allowed));
			// A module transformed meanwhile wins: the bundler may have handed it newer code than the disk
			if (!moduleRules.has(other)) moduleRules.set(other, rulesOf(lowered));
		}),
	);
	await othersLowered;
	const ordered = Object.keys(allowlist).flatMap((file) => moduleRules.get(join(root, file)) ?? []);
	const text = `@layer fuselage {\n${[...new Set(ordered)].join('\n')}\n}\n`;
	if (existsSync(cssFile) && readFileSync(cssFile, 'utf8') === text) return;
	mkdirSync(dirname(cssFile), { recursive: true });
	writeFileSync(cssFile, text);
};

/** Replaces each allowlisted `styled()` definition in a module with a recipe component and an import of the lowered CSS. */
export const lowerModule = async (code: string, id: string) => {
	const allowed = allowlist[relative(root, id)];
	// `LOWER_STYLED=0` builds the Tamagui frames as they are, for A/B measurements
	if (!allowed || process.env.LOWER_STYLED === '0') return null;

	const ast = parseAst(code, { lang: 'tsx' });
	const calls = new Map<string, { call: Node; statement: Node }>();
	for (const statement of (ast as unknown as { body: Node[] }).body) {
		walk(statement, (n) => {
			if (
				n.type === 'VariableDeclarator' &&
				(n.id as Node).type === 'Identifier' &&
				(n.init as Node | undefined)?.type === 'CallExpression'
			) {
				const { name } = n.id as { name: string };
				const callee = (n.init as Node).callee as Node;
				if (name in allowed && callee.type === 'Identifier' && (callee as unknown as { name: string }).name === 'styled') {
					calls.set(name, { call: n.init as Node, statement });
				}
			}
		});
	}
	// A renamed or rewritten definition would otherwise silently fall back to the runtime
	const missing = Object.keys(allowed).filter((name) => !calls.has(name));
	if (missing.length) throw new Error(`lowerStyled: ${relative(root, id)}: no \`styled()\` definition named ${missing.join(', ')}`);

	const lowered = await lowerDefinitions(code, id, Object.keys(allowed));
	await writeCss(id, rulesOf(lowered));
	const edits: [start: number, end: number, text: string][] = [];
	for (const [name, { call, statement }] of calls) {
		const { recipe } = lowered[name];
		const json = JSON.stringify(recipe);
		recipes[name] = lowered[name];
		stats[`${relative(root, id)}#${name}`] = lowered[name].stats;

		if (!extendedFrames().has(name)) {
			edits.push([call.start, call.end, `__lowered(${json})`]);
			continue;
		}
		// Keeps the frame for the definitions that extend it, and points this module's own uses at the recipe
		edits.push([statement.end, statement.end, `\nconst ${name}__lowered = __lowered(${json});`]);
		walk(ast, (n, parent) => {
			if (n.type !== 'Identifier' || (n as unknown as { name: string }).name !== name) return;
			if (n.start >= statement.start && n.end <= statement.end) return;
			// A lowered definition that extends this frame is replaced whole, its argument included
			for (const [other, { call }] of calls) {
				if (other !== name && !extendedFrames().has(other) && n.start >= call.start && n.end <= call.end) return;
			}
			if (parent?.type === 'ExportSpecifier' || parent?.type?.startsWith('TS')) return;
			edits.push([n.start, n.end, `${name}__lowered`]);
		});
	}

	let out = code;
	for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) out = `${out.slice(0, start)}${text}${out.slice(end)}`;
	out = `import { lowered as __lowered } from ${JSON.stringify(join(root, 'src/lowered/recipe.ts'))};\nimport ${JSON.stringify(cssFile)};\n${out}`;
	return { code: out, map: null };
};

/** Compiles allowlisted `styled()` definitions into runtime-free recipes (see `lowerModule`). */
export const lowerStyled = (): Plugin => ({
	name: 'fuselage-lower-styled',
	enforce: 'pre',
	transform: {
		order: 'pre',
		handler(code, id) {
			return lowerModule(code, id.split('?')[0]);
		},
	},
	buildEnd() {
		for (const [key, value] of Object.entries(stats)) this.info(`${key}: ${JSON.stringify(value)}`);
	},
});
