// Test-only: walks the runtime import graph of a file so a spec can prove a core stays free of web singletons.
import fs from 'fs';
import path from 'path';

export const CLIENT_ROOT = path.resolve(__dirname, '../..');

// Client-relative paths, matched as the path itself or anything below it.
export const FORBIDDEN_PATHS = [
	'lib/SDKClient',
	'sdk',
	'stores',
	'lib/settings',
	'lib/user',
	'lib/toast',
	'lib/authorization',
	'lib/e2ee',
	'lib/rooms/roomCoordinator',
	'lib/utils/threadMessageUtils',
	'lib/queryClient',
	'lib/i18n',
	'lib/getPermaLink',
	'lib/UserAction',
	'lib/chats/uploads',
	'lib/chats/data',
	'lib/chats/flows',
	'lib/chats/ChatMessages',
	'lib/messageBoxFormatting',
	'lib/createComposerAPICore',
	'lib/composerStateCore',
	'meteor',
	'views',
	'providers',
	'components',
	'hooks',
];

export const FORBIDDEN_PACKAGES = [
	'meteor/',
	'react',
	'react-dom',
	'@rocket.chat/ui-client',
	'@rocket.chat/ui-contexts',
	'@rocket.chat/fuselage',
];

const isForbiddenPackage = (specifier: string, forbidden: string[]): boolean =>
	forbidden.some((prefix) =>
		prefix.endsWith('/') ? specifier.startsWith(prefix) : specifier === prefix || specifier.startsWith(`${prefix}/`),
	);

const isForbiddenPath = (file: string, forbidden: string[], root: string): boolean => {
	const relative = path
		.relative(root, file)
		.split(path.sep)
		.join('/')
		.replace(/\.(tsx?|jsx?)$/, '');
	return forbidden.some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`) || relative === `${prefix}/index`);
};

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const resolveRelative = (from: string, specifier: string): string | undefined => {
	const base = path.resolve(path.dirname(from), specifier);
	for (const candidate of [base, ...EXTENSIONS.map((ext) => base + ext), ...EXTENSIONS.map((ext) => path.join(base, `index${ext}`))]) {
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
			return candidate;
		}
	}
	return undefined;
};

type Edge = { specifier: string; dynamic: boolean };

const stripComments = (code: string): string => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

const isTypeOnlyClause = (clause: string): boolean => {
	if (/^type\s/.test(clause)) {
		return true;
	}
	const named = /^\{([\s\S]*)\}$/.exec(clause.trim());
	return (
		!!named &&
		named[1]
			.split(',')
			.filter((part) => part.trim() !== '')
			.every((part) => /^\s*type\s/.test(part))
	);
};

// Conservative regex scan (the TypeScript compiler of this repo has no JS API). Imports whose clause is `type` are erased and skipped;
// anything that looks like a dynamic import or a require counts, even when its argument is computed.
export const readImports = (file: string): Edge[] => {
	const code = stripComments(fs.readFileSync(file, 'utf8'));
	const edges: Edge[] = [];

	for (const match of code.matchAll(/\bimport\s+([^'";]*?)\s*from\s*['"]([^'"]+)['"]/g)) {
		if (!isTypeOnlyClause(match[1])) {
			edges.push({ specifier: match[2], dynamic: false });
		}
	}
	for (const match of code.matchAll(/\bimport\s*['"]([^'"]+)['"]/g)) {
		edges.push({ specifier: match[1], dynamic: false });
	}
	for (const match of code.matchAll(/\bexport\s+(?!type\b)(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s*from\s*['"]([^'"]+)['"]/g)) {
		edges.push({ specifier: match[1], dynamic: false });
	}
	for (const match of code.matchAll(/\b(?:import|require)\s*\(\s*(?:(['"`])([^'"`]*)\1)?/g)) {
		edges.push({ specifier: match[2] ?? '<computed>', dynamic: true });
	}

	return edges;
};

export type GraphReport = { violations: string[]; files: string[]; packages: Map<string, string[]> };

export const walkImports = (
	entries: string[],
	{
		root = CLIENT_ROOT,
		forbiddenPaths = FORBIDDEN_PATHS,
		forbiddenPackages = FORBIDDEN_PACKAGES,
	}: { root?: string; forbiddenPaths?: string[]; forbiddenPackages?: string[] } = {},
): GraphReport => {
	const violations: string[] = [];
	const seen = new Set<string>();
	const packages = new Map<string, string[]>();
	const queue = [...entries];

	for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
		if (seen.has(file)) {
			continue;
		}
		seen.add(file);

		for (const { specifier, dynamic } of readImports(file)) {
			if (dynamic) {
				violations.push(`${file}: dynamic import or require of '${specifier}'`);
			}

			if (specifier.startsWith('.')) {
				const resolved = resolveRelative(file, specifier);
				if (!resolved) {
					violations.push(`${file}: cannot resolve '${specifier}'`);
				} else if (isForbiddenPath(resolved, forbiddenPaths, root)) {
					violations.push(`${file}: imports forbidden module '${specifier}'`);
				} else {
					queue.push(resolved);
				}
				continue;
			}

			if (isForbiddenPackage(specifier, forbiddenPackages)) {
				violations.push(`${file}: imports forbidden package '${specifier}'`);
			}
			packages.set(specifier, [...(packages.get(specifier) ?? []), file]);
		}
	}

	return { violations, files: [...seen], packages };
};
