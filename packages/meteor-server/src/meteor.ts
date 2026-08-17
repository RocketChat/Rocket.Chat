import { AsyncLocalStorage } from 'node:async_hooks';

import { MethodInvocation } from '@rocket.chat/meteor-client/ddp-common';

type Callback = (...args: any[]) => void;

type AslStore = {
	dynamics?: unknown[];
	[key: string]: unknown;
};

const asl = new AsyncLocalStorage<AslStore>();

export const _getAsl = (): AsyncLocalStorage<AslStore> => asl;
export const _getAslStore = (): AslStore | undefined => asl.getStore();
export const _getValueFromAslStore = (key: string): unknown => asl.getStore()?.[key];
export const _updateAslStore = (key: string, value: unknown): void => {
	const store = asl.getStore();
	if (store) store[key] = value;
};

let nextSlot = 0;
let callAsyncMethodRunning = false;

/** Dynamic scoping over AsyncLocalStorage — port of meteor/dynamics_nodejs.js */
export class EnvironmentVariable<T = unknown> {
	private readonly slot: number;

	constructor() {
		this.slot = nextSlot++;
	}

	public get(): T | undefined {
		const store = asl.getStore();
		if (store?.dynamics) {
			return store.dynamics[this.slot] as T;
		}
	}

	public getOrNullIfOutsideFiber(): T | undefined {
		return this.get();
	}

	public withValue<R>(value: T, func: () => R, options?: Record<string, unknown>): R {
		const store = asl.getStore();
		const dynamics = store?.dynamics ? store.dynamics.slice() : [];
		dynamics[this.slot] = value;

		const newStore: AslStore = { dynamics };
		if (options) Object.assign(newStore, options);

		return asl.run(newStore, func);
	}

	public _set(value: T): void {
		const dynamics = (asl.getStore()?.dynamics as unknown[]) || [];
		dynamics[this.slot] = value;
	}

	public _setNewContextAndGetCurrent(value: T): T {
		const dynamics = (asl.getStore()?.dynamics as unknown[]) || [];
		const saved = dynamics[this.slot];
		dynamics[this.slot] = value;
		return saved as T;
	}

	public _isCallAsyncMethodRunning(): boolean {
		return callAsyncMethodRunning;
	}

	public _setCallAsyncMethodRunning(value: boolean): void {
		callAsyncMethodRunning = value;
	}
}

export class MeteorError extends Error {
	public error: string | number;

	public reason?: string | undefined;

	public details?: unknown;

	public isClientSafe = true;

	public errorType = 'Meteor.Error';

	constructor(error: string | number, reason?: string | undefined, details?: unknown) {
		super();
		this.name = 'Meteor.Error';
		this.error = error;
		this.reason = reason;
		this.details = details;
		if (this.reason) {
			this.message = `${this.reason} [${this.error}]`;
		} else {
			this.message = `[${this.error}]`;
		}
	}

	public clone(): MeteorError {
		return new MeteorError(this.error, this.reason, this.details as string | undefined);
	}
}

/** Port of Meteor.makeErrorType (meteor/errors.js) */
export function makeErrorType<TArgs extends any[]>(name: string, constructor: (this: any, ...args: TArgs) => void): any {
	const errorClass = function (this: any, ...args: TArgs) {
		this.errorType = name;
		constructor.apply(this, args);
		if (!this.message) this.message = name;
		const err = new Error(this.message);
		this.stack = err.stack;
	};
	errorClass.prototype = Object.create(Error.prototype);
	errorClass.prototype.constructor = errorClass;
	errorClass.prototype.name = name;
	return errorClass;
}

// ---------------------------------------------------------------------------
// Method / publication invocation context
// ---------------------------------------------------------------------------

export const currentMethodInvocation = new EnvironmentVariable<MethodInvocation | null>();
export const currentPublicationInvocation = new EnvironmentVariable<any>();

type MethodHandler = (this: MethodInvocation, ...args: any[]) => any;
type PublishHandler = (this: any, ...args: any[]) => any;

// Plain objects keyed by name, matching Meteor's Server (livedata_server.js);
// app code reaches into them directly, e.g.
// `Meteor.server.publish_handlers.meteor_autoupdate_clientVersions.call(...)`
const methodHandlers: Record<string, MethodHandler> = Object.create(null);
const publishHandlers: Record<string, PublishHandler> = Object.create(null);

// accounts-base installs the real user loader (Meteor.users.findOneAsync)
let userLoader: ((userId: string) => Promise<unknown>) | undefined;
export const _setUserLoader = (loader: (userId: string) => Promise<unknown>): void => {
	userLoader = loader;
};

const connectionCallbacks: Array<(connection: unknown) => void> = [];
/** The DDP layer calls this for each new session so Meteor.onConnection callbacks fire. */
export const _emitConnection = (connection: unknown): void => {
	for (const callback of connectionCallbacks) {
		callback(connection);
	}
};

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

const startupCallbacks: Array<() => void | Promise<void>> = [];
let startupRan = false;

/** Called by the server entrypoint once the module graph is loaded (Meteor runs these after eager load). */
export const runStartupCallbacks = async (): Promise<void> => {
	startupRan = true;
	while (startupCallbacks.length) {
		const callback = startupCallbacks.shift();
		if (callback) await callback();
	}
};

// ---------------------------------------------------------------------------
// Settings / absoluteUrl
// ---------------------------------------------------------------------------

const parseSettings = (): Record<string, any> => {
	const raw = process.env.METEOR_SETTINGS;
	if (!raw) return { public: {} };
	try {
		const settings = JSON.parse(raw);
		settings.public ??= {};
		return settings;
	} catch (e) {
		throw new Error(`METEOR_SETTINGS are not valid JSON: ${(e as Error).message}`);
	}
};

/**
 * Meteor injects `__meteor_runtime_config__` as a server global; app code reads
 * (and in configureBoilerplate's case writes) it directly rather than importing
 * it, so install it as a side effect of loading this module.
 */
export type MeteorRuntimeConfig = {
	ROOT_URL?: string;
	ROOT_URL_PATH_PREFIX: string;
	meteorRelease?: string;
	gitCommitHash?: string;
	autoupdate?: unknown;
	appId?: string;
	PUBLIC_SETTINGS?: Record<string, unknown>;
	meteorEnv: Record<string, unknown>;
};

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention, no-var
	var __meteor_runtime_config__: MeteorRuntimeConfig;
}

globalThis.__meteor_runtime_config__ ??= {
	ROOT_URL: process.env.ROOT_URL,
	ROOT_URL_PATH_PREFIX: process.env.ROOT_URL_PATH_PREFIX ?? '',
	meteorRelease: 'METEOR@none',
	gitCommitHash: process.env.GIT_COMMIT_HASH,
	appId: process.env.APP_ID,
	PUBLIC_SETTINGS: {},
	meteorEnv: { NODE_ENV: process.env.NODE_ENV },
};

type AbsoluteUrlOptions = { rootUrl?: string; secure?: boolean; replaceLocalhost?: boolean };

const absoluteUrl = (() => {
	function absoluteUrl(path?: string | AbsoluteUrlOptions, options?: AbsoluteUrlOptions): string {
		if (typeof path === 'object' && !options) {
			options = path;
			path = undefined;
		}

		const opts = { ...absoluteUrl.defaultOptions, ...options };
		let url = opts.rootUrl;

		if (!url) throw new Error('Must pass options.rootUrl or set ROOT_URL in the server environment');
		if (!/^http[s]?:\/\//i.test(url)) url = `http://${url}`;
		if (!url.endsWith('/')) url += '/';

		if (path && typeof path === 'string') {
			url += path.replace(/^\/+/, '');
		}

		if (opts.secure && /^http:/.test(url) && !/http:\/\/localhost[:/]/.test(url) && !/http:\/\/127\.0\.0\.1[:/]/.test(url)) {
			url = url.replace(/^http:/, 'https:');
		}

		if (opts.replaceLocalhost) {
			url = url.replace(/^http:\/\/localhost([:/].*)/, 'http://127.0.0.1$1');
		}

		return url;
	}

	absoluteUrl.defaultOptions = {
		rootUrl: process.env.ROOT_URL,
		secure: false,
	} as AbsoluteUrlOptions;

	return absoluteUrl;
})();

// ---------------------------------------------------------------------------
// Meteor namespace
// ---------------------------------------------------------------------------

const bindEnvironment = <T extends (...args: any[]) => any>(func: T, onException?: ((e: any) => void) | string, _this?: any): T => {
	const store = asl.getStore();
	const dynamics = store?.dynamics ? store.dynamics.slice() : [];

	if (!onException || typeof onException === 'string') {
		const description = onException || 'callback of async function';
		onException = (error: any) => {
			Meteor._debug(`Exception in ${description}:`, error);
		};
	} else if (typeof onException !== 'function') {
		throw new Error('onException argument must be a function, string or undefined for Meteor.bindEnvironment().');
	}

	return function (this: any, ...args: any[]) {
		return asl.run({ dynamics }, () => {
			let ret;
			try {
				ret = func.apply(_this ?? this, args);
				if (ret && typeof ret.then === 'function') {
					ret = ret.catch(onException);
				}
			} catch (e) {
				(onException as (e: any) => void)(e);
			}
			return ret;
		});
	} as unknown as T;
};

const applyAsync = async (name: string, args: any[]): Promise<any> => {
	const handler = methodHandlers[name];
	if (!handler) {
		throw new MeteorError(404, `Method '${name}' not found`);
	}

	const enclosing = currentMethodInvocation.get();
	const invocation = new MethodInvocation({
		isSimulation: false,
		userId: enclosing?.userId ?? null,
		setUserId: (userId: string | null) => {
			invocation.userId = userId;
		},
		unblock: () => undefined,
		connection: (enclosing as any)?.connection ?? null,
	} as any);

	return currentMethodInvocation.withValue(invocation, () => handler.apply(invocation, args));
};

const Meteor = {
	isProduction: process.env.NODE_ENV === 'production',
	isDevelopment: process.env.NODE_ENV !== 'production',
	isClient: false,
	isServer: true,
	isCordova: false,
	isModern: true,
	isTest: false,
	isAppTest: false,
	isPackageTest: false,
	isFibersDisabled: true,
	release: 'METEOR@none',

	settings: parseSettings(),

	Error: MeteorError,
	makeErrorType,
	EnvironmentVariable,

	_getAsl,
	_getAslStore,
	_getValueFromAslStore,
	_updateAslStore,

	// --- methods ---

	methods(handlers: Record<string, MethodHandler>) {
		for (const [name, handler] of Object.entries(handlers)) {
			if (typeof handler !== 'function') {
				throw new Error(`Method '${name}' must be a function`);
			}
			if (methodHandlers[name]) {
				throw new Error(`A method named '${name}' is already defined`);
			}
			methodHandlers[name] = handler;
		}
	},

	async callAsync(name: string, ...args: any[]): Promise<any> {
		return applyAsync(name, args);
	},

	async applyAsync(name: string, args: any[]): Promise<any> {
		return applyAsync(name, args);
	},

	call(name: string, ...args: any[]): any {
		// Callback-style invocation kept for legacy call sites
		if (args.length && typeof args[args.length - 1] === 'function') {
			const callback = args.pop();
			applyAsync(name, args).then(
				(result) => callback(undefined, result),
				(error) => callback(error),
			);
			return;
		}
		return applyAsync(name, args);
	},

	// --- publications (DDP layer wires these to real subscriptions) ---

	publish(name: string, handler: PublishHandler) {
		if (publishHandlers[name]) {
			throw new Error(`A publication named '${name}' is already defined`);
		}
		publishHandlers[name] = handler;
	},

	server: {
		method_handlers: methodHandlers,
		publish_handlers: publishHandlers,
		// A Map, as in Meteor 3 — app code calls .get()/.size/.values()/.forEach()
		sessions: new Map<string, any>(),
		onConnection(callback: (connection: unknown) => void) {
			connectionCallbacks.push(callback);
		},
	},

	onConnection(callback: (connection: unknown) => void) {
		connectionCallbacks.push(callback);
	},

	// --- user context ---

	userId(): string | null {
		const invocation = currentMethodInvocation.get() ?? currentPublicationInvocation.get();
		return (invocation as MethodInvocation | undefined)?.userId ?? null;
	},

	async userAsync(): Promise<any> {
		const userId = Meteor.userId();
		if (!userId) return null;
		if (!userLoader) {
			throw new Error('Meteor.userAsync() requires accounts-base to configure a user loader');
		}
		return userLoader(userId);
	},

	user(): never {
		throw new Error('Meteor.user() is not available on the server; use Meteor.userAsync()');
	},

	async runAsUser<T>(userId: string | null, fn: () => T | Promise<T>): Promise<T> {
		const enclosing = currentMethodInvocation.get();
		const invocation = new MethodInvocation({
			isSimulation: false,
			userId,
			setUserId: (uid: string | null) => {
				invocation.userId = uid;
			},
			unblock: () => undefined,
			connection: (enclosing as any)?.connection ?? null,
		} as any);
		return currentMethodInvocation.withValue(invocation, fn as () => Promise<T>);
	},

	// --- lifecycle ---

	startup(callback: () => void | Promise<void>) {
		if (startupRan) {
			void callback();
			return;
		}
		startupCallbacks.push(callback);
	},

	absoluteUrl,

	_relativeToSiteRootUrl(link: string) {
		const prefix = process.env.ROOT_URL_PATH_PREFIX;
		if (prefix && link.startsWith('/')) {
			return prefix + link;
		}
		return link;
	},

	// --- misc runtime helpers ---

	bindEnvironment,

	promisify(fn: Callback, context?: any, errorFirst = true) {
		return function (this: any, ...args: any[]) {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const self = this;
			const filteredArgs = args.filter((i) => i !== undefined);

			return new Promise((resolve, reject) => {
				const callback = bindEnvironment((error: any, result: any) => {
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

	wrapAsync(fn: Callback, context?: any) {
		return function (this: any, ...args: any[]) {
			const self = context || this;
			let callback: Callback | undefined;

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
				callback = (err: any) => {
					if (err) Meteor._debug('Exception in callback of async function', err);
				};
				args.push(undefined);
			}

			const callbackIndex = args.indexOf(callback);
			const boundCallback = bindEnvironment(callback);

			if (callbackIndex !== -1) {
				args[callbackIndex] = boundCallback;
			} else {
				args.push(boundCallback);
			}

			return fn.apply(self, args);
		};
	},

	wrapFn<F>(fn: F): F {
		return fn;
	},

	defer(fn: () => void) {
		setTimeout(bindEnvironment(fn), 0);
	},

	setTimeout(fn: () => void, duration?: number) {
		return setTimeout(bindEnvironment(fn), duration);
	},

	setInterval(fn: () => void, duration?: number) {
		return setInterval(bindEnvironment(fn), duration);
	},

	clearTimeout(x: any) {
		return clearTimeout(x);
	},

	clearInterval(x: any) {
		return clearInterval(x);
	},

	_setImmediate(fn: () => void) {
		return setImmediate(fn);
	},

	_sleepForMs(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	},

	sleep(ms: number) {
		return Meteor._sleepForMs(ms);
	},

	_isPromise(r: any): boolean {
		return !!r && typeof r.then === 'function';
	},

	_debug(...args: unknown[]) {
		console.log(...args);
	},

	_escapeRegExp(string: string) {
		return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	},

	deprecate(...args: any[]) {
		console.warn('[DEPRECATION]', ...args);
	},
};

export { Meteor, MethodInvocation };
export const global = globalThis;
export const meteorEnv = { NODE_ENV: process.env.NODE_ENV };
