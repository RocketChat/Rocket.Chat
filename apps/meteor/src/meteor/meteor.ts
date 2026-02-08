import { Package } from './package-registry.ts';
import { hasOwn } from './utils/hasOwn.ts';

// --- Types & Interfaces ---

type MeteorRuntimeConfig = {
	meteorRelease?: string;
	NODE_ENV?: string;
	PUBLIC_SETTINGS?: Record<string, unknown>;
	ROOT_URL?: string;
	ROOT_URL_PATH_PREFIX?: string;
	gitCommitHash?: string;
	isModern?: boolean;
	debug?: boolean;
	noDeprecation?: boolean | string;
	meteorEnv: {
		NODE_ENV: string;
		[key: string]: unknown;
	};
};

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention, no-var
	var __meteor_runtime_config__: MeteorRuntimeConfig;
	// eslint-disable-next-line no-var
	var meteorEnv: MeteorRuntimeConfig['meteorEnv'];
}

// Ensure global environment existence
const globalScope = globalThis;
const config = typeof __meteor_runtime_config__ === 'object' ? __meteor_runtime_config__ : ({} as MeteorRuntimeConfig);
const { meteorEnv } = config;

// --- Meteor Error Class ---

class MeteorError extends Error {
	public error: string | number;

	public reason?: string;

	public details?: string | undefined;

	public isClientSafe = true;

	public errorType = 'Meteor.Error';

	constructor(error: string | number, reason?: string, details?: string | undefined) {
		super();
		this.error = error;
		this.reason = reason;
		this.details = details;

		// Set message safely after super()
		if (this.reason) {
			this.message = `${this.reason} [${this.error}]`;
		} else {
			this.message = `[${this.error}]`;
		}
	}

	public clone(): MeteorError {
		return new MeteorError(this.error, this.reason, this.details);
	}
}

// --- Environment Variable (Fiber-like Context) ---

let nextSlot = 0;
let currentValues: unknown[] = [];
let callAsyncMethodRunning = false;

class EnvironmentVariable<T> {
	private readonly slot: number;

	constructor() {
		this.slot = nextSlot++;
	}

	public get(): T | undefined {
		return currentValues[this.slot] as T;
	}

	public getOrNullIfOutsideFiber(): T | undefined {
		return this.get();
	}

	public withValue<R>(value: T, func: () => R): R {
		const saved = currentValues[this.slot];
		try {
			currentValues[this.slot] = value;
			return func();
		} finally {
			currentValues[this.slot] = saved;
		}
	}

	public _set(value: T): void {
		currentValues[this.slot] = value;
	}

	public _setNewContextAndGetCurrent(value: T): unknown {
		const saved = currentValues[this.slot];
		this._set(value);
		return saved;
	}

	public static _isCallAsyncMethodRunning(): boolean {
		return callAsyncMethodRunning;
	}

	public static _setCallAsyncMethodRunning(value: boolean): void {
		callAsyncMethodRunning = value;
	}

	public static getCurrentValues(): unknown[] {
		return currentValues;
	}
}

// --- Queues ---

class FakeDoubleEndedQueue {
	private queue: unknown[] = [];

	push(task: unknown): void {
		this.queue.push(task);
	}

	shift(): unknown {
		return this.queue.shift();
	}

	isEmpty(): boolean {
		return this.queue.length === 0;
	}
}

class SynchronousQueue {
	private _tasks: Array<() => void> = [];

	private _running = false;

	private _runTimeout: number | null = null;

	public runTask(task: () => void): void {
		if (!this.safeToRunTask()) {
			throw new Error('Could not synchronously run a task from a running task');
		}

		this._tasks.push(task);
		const tasks = this._tasks;
		this._tasks = [];
		this._running = true;

		if (this._runTimeout) {
			clearTimeout(this._runTimeout);
			this._runTimeout = null;
		}

		try {
			while (tasks.length > 0) {
				const t = tasks.shift();
				try {
					t?.();
				} catch (e) {
					if (tasks.length === 0) throw e;
					Meteor._debug('Exception in queued task', e);
				}
			}
		} finally {
			this._running = false;
		}
	}

	public queueTask(task: () => void): void {
		this._tasks.push(task);
		if (!this._runTimeout) {
			this._runTimeout = setTimeout(() => this.flush(), 0) as unknown as number;
		}
	}

	public flush(): void {
		this.runTask(() => {});
	}

	public drain(): void {
		if (!this.safeToRunTask()) return;
		while (this._tasks.length > 0) {
			this.flush();
		}
	}

	public safeToRunTask(): boolean {
		return !this._running;
	}
}

// --- Utilities & Polyfills ---

const _setImmediate = ((): ((fn: () => void) => void) => {
	let postMessageIsAsynchronous = true;
	const oldOnMessage = globalScope.onmessage;
	globalScope.onmessage = () => {
		postMessageIsAsynchronous = false;
	};
	globalScope.postMessage('', '*');
	globalScope.onmessage = oldOnMessage;

	if (!postMessageIsAsynchronous) {
		const useTimeout = (fn: () => void) => setTimeout(fn, 0);
		useTimeout.implementation = 'setTimeout';
		return useTimeout;
	}

	let funcIndex = 0;
	const funcs: Record<number, () => void> = {};
	const MESSAGE_PREFIX = `Meteor._setImmediate.${Math.random()}.`;

	globalScope.addEventListener(
		'message',
		(event: MessageEvent) => {
			if (event.source === globalScope && typeof event.data === 'string' && event.data.startsWith(MESSAGE_PREFIX)) {
				const index = parseInt(event.data.substring(MESSAGE_PREFIX.length), 10);
				try {
					if (funcs[index]) funcs[index]();
				} finally {
					delete funcs[index];
				}
			}
		},
		false,
	);

	const usePostMessage = (fn: () => void) => {
		++funcIndex;
		funcs[funcIndex] = fn;
		globalScope.postMessage(MESSAGE_PREFIX + funcIndex, '*');
	};
	// @ts-expect-error - legacy implementation flag
	usePostMessage.implementation = 'postMessage';
	return usePostMessage;
})();

// --- Main Meteor Object ---

const Meteor = {
	isProduction: meteorEnv.NODE_ENV === 'production',
	isDevelopment: meteorEnv.NODE_ENV !== 'production',
	isClient: true,
	isServer: false,
	isCordova: false,
	isModern: config.isModern,
	gitCommitHash: config.gitCommitHash,
	settings: config.PUBLIC_SETTINGS ? { public: config.PUBLIC_SETTINGS } : {},
	release: config.meteorRelease,

	// Flags
	isFibersDisabled: true,
	isTest: false,
	isAppTest: false,
	isPackageTest: false,
	isDebug: true ? typeof window === 'object' && !!config.debug : !!config.debug,

	// Classes
	Error: MeteorError,
	EnvironmentVariable,
	_SynchronousQueue: SynchronousQueue,
	// @ts-expect-error - Conditionally loaded
	_DoubleEndedQueue: false ? Npm.require('denque') : FakeDoubleEndedQueue,

	// Internal methods
	_setImmediate,

	_get(obj: any, ...keys: (string | number)[]): any {
		let current = obj;
		for (const key of keys) {
			if (current == null || !(key in current)) return undefined;
			current = current[key];
		}
		return current;
	},

	_ensure(obj: any, ...keys: (string | number)[]): any {
		let current = obj;
		for (const key of keys) {
			if (!(key in current)) current[key] = {};
			current = current[key];
		}
		return current;
	},

	_delete(obj: any, ...keys: (string | number)[]): void {
		const stack: any[] = [obj];
		let leaf = true;
		for (let i = 0; i < keys.length - 1; i++) {
			const key = keys[i];
			if (!(key in stack[stack.length - 1])) {
				leaf = false;
				break;
			}
			const next = stack[stack.length - 1][key];
			if (typeof next !== 'object' || next === null) break;
			stack.push(next);
		}
		for (let i = stack.length - 1; i >= 0; i--) {
			const key = keys[i];
			if (leaf) {
				leaf = false;
			} else {
				for (const _other in stack[i][key]) return;
			}
			delete stack[i][key];
		}
	},

	_inherits(Child: any, Parent: any): any {
		for (const key in Parent) {
			if (hasOwn(Parent, key)) {
				Child[key] = Parent[key];
			}
		}
		// FIX: Use a standard function instead of a class for the Middle constructor.
		// ES6 Classes have read-only prototypes, which causes the TypeError.
		const Middle = function (this: any) {
			this.constructor = Child;
		} as unknown as { new (): any };

		Middle.prototype = Parent.prototype;
		Child.prototype = new Middle();
		Child.__super__ = Parent.prototype;
		return Child;
	},

	makeErrorType(name: string, constructor: Function) {
		// FIX: Use 'class extends' natively. Do NOT call _inherits on this class,
		// as it would try to overwrite the read-only class prototype.
		class ErrorClass extends Error {
			public errorType: string;

			public name: string;

			[key: string]: any;

			constructor(...args: any[]) {
				super();
				// Mimic legacy captureStackTrace behavior
				if (Error.captureStackTrace) {
					Error.captureStackTrace(this, ErrorClass);
				} else {
					this.stack = new Error().stack;
				}

				this.errorType = name;
				this.name = name;

				// Apply the user-supplied constructor function
				constructor.apply(this, args);
			}
		}

		// Don't call _inherits(ErrorClass, Error) here; extends handles it.
		return ErrorClass;
	},

	// Async / Promises

	promisify(fn: Function, context?: any, errorFirst = true) {
		return function (this: any, ...args: any[]) {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const self = this;
			const filteredArgs = args.filter((i) => i !== undefined);

			return new Promise((resolve, reject) => {
				const callback = Meteor.bindEnvironment((error: any, result: any) => {
					let _error = error;
					let _result = result;

					if (!errorFirst) {
						_error = result;
						_result = error;
					}

					if (_error) return reject(_error);
					resolve(_result);
				});

				filteredArgs.push(callback);
				return fn.apply(context || self, filteredArgs);
			});
		};
	},

	wrapAsync(fn: Function, context?: any) {
		return function (this: any, ...args: any[]) {
			const self = context || this;
			let callback: Function | undefined;

			for (let i = args.length - 1; i >= 0; --i) {
				const arg = args[i];
				if (arg !== undefined) {
					if (typeof arg === 'function') {
						callback = arg;
					}
					break;
				}
			}

			if (!callback) {
				callback = logErr;
				args.push(undefined);
			}

			const callbackIndex = args.indexOf(callback);
			const boundCallback = Meteor.bindEnvironment(callback!);

			if (callbackIndex !== -1) {
				args[callbackIndex] = boundCallback;
			} else {
				args.push(boundCallback);
			}

			return fn.apply(self, args);
		};
	},

	_wrapAsync(fn: Function, context?: any) {
		if (!warnedAboutWrapAsync) {
			Meteor._debug('Meteor._wrapAsync has been renamed to Meteor.wrapAsync');
			warnedAboutWrapAsync = true;
		}
		return Meteor.wrapAsync(fn, context);
	},

	wrapFn(fn: Function) {
		return fn;
	},

	_sleepForMs(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	},

	sleep(ms: number) {
		return Meteor._sleepForMs(ms);
	},

	_noYieldsAllowed(f: () => any) {
		const result = f();
		if (Meteor._isPromise(result)) {
			throw new Error('function is a promise when calling Meteor._noYieldsAllowed');
		}
		return result;
	},

	_isPromise(r: any): boolean {
		return !!r && typeof r.then === 'function';
	},

	_runFresh(fn: () => any) {
		return fn();
	},

	// Environment & Binding

	bindEnvironment<T extends Function>(func: T, onException?: ((e: any) => void) | string, _this?: any): T {
		const boundValues = currentValues.slice();

		if (!onException || typeof onException === 'string') {
			const description = onException || 'callback of async function';
			onException = (error: any) => {
				Meteor._debug(`Exception in ${description}:`, error);
			};
		}

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		return function (this: any, ...args: any[]) {
			const savedValues = currentValues;
			let ret;
			try {
				currentValues = boundValues;
				ret = func.apply(_this ?? this, args);
			} catch (e) {
				(onException as (e: any) => void)(e);
			} finally {
				currentValues = savedValues;
			}
			return ret;
		} as unknown as T;
	},

	// Timers

	setTimeout(f: Function, duration: number) {
		return setTimeout(bindAndCatch('setTimeout callback', f), duration);
	},

	setInterval(f: Function, duration: number) {
		return setInterval(bindAndCatch('setInterval callback', f), duration);
	},

	clearInterval(x: any) {
		return clearInterval(x);
	},

	clearTimeout(x: any) {
		return clearTimeout(x);
	},

	defer(f: Function) {
		Meteor._setImmediate(bindAndCatch('defer callback', f));
	},

	// Logging

	_debug(...args: unknown[]) {
		if (suppress > 0) {
			suppress--;
			return;
		}
		if (typeof console !== 'undefined' && console.log) {
			if (args.length === 0) {
				console.log('');
			} else {
				const allStrings = args.every((a) => typeof a === 'string');
				if (allStrings) {
					console.log(args.join(' '));
				} else {
					console.log(...args);
				}
			}
		}
	},

	_suppress_log(count: number) {
		suppress += count;
	},

	_suppressed_log_expected() {
		return suppress !== 0;
	},

	_escapeRegExp(string: string) {
		return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	},

	// Deprecation

	deprecate(...args: any[]) {
		if (typeof console === 'undefined' || !console.warn) return;

		const stackTrace = cleanStackTrace(new Error().stack || '');

		if (config.noDeprecation) {
			if (typeof config.noDeprecation === 'string') {
				const pattern = new RegExp(config.noDeprecation);
				if (pattern.test(stackTrace)) {
					onceFixDeprecation();
					return;
				}
			} else if (config.noDeprecation === true) {
				onceFixDeprecation();
				return;
			}
		}

		const messages = [...args];
		if (stackTrace.length > 0) {
			messages.push('\n\nTrace:\n', stackTrace);
		}
		messages.push('\n\nTo disable warnings, set the `METEOR_NO_DEPRECATION` to `true` or a regex pattern.\n');

		onceWarning(['[DEPRECATION]', ...messages]);
	},

	// Startup

	startup(callback: () => void) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const docEl = document.documentElement as any;
		const doScroll = !document.addEventListener && docEl.doScroll;

		if (!doScroll || window !== top) {
			if (isReady) callback();
			else callbackQueue.push(callback);
		} else {
			try {
				doScroll('left');
			} catch (error) {
				setTimeout(() => Meteor.startup(callback), 50);
				return;
			}
			callback();
		}
	},

	// URL generation

	absoluteUrl(path?: string | Record<string, any>, options?: { rootUrl?: string; secure?: boolean; replaceLocalhost?: boolean }) {
		if (typeof path === 'object' && !options) {
			options = path;
			path = undefined;
		}

		const opts = { ...Meteor.absoluteUrl.defaultOptions, ...options };
		let url = opts.rootUrl;

		if (!url) throw new Error('Must pass options.rootUrl or set ROOT_URL in the server environment');
		if (!/^http[s]?:\/\//i.test(url)) url = `http://${url}`;
		if (!url.endsWith('/')) url += '/';

		if (path) {
			if (typeof path === 'string') {
				url += path.replace(/^\/+/, '');
			}
		}

		if (opts.secure && /^http:/.test(url) && !/http:\/\/localhost[:\/]/.test(url) && !/http:\/\/127\.0\.0\.1[:\/]/.test(url)) {
			url = url.replace(/^http:/, 'https:');
		}

		if (opts.replaceLocalhost) {
			url = url.replace(/^http:\/\/localhost([:\/].*)/, 'http://127.0.0.1$1');
		}

		return url;
	},

	_relativeToSiteRootUrl(link: string) {
		if (config.ROOT_URL_PATH_PREFIX && link.startsWith('/')) {
			return config.ROOT_URL_PATH_PREFIX + link;
		}
		return link;
	},
};

// Initialize default options for absoluteUrl
Meteor.absoluteUrl.defaultOptions = {} as { rootUrl?: string; secure?: boolean; replaceLocalhost?: boolean };
if (config.ROOT_URL) {
	Meteor.absoluteUrl.defaultOptions.rootUrl = config.ROOT_URL;
} else if (typeof location !== 'undefined' && location.protocol && location.host) {
	Meteor.absoluteUrl.defaultOptions.rootUrl = `${location.protocol}//${location.host}`;
}
if (typeof location !== 'undefined' && location.protocol === 'https:') {
	Meteor.absoluteUrl.defaultOptions.secure = true;
}

// --- Internal Helpers ---

let warnedAboutWrapAsync = false;
let suppress = 0;

function logErr(err: any) {
	if (err) {
		return Meteor._debug('Exception in callback of async function', err);
	}
}

function withoutInvocation(f: () => void): () => void {
	return f;
}

function bindAndCatch(context: string, f: () => void): () => void {
	return Meteor.bindEnvironment(withoutInvocation(f), context);
}

function oncePerArgument(func: Function) {
	const cache = new Map();
	return function (this: any, ...args: any[]) {
		const key = JSON.stringify(args);
		if (!cache.has(key)) {
			const result = func.apply(this, args);
			cache.set(key, result);
		}
		return cache.get(key);
	};
}

const onceWarning = oncePerArgument((messages: any[]) => {
	if (console && console.warn) console.warn(...messages);
});

function onceFixDeprecation() {
	onceWarning([
		'Deprecation warnings are hidden but crucial to address for future Meteor updates.',
		'\n',
		'Remove the `METEOR_NO_DEPRECATION` env var to reveal them, then report or fix the issues.',
	]);
}

function cleanStackTrace(stackTrace: string): string {
	if (!stackTrace) return '';
	const lines = stackTrace.split('\n');
	const trace = [];

	try {
		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed.includes('Meteor.deprecate')) continue;
			if (trimmed.includes('packages/') || trimmed.includes('/')) {
				trace.push(trimmed);
				if (!trimmed.includes('packages/')) break;
			}
		}
	} catch (e) {
		console.error('Error cleaning stack trace: ', e);
	}
	return trace.join('\n');
}

// --- Startup Logic ---

const callbackQueue: Array<() => void> = [];
let isLoadingCompleted = false;
let eagerCodeRan = false;
let isReady = false;
const readyHoldsCount = 0;

const maybeReady = function () {
	if (isReady || !eagerCodeRan || readyHoldsCount > 0) return;
	isReady = true;
	while (callbackQueue.length) {
		const cb = callbackQueue.shift();
		if (cb) cb();
	}
};

function waitForEagerAsyncModules() {
	function finish() {
		eagerCodeRan = true;
		maybeReady();
	}

	const potentialPromise = Package['core-runtime']?.waitUntilAllLoaded();
	if (potentialPromise && typeof potentialPromise.then === 'function') {
		potentialPromise.then(finish);
	} else {
		finish();
	}
}

const loadingCompleted = function () {
	if (isLoadingCompleted) return;
	isLoadingCompleted = true;
	waitForEagerAsyncModules();
};

if (typeof document !== 'undefined') {
	if (document.readyState === 'complete') {
		window.setTimeout(loadingCompleted);
	} else {
		document.addEventListener('DOMContentLoaded', loadingCompleted, false);
		window.addEventListener('load', loadingCompleted, false);
	}
}

export { Meteor, globalScope as global, meteorEnv };

Package.meteor = {
	Meteor,
	global: globalScope,
	meteorEnv,
};
