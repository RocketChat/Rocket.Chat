import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const WORKSPACE_ROOTS = ['apps', 'packages', 'ee/apps', 'ee/packages'];
const APP_DIR = 'apps/meteor';
const APP_SOURCES = ['client', 'ee/client', 'server', 'ee/server', 'app', 'lib', 'imports', 'definition'];
const WIDGET_DIR = 'packages/livechat';
const ENTRIES = ['src/index.ts', 'src/index.tsx', 'index.ts', 'index.tsx'];
const EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];

const SKIPPED = /node_modules|\/dist\/|\/build\/|__tests__|__mocks__|\/\.storybook\/|\.(spec|test|stories)\.[cm]?[jt]sx?$|\.d\.ts$/;
const SOURCE = /\.[cm]?[jt]sx?$/;
const PACKAGE_SPECIFIER = /^(@rocket\.chat\/[a-z0-9-]+)(\/.+)?$/;

// '*' means the whole module: a namespace, side-effect, dynamic or subpath import
type Names = Set<string> | '*';

type Dependency = { specifier: string; names: Names };

type Reexport = { specifier: string; names: Map<string, string> | '*' } | { specifier: string; namespace: string };

type ModuleInfo = {
	workspace: string;
	dependencies: Dependency[];
	declared: Set<string>;
	// `export { local as exported }` without `from`
	aliases: Map<string, string>;
	reexports: Reexport[];
	// Local binding -> where it was imported from
	bindings: Map<string, { specifier: string; name: string }>;
};

export type ImportGraph = {
	// Workspace directory -> package name
	names: Map<string, string>;
	modules: Map<string, ModuleInfo>;
};

function walk(repoRoot: string, dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
		const file = path.posix.join(dir, entry.name);
		if (SKIPPED.test(entry.isDirectory() ? `${file}/` : file)) {
			continue;
		}
		if (entry.isDirectory()) {
			walk(repoRoot, file, out);
		} else if (SOURCE.test(entry.name)) {
			out.push(file);
		}
	}
	return out;
}

function entriesOf(clause: string): string[] {
	return clause
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry && !entry.startsWith('type '));
}

function nameParts(entry: string): [string, string] {
	const [name, alias] = entry.split(/\s+as\s+/);
	return [name.trim(), (alias ?? name).trim()];
}

export function parseModule(workspace: string, content: string): ModuleInfo {
	const info: ModuleInfo = { workspace, dependencies: [], declared: new Set(), aliases: new Map(), reexports: [], bindings: new Map() };

	for (const [, type, clause, specifier] of content.matchAll(/^\s*import\s+(type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]/gm)) {
		if (type) {
			continue;
		}
		const names = new Set<string>();
		let whole = false;
		const braces = clause.match(/\{([^}]*)\}/);
		const head = clause
			.replace(/\{[^}]*\}/, '')
			.replace(/,/g, ' ')
			.trim();
		if (/\*\s+as\s+[\w$]+/.test(head)) {
			whole = true;
		}
		const defaultName = head.replace(/\*\s+as\s+[\w$]+/, '').trim();
		if (defaultName) {
			names.add('default');
			info.bindings.set(defaultName, { specifier, name: 'default' });
		}
		for (const entry of entriesOf(braces?.[1] ?? '')) {
			const [name, local] = nameParts(entry);
			names.add(name);
			info.bindings.set(local, { specifier, name });
		}
		if (whole || names.size) {
			info.dependencies.push({ specifier, names: whole ? '*' : names });
		}
	}
	for (const [, specifier] of content.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) {
		info.dependencies.push({ specifier, names: '*' });
	}
	for (const [, specifier] of content.matchAll(/\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
		info.dependencies.push({ specifier, names: '*' });
	}

	for (const [, type, clause, specifier] of content.matchAll(/^\s*export\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/gm)) {
		if (type) {
			continue;
		}
		const names = new Map(entriesOf(clause).map((entry) => nameParts(entry).reverse() as [string, string]));
		if (names.size) {
			info.reexports.push({ specifier, names });
			info.dependencies.push({ specifier, names: new Set(names.values()) });
		}
	}
	for (const [, namespace, specifier] of content.matchAll(/^\s*export\s+\*\s*(?:as\s+([\w$]+)\s*)?from\s*['"]([^'"]+)['"]/gm)) {
		info.reexports.push(namespace ? { specifier, namespace } : { specifier, names: '*' });
		info.dependencies.push({ specifier, names: '*' });
	}
	for (const [, type, clause] of content.matchAll(/^\s*export\s+(type\s+)?\{([^}]*)\}(?!\s*from)/gm)) {
		if (!type) {
			entriesOf(clause).forEach((entry) => {
				const [local, exported] = nameParts(entry);
				info.aliases.set(exported, local);
			});
		}
	}
	for (const [, isDefault, name] of content.matchAll(
		/^\s*export\s+(?:declare\s+)?(default\s+)?(?:async\s+)?(?:const|let|var|function\*?|class|abstract\s+class|enum)\s+([\w$]+)/gm,
	)) {
		info.declared.add(isDefault ? 'default' : name);
	}
	if (/^\s*export\s+default\b/m.test(content)) {
		info.declared.add('default');
	}
	return info;
}

export function buildImportGraph(repoRoot: string): ImportGraph {
	const names = new Map<string, string>();
	for (const base of WORKSPACE_ROOTS) {
		for (const dir of readdirSync(path.join(repoRoot, base))) {
			const manifest = path.join(repoRoot, base, dir, 'package.json');
			if (existsSync(manifest)) {
				names.set(path.posix.join(base, dir), JSON.parse(readFileSync(manifest, 'utf8')).name);
			}
		}
	}

	const modules = new Map<string, ModuleInfo>();
	for (const dir of names.keys()) {
		const sources = dir === APP_DIR ? APP_SOURCES.map((source) => path.posix.join(dir, source)) : [dir];
		for (const source of sources.filter((source) => existsSync(path.join(repoRoot, source)))) {
			for (const file of walk(repoRoot, source)) {
				modules.set(file, parseModule(dir, readFileSync(path.join(repoRoot, file), 'utf8')));
			}
		}
	}
	return { names, modules };
}

export function workspaceOf(file: string): string | undefined {
	const match = file.match(/^((?:ee\/)?packages\/[^/]+)\//);
	return match?.[1];
}

function resolveRelative(graph: ImportGraph, from: string, specifier: string): string | undefined {
	if (!specifier.startsWith('.')) {
		return;
	}
	const target = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier)).replace(/\.[cm]?js$/, '');
	return [target, ...EXTENSIONS.map((ext) => target + ext), ...EXTENSIONS.map((ext) => `${target}/index${ext}`)].find((file) =>
		graph.modules.has(file),
	);
}

const exportCache = new WeakMap<ImportGraph, Map<string, Map<string, string>>>();

// Exported name -> the file that defines it, following re-export chains
function exportsOf(graph: ImportGraph, file: string, seen = new Set<string>()): Map<string, string> {
	const cache = exportCache.get(graph) ?? new Map<string, Map<string, string>>();
	exportCache.set(graph, cache);
	const cached = cache.get(file);
	if (cached) {
		return cached;
	}
	const result = new Map<string, string>();
	const info = graph.modules.get(file);
	if (!info || seen.has(file)) {
		return result;
	}
	seen.add(file);

	info.declared.forEach((name) => result.set(name, file));
	for (const [exported, local] of info.aliases) {
		const binding = info.bindings.get(local);
		const target = binding && resolveRelative(graph, file, binding.specifier);
		result.set(exported, (target && exportsOf(graph, target, seen).get(binding!.name)) ?? target ?? file);
	}
	for (const reexport of info.reexports) {
		const target = resolveRelative(graph, file, reexport.specifier);
		if ('namespace' in reexport) {
			result.set(reexport.namespace, target ?? file);
			continue;
		}
		const inner = target ? exportsOf(graph, target, seen) : new Map<string, string>();
		if (reexport.names === '*') {
			inner.forEach((definer, name) => name !== 'default' && result.set(name, definer));
		} else {
			reexport.names.forEach((local, exported) => result.set(exported, inner.get(local) ?? target ?? file));
		}
	}
	cache.set(file, result);
	return result;
}

// The package exports a change to `seeds` reaches; '*' when the change cannot be pinned to named exports
function affectedExports(graph: ImportGraph, workspace: string, seeds: Set<string>): Names {
	const entry = ENTRIES.map((file) => path.posix.join(workspace, file)).find((file) => graph.modules.has(file));
	if (!entry) {
		return '*';
	}
	const dependents = new Map<string, Set<string>>();
	for (const [file, info] of graph.modules) {
		if (info.workspace !== workspace) {
			continue;
		}
		// A named import from a barrel depends on the file that defines the name, not on the whole barrel
		for (const { specifier, names } of info.dependencies) {
			const target = resolveRelative(graph, file, specifier);
			if (!target) {
				continue;
			}
			const definers = names === '*' ? [target] : [...names].map((name) => exportsOf(graph, target).get(name) ?? target);
			for (const definer of definers) {
				dependents.set(definer, (dependents.get(definer) ?? new Set()).add(file));
			}
		}
	}
	const reached = new Set(seeds);
	const queue = [...seeds];
	while (queue.length) {
		for (const dependent of dependents.get(queue.pop()!) ?? []) {
			if (!reached.has(dependent)) {
				reached.add(dependent);
				queue.push(dependent);
			}
		}
	}

	const affected = new Set<string>();
	exportsOf(graph, entry).forEach((definer, name) => reached.has(definer) && affected.add(name));
	return affected.size ? affected : '*';
}

export type PackageImpact = {
	appFiles: string[];
	// The change reaches the livechat widget, which the coverage map cannot see
	widget: boolean;
	reasons: string[];
	// How each changed package reached the app, the widget or a microservice
	trace: string[];
};

// Follows each changed package, export by export, to the code that ships it: the app, the widget or a microservice
export function packageImpact(graph: ImportGraph, changed: string[]): PackageImpact {
	const appFiles = new Set<string>();
	const reasons: string[] = [];
	const trace: string[] = [];
	const microservices = new Set<string>();
	let widget = false;

	const seeds = new Map<string, Set<string>>();
	for (const file of changed) {
		const workspace = workspaceOf(file);
		if (!workspace) {
			continue;
		}
		if (!graph.names.has(workspace)) {
			reasons.push(`not a workspace package: ${workspace}`);
		} else if (file === `${workspace}/package.json`) {
			reasons.push(`dependencies changed: ${file}`);
		} else {
			seeds.set(workspace, (seeds.get(workspace) ?? new Set()).add(file));
		}
	}

	const done = new Map<string, Set<string>>();
	const queue = [...seeds.keys()];
	while (queue.length) {
		const workspace = queue.shift()!;
		const pending = seeds.get(workspace)!;
		const previous = done.get(workspace) ?? new Set();
		if ([...pending].every((file) => previous.has(file))) {
			continue;
		}
		done.set(workspace, new Set([...previous, ...pending]));

		const name = graph.names.get(workspace)!;
		const affected = affectedExports(graph, workspace, pending);
		trace.push(`${name}: ${affected === '*' ? 'every export' : [...affected].sort().join(', ')}`);

		const consumers = new Map<string, number>();
		for (const [file, info] of graph.modules) {
			if (info.workspace === workspace) {
				continue;
			}
			const uses = info.dependencies.some(({ specifier, names }) => {
				const match = specifier.match(PACKAGE_SPECIFIER);
				if (match?.[1] !== name) {
					return false;
				}
				return affected === '*' || names === '*' || match[2] !== undefined || [...names].some((used) => affected.has(used));
			});
			if (!uses) {
				continue;
			}
			consumers.set(info.workspace, (consumers.get(info.workspace) ?? 0) + 1);
			if (info.workspace === APP_DIR) {
				appFiles.add(file);
			} else if (info.workspace === WIDGET_DIR) {
				widget = true;
			} else if (info.workspace.startsWith('ee/apps/')) {
				microservices.add(info.workspace);
			} else if (!info.workspace.startsWith('apps/')) {
				const next = seeds.get(info.workspace) ?? new Set();
				seeds.set(info.workspace, next.add(file));
				queue.push(info.workspace);
			}
		}
		trace.push(`  -> ${[...consumers].map(([consumer, count]) => `${consumer} (${count} files)`).join(', ') || 'nothing imports them'}`);
		if (workspace === WIDGET_DIR) {
			widget = true;
		}
	}

	// Microservices run code the app also runs, and the EE jobs run the app's specs against them; code only a
	// microservice runs has no spec that reaches it
	if (microservices.size && !appFiles.size && !widget) {
		reasons.push(`only microservices import what changed: ${[...microservices].sort().join(', ')}`);
	} else if (!reasons.length && !appFiles.size && !widget) {
		reasons.push(`no app or widget imports what changed in ${[...seeds.keys()].join(', ')}`);
	}
	return { appFiles: [...appFiles].sort(), widget, reasons, trace };
}
