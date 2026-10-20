import { createRequire } from 'node:module';
import { runInThisContext } from 'node:vm';

import { build } from 'esbuild';
import { parseAst, type Plugin } from 'vite';

const require = createRequire(import.meta.url);

type Node = { type: string; start: number; end: number; [key: string]: unknown };

const isPlain = (value: unknown): boolean => {
	if (value === null || ['string', 'boolean', 'undefined'].includes(typeof value)) return true;
	// JSON would turn NaN and Infinity into null
	if (typeof value === 'number') return Number.isFinite(value);
	if (Array.isArray(value)) return value.every(isPlain);
	if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return false;
	return Object.values(value).every(isPlain);
};

/** Names of the frames this module renders at least once with no spread, the only elements the compiler can flatten. */
const findSpreadFreeTags = (node: unknown, names = new Set<string>()): Set<string> => {
	if (!node || typeof node !== 'object') return names;
	if (Array.isArray(node)) {
		node.forEach((child) => findSpreadFreeTags(child, names));
		return names;
	}
	const n = node as Node;
	if (n.type === 'JSXOpeningElement' && (n.name as Node).type === 'JSXIdentifier') {
		if (!(n.attributes as Node[]).some((attribute) => attribute.type === 'JSXSpreadAttribute')) {
			names.add((n.name as { name: string }).name);
		}
	}
	for (const [key, child] of Object.entries(n)) {
		if (key !== 'type') findSpreadFreeTags(child, names);
	}
	return names;
};

/** Maps each `styled()` call to the variable it is assigned to. */
const findDeclaredNames = (node: unknown, names = new Map<Node, string>()): Map<Node, string> => {
	if (!node || typeof node !== 'object') return names;
	if (Array.isArray(node)) {
		node.forEach((child) => findDeclaredNames(child, names));
		return names;
	}
	const n = node as Node;
	if (n.type === 'VariableDeclarator' && (n.id as Node).type === 'Identifier' && n.init) {
		names.set(n.init as Node, (n.id as { name: string }).name);
	}
	for (const [key, child] of Object.entries(n)) {
		if (key !== 'type') findDeclaredNames(child, names);
	}
	return names;
};

const findStyledCalls = (node: unknown, calls: Node[] = []): Node[] => {
	if (!node || typeof node !== 'object') return calls;
	if (Array.isArray(node)) {
		node.forEach((child) => findStyledCalls(child, calls));
		return calls;
	}
	const n = node as Node;
	if (n.type === 'CallExpression' && (n.callee as Node).type === 'Identifier' && (n.callee as { name: string }).name === 'styled') {
		calls.push(n);
	}
	for (const [key, child] of Object.entries(n)) {
		if (key !== 'type') findStyledCalls(child, calls);
	}
	return calls;
};

// The module is bundled with `@tamagui/web` stubbed, so evaluating it only records what each `styled()` call received
const tamaguiStub = `
const noop = () => null;
const styled = () => { const c = () => null; c.staticConfig = {}; return c; };
const createStyledContext = (defaults) => ({ Provider: noop, useStyledContext: () => defaults, props: defaults });
const createTamagui = (config) => ({ ...config, getCSS: () => '' });
module.exports = { styled, createStyledContext, createTamagui, createTokens: (tokens) => tokens, Text: noop, View: noop, ThemeProvider: noop };
`;

/**
 * Replaces each `styled()` options object in a component module with its evaluated value, so Tamagui's compiler,
 * which only reads literals in a module's own definitions, can flatten that module's frames. Options holding
 * anything but plain data (a styled context, for one) are left as written.
 */
export const prevalStyled = (): Plugin => ({
	name: 'fuselage-preval-styled',
	enforce: 'pre',
	transform: {
		order: 'pre',
		async handler(code, id) {
			if (!/\/src\/components\/.+\.tsx$/.test(id) || id.includes('.stories.') || !code.includes('styled(')) {
				return null;
			}

			const ast = parseAst(code, { lang: 'tsx' });
			const calls = findStyledCalls(ast).sort((a, b) => a.start - b.start);
			const spreadFree = findSpreadFreeTags(ast);
			const declared = findDeclaredNames(ast);
			if (!calls.length) return null;

			// Tag every call site so the evaluation knows which recorded options belong to which call
			let marked = code;
			for (const [index, call] of [...calls.entries()].reverse()) {
				const callee = call.callee as Node;
				marked = `${marked.slice(0, callee.start)}globalThis.__preval(${index}, styled)${marked.slice(callee.end)}`;
			}

			const recorded: unknown[] = [];

			try {
				const result = await build({
					stdin: { contents: marked, resolveDir: id.slice(0, id.lastIndexOf('/')), sourcefile: id, loader: 'tsx' },
					bundle: true,
					write: false,
					platform: 'node',
					format: 'cjs',
					jsx: 'automatic',
					logLevel: 'silent',
					external: ['react', 'react-dom', 'react/*'],
					loader: { '.css': 'empty', '.svg': 'empty', '.woff2': 'empty' },
					plugins: [
						{
							name: 'stub-tamagui',
							setup(pluginBuild) {
								pluginBuild.onResolve({ filter: /^@tamagui\/web$/ }, () => ({ path: 'tamagui-stub', namespace: 'stub' }));
								pluginBuild.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: tamaguiStub, loader: 'js' }));
							},
						},
					],
				});
				// Set right before the synchronous run: transforms of other modules interleave at every `await`
				(globalThis as any).__preval =
					(index: number, styled: (...args: unknown[]) => unknown) => (base: unknown, a: unknown, b: unknown) => {
						recorded[index] = typeof a === 'string' ? b : a;
						return styled(base, a, b);
					};
				const run = runInThisContext(`(function (require, module, exports) {\n${result.outputFiles[0].text}\n})`) as (
					require: NodeRequire,
					module: { exports: unknown },
					exports: unknown,
				) => void;
				run(require, { exports: {} }, {});
			} catch (error) {
				this.warn(`could not evaluate ${id}: ${(error as Error).message.split('\n')[0]}`);
				return null;
			}

			let out = code;
			let replaced = 0;
			for (const [index, call] of [...calls.entries()].reverse()) {
				const options = (call.arguments as Node[]).find((arg, i) => i > 0 && !(arg.type === 'Literal' && typeof arg.value === 'string'));
				const value = recorded[index];
				// Rewriting a frame no element can flatten only duplicates its shared fragments into the bundle
				const flattenable = spreadFree.has(declared.get(call) ?? '');
				if (!flattenable || !options || value === undefined || !isPlain(value)) continue;
				out = `${out.slice(0, options.start)}${JSON.stringify(value)}${out.slice(options.end)}`;
				replaced++;
			}

			return replaced ? { code: out, map: null } : null;
		},
	},
});
