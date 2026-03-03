export type ExceptionHandler = (exception: unknown) => void;

export type HookOptions = {
  /**
   * @deprecated Modern JS environments do not use Fibers. Kept for API compatibility.
   */
  bindEnvironment?: boolean;
  /**
   * @deprecated Modern JS uses standard async/await. Kept for API compatibility.
   */
  wrapAsync?: boolean;
  exceptionHandler?: ExceptionHandler;
  debugPrintExceptions?: string;
};

export type RegisteredCallback<T extends (...args: any[]) => any> = {
  callback: T;
  stop: () => void;
};

export class Hook<T extends (...args: any[]) => any = (...args: any[]) => any> {
  private nextCallbackId = 0;
  private callbacks: Record<number, T> = Object.create(null);
  private exceptionHandler?: ExceptionHandler;

  constructor(options: HookOptions = {}) {
    if (options.exceptionHandler) {
      this.exceptionHandler = options.exceptionHandler;
    } else if (options.debugPrintExceptions) {
      if (typeof options.debugPrintExceptions !== "string") {
        throw new Error("Hook option debugPrintExceptions should be a string");
      }
      const description = options.debugPrintExceptions;
      this.exceptionHandler = (error: unknown) => {
        console.error(`Exception in ${description}`, error);
      };
    }
  }

  /**
   * Registers a callback.
   * If an exceptionHandler/debugPrintExceptions was provided, the callback is automatically
   * wrapped in a try/catch block.
   */
  register(callback: T): RegisteredCallback<T> {
    const handler = this.exceptionHandler || ((exception: unknown) => {
      throw exception;
    });

    // Wrap the callback to catch exceptions if needed
    const wrappedCallback = ((...args: Parameters<T>): ReturnType<T> | undefined => {
      try {
        return callback(...args);
      } catch (e) {
        handler(e);
        return undefined; // Or throw depending on the handler
      }
    }) as T;

    const id = this.nextCallbackId++;
    this.callbacks[id] = wrappedCallback;

    return {
      callback: wrappedCallback,
      stop: () => {
        delete this.callbacks[id];
      }
    };
  }

  clear(): void {
    this.nextCallbackId = 0;
    this.callbacks = Object.create(null);
  }

  /**
   * For each registered callback, call the passed iterator function with the callback.
   *
   * The iteration is stopped if the iterator function returns a falsy value or throws an exception.
   */
  forEach(iterator: (callback: T) => boolean | void | any): void {
    const ids = Object.keys(this.callbacks).map(Number);
    
    for (let i = 0; i < ids.length; ++i) {
      const id = ids[i];
      // Check to see if the callback was removed during iteration
      if (Object.prototype.hasOwnProperty.call(this.callbacks, id)) {
        const callback = this.callbacks[id];
        if (!iterator(callback)) {
          break;
        }
      }
    }
  }

  /**
   * Async counterpart of forEach. Returns a promise.
   */
  async forEachAsync(iterator: (callback: T) => Promise<boolean | void | any>): Promise<void> {
    const ids = Object.keys(this.callbacks).map(Number);
    
    for (let i = 0; i < ids.length; ++i) {
      const id = ids[i];
      // Check to see if the callback was removed during iteration
      if (Object.prototype.hasOwnProperty.call(this.callbacks, id)) {
        const callback = this.callbacks[id];
        if (!(await iterator(callback))) {
          break;
        }
      }
    }
  }

  /**
   * @deprecated use forEach
   */
  each(iterator: (callback: T) => boolean | void | any): void {
    this.forEach(iterator);
  }
}