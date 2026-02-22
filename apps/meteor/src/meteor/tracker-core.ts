let nextId = 1;
const pendingComputations: Computation[] = [];
let willFlush = false;
let isFlushing = false;
let inCompute = false;

const afterFlushCallbacks: (() => void)[] = [];

function requireFlush() {
	if (!willFlush) {
		setTimeout(_runFlush, 0);
		willFlush = true;
	}
}

export let active = false;
export let currentComputation: Computation | null = null;

export function inFlush() {
	return isFlushing;
}

class Computation {
	stopped = false;

	invalidated = false;

	firstRun = true;

	_recomputing = false;

	_id = nextId++;

	_onInvalidateCallbacks: ((c: Computation) => void)[] = [];

	_onStopCallbacks: ((c: Computation) => void)[] = [];

	_parent: Computation | null;

	_func: (computation: Computation) => void;

	_onError?: ((error: unknown) => void) | undefined;

	firstRunPromise: Promise<unknown> | null = null;

	constructor(f: (computation: Computation) => void, parent: Computation | null, onError?: (error: unknown) => void) {
		this._parent = parent;
		this._func = f;
		this._onError = onError;

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
		onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null,
	): Promise<TResult1 | TResult2> | undefined {
		return this.firstRunPromise?.then(onResolved, onRejected);
	}

	catch(onRejected: ((reason: unknown) => unknown | PromiseLike<unknown>) | undefined | null) {
		return this.firstRunPromise?.catch(onRejected);
	}

	onInvalidate(f: (c: Computation) => void) {
		if (typeof f !== 'function') throw new Error('onInvalidate requires a function');

		if (this.invalidated) {
			const prev = currentComputation;
			const prevActive = active;
			currentComputation = null;
			active = false;
			try {
				f(this);
			} finally {
				currentComputation = prev;
				active = prevActive;
			}
		} else {
			this._onInvalidateCallbacks.push(f);
		}
	}

	onStop(f: (c: Computation) => void) {
		if (typeof f !== 'function') throw new Error('onStop requires a function');

		if (this.stopped) {
			const prev = currentComputation;
			const prevActive = active;
			currentComputation = null;
			active = false;
			try {
				f(this);
			} finally {
				currentComputation = prev;
				active = prevActive;
			}
		} else {
			this._onStopCallbacks.push(f);
		}
	}

	invalidate() {
		if (!this.invalidated) {
			if (!this._recomputing && !this.stopped) {
				requireFlush();
				pendingComputations.push(this);
			}

			this.invalidated = true;
			if (this._onInvalidateCallbacks.length > 0) {
				const prev = currentComputation;
				const prevActive = active;
				currentComputation = null;
				active = false;

				try {
					for (let i = 0; i < this._onInvalidateCallbacks.length; i++) {
						const f = this._onInvalidateCallbacks[i];
						f(this);
					}
				} finally {
					currentComputation = prev;
					active = prevActive;
					this._onInvalidateCallbacks = []; // Clear array reference
				}
			}
		}
	}

	stop() {
		if (!this.stopped) {
			this.stopped = true;
			this.invalidate();

			if (this._onStopCallbacks.length > 0) {
				const prev = currentComputation;
				const prevActive = active;
				currentComputation = null;
				active = false;

				try {
					for (let i = 0; i < this._onStopCallbacks.length; i++) {
						const f = this._onStopCallbacks[i];
						f(this);
					}
				} finally {
					currentComputation = prev;
					active = prevActive;
					this._onStopCallbacks = [];
				}
			}
		}
	}

	_compute() {
		this.invalidated = false;

		const previousInCompute = inCompute;
		inCompute = true;

		try {
			const firstRunPromise = withComputation(this, () => {
				return this._func(this);
			});

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
				} catch (e) {
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
	_dependents = new Set<Computation>();

	depend(computation?: Computation): boolean {
		if (!computation) {
			if (!active) return false;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			computation = currentComputation!;
		}

		if (!this._dependents.has(computation)) {
			this._dependents.add(computation);
			computation.onInvalidate(() => {
				this._dependents.delete(computation);
			});
			return true;
		}
		return false;
	}

	changed() {
		if (this._dependents.size === 0) return;
		for (const computation of this._dependents) {
			computation.invalidate();
		}
	}

	hasDependents(): boolean {
		return this._dependents.size > 0;
	}
}

export function flush(options: { _throwFirstError?: boolean } = {}) {
	_runFlush({
		finishSynchronously: true,
		throwFirstError: options._throwFirstError,
	});
}

function _runFlush(options: { finishSynchronously?: boolean | undefined; throwFirstError?: boolean | undefined } = {}) {
	if (inFlush()) throw new Error("Can't call Tracker.flush while flushing");
	if (inCompute) throw new Error("Can't flush inside Tracker.autorun");

	isFlushing = true;
	willFlush = true;

	let recomputedCount = 0;
	let finishedTry = false;

	try {
		while (pendingComputations.length > 0 || afterFlushCallbacks.length > 0) {
			if (pendingComputations.length > 0) {
				for (let i = 0; i < pendingComputations.length; i++) {
					const comp = pendingComputations[i];

					comp._recompute();

					if (comp._needsRecompute()) {
						pendingComputations.push(comp);
					}

					if (!options.finishSynchronously && ++recomputedCount > 1000) {
						pendingComputations.splice(0, i + 1);
						finishedTry = true;
						return;
					}
				}
				pendingComputations.length = 0;
			}

			if (afterFlushCallbacks.length > 0) {
				const func = afterFlushCallbacks.shift();
				try {
					if (func) func();
				} catch (e) {
					console.error('Exception in afterFlush callback', e);
				}
			}
		}
		finishedTry = true;
	} finally {
		if (!finishedTry) {
			isFlushing = false;
			_runFlush({
				finishSynchronously: options.finishSynchronously,
				throwFirstError: false,
			});
		}
		willFlush = false;
		isFlushing = false;

		if (pendingComputations.length || afterFlushCallbacks.length) {
			if (options.finishSynchronously) {
				// eslint-disable-next-line no-unsafe-finally
				throw new Error('still have more to do?');
			}
			setTimeout(requireFlush, 10);
		}
	}
}

export function autorun(f: (computation: Computation) => void, options: { onError?: (error: unknown) => void } = {}): Computation {
	const c = new Computation(f, currentComputation, options.onError);

	if (active)
		onInvalidate(() => {
			c.stop();
		});

	return c;
}

export function nonreactive<T>(f: () => T): T {
	const previousComputation = currentComputation;
	const previousActive = active;

	currentComputation = null;
	active = false;

	try {
		return f();
	} finally {
		currentComputation = previousComputation;
		active = previousActive;
	}
}

export function withComputation<T>(computation: Computation | null, f: () => T): T {
	const previousComputation = currentComputation;
	const previousActive = active;

	currentComputation = computation;
	active = !!computation;

	try {
		return f();
	} finally {
		currentComputation = previousComputation;
		active = previousActive;
	}
}

export function onInvalidate(f: (c: Computation) => void) {
	if (!active || !currentComputation) throw new Error('Tracker.onInvalidate requires a currentComputation');
	currentComputation.onInvalidate(f);
}

export function afterFlush(f: () => void) {
	afterFlushCallbacks.push(f);
	requireFlush();
}
