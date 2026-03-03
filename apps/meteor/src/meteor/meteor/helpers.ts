// src/core/helpers.ts

/**
 * _get(a,b,c,d) returns a[b][c][d], or else undefined if a[b] or
 * a[b][c] doesn't exist.
 */
export function _get(obj: Record<string, any>, ...args: string[]): any {
  let current = obj;
  for (let i = 0; i < args.length; i++) {
    if (!current || !(args[i] in current)) {
      return undefined;
    }
    current = current[args[i]];
  }
  return current;
}

/**
 * _ensure(a,b,c,d) ensures that a[b][c][d] exists. If it does not,
 * it is created and set to {}. Either way, it is returned.
 */
export function _ensure(obj: Record<string, any>, ...args: string[]): any {
  let current = obj;
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  return current;
}

/**
 * _delete(a, b, c, d) deletes a[b][c][d], then a[b][c] unless it
 * isn't empty, then a[b] unless it isn't empty.
 */
export function _delete(obj: Record<string, any>, ...args: string[]): void {
  const stack = [obj];
  let leaf = true;

  for (let i = 0; i < args.length - 1; i++) {
    const key = args[i];
    if (!(key in obj)) {
      leaf = false;
      break;
    }
    obj = obj[key];
    if (typeof obj !== "object" || obj === null) {
      break;
    }
    stack.push(obj);
  }

  for (let i = stack.length - 1; i >= 0; i--) {
    const key = args[i];

    if (leaf) {
      leaf = false;
    } else {
      // Check if the object is empty before deleting
      for (const _other in stack[i][key]) {
        return; // not empty -- we're done
      }
    }

    delete stack[i][key];
  }
}

/**
 * Takes a function that has a callback argument as the last one and promisifies it.
 * Replaces node's util.promisify for the browser.
 */
export function promisify(
  fn: Function,
  context?: any,
  errorFirst: boolean = true
): (...args: any[]) => Promise<any> {
  return function (this: any, ...args: any[]) {
    const self = context || this;
    const filteredArgs = args.filter((i) => i !== undefined);

    return new Promise((resolve, reject) => {
      const callback = function (error: any, result: any) {
        let _error = error;
        let _result = result;
        
        if (!errorFirst) {
          _error = result;
          _result = error;
        }

        if (_error) {
          return reject(_error);
        }
        resolve(_result);
      };

      filteredArgs.push(callback);
      return fn.apply(self, filteredArgs);
    });
  };
}

/**
 * On the client, wrapAsync guarantees a callback is passed to the original function.
 * If no callback is provided, it supplies a default one that logs errors.
 * (The server-side Fiber yield/resume behavior is intentionally erased for modern frontend).
 */
export function wrapAsync(fn: Function, context?: any): Function {
  return function (this: any, ...args: any[]) {
    const self = context || this;
    const newArgs = [...args];
    let callback: Function | undefined;

    let i = newArgs.length - 1;
    for (; i >= 0; --i) {
      const arg = newArgs[i];
      if (typeof arg !== "undefined") {
        if (typeof arg === "function") {
          callback = arg;
        }
        break;
      }
    }

    if (!callback) {
      callback = logErr;
      ++i; // Insert the callback just after the last defined argument.
    }

    // Demeteorized: We stripped `Meteor.bindEnvironment` since it's irrelevant without Fibers
    newArgs[i] = callback;
    return fn.apply(self, newArgs);
  };
}

export function wrapFn(fn: Function): Function {
  return fn;
}

let warnedAboutWrapAsync = false;

/**
 * @deprecated
 */
export function _wrapAsync(fn: Function, context?: any): Function {
  if (!warnedAboutWrapAsync) {
    console.warn("Meteor._wrapAsync has been renamed to Meteor.wrapAsync");
    warnedAboutWrapAsync = true;
  }
  return wrapAsync(fn, context);
}

// Classical inheritance helper
const hasOwn = Object.prototype.hasOwnProperty;

export function _inherits(Child: any, Parent: any): any {
  for (const key in Parent) {
    if (hasOwn.call(Parent, key)) {
      Child[key] = Parent[key];
    }
  }

  const Middle = function (this: any) {
    this.constructor = Child;
  } as any;
  Middle.prototype = Parent.prototype;
  Child.prototype = new Middle();
  Child.__super__ = Parent.prototype;
  return Child;
}

function logErr(err?: any) {
  if (err) {
    console.error("Exception in callback of async function", err);
  }
}