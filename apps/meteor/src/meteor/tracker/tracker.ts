// tracker.ts

export type ComputationFunction = (c: Computation) => unknown;
export type OnErrorFunction = (error: unknown) => void;
export type FlushOptions = { finishSynchronously?: boolean | undefined; _throwFirstError?: boolean | undefined; throwFirstError?: boolean | undefined };

// Module-level state tracking
export let active = false;
export let currentComputation: Computation | null = null;

let nextId = 1;
const pendingComputations: Computation[] = [];
const afterFlushCallbacks: Array<() => void> = [];

let willFlush = false;
let inFlush = false;
let inCompute = false;
let throwFirstError = false;
let constructingComputation = false;

function requireFlush(): void {
  if (!willFlush) {
    queueMicrotask(() => flushInternal());
    willFlush = true;
  }
}

function _throwOrLog(from: string, e: any): void {
  if (throwFirstError) {
    throw e;
  } else {
    const printArgs: string[] = [`Exception from Tracker ${from} function:`];
    if (e && e.stack && e.message && e.name) {
      const idx = e.stack.indexOf(e.message);
      if (idx < 0 || idx > e.name.length + 2) {
        printArgs.push(`${e.name}: ${e.message}`);
      }
    }
    if (e && e.stack) {
      printArgs.push(e.stack);
    }
    for (let i = 0; i < printArgs.length; i++) {
      console.error(printArgs[i]);
    }
  }
}

export class Computation {
  public stopped: boolean;
  public invalidated: boolean;
  public firstRun: boolean;
  public _id: number;
  public _onInvalidateCallbacks: Array<(c: Computation) => void>;
  public _onStopCallbacks: Array<(c: Computation) => void>;
  public _parent: Computation | null;
  public _func: ComputationFunction;
  public _onError?: OnErrorFunction | undefined;
  public _recomputing: boolean;
  public firstRunPromise?: Promise<unknown> | undefined;

  constructor(f: ComputationFunction, parent: Computation | null, onError?: OnErrorFunction) {
    if (!constructingComputation) {
      throw new Error("Tracker.Computation constructor is private; use Tracker.autorun");
    }
    constructingComputation = false;

    this.stopped = false;
    this.invalidated = false;
    this.firstRun = true;
    this._id = nextId++;
    this._onInvalidateCallbacks = [];
    this._onStopCallbacks = [];
    this._parent = parent;
    this._func = f;
    this._onError = onError;
    this._recomputing = false;
    this.firstRunPromise = undefined;

    let errored = true;
    try {
      this._compute();
      errored = false;
    } finally {
      this.firstRun = false;
      if (errored) this.stop();
    }
  }

  then(onResolved?: (value: unknown) => unknown, onRejected?: (reason: any) => unknown): Promise<unknown> {
    return this.firstRunPromise
      ? this.firstRunPromise.then(onResolved, onRejected)
      : Promise.resolve().then(onResolved, onRejected);
  }

  catch(onRejected?: (reason: any) => unknown): Promise<unknown> {
    return this.firstRunPromise
      ? this.firstRunPromise.catch(onRejected)
      : Promise.resolve().catch(onRejected);
  }

  onInvalidate(f: (c: Computation) => void): void {
    if (typeof f !== 'function') throw new Error("onInvalidate requires a function");

    if (this.invalidated) {
      nonreactive(() => f(this));
    } else {
      this._onInvalidateCallbacks.push(f);
    }
  }

  onStop(f: (c: Computation) => void): void {
    if (typeof f !== 'function') throw new Error("onStop requires a function");

    if (this.stopped) {
      nonreactive(() => f(this));
    } else {
      this._onStopCallbacks.push(f);
    }
  }

  invalidate(): void {
    if (!this.invalidated) {
      if (!this._recomputing && !this.stopped) {
        requireFlush();
        pendingComputations.push(this);
      }

      this.invalidated = true;

      for (let i = 0; i < this._onInvalidateCallbacks.length; i++) {
        const f = this._onInvalidateCallbacks[i];
        nonreactive(() => f(this));
      }
      this._onInvalidateCallbacks = [];
    }
  }

  stop(): void {
    if (!this.stopped) {
      this.stopped = true;
      this.invalidate();
      for (let i = 0; i < this._onStopCallbacks.length; i++) {
        const f = this._onStopCallbacks[i];
        nonreactive(() => f(this));
      }
      this._onStopCallbacks = [];
    }
  }

  _compute(): void {
    this.invalidated = false;
    const previousInCompute = inCompute;
    inCompute = true;

    try {
      const promiseResult = withComputation(this, () => this._func(this));
      if (this.firstRun) {
        this.firstRunPromise = Promise.resolve(promiseResult);
      }
    } finally {
      inCompute = previousInCompute;
    }
  }

  _needsRecompute(): boolean {
    return this.invalidated && !this.stopped;
  }

  _recompute(): void {
    this._recomputing = true;
    try {
      if (this._needsRecompute()) {
        try {
          this._compute();
        } catch (e) {
          if (this._onError) {
            this._onError(e);
          } else {
            _throwOrLog("recompute", e);
          }
        }
      }
    } finally {
      this._recomputing = false;
    }
  }

  flush(): void {
    if (this._recomputing) return;
    this._recompute();
  }

  run(): void {
    this.invalidate();
    this.flush();
  }
}

export class Dependency {
  public _dependentsById: Record<string, Computation>;

  constructor() {
    this._dependentsById = Object.create(null);
  }

  depend(computation?: Computation): boolean {
    if (!computation) {
      if (!active || !currentComputation) return false;
      computation = currentComputation;
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

  changed(): void {
    for (const id in this._dependentsById) {
      this._dependentsById[id].invalidate();
    }
  }

  hasDependents(): boolean {
    for (const _id in this._dependentsById) {
      return true;
    }
    return false;
  }
}

function flushInternal(options?: FlushOptions): void {
  if (inFlush) throw new Error("Can't call Tracker.flush while flushing");
  if (inCompute) throw new Error("Can't flush inside Tracker.autorun");

  options = options || {};
  inFlush = true;
  willFlush = true;
  throwFirstError = !!(options.throwFirstError || options._throwFirstError);

  let recomputedCount = 0;
  let finishedTry = false;

  try {
    while (pendingComputations.length || afterFlushCallbacks.length) {
      while (pendingComputations.length) {
        const comp = pendingComputations.shift()!;
        comp._recompute();
        if (comp._needsRecompute()) {
          pendingComputations.unshift(comp);
        }

        if (!options.finishSynchronously && ++recomputedCount > 1000) {
          finishedTry = true;
          return;
        }
      }

      if (afterFlushCallbacks.length) {
        const func = afterFlushCallbacks.shift()!;
        try {
          func();
        } catch (e) {
          _throwOrLog("afterFlush", e);
        }
      }
    }
    finishedTry = true;
  } finally {
    if (!finishedTry) {
      inFlush = false;
      flushInternal({ finishSynchronously: options.finishSynchronously, throwFirstError: false });
    }
    willFlush = false;
    inFlush = false;
    if (pendingComputations.length || afterFlushCallbacks.length) {
      if (options.finishSynchronously) {
        throw new Error("still have more to do?");
      }
      setTimeout(requireFlush, 10);
    }
  }
}

export function flush(options?: FlushOptions): void {
  flushInternal({ finishSynchronously: true, throwFirstError: options?._throwFirstError });
}

export function autorun(f: ComputationFunction, options: { onError?: OnErrorFunction } = {}): Computation {
  if (typeof f !== 'function') throw new Error('Tracker.autorun requires a function argument');

  constructingComputation = true;
  const c = new Computation(f, currentComputation, options.onError);

  if (active && currentComputation) {
    onInvalidate(() => c.stop());
  }

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

export function onInvalidate(f: (c: Computation) => void): void {
  if (!active || !currentComputation) {
    throw new Error("Tracker.onInvalidate requires a currentComputation");
  }
  currentComputation.onInvalidate(f);
}

export function afterFlush(f: () => void): void {
  afterFlushCallbacks.push(f);
  requireFlush();
}
