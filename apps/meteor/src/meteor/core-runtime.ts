import { Package } from './package-registry.ts';

const pending: { name: string; runImage: () => any }[] = [];
export function queue(name: string | null, runImage: () => any) {
	if (name === null) {
		// Special case to queue a callback when all linked packages are loaded
		if (pending.length === 0 && !isProcessing) {
			// All packages are already loaded
			runImage();
		} else {
			// Queue the callback to run when all packages are loaded
			pending.push({ name: '__callback__', runImage });
		}
		return;
	}
	pending.push({ name, runImage });
	processNext();
}

let isProcessing = false;
function processNext() {
	if (isProcessing) {
		return;
	}

	const next = pending.shift();
	if (!next) {
		return;
	}

	isProcessing = true;

	const config = next.runImage();
	runEagerModules(config, (mainModuleExports) => {
		// Get the exports after the eager code has been run
		const exports = config.export ? config.export() : {};
		if (config.mainModulePath) {
			Package._define(next.name, mainModuleExports, exports);
		} else {
			Package._define(next.name, exports);
		}

		isProcessing = false;
		processNext();
	});
}

function runEagerModules(
	config: { eagerModulePaths: string[]; mainModulePath?: string; require: (path: string) => any; export?: () => any },
	callback: (mainModuleExports?: any) => void,
) {
	if (!config.eagerModulePaths) {
		return callback();
	}

	let index = -1;
	let mainExports = {};
	let mainModuleAsync = false;

	function evaluateNextModule() {
		index += 1;
		if (index === config.eagerModulePaths.length) {
			if (mainModuleAsync) {
				// Now that the package has loaded, mark the main module as sync
				// This allows other packages and the app to `require` the package
				// and for it to work the same, regardless of if it uses TLA or not
				// XXX: this is a temporary hack until we find a better way to do this
				// const reify = config.require('/node_modules/meteor/modules/node_modules/@meteorjs/reify/lib/runtime');
				// reify._requireAsSync(config.mainModulePath);
			}

			return callback(mainExports);
		}

		const path = config.eagerModulePaths?.[index];
		const exports = config.require(path);
		if (checkAsyncModule(exports)) {
			if (path === config.mainModulePath) {
				mainModuleAsync = true;
			}

			// Is an async module
			exports
				.then((exports) => {
					if (path === config.mainModulePath) {
						mainExports = exports;
					}
					evaluateNextModule();
				})
				// This also handles errors in modules and packages loaded sync
				// afterwards since they are run within the `.then`.
				.catch((error) => {
					if (typeof process === 'object' && typeof process.nextTick === 'function') {
						// Is node.js
						process.nextTick(() => {
							throw error;
						});
					} else {
						// TODO: is there a faster way to throw the error?
						setTimeout(() => {
							throw error;
						}, 0);
					}
				});
		} else {
			if (path === config.mainModulePath) {
				mainExports = exports;
			}
			evaluateNextModule();
		}
	}

	evaluateNextModule();
}

function checkAsyncModule(exports: unknown): exports is Promise<any> {
	const potentiallyAsync = exports && typeof exports === 'object' && Object.hasOwn(exports, '__reifyAsyncModule');

	if (!potentiallyAsync) {
		return false;
	}

	return 'then' in exports && typeof exports.then === 'function';
}

// For this to be accurate, all linked files must be queued before calling this
// If all are loaded, returns null. Otherwise, returns a promise
export function waitUntilAllLoaded() {
	if (pending.length === 0 && !isProcessing) {
		// All packages are loaded
		// If there were no async packages, then there might not be a promise
		// polyfill loaded either, so we don't create a promise to return
		return null;
	}

	return new Promise<void>((resolve) => {
		queue(null, () => {
			resolve();
			return {};
		});
	});
}
