// Test-only: walks the runtime import graph of a file so a spec can prove a core stays free of web singletons.
import fs from 'fs';
import path from 'path';

export const APP_ROOT = path.resolve(__dirname, '../../..');

// Relative to apps/meteor, matched as the file itself or anything below it. Every entry must exist on disk.
export const FORBIDDEN_PATHS = [
	'client/lib/SDKClient',
	'client/lib/sdk',
	'client/lib/baseURI',
	'client/lib/RestApiClient',
	'client/stores',
	'client/lib/settings',
	'client/lib/user',
	'client/lib/toast',
	'client/lib/authorization',
	'client/lib/e2ee',
	'client/lib/rooms/roomCoordinator',
	'client/lib/utils/threadMessageUtils',
	'client/lib/queryClient',
	'lib/i18n',
	'client/lib/getPermaLink',
	'client/lib/getURL',
	'client/lib/UserAction',
	'client/lib/slashCommand',
	'client/lib/onClientBeforeSendMessage',
	'client/lib/onClientMessageReceived',
	'client/lib/chats/uploads',
	'client/lib/chats/data',
	'client/lib/chats/flows',
	'client/lib/ChatMessages',
	'client/lib/messageBoxFormatting',
	'client/lib/createComposerAPICore',
	'client/lib/composerStateCore',
	'client/meteor',
	'client/views',
	'client/providers',
	'client/components',
	'client/hooks',
];

// What a core may import at runtime. Anything else fails the guard until a person adds it here on purpose.
export const ALLOWED_PACKAGES = ['@rocket.chat/core-typings', '@rocket.chat/emitter'];

const isAllowedPackage = (specifier: string, allowed: string[]): boolean =>
	allowed.some((name) => specifier === name || specifier.startsWith(`${name}/`));

const isForbiddenPath = (file: string, forbidden: string[], root: string): boolean => {
	const relative = path
		.relative(root, file)
		.split(path.sep)
		.join('/')
		.replace(/\.(tsx?|jsx?)$/, '');
	return forbidden.some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`) || relative === `${prefix}/index`);
};

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const resolveFile = (base: string): string | undefined => {
	for (const candidate of [base, ...EXTENSIONS.map((ext) => base + ext), ...EXTENSIONS.map((ext) => path.join(base, `index${ext}`))]) {
		if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
			return candidate;
		}
	}
	return undefined;
};

const resolveRelative = (from: string, specifier: string): string | undefined => resolveFile(path.resolve(path.dirname(from), specifier));

export const forbiddenPathExists = (entry: string, root = APP_ROOT): boolean =>
	fs.existsSync(path.join(root, entry)) || resolveFile(path.join(root, entry)) !== undefined;

type Edge = { specifier: string; dynamic: boolean };

const REGEX_PRECEDERS = /[(,=:[!&|?{};+\-*%<>~^]$|(?:^|[^\w$.])(?:return|typeof|case|do|else|in|of|void|delete|throw|new|yield|await)$/;

// Drops comments only. Strings, template literals and regex literals are copied through, so a `//` or `/*` inside one is never a comment.
export const stripComments = (code: string): string => {
	let out = '';
	let i = 0;
	let braceDepth = 0;
	const templateResume: number[] = [];

	const copyString = (quote: string): void => {
		out += code[i++];
		while (i < code.length && code[i] !== quote && code[i] !== '\n') {
			if (code[i] === '\\') {
				out += code[i++];
			}
			out += code[i++] ?? '';
		}
		out += code[i++] ?? '';
	};

	const copyTemplate = (): void => {
		while (i < code.length) {
			if (code[i] === '\\') {
				out += code[i++];
			} else if (code[i] === '`') {
				out += code[i++];
				return;
			} else if (code[i] === '$' && code[i + 1] === '{') {
				out += '${';
				i += 2;
				templateResume.push(braceDepth++);
				return;
			}
			out += code[i++] ?? '';
		}
	};

	const copyRegex = (): boolean => {
		let inClass = false;
		for (let j = i + 1; j < code.length && code[j] !== '\n'; j++) {
			if (code[j] === '\\') {
				j++;
			} else if (code[j] === '[') {
				inClass = true;
			} else if (code[j] === ']') {
				inClass = false;
			} else if (code[j] === '/' && !inClass) {
				out += code.slice(i, j + 1);
				i = j + 1;
				return true;
			}
		}
		return false;
	};

	while (i < code.length) {
		const char = code[i];
		const next = code[i + 1];

		if (char === '/' && next === '/') {
			while (i < code.length && code[i] !== '\n') {
				i++;
			}
		} else if (char === '/' && next === '*') {
			const end = code.indexOf('*/', i + 2);
			const stop = end === -1 ? code.length : end + 2;
			out += code.slice(i, stop).replace(/[^\n]/g, ' ');
			i = stop;
		} else if (char === '"' || char === "'") {
			copyString(char);
		} else if (char === '`') {
			out += code[i++];
			copyTemplate();
		} else if (char === '/' && REGEX_PRECEDERS.test(out.trimEnd()) && copyRegex()) {
			continue;
		} else {
			if (char === '{') {
				braceDepth++;
			} else if (char === '}') {
				braceDepth--;
				if (templateResume.length && templateResume[templateResume.length - 1] === braceDepth) {
					templateResume.pop();
					out += code[i++];
					copyTemplate();
					continue;
				}
			}
			out += code[i++];
		}
	}

	return out;
};

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

// Regex scan (the TypeScript compiler of this repo has no JS API) over source with comments removed. It can over-report, never hide: an
// import written inside a string or template literal still counts. Imports whose clause is `type` are erased and skipped; anything that
// looks like a dynamic import or a require counts, even when its argument is computed.
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
		root = APP_ROOT,
		forbiddenPaths = FORBIDDEN_PATHS,
		allowedPackages = ALLOWED_PACKAGES,
	}: { root?: string; forbiddenPaths?: string[]; allowedPackages?: string[] } = {},
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

			if (!isAllowedPackage(specifier, allowedPackages)) {
				violations.push(`${file}: imports package '${specifier}' outside the allow-list`);
			}
			packages.set(specifier, [...(packages.get(specifier) ?? []), file]);
		}
	}

	return { violations, files: [...seen], packages };
};
