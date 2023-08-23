import type { Logger } from '@rocket.chat/logger';
import { Random } from '@rocket.chat/random';

import { compareByRanking } from '../utils/comparisons';

enum CallbackPriority {
	HIGH = -1000,
	MEDIUM = 0,
	LOW = 1000,
}

type Callback<H> = {
	(item: unknown, constant?: unknown): Promise<unknown>;
	hook: H;
	id: string;
	priority: CallbackPriority;
	stack: string;
};

type CallbackTracker<H> = (callback: Callback<H>) => () => void;

type HookTracker<H> = (params: { hook: H; length: number }) => () => void;

export class Callbacks<
	TChainedCallbackSignatures extends {
		[key: string]: (item: any, constant?: any) => any;
	},
	TEventLikeCallbackSignatures extends {
		[key: string]: (item: any, constant?: any) => any;
	},
	THook extends string = keyof TChainedCallbackSignatures & keyof TEventLikeCallbackSignatures & string,
> {
	private logger: Logger | undefined = undefined;

	private trackCallback: CallbackTracker<THook> | undefined = undefined;

	private trackHook: HookTracker<THook> | undefined = undefined;

	private callbacks = new Map<THook, Callback<THook>[]>();

	private sequentialRunners = new Map<THook, (item: unknown, constant?: unknown) => Promise<unknown>>();

	private asyncRunners = new Map<THook, (item: unknown, constant?: unknown) => unknown>();

	readonly priority = CallbackPriority;

	setLogger(logger: Logger): void {
		this.logger = logger;
	}

	setMetricsTrackers({ trackCallback, trackHook }: { trackCallback?: CallbackTracker<THook>; trackHook?: HookTracker<THook> }): void {
		this.trackCallback = trackCallback;
		this.trackHook = trackHook;
	}

	private runOne(callback: Callback<THook>, item: unknown, constant: unknown): Promise<unknown> {
		const stopTracking = this.trackCallback?.(callback);

		return Promise.resolve(callback(item, constant)).finally(stopTracking);
	}

	private createSequentialRunner(hook: THook, callbacks: Callback<THook>[]): (item: unknown, constant?: unknown) => Promise<unknown> {
		const wrapCallback =
			(callback: Callback<THook>) =>
			async (item: unknown, constant?: unknown): Promise<unknown> => {
				this.logger?.debug(`Executing callback with id ${callback.id} for hook ${callback.hook}`);

				return (await this.runOne(callback, item, constant)) ?? item;
			};

		const identity = <TItem>(item: TItem): Promise<TItem> => Promise.resolve(item);

		const pipe =
			(curr: (item: unknown, constant?: unknown) => Promise<unknown>, next: (item: unknown, constant?: unknown) => Promise<unknown>) =>
			async (item: unknown, constant?: unknown): Promise<unknown> =>
				next(await curr(item, constant), constant);

		const fn = callbacks.map(wrapCallback).reduce(pipe, identity);

		return async (item: unknown, constant?: unknown): Promise<unknown> => {
			const stopTracking = this.trackHook?.({ hook, length: callbacks.length });

			return fn(item, constant).finally(() => stopTracking?.());
		};
	}

	private createAsyncRunner(_: THook, callbacks: Callback<THook>[]) {
		return (item: unknown, constant?: unknown): unknown => {
			if (typeof window !== 'undefined') {
				throw new Error('callbacks.runAsync on client server not allowed');
			}

			for (const callback of callbacks) {
				setTimeout(() => {
					void this.runOne(callback, item, constant);
				}, 0);
			}

			return item;
		};
	}

	getCallbacks(hook: THook): Callback<THook>[] {
		return this.callbacks.get(hook) ?? [];
	}

	setCallbacks(hook: THook, callbacks: Callback<THook>[]): void {
		this.callbacks.set(hook, callbacks);
		this.sequentialRunners.set(hook, this.createSequentialRunner(hook, callbacks));
		this.asyncRunners.set(hook, this.createAsyncRunner(hook, callbacks));
	}

	/**
	 * Add a callback function to a hook
	 *
	 * @param hook the name of the hook
	 * @param callback the callback function
	 * @param priority the callback run priority (order)
	 * @param id human friendly name for this callback
	 */
	add<Hook extends keyof TEventLikeCallbackSignatures>(
		hook: Hook,
		callback: TEventLikeCallbackSignatures[Hook],
		priority?: CallbackPriority,
		id?: string,
	): void;

	add<Hook extends keyof TChainedCallbackSignatures>(
		hook: Hook,
		callback: TChainedCallbackSignatures[Hook],
		priority?: CallbackPriority,
		id?: string,
	): void;

	add<TItem, TConstant, TNextItem = TItem>(
		hook: THook,
		callback: (item: TItem, constant?: TConstant) => TNextItem,
		priority?: CallbackPriority,
		id?: string,
	): void;

	add(hook: THook, callback: (item: unknown, constant?: unknown) => unknown, priority = this.priority.MEDIUM, id = Random.id()): void {
		const callbacks = this.getCallbacks(hook);

		if (callbacks.some((cb) => cb.id === id)) {
			return;
		}

		callbacks.push(
			Object.assign(callback as Callback<THook>, {
				hook,
				priority,
				id,
				stack: new Error().stack,
			}),
		);
		callbacks.sort(compareByRanking((callback: Callback<THook>): number => callback.priority ?? this.priority.MEDIUM));

		this.setCallbacks(hook, callbacks);
	}

	/**
	 * Remove a callback from a hook
	 *
	 * @param hook the name of the hook
	 * @param id the callback's id
	 */
	remove(hook: THook, id: string): void {
		const hooks = this.getCallbacks(hook).filter((callback) => callback.id !== id);
		this.setCallbacks(hook, hooks);
	}

	run<Hook extends keyof TEventLikeCallbackSignatures>(hook: Hook, ...args: Parameters<TEventLikeCallbackSignatures[Hook]>): void;

	run<Hook extends keyof TChainedCallbackSignatures>(
		hook: Hook,
		...args: Parameters<TChainedCallbackSignatures[Hook]>
	): Promise<ReturnType<TChainedCallbackSignatures[Hook]>>;

	run<TItem, TConstant, TNextItem = TItem>(hook: THook, item: TItem, constant?: TConstant): Promise<TNextItem>;

	/**
	 * Successively run all of a hook's callbacks on an item
	 *
	 * @param hook the name of the hook
	 * @param item the post, comment, modifier, etc. on which to run the callbacks
	 * @param constant an optional constant that will be passed along to each callback
	 * @returns returns the item after it's been through all the callbacks for this hook
	 */
	run(hook: THook, item: unknown, constant?: unknown): Promise<unknown> {
		const runner = this.sequentialRunners.get(hook) ?? (async (item: unknown, _constant?: unknown): Promise<unknown> => item);
		return runner(item, constant);
	}

	runAsync<Hook extends keyof TEventLikeCallbackSignatures>(hook: Hook, ...args: Parameters<TEventLikeCallbackSignatures[Hook]>): void;

	/**
	 * Successively run all of a hook's callbacks on an item, in async mode (only works on server)
	 *
	 * @param hook the name of the hook
	 * @param item the post, comment, modifier, etc. on which to run the callbacks
	 * @param constant an optional constant that will be passed along to each callback
	 * @returns the post, comment, modifier, etc. on which to run the callbacks
	 */
	runAsync(hook: THook, item: unknown, constant?: unknown): unknown {
		const runner = this.asyncRunners.get(hook) ?? ((item: unknown, _constant?: unknown): unknown => item);
		return runner(item, constant);
	}

	static create<F extends (item: any, constant?: any) => any | Promise<any>>(
		hook: string,
	): Cb<Parameters<F>[0], ReturnType<F>, Parameters<F>[1]>;

	static create<I, R, C = undefined>(hook: string): Cb<I, R, C> {
		const callbacks = new Callbacks();

		return {
			add: (callback, priority, id) => callbacks.add(hook as any, callback, priority, id),
			remove: (id) => callbacks.remove(hook as any, id),
			run: (item, constant) => callbacks.run(hook as any, item, constant) as any,
		};
	}
}

/**
 * Callback hooks provide an easy way to add extra steps to common operations.
 * @deprecated
 */
type Cb<I, R, C = undefined> = {
	add: (
		callback: (item: I, constant: C) => Promise<R | undefined | void> | R | undefined | void,
		priority?: CallbackPriority,
		id?: string,
	) => void;
	remove: (id: string) => void;
	run: (item: I, constant?: C) => Promise<R>;
};
