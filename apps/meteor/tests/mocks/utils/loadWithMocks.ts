import { mkdirSync, writeFileSync } from 'node:fs';
import Module, { builtinModules, createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { mock } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

type Stubs = Record<string, unknown>;

type LoadWithMocksOptions = {
	/**
	 * Lets stubs fall back to the real module for the exports they do not define. A stub overrides it with
	 * `'@noCallThru': true` or `false`.
	 */
	callThru?: boolean;
};

type ModuleLoad = (request: string, parent: unknown, isMain: boolean) => unknown;

const moduleInternals = Module as unknown as {
	_load: ModuleLoad;
	_resolveFilename: (request: string, parent: unknown) => string;
};

const resolveFrom = (request: string, parent: unknown): string | undefined => {
	try {
		return moduleInternals._resolveFilename(request, parent);
	} catch {
		return undefined;
	}
};

const placeholderDir = join(tmpdir(), 'rocketchat-unit-test-placeholders');

const callerFile = (): string => {
	const original = Error.prepareStackTrace;
	try {
		Error.prepareStackTrace = (_, callSites) => callSites;
		const callSites = new Error().stack as unknown as NodeJS.CallSite[];
		const fileName = callSites[2]?.getFileName();
		if (!fileName) {
			throw new Error('loadWithMocks could not locate its caller');
		}
		return fileName.startsWith('file:') ? fileURLToPath(fileName) : fileName;
	} finally {
		Error.prepareStackTrace = original;
	}
};

/**
 * Stubs of modules that exist replace only the imports of the module under test, the way `proxyquire` applied them.
 * A module it imports that runs for the first time during the load gets the real dependencies, so it does not keep
 * the stubs for the rest of the run. Specifiers Node cannot resolve, like `meteor/meteor` or a package path its
 * `exports` hide, load an empty file instead, which their stubs replace for every module.
 */
const withStubs = <T>(subject: string, subjectStubs: Map<string, unknown>, placeholders: Map<string, string>, fn: () => T): T => {
	const load = moduleInternals._load;
	moduleInternals._load = (request, parent, isMain) => {
		if ((parent as NodeJS.Module | undefined)?.filename === subject) {
			const resolved = resolveFrom(request, parent);
			if (resolved !== undefined && subjectStubs.has(resolved)) {
				return subjectStubs.get(resolved);
			}
		}
		return load(placeholders.get(request) ?? request, parent, isMain);
	};
	try {
		return fn();
	} finally {
		moduleInternals._load = load;
	}
};

const placeholderFor = (specifier: string): string => {
	const path = join(placeholderDir, `${encodeURIComponent(specifier)}.cjs`);
	mkdirSync(placeholderDir, { recursive: true });
	writeFileSync(path, 'module.exports = {};\n');
	return path;
};

const isStubObject = (stub: unknown): stub is Stubs => typeof stub === 'object' && stub !== null;

// Modules loaded with a `'@global'` stub load fresh, so a dependency loaded earlier in the run sees the stub too.
const withEmptyModuleCache = <T>(cache: NodeJS.Dict<NodeJS.Module>, fn: () => T): T => {
	const previous = { ...cache };
	const clear = () => Object.keys(cache).forEach((key) => delete cache[key]);
	clear();
	try {
		return fn();
	} finally {
		clear();
		Object.assign(cache, previous);
	}
};

const toModuleUrl = (resolved: string): string => {
	if (isAbsolute(resolved)) {
		return pathToFileURL(resolved).href;
	}
	return builtinModules.includes(resolved) ? `node:${resolved}` : resolved;
};

/**
 * Loads a fresh copy of a module with some of its imports replaced, the way `proxyquire` does: each key of `stubs`
 * is a specifier as written in the module under test, and its value becomes that import's `module.exports`.
 * Modules that only exist inside Meteor, like `meteor/meteor`, can be stubbed as well.
 */
export const loadWithMocks = <T = any>(path: string, stubs: Stubs, { callThru = false }: LoadWithMocksOptions = {}): T => {
	const requireFromCaller = createRequire(callerFile());
	const subject = requireFromCaller.resolve(path);
	const requireFromSubject = createRequire(subject);

	const hasGlobalStubs = Object.values(stubs).some((stub) => isStubObject(stub) && stub['@global'] === true);

	const placeholders = new Map<string, string>();

	const load = () => {
		const mocks: ReturnType<typeof mock.module>[] = [];
		const subjectStubs = new Map<string, unknown>();
		try {
			for (const [specifier, stub] of Object.entries(stubs)) {
				let resolved: string;
				let exists = true;
				try {
					resolved = requireFromSubject.resolve(specifier);
				} catch {
					// A relative stub the module never imports, as when one set of stubs serves several modules.
					if (specifier.startsWith('.') || isAbsolute(specifier)) {
						continue;
					}
					resolved = placeholderFor(specifier);
					placeholders.set(specifier, resolved);
					exists = false;
				}

				const noCallThru = isStubObject(stub) ? stub['@noCallThru'] : undefined;
				if (exists && isStubObject(stub) && (typeof noCallThru === 'boolean' ? !noCallThru : callThru)) {
					const real = requireFromSubject(specifier);
					for (const key of Object.keys(real)) {
						if (!(key in stub)) {
							stub[key] = real[key];
						}
					}
				}

				if (exists && !(isStubObject(stub) && stub['@global'] === true)) {
					subjectStubs.set(resolved, stub);
					continue;
				}

				mocks.push(mock.module(toModuleUrl(resolved), { exports: { default: stub } }));
			}

			delete requireFromCaller.cache[subject];
			return withStubs(subject, subjectStubs, placeholders, () => requireFromCaller(subject));
		} finally {
			for (const moduleMock of mocks) {
				moduleMock.restore();
			}
		}
	};

	return hasGlobalStubs ? withEmptyModuleCache(requireFromCaller.cache, load) : load();
};
