import type { Dirent } from 'node:fs';
import { readFile, glob, readdir } from 'node:fs/promises';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PACKAGE_JSON = 'package.json';

function parseJson(text: string): unknown {
	return JSON.parse(text);
}

function isObject(value: unknown) {
	return typeof value === 'object' && value !== null;
}

function isArray(value: unknown): value is unknown[] {
	return Array.isArray(value);
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}

function getWorkspaces(content: string) {
	const json = parseJson(content);

	if (typeof json !== 'object') {
		throw new Error('Package.json is not an object');
	}

	if (json === null) {
		throw new Error('Package.json is null');
	}

	if (!('workspaces' in json)) {
		throw new Error('Package.json does not contain "workspaces"');
	}

	const { workspaces } = json;

	if (!isArray(workspaces)) {
		throw new Error('Package.json "workspaces" is not an array');
	}

	if (workspaces.length === 0) {
		throw new Error('Package.json "workspaces" is an empty array');
	}

	if (!workspaces.every(isString)) {
		throw new Error('Package.json "workspaces" contains non-string values');
	}

	return workspaces;
}

class PackageVisitor {
	#patterns: AsyncIteratorObject<Dirent, void, unknown>;
	constructor(patterns: string[]) {
		this.#patterns = glob(patterns, { cwd: ROOT, withFileTypes: true });
	}
	async *[Symbol.asyncIterator]() {
		for await (const dirent of this.#patterns) {
			const fullPath = path.join(dirent.parentPath, dirent.name);
			const children = await readdir(fullPath, { withFileTypes: true, encoding: 'utf8' });
			yield { dirent, children };
		}
	}
}

type DeepPartial<T> = { [P in keyof T]?: T[P] extends Record<string, unknown> ? DeepPartial<T[P]> : T[P] } & {};

type PackageJson = {
	name: string;
	version: string;
	private: boolean;
	devDependencies: Record<string, string>;
	scripts: Record<string, string>;
	main: string;
	typings: string;
	files: string[];
	volta: {
		extends: string;
	};
};

class RuleContext {
	#relative: string;
	constructor(relative: string) {
		this.#relative = relative;
	}
	get relative() {
		return this.#relative;
	}
	error(message: string): false {
		console.error(`[${this.#relative}] ${message}`);
		return false;
	}
}

interface Rule<T> {
	name: string;
	(this: RuleContext, value: DeepPartial<T>): boolean | Promise<boolean>;
}

const rules = [
	function name(json) {
		return 'name' in json && typeof json.name === 'string';
	},
	function scope(json) {
		return json.name?.startsWith('@rocket.chat/') ?? false;
	},
	function volta(json) {
		if (
			!(
				'volta' in json &&
				typeof json.volta === 'object' &&
				json.volta !== null &&
				'extends' in json.volta &&
				typeof json.volta.extends === 'string'
			)
		) {
			return false;
		}

		if (path.join(this.relative, json.volta.extends) === path.join(ROOT, 'package.json')) {
			return true;
		}

		return this.error(path.join(this.relative, json.volta.extends));
	},
] as const satisfies Rule<PackageJson>[];

async function checkPackageJson() {
	const workspaces = await fetchWorkspaces();

	for await (const { dirent, children } of workspaces) {
		try {
			for (const child of children) {
				const relative = path.relative(ROOT, `${child.parentPath}/${child.name}`);
				const context = new RuleContext(child.parentPath);
				if (child.name === PACKAGE_JSON) {
					const content = await readFile(path.join(child.parentPath, child.name), 'utf8');
					const json = parseJson(content);
					if (!isObject(json)) {
						throw new Error(`Invalid JSON in ${child.name}`);
					}

					for (const rule of rules) {
						rule.apply(context, [json]);
					}

					// console.dir(packageJson);
				}
			}
		} catch (error) {
			console.error('Error reading package.json:', error);
		}
	}
}

checkPackageJson();
async function fetchWorkspaces() {
	const content = await readFile(PACKAGE_JSON, 'utf8');
	const workspaces = new PackageVisitor(getWorkspaces(content));
	return workspaces;
}
