import { Package } from './package-registry.ts';
import { copyKey } from './utils/copyKey.ts';
import { isFunction } from './utils/isFunction.ts';

const mainFields = ['browser', 'main'];

const filesByModuleId: Record<string, File> = {};

export class Module {
	id: string;

	children: Module[] = [];

	childrenById: Record<string, Module> = {};

	parent: Module | null = null;

	loaded = false;

	runSetters?(names: string[] | undefined, runNsSetter: any): void;

	runModuleSetters?(): void;

	exports: any;

	constructor(id: string) {
		this.id = id;
	}

	exportAs(name: string) {
		const includeDefault = name === '*+';

		const setter = (value: any) => {
			if (name === '*' || name === '*+') {
				Object.keys(value).forEach((key) => {
					if (includeDefault || key !== 'default') {
						copyKey(key, this.exports, value);
					}
				});
			} else {
				this.exports[name] = value;
			}
		};

		if (name !== '*+' && name !== '*') {
			setter.exportAs = name;
		}

		return setter;
	}

	exportDefault(value: any) {
		return this.export(
			{
				default() {
					return value;
				},
			},
			// true,
		);
	}

	makeNsSetter(includeDefault: boolean) {
		return this.exportAs(includeDefault ? '*+' : '*');
	}

	require(id: string) {
		const result = fileResolve(filesByModuleId[this.id], id);
		if (result) {
			return fileEvaluate(result, this);
		}

		const error = makeMissingError(id);

		throw error;
	}

	resolve(id: string) {
		const file = fileResolve(filesByModuleId[this.id], id);
		if (file) return file.module.id;
		const error = makeMissingError(id);
		throw error;
	}

	export(exports: Record<string, unknown>, _constant = false) {
		this.exports = exports;
	}

	link(id: string, module: Module, _setter: any) {
		this.childrenById[id] = module;
	}

	wrapAsync(
		_body: { call: (arg0: any, arg1: any, arg2: () => any, arg3: (error: any) => void) => void },
		_options: { async: boolean; self: any },
	) {
		//
	}
}

export type Leaf = ((require: (id: string) => any, exports: any, module: Module) => void) | string | false;
export type TreeNode = {
	[key: string]: Array<TreeNode | Leaf> | TreeNode | Leaf;
};

type ContentsFn = (require: IRequire, exports: any, module: Module, __filename: string, __dirname: string) => void;

// File objects represent either directories or modules that have been
// installed. When a `File` respresents a directory, its `.contents`
// property is an object containing the names of the files (or
// directories) that it contains. When a `File` represents a module, its
// `.contents` property is a function that can be invoked with the
// appropriate `(require, exports, module)` arguments to evaluate the
// module. If the `.contents` property is a string, that string will be
// resolved as a module identifier, and the exports of the resulting
// module will provide the exports of the original file. The `.parent`
// property of a File is either a directory `File` or `null`. Note that
// a child may claim another `File` as its parent even if the parent
// does not have an entry for that child in its `.contents` object.
// This is important for implementing anonymous files, and preventing
// child modules from using `../relative/identifier` syntax to examine
// unrelated modules.
class File {
	parent: File | null;

	module: Module;

	contents: (string | Record<string, unknown> | ContentsFn)[] | ContentsFn | null;

	deps: Record<string, string>;

	options?: { extensions?: string[] };

	stub: Record<string, unknown> = {};

	constructor(moduleId: string, parent: File | null = null) {
		// Link to the parent file.
		this.parent = parent;

		// The module object for this File, which will eventually boast an
		// .exports property when/if the file is evaluated.
		this.module = new Module(moduleId);
		filesByModuleId[moduleId] = this;

		// The .contents of the file can be either (1) an object, if the file
		// represents a directory containing other files; (2) a factory
		// function, if the file represents a module that can be imported; (3)
		// a string, if the file is an alias for another file; or (4) null, if
		// the file's contents are not (yet) available.
		this.contents = null;

		// Set of module identifiers imported by this module. Note that this
		// set is not necessarily complete, so don't rely on it unless you
		// know what you're doing.
		this.deps = {};
	}
}

const root = new File('/', new File('/..'));

function fileIsDirectory(file: File | null) {
	return !!file && isObject(file.contents);
}

function fileAppendIdPart(file: File | null, part: string, extensions?: string[]) {
	let dir: File | null = file;
	// Always append relative to a directory.
	while (dir && !fileIsDirectory(dir)) {
		dir = dir.parent;
	}

	if (!dir || !part || part === '.') {
		return dir;
	}

	if (part === '..') {
		return dir.parent;
	}

	const exactChild = getOwn(dir.contents, part) as File | null;

	// Only consider multiple file extensions if this part is the last
	// part of a module identifier and not equal to `.` or `..`, and there
	// was no exact match or the exact match was a directory.
	if (extensions && (!exactChild || fileIsDirectory(exactChild))) {
		for (let e = 0; e < extensions.length; ++e) {
			const child = getOwn(dir.contents, part + extensions[e]) as File | null;
			if (child && !fileIsDirectory(child)) {
				return child;
			}
		}
	}

	return exactChild;
}

function fileAppendId(file: File | null, id: string, extensions?: string[]) {
	const parts = id.split('/');

	// Use `Array.prototype.every` to terminate iteration early if
	// `fileAppendIdPart` returns a falsy value.
	for (let i = 0; i < parts.length; ++i) {
		const part = parts[i];
		file = fileAppendIdPart(file, part, i === parts.length - 1 ? extensions : undefined);
		if (!file) {
			break;
		}
	}

	return file;
}

function recordChild(parentModule: Module | undefined, childFile: File | null) {
	const childModule = childFile?.module;
	if (parentModule && childModule) {
		parentModule.childrenById[childModule.id] = childModule;
	}
}

function nodeModulesLookup(file: File, id: string, extensions?: string[]) {
	let parent: File | null = file;
	let resolved;

	while (parent && !resolved) {
		resolved = fileIsDirectory(parent) && fileAppendId(parent, `node_modules/${id}`, extensions);
		parent = parent.parent;
	}

	if (!resolved) {
		throw makeMissingError(id);
	}

	return resolved;
}

function each<T extends Record<string, unknown>>(obj: T, callback: (value: unknown, key: string) => void, context?: any): void {
	Object.keys(obj).forEach((key) => {
		callback(obj[key], key);
	}, context);
}

function fileResolve(_file: File, id: string, parentModule?: Module, seenDirFiles?: File[]): File | null {
	let file: File | null = _file;
	parentModule = parentModule || file.module;
	const extensions = fileGetExtensions(file);

	if (id.charAt(0) === '/') {
		file = fileAppendId(root, id, extensions);
	} else if (id.charAt(0) === '.') {
		file = fileAppendId(file, id, extensions);
	} else {
		file = nodeModulesLookup(file, id, extensions);
	}

	// If the identifier resolves to a directory, we use the same logic as
	// Node to find an `index.js` or `package.json` file to evaluate.
	while (file && fileIsDirectory(file)) {
		seenDirFiles = seenDirFiles || [];

		// If the "main" field of a `package.json` file resolves to a
		// directory we've already considered, then we should not attempt to
		// read the same `package.json` file again. Using an array as a set
		// is acceptable here because the number of directories to consider
		// is rarely greater than 1 or 2. Also, using indexOf allows us to
		// store File objects instead of strings.
		if (seenDirFiles.indexOf(file) < 0) {
			seenDirFiles.push(file);

			const pkgJsonFile = fileAppendIdPart(file, 'package.json');
			const pkg = pkgJsonFile && fileEvaluate(pkgJsonFile, parentModule);
			let mainFile;
			let resolved = false;

			if (pkg) {
				for (const name of mainFields) {
					const main = pkg[name];
					if (isString(main)) {
						// The "main" field of package.json does not have to begin
						// with ./ to be considered relative, so first we try
						// simply appending it to the directory path before
						// falling back to a full fileResolve, which might return
						// a package from a node_modules directory.
						mainFile = fileAppendId(file, main, extensions) || fileResolve(file, main, parentModule, seenDirFiles);
						if (mainFile) {
							resolved = true;
							break;
						}
					}
				}
			}

			if (resolved && mainFile) {
				file = mainFile;
				recordChild(parentModule, pkgJsonFile);
				// The fileAppendId call above may have returned a directory,
				// so continue the loop to make sure we resolve it to a
				// non-directory file.
				continue;
			}
		}

		// If we didn't find a `package.json` file, or it didn't have a
		// resolvable `.main` property, the only possibility left to
		// consider is that this directory contains an `index.js` module.
		// This assignment almost always terminates the while loop, because
		// there's very little chance `fileIsDirectory(file)` will be true
		// for `fileAppendIdPart(file, "index", extensions)`. However, in
		// principle it is remotely possible that a file called `index.js`
		// could be a directory instead of a file.
		file = fileAppendIdPart(file, 'index', extensions);
	}

	if (file && isString(file.contents)) {
		file = fileResolve(file, file.contents, parentModule, seenDirFiles);
	}

	recordChild(parentModule, file);

	return file;
}

const defaultExtensions = ['.js', '.json'];

function fileGetExtensions(file: File) {
	return file.options?.extensions || defaultExtensions;
}

interface IRequire {
	(id: string): any;
	extensions: string[];
	resolve(id: string): string;
	export?: () => any;
}

function makeRequire(file: File): IRequire {
	const { module } = file;

	const require: IRequire = function require(id: string) {
		return module.require(id);
	};

	require.extensions = fileGetExtensions(file).slice(0);

	require.resolve = function resolve(id: string) {
		return module.resolve(id);
	};

	require.export = function exportFn() {
		return module;
	};

	return require;
}

const hasOwn = {}.hasOwnProperty;

function getOwn<T>(obj: T, key: PropertyKey): unknown {
	if (typeof obj === 'object' && obj !== null) {
		return Reflect.get(obj, key);
	}

	return undefined;
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}

function makeMissingError(id: string) {
	return new Error(`Cannot find module '${id}'`);
}

function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object';
}
function strictHasOwn(obj: unknown, key: unknown) {
	return isObject(obj) && isString(key) && hasOwn.call(obj, key);
}

function fileEvaluate(file: File, parentModule?: Module) {
	const { module } = file;
	if (!strictHasOwn(module, 'exports')) {
		const { contents } = file;
		if (!contents) {
			// If this file was installed with array notation, and the array
			// contained one or more objects but no functions, then the combined
			// properties of the objects are treated as a temporary stub for
			// file.module.exports. This is particularly important for partial
			// package.json modules, so that the resolution logic can know the
			// value of the "main" and/or "browser" fields, at least, even if
			// the rest of the package.json file is not (yet) available.
			if (file.stub) {
				return file.stub;
			}

			throw makeMissingError(module.id);
		}

		if (parentModule) {
			module.parent = parentModule;
			const { children } = parentModule;
			if (Array.isArray(children)) {
				children.push(module);
			}
		}

		if (isFunction(contents)) {
			contents(
				makeRequire(file), // If the file had a .stub, reuse the same object for exports.
				(module.exports = file.stub || {}),
				module,
				file.module.id,
				file.parent?.module.id,
			);
		}

		module.loaded = true;
	}

	// The module.runModuleSetters method will be deprecated in favor of
	// just module.runSetters: https://github.com/benjamn/reify/pull/160
	const runSetters = module.runSetters || module.runModuleSetters;
	if (isFunction(runSetters)) {
		runSetters.call(module);
	}

	return module.exports;
}

function imports(id: string) {
	function from(location: string): boolean {
		if (!id) {
			return false;
		}

		// XXX: removed last part of path so that it does not trigger false positives
		const path = String(id).split('/').slice(0, -1);

		return path.some((subPath) => {
			return subPath === location;
		});
	}

	function fromClientError() {
		return new Error(
			`Unable to import on the server a module from a client directory: "${
				id
			}" \n (cross-boundary import) see: https://guide.meteor.com/structure.html#special-directories`,
		);
	}

	function fromServerError() {
		return new Error(
			`Unable to import on the client a module from a server directory: "${
				id
			}" \n (cross-boundary import) see: https://guide.meteor.com/structure.html#special-directories`,
		);
	}

	return {
		from,
		fromClientError,
		fromServerError,
	};
}

function cannotFindMeteorPackage(id: string) {
	const packageName = id.split('/', 2)[1];
	return new Error(`Cannot find package "${packageName}". Try "meteor add ${packageName}".`);
}

export function verifyErrors(id: string, _parentId: string, err: Error) {
	if (id.startsWith('meteor/')) {
		throw cannotFindMeteorPackage(id);
	}

	if (!(id.startsWith('.') || id.startsWith('/'))) {
		throw err;
	}

	if (imports(id).from('node_modules')) {
		// Problem with node modules
		throw err;
	}

	// custom errors
	if (true && imports(id).from('server')) {
		throw imports(id).fromServerError();
	}

	if (err) {
		throw err;
	}
}

function processArrayContents(file: File, contents: TreeNode[]): TreeNode {
	let moduleFunction: TreeNode = {};
	for (const item of contents) {
		if (isString(item)) {
			file.deps[item] = file.module.id;
		} else if (isFunction(item)) {
			moduleFunction = item;
		} else if (isObject(item)) {
			file.stub = file.stub || {};
			each(item, (value, key) => {
				file.stub[key] = value;
			});
		}
	}

	return moduleFunction;
}

function getOrCreateChild(file: File, dirContents: Record<string, unknown>, key: string, options: { extensions?: string[] }): File | null {
	if (key === '..') {
		return file.parent;
	}

	let child = getOwn(dirContents, key) as File | undefined;

	if (!child) {
		const childId = file.module.id.replace(/\/*$/, '/') + key;
		child = new File(childId, file);
		child.options = options;
		dirContents[key] = child;
	}

	return child;
}

function fileMergeContents(file: File, contents: TreeNode, options: { extensions?: string[] }) {
	let normalizedContents: TreeNode | null = contents;

	if (Array.isArray(contents)) {
		normalizedContents = processArrayContents(file, contents);
	} else if (!isFunction(contents) && !isString(contents) && !isObject(contents)) {
		// If contents is neither an array nor a function nor a string nor
		// an object, just give up and merge nothing.
		normalizedContents = null;
	}

	if (normalizedContents) {
		file.contents = (file.contents || (isObject(normalizedContents) ? {} : normalizedContents)) as any;
		if (isObject(normalizedContents) && fileIsDirectory(file)) {
			const dirContents = file.contents as unknown as Record<string, unknown>;
			each(normalizedContents, (value, key) => {
				const child = getOrCreateChild(file, dirContents, key, options);
				if (child) {
					fileMergeContents(child, value as any, options);
				}
			});
		}
	}
}

const rootRequire = makeRequire(root);

export function meteorInstall<const T extends TreeNode>(tree: T, options: { extensions?: string[] } = {}): IRequire {
	if (isObject(tree)) {
		fileMergeContents(root, tree, options);
	}
	return rootRequire;
}

Package['modules-runtime'] = {
	meteorInstall,
	verifyErrors,
};
