import { DDP } from "./namespace.ts";
import { Connection } from "./livedata-connection.ts";

let queueSize = 0;
let queue = Promise.resolve();

export const loadAsyncStubHelpers = (): void => {
  function queueFunction(fn: (resolve: any, reject: any) => void, promiseProps: any = {}): Promise<any> {
    queueSize += 1;

    let resolveFn: any;
    let rejectFn: any;
    
    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    }) as any;

    queue = queue.finally(() => {
      fn(resolveFn, rejectFn);
      return promise.stubPromise?.catch(() => {});
    });

    promise
      .catch(() => {})
      .finally(() => {
        queueSize -= 1;
        if (queueSize === 0) {
          // Assuming Meteor.connection exists globally when this is running
          (globalThis as any).Meteor?.connection?._maybeMigrate();
        }
      });

    promise.stubPromise = promiseProps.stubPromise;
    promise.serverPromise = promiseProps.serverPromise;

    return promise;
  }

  const oldReadyToMigrate = Connection.prototype._readyToMigrate;
  Connection.prototype._readyToMigrate = function (): boolean {
    if (queueSize > 0) {
      return false;
    }
    return oldReadyToMigrate.apply(this, arguments as any);
  };

  let currentMethodInvocation: any = null;

  const oldApplyAsync = Connection.prototype.applyAsync;
  Connection.prototype.applyAsync = function (...args: any[]): any {
    const name = args[0];

    if (currentMethodInvocation) {
      DDP._CurrentMethodInvocation._set(currentMethodInvocation);
      currentMethodInvocation = null;
    }

    const enclosing = DDP._CurrentMethodInvocation.get();
    const alreadyInSimulation = enclosing?.isSimulation;
    const isFromCallAsync = enclosing?._isFromCallAsync;

    if (
      this._getIsSimulation({
        isFromCallAsync,
        alreadyInSimulation,
      })
    ) {
      return oldApplyAsync.apply(this, args as any);
    }

    let stubPromiseResolver: any;
    let serverPromiseResolver: any;
    
    const stubPromise = new Promise((r) => (stubPromiseResolver = r));
    const serverPromise = new Promise((r) => (serverPromiseResolver = r));

    return queueFunction(
      (resolve, reject) => {
        let finished = false;

        setTimeout(() => {
          const applyAsyncPromise = oldApplyAsync.apply(this, args as any);
          stubPromiseResolver(applyAsyncPromise.stubPromise);
          serverPromiseResolver(applyAsyncPromise.serverPromise);

          applyAsyncPromise.stubPromise
            .catch(() => {})
            .finally(() => {
              finished = true;
            });

          applyAsyncPromise
            .then((result: any) => resolve(result))
            .catch((err: any) => reject(err));

          serverPromise.catch(() => {});
        }, 0);

        setTimeout(() => {
          if (!finished) {
            console.warn(
              `Method stub (${name}) took too long and could cause unexpected problems.`
            );
          }
        }, 0);
      },
      {
        stubPromise,
        serverPromise,
      }
    );
  };

  const oldApply = Connection.prototype.apply;
  Connection.prototype.apply = function (name: string, args: any[], options?: any, callback?: any): any {
    if (this._stream._neverQueued) {
      return oldApply.apply(this, arguments as any);
    }

    if (!callback && typeof options === 'function') {
      callback = options;
      options = undefined;
    }

    const { methodInvoker, result } = oldApply.call(this, name, args, {
      ...options,
      _returnMethodInvoker: true,
    }, callback);

    if (methodInvoker) {
      queueFunction((resolve) => {
        this._addOutstandingMethod(methodInvoker, options);
        resolve(undefined);
      });
    }

    return result;
  };

  let queueSend = false;
  const oldSubscribe = Connection.prototype.subscribe;
  Connection.prototype.subscribe = function (...args: any[]): any {
    if (this._stream._neverQueued) {
      return oldSubscribe.apply(this, args as any);
    }

    queueSend = true;
    try {
      return oldSubscribe.apply(this, args as any);
    } finally {
      queueSend = false;
    }
  };

  const oldSend = Connection.prototype._send;
  Connection.prototype._send = function (params: any, shouldQueue?: boolean): void {
    if (this._stream._neverQueued) {
      return oldSend.apply(this, arguments as any);
    }

    if (!queueSend && !shouldQueue) {
      return oldSend.call(this, params);
    }

    queueSend = false;
    queueFunction((resolve) => {
      try {
        oldSend.call(this, params);
      } finally {
        resolve(undefined);
      }
    });
  };

  const oldSendOutstandingMethodBlocksMessages = Connection.prototype._sendOutstandingMethodBlocksMessages;
  Connection.prototype._sendOutstandingMethodBlocksMessages = function (...args: any[]): void {
    if (this._stream._neverQueued) {
      return oldSendOutstandingMethodBlocksMessages.apply(this, args as any);
    }
    queueFunction((resolve) => {
      try {
        oldSendOutstandingMethodBlocksMessages.apply(this, args as any);
      } finally {
        resolve(undefined);
      }
    });
  };
};