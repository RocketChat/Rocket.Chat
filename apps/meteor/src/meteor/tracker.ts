import { Package } from './package-registry.ts';

let nextId = 1;
// computations whose callbacks we should call at flush time
const pendingComputations: Computation[] = [];
// `true` if a Tracker.flush is scheduled, or if we are in Tracker.flush now
let willFlush = false;
// `true` if we are in Tracker.flush now
let isFlushing = false;
// `true` if we are computing a computation now, either first time
// or recompute.  This matches Tracker.active unless we are inside
// Tracker.nonreactive, which nullfies currentComputation even though
// an enclosing computation may still be running.
let inCompute = false;

const afterFlushCallbacks: (() => void)[] = [];

function requireFlush() {
	if (!willFlush) {
		// We want this code to work without Meteor, see debugFunc above
		// @ts-expect-error - Meteor is not defined
		// eslint-disable-next-line no-undef
		if (typeof Meteor !== 'undefined') Meteor._setImmediate(_runFlush);
		else setTimeout(_runFlush, 0);
		willFlush = true;
	}
}

export let active = false;

export let currentComputation: Computation | null = null;

export function inFlush() {
	return isFlushing;
}

export class Computation {
	stopped: boolean;

	invalidated: boolean;

	firstRun: boolean;

	_id: number;

	_onInvalidateCallbacks: ((c: Computation) => void)[];

	_onStopCallbacks: ((c: Computation) => void)[];

	_parent: Computation | null;

	_func: (computation: Computation) => void;

	_onError?: (error: Error) => void;

	_recomputing: boolean;

	firstRunPromise: Promise<unknown> | null = null;

	constructor(f: (computation: Computation) => void, parent: Computation | null, onError?: (error: Error) => void) {
		this.stopped = false;
		this.invalidated = false;
		this.firstRun = true;

		this._id = nextId++;
		this._onInvalidateCallbacks = [];
		this._onStopCallbacks = [];
		// the plan is at some point to use the parent relation
		// to constrain the order that computations are processed
		this._parent = parent;
		this._func = f;
		this._onError = onError;
		this._recomputing = false;

		let errored = true;
		try {
			this._compute();
			errored = false;
		} finally {
			this.firstRun = false;
			if (errored) this.stop();
		}
	}

	then<TResult1 = unknown, TResult2 = never>(
		onResolved?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | undefined | null,
		onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
	): Promise<TResult1 | TResult2> | undefined {
		return this.firstRunPromise?.then(onResolved, onRejected);
	}

	catch(onRejected: ((reason: any) => any | PromiseLike<any>) | undefined | null) {
		return this.firstRunPromise?.catch(onRejected) as Promise<unknown>;
	}

	onInvalidate(f: (c: Computation) => void) {
		if (typeof f !== 'function') throw new Error('onInvalidate requires a function');

		if (this.invalidated) {
			nonreactive(() => {
				f(this);
			});
		} else {
			this._onInvalidateCallbacks.push(f);
		}
	}

	onStop(f: (c: Computation) => void) {
		if (this.stopped) {
			nonreactive(() => {
				f(this);
			});
		} else {
			this._onStopCallbacks.push(f);
		}
	}

	invalidate() {
		if (!this.invalidated) {
			// if we're currently in _recompute(), don't enqueue
			// ourselves, since we'll rerun immediately anyway.
			if (!this._recomputing && !this.stopped) {
				requireFlush();
				pendingComputations.push(this);
			}

			this.invalidated = true;

			// callbacks can't add callbacks, because
			// this.invalidated === true.
			for (let i = 0, f; (f = this._onInvalidateCallbacks[i]); i++) {
				nonreactive(() => {
					f(this);
				});
			}
			this._onInvalidateCallbacks = [];
		}
	}

	stop() {
		if (!this.stopped) {
			this.stopped = true;
			this.invalidate();
			for (let i = 0, f; (f = this._onStopCallbacks[i]); i++) {
				nonreactive(() => {
					f(this);
				});
			}
			this._onStopCallbacks = [];
		}
	}

	_compute() {
		this.invalidated = false;

		const previousInCompute = inCompute;
		inCompute = true;

		try {
			// In case of async functions, the result of this function will contain the promise of the autorun function
			// & make autoruns await-able.
			const firstRunPromise = withComputation(this, () => {
				return this._func(this);
			});
			// We'll store the firstRunPromise on the computation so it can be awaited by the callers, but only
			// during the first run. We don't want things to get mixed up.
			if (this.firstRun) {
				this.firstRunPromise = Promise.resolve(firstRunPromise);
			}
		} finally {
			inCompute = previousInCompute;
		}
	}

	_needsRecompute() {
		return this.invalidated && !this.stopped;
	}

	_recompute() {
		this._recomputing = true;
		try {
			if (this._needsRecompute()) {
				try {
					this._compute();
				} catch (e: any) {
					if (this._onError) {
						this._onError(e);
					} else {
						console.error('Exception from Tracker recompute function:', e);
					}
				}
			}
		} finally {
			this._recomputing = false;
		}
	}

	flush() {
		if (this._recomputing) return;

		this._recompute();
	}

	run() {
		this.invalidate();
		this.flush();
	}
}

export class Dependency {
	_dependentsById: Record<string, Computation>;

	constructor() {
		this._dependentsById = Object.create(null);
	}

	depend(computation?: Computation): boolean {
		if (!computation) {
			if (!active) return false;

			computation = currentComputation as Computation;
		}
		const id = computation._id;
		if (!(id in this._dependentsById)) {
			this._dependentsById[id] = computation;
			computation.onInvalidate(() => {
				delete this._dependentsById[id];
			});
			return true;
		}
		return false;
	}

	changed() {
		for (const id of Object.keys(this._dependentsById)) {
			this._dependentsById[id].invalidate();
		}
	}

	hasDependents(): boolean {
		return Object.keys(this._dependentsById).length > 0;
	}
}

export function flush(options?: { _throwFirstError?: boolean }) {
	_runFlush({
		finishSynchronously: true,
		throwFirstError: options?._throwFirstError,
	});
}

export function _runFlush(options: { finishSynchronously?: boolean; throwFirstError?: boolean }) {
	if (inFlush()) throw new Error("Can't call Tracker.flush while flushing");

	if (inCompute) throw new Error("Can't flush inside Tracker.autorun");

	options = options || {};

	isFlushing = true;
	willFlush = true;

	let recomputedCount = 0;
	let finishedTry = false;
	try {
		while (pendingComputations.length || afterFlushCallbacks.length) {
			// recompute all pending computations
			while (pendingComputations.length) {
				const comp = pendingComputations.shift();
				if (comp) {
					comp._recompute();
					if (comp._needsRecompute()) {
						pendingComputations.unshift(comp);
					}
				}

				if (!options.finishSynchronously && ++recomputedCount > 1000) {
					finishedTry = true;
					return;
				}
			}

			if (afterFlushCallbacks.length) {
				// call one afterFlush callback, which may
				// invalidate more computations
				const func = afterFlushCallbacks.shift();
				try {
					if (func) func();
				} catch (e: any) {
					console.error('Exception in afterFlush callback', e);
				}
			}
		}
		finishedTry = true;
	} finally {
		if (!finishedTry) {
			// we're erroring due to throwFirstError being true.
			isFlushing = false; // needed before calling `Tracker.flush()` again
			// finish flushing
			_runFlush({
				finishSynchronously: options.finishSynchronously,
				throwFirstError: false,
			});
		}
		willFlush = false;
		isFlushing = false;
		if (pendingComputations.length || afterFlushCallbacks.length) {
			// We're yielding because we ran a bunch of computations and we aren't
			// required to finish synchronously, so we'd like to give the event loop a
			// chance. We should flush again soon.
			if (options.finishSynchronously) {
				// eslint-disable-next-line no-unsafe-finally
				throw new Error('still have more to do?'); // shouldn't happen
			}
			setTimeout(requireFlush, 10);
		}
	}
}
export function autorun(f: (computation: Computation) => void, options: { onError?: (error: Error) => void } = {}): Computation {
	const c = new Computation(f, currentComputation, options.onError);

	if (active)
		onInvalidate(() => {
			c.stop();
		});

	return c;
}

export function nonreactive<T>(f: () => T): T {
	return withComputation(null, f);
}

export function withComputation<T>(computation: Computation | null, f: () => T): T {
	const previousComputation = currentComputation;

	currentComputation = computation;
	active = !!computation;

	try {
		return f();
	} finally {
		currentComputation = previousComputation;
		active = !!previousComputation;
	}
}

export function onInvalidate(f: (c: Computation) => void) {
	if (!active) throw new Error('Tracker.onInvalidate requires a currentComputation');

	(currentComputation as Computation).onInvalidate(f);
}

export function afterFlush(f: () => void) {
	afterFlushCallbacks.push(f);
	requireFlush();
}

export const Tracker = {
	get active() {
		return active;
	},
	set active(v) {
		active = v;
	},
	get currentComputation() {
		return currentComputation;
	},
	set currentComputation(v) {
		currentComputation = v;
	},
	inFlush,
	Computation,
	Dependency,
	flush,
	_runFlush,
	autorun,
	nonreactive,
	withComputation,
	onInvalidate,
	afterFlush,
};

export const Deps = Tracker;

Package.tracker = { Tracker, Deps };
