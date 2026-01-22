// Resolver for Meteor packages to extract main entry points
import vm from 'node:vm';

type PackageOptions = {
	summary?: string | undefined;
	version?: string | undefined;
	name?: string | undefined;
	git?: string | undefined;
	documentation?: string | undefined;
	debugOnly?: boolean | undefined;
	prodOnly?: boolean | undefined;
	testOnly?: boolean | undefined;
};

type BuildPluginOptions = {
	name?: string | undefined;
	use?: string | string[] | undefined;
	sources?: string[] | undefined;
	npmDependencies?: object | undefined;
};

type Package = {
	describe(options: PackageOptions): void;

	onTest(func: (api: PackageAPI) => void): void;

	onUse(func: (api: PackageAPI) => void): void;

	registerBuildPlugin(options?: BuildPluginOptions): void;
};

type PackageAPI = {
	mainModule(file: string, where?: string | string[]): void;
	addAssets(filenames: string | string[], architecture: string | string[]): void;
	addFiles(filenames: string | string[], architecture?: string | string[], options?: { bare?: boolean | undefined }): void;
	export(exportedObjects: string | string[], architecture?: string | string[], exportOptions?: object, testOnly?: boolean): void;
	imply(packageNames: string | string[], architecture?: string | string[]): void;
	use(
		packageNames: string | string[],
		architecture?: string | string[],
		options?: {
			weak?: boolean | undefined;
			unordered?: boolean | undefined;
		},
	): void;
	versionsFrom(meteorRelease: string | string[]): void;
};

type ResolvedPackage = {
	mainModules: { file: string; where?: string | string[] }[];
	config: PackageOptions;
	use: string[];
	exports: {
		symbols: string[];
		where?: string | string[];
	}[];
	files: {
		filenames: string[];
		architecture?: string | string[] | undefined;
		options?:
			| {
					bare?: boolean | undefined;
			  }
			| undefined;
	}[];
	assets: {
		filenames: string[];
		architecture: string | string[];
	}[];
	imply: {
		packageNames: string[];
		architecture?: string | string[] | undefined;
	}[];
	versionsFrom: string[];
};

/**
 * Extracts the main entry point(s) from a Meteor package.js source code.
 *
 * @param source The source code of the package.js file.
 * @returns An array of main module paths and their target environments, or null if none found.
 */
export async function resolvePackage(source: string) {
	const result: ResolvedPackage = {
		mainModules: [],
		config: {},
		use: [],
		exports: [],
		files: [],
		assets: [],
		imply: [],
		versionsFrom: [],
	};
	const Package: Package = {
		describe(options) {
			Object.assign(result.config, options);
		},
		onUse(fn) {
			const api: PackageAPI = {
				// The call we care about: capture the declared main module
				mainModule(file, where) {
					result.mainModules.push({ file, where });
				},
				// Commonly used Meteor package API methods – implemented as no-ops
				use(pkg) {
					result.use.push(...(Array.isArray(pkg) ? pkg : [pkg]));
				},
				addFiles(filenames, architecture, options) {
					result.files.push({ filenames: Array.isArray(filenames) ? filenames : [filenames], architecture, options });
				},
				addAssets(filenames, architecture) {
					result.assets.push({ filenames: Array.isArray(filenames) ? filenames : [filenames], architecture });
				},
				export(symbols, where) {
					result.exports.push({
						symbols: Array.isArray(symbols) ? symbols : [symbols],
						where,
					});
				},
				imply(packageNames, architecture) {
					result.imply.push({ packageNames: Array.isArray(packageNames) ? packageNames : [packageNames], architecture });
				},
				versionsFrom(meteorRelease) {
					result.versionsFrom.push(...(Array.isArray(meteorRelease) ? meteorRelease : [meteorRelease]));
				},
			};

			try {
				fn(api);
			} catch {
				// Ignore errors thrown inside Package.onUse callbacks –
				// they are not relevant for locating mainModule.
			}
		},
		onTest(_fn) {
			// Tests do not affect the runtime main entry point
		},
		registerBuildPlugin(_options) {
			// no-op: not needed for entry point resolution
		},
	};

	// Minimal stub for the Meteor Npm API used in some package.js files
	const Npm = {
		depends(_deps: Record<string, string>) {
			// no-op: dependency metadata is not needed for main module discovery
		},
		strip(_rules: unknown) {
			// no-op: we don't actually bundle npm modules here
		},
	};

	const sandbox = vm.createContext({
		Package,
		Npm,
		console,
		module: {},
		exports: {},
		require: undefined,
		process: undefined,
		global: {},
		globalThis: {},
	});

	try {
		vm.runInContext(source, sandbox, {
			filename: 'package.js',
			displayErrors: true,
			timeout: 1000,
		});
	} catch (error) {
		console.warn('[meteor-resolver] Failed to execute package.js in VM:', error);
	}

	return result;
}
