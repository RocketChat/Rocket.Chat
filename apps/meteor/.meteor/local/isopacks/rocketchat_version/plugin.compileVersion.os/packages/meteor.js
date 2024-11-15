Package["core-runtime"].queue("meteor",function () {/* Package-scope variables */
var global, meteorEnv, Meteor, EmitterPromise;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/global.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Export a reliable global object for all Meteor code.
global = this;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/server_environment.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
meteorEnv = {
  NODE_ENV: process.env.NODE_ENV || "production",
  TEST_METADATA: process.env.TEST_METADATA || "{}"
};

const config = typeof __meteor_runtime_config__ === "object" &&
  __meteor_runtime_config__;

if (config) {
  config.meteorEnv = meteorEnv;
}

Meteor = {
  isProduction: meteorEnv.NODE_ENV === "production",
  isDevelopment: meteorEnv.NODE_ENV !== "production",
  isClient: false,
  isServer: true,
  isCordova: false,
  // Server code runs in Node 8+, which is decidedly "modern" by any
  // reasonable definition.
  isModern: true
};

Meteor.settings = {};

if (process.env.METEOR_SETTINGS) {
  try {
    Meteor.settings = JSON.parse(process.env.METEOR_SETTINGS);
  } catch (e) {
    throw new Error("METEOR_SETTINGS are not valid JSON.");
  }
}

// Make sure that there is always a public attribute
// to enable Meteor.settings.public on client
if (! Meteor.settings.public) {
    Meteor.settings.public = {};
}

// Push a subset of settings to the client.  Note that the way this
// code is written, if the app mutates `Meteor.settings.public` on the
// server, it also mutates
// `__meteor_runtime_config__.PUBLIC_SETTINGS`, and the modified
// settings will be sent to the client.
if (config) {
  config.PUBLIC_SETTINGS = Meteor.settings.public;
}

if (config && config.gitCommitHash) {
  Meteor.gitCommitHash = config.gitCommitHash;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/helpers.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
if (typeof __meteor_runtime_config__ === 'object' &&
    __meteor_runtime_config__.meteorRelease) {
  /**
   * @summary `Meteor.release` is a string containing the name of the [release](#meteorupdate) with which the project was built (for example, `"1.2.3"`). It is `undefined` if the project was built using a git checkout of Meteor.
   * @locus Anywhere
   * @type {String}
   */
  Meteor.release = __meteor_runtime_config__.meteorRelease;
}

// XXX find a better home for these? Ideally they would be _.get,
// _.ensure, _.delete..

// _get(a,b,c,d) returns a[b][c][d], or else undefined if a[b] or
// a[b][c] doesn't exist.
//
Meteor._get = function (obj /*, arguments */) {
  for (var i = 1; i < arguments.length; i++) {
    if (!(arguments[i] in obj))
      return undefined;
    obj = obj[arguments[i]];
  }
  return obj;
};

// _ensure(a,b,c,d) ensures that a[b][c][d] exists. If it does not,
// it is created and set to {}. Either way, it is returned.
//
Meteor._ensure = function (obj /*, arguments */) {
  for (var i = 1; i < arguments.length; i++) {
    var key = arguments[i];
    if (!(key in obj))
      obj[key] = {};
    obj = obj[key];
  }

  return obj;
};

// _delete(a, b, c, d) deletes a[b][c][d], then a[b][c] unless it
// isn't empty, then a[b] unless it isn't empty.
//
Meteor._delete = function (obj /*, arguments */) {
  var stack = [obj];
  var leaf = true;
  for (var i = 1; i < arguments.length - 1; i++) {
    var key = arguments[i];
    if (!(key in obj)) {
      leaf = false;
      break;
    }
    obj = obj[key];
    if (typeof obj !== "object")
      break;
    stack.push(obj);
  }

  for (var i = stack.length - 1; i >= 0; i--) {
    var key = arguments[i+1];

    if (leaf)
      leaf = false;
    else
      for (var other in stack[i][key])
        return; // not empty -- we're done

    delete stack[i][key];
  }
};


/**
 * @memberOf Meteor
 * @locus Anywhere
 * @summary Takes a function that has a callback argument as the last one and promissify it.
 * One option would be to use node utils.promisify, but it won't work on the browser.
 * @param {Function} fn
 * @param {Object} [context]
 * @param {Boolean} [errorFirst] - If the callback follows the errorFirst style, default to true
 * @returns {function(...[*]): Promise<unknown>}
 */
Meteor.promisify = function (fn, context, errorFirst) {
  if (errorFirst === undefined) {
    errorFirst = true;
  }

  return function () {
    var self = this;
    var filteredArgs = Array.prototype.slice.call(arguments)
      .filter(function (i) { return i !== undefined; });

    return new Promise(function (resolve, reject) {
      var callback = Meteor.bindEnvironment(function (error, result) {
        var _error = error, _result = result;
        if (!errorFirst) {
          _error = result;
          _result = error;
        }

        if (_error) {
          return reject(_error);
        }

        resolve(_result);
      });

      filteredArgs.push(callback);

      return fn.apply(context || self, filteredArgs);
    });
  };
};

// wrapAsync can wrap any function that takes some number of arguments that
// can't be undefined, followed by some optional arguments, where the callback
// is the last optional argument.
// e.g. fs.readFile(pathname, [callback]),
// fs.open(pathname, flags, [mode], [callback])
// For maximum effectiveness and least confusion, wrapAsync should be used on
// functions where the callback is the only argument of type Function.

/**
 * @memberOf Meteor
 * @summary Wrap a function that takes a callback function as its final parameter.
 * The signature of the callback of the wrapped function should be `function(error, result){}`.
 * On the server, the wrapped function can be used either synchronously (without passing a callback) or asynchronously
 * (when a callback is passed). On the client, a callback is always required; errors will be logged if there is no callback.
 * If a callback is provided, the environment captured when the original function was called will be restored in the callback.
 * The parameters of the wrapped function must not contain any optional parameters or be undefined, as the callback function is expected to be the final, non-undefined parameter.
 * @locus Anywhere
 * @param {Function} func A function that takes a callback as its final parameter
 * @param {Object} [context] Optional `this` object against which the original function will be invoked
 */
Meteor.wrapAsync = function (fn, context) {
  return function (/* arguments */) {
    var self = context || this;
    var newArgs = Array.prototype.slice.call(arguments);
    var callback;

    for (var i = newArgs.length - 1; i >= 0; --i) {
      var arg = newArgs[i];
      var type = typeof arg;
      if (type !== "undefined") {
        if (type === "function") {
          callback = arg;
        }
        break;
      }
    }

    if (! callback) {
      callback = logErr;
      ++i; // Insert the callback just after arg.
    }

    newArgs[i] = Meteor.bindEnvironment(callback);
    return fn.apply(self, newArgs);
  };
};

Meteor.wrapFn = function (fn) {
  return fn;
};

// Sets child's prototype to a new object whose prototype is parent's
// prototype. Used as:
//   Meteor._inherits(ClassB, ClassA).
//   _.extend(ClassB.prototype, { ... })
// Inspired by CoffeeScript's `extend` and Google Closure's `goog.inherits`.
var hasOwn = Object.prototype.hasOwnProperty;
Meteor._inherits = function (Child, Parent) {
  // copy Parent static properties
  for (var key in Parent) {
    // make sure we only copy hasOwnProperty properties vs. prototype
    // properties
    if (hasOwn.call(Parent, key)) {
      Child[key] = Parent[key];
    }
  }

  // a middle member of prototype chain: takes the prototype from the Parent
  var Middle = function () {
    this.constructor = Child;
  };
  Middle.prototype = Parent.prototype;
  Child.prototype = new Middle();
  Child.__super__ = Parent.prototype;
  return Child;
};

var warnedAboutWrapAsync = false;

/**
 * @deprecated in 0.9.3
 */
Meteor._wrapAsync = function(fn, context) {
  if (! warnedAboutWrapAsync) {
    Meteor._debug("Meteor._wrapAsync has been renamed to Meteor.wrapAsync");
    warnedAboutWrapAsync = true;
  }
  return Meteor.wrapAsync.apply(Meteor, arguments);
};

function logErr(err) {
  if (err) {
    return Meteor._debug(
      "Exception in callback of async function",
      err
    );
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/setimmediate.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Chooses one of three setImmediate implementations:
//
// * Native setImmediate (IE 10, Node 0.9+)
//
// * postMessage (many browsers)
//
// * setTimeout  (fallback)
//
// The postMessage implementation is based on
// https://github.com/NobleJS/setImmediate/tree/1.0.1
//
// Don't use `nextTick` for Node since it runs its callbacks before
// I/O, which is stricter than we're looking for.
//
// Not installed as a polyfill, as our public API is `Meteor.defer`.
// Since we're not trying to be a polyfill, we have some
// simplifications:
//
// If one invocation of a setImmediate callback pauses itself by a
// call to alert/prompt/showModelDialog, the NobleJS polyfill
// implementation ensured that no setImmedate callback would run until
// the first invocation completed.  While correct per the spec, what it
// would mean for us in practice is that any reactive updates relying
// on Meteor.defer would be hung in the main window until the modal
// dialog was dismissed.  Thus we only ensure that a setImmediate
// function is called in a later event loop.
//
// We don't need to support using a string to be eval'ed for the
// callback, arguments to the function, or clearImmediate.

"use strict";

var global = this;


// IE 10, Node >= 9.1

function useSetImmediate() {
  if (! global.setImmediate)
    return null;
  else {
    var setImmediate = function (fn) {
      global.setImmediate(fn);
    };
    setImmediate.implementation = 'setImmediate';
    return setImmediate;
  }
}


// Android 2.3.6, Chrome 26, Firefox 20, IE 8-9, iOS 5.1.1 Safari

function usePostMessage() {
  // The test against `importScripts` prevents this implementation
  // from being installed inside a web worker, where
  // `global.postMessage` means something completely different and
  // can't be used for this purpose.

  if (!global.postMessage || global.importScripts) {
    return null;
  }

  // Avoid synchronous post message implementations.

  var postMessageIsAsynchronous = true;
  var oldOnMessage = global.onmessage;
  global.onmessage = function () {
      postMessageIsAsynchronous = false;
  };
  global.postMessage("", "*");
  global.onmessage = oldOnMessage;

  if (! postMessageIsAsynchronous)
    return null;

  var funcIndex = 0;
  var funcs = {};

  // Installs an event handler on `global` for the `message` event: see
  // * https://developer.mozilla.org/en/DOM/window.postMessage
  // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

  // XXX use Random.id() here?
  var MESSAGE_PREFIX = "Meteor._setImmediate." + Math.random() + '.';

  function isStringAndStartsWith(string, putativeStart) {
    return (typeof string === "string" &&
            string.substring(0, putativeStart.length) === putativeStart);
  }

  function onGlobalMessage(event) {
    // This will catch all incoming messages (even from other
    // windows!), so we need to try reasonably hard to avoid letting
    // anyone else trick us into firing off. We test the origin is
    // still this window, and that a (randomly generated)
    // unpredictable identifying prefix is present.
    if (event.source === global &&
        isStringAndStartsWith(event.data, MESSAGE_PREFIX)) {
      var index = event.data.substring(MESSAGE_PREFIX.length);
      try {
        if (funcs[index])
          funcs[index]();
      }
      finally {
        delete funcs[index];
      }
    }
  }

  if (global.addEventListener) {
    global.addEventListener("message", onGlobalMessage, false);
  } else {
    global.attachEvent("onmessage", onGlobalMessage);
  }

  var setImmediate = function (fn) {
    // Make `global` post a message to itself with the handle and
    // identifying prefix, thus asynchronously invoking our
    // onGlobalMessage listener above.
    ++funcIndex;
    funcs[funcIndex] = fn;
    global.postMessage(MESSAGE_PREFIX + funcIndex, "*");
  };
  setImmediate.implementation = 'postMessage';
  return setImmediate;
}


function useTimeout() {
  var setImmediate = function (fn) {
    global.setTimeout(fn, 0);
  };
  setImmediate.implementation = 'setTimeout';
  return setImmediate;
}


Meteor._setImmediate =
  useSetImmediate() ||
  usePostMessage() ||
  useTimeout();

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/timers.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function withoutInvocation(f) {
  if (Package.ddp) {
    var DDP = Package.ddp.DDP;
    var CurrentInvocation =
      DDP._CurrentMethodInvocation ||
      // For backwards compatibility, as explained in this issue:
      // https://github.com/meteor/meteor/issues/8947
      DDP._CurrentInvocation;

    var invocation = CurrentInvocation.get();
    if (invocation && invocation.isSimulation) {
      throw new Error("Can't set timers inside simulations");
    }

    return function () {
      CurrentInvocation.withValue(null, f);
    };
  } else {
    return f;
  }
}

function bindAndCatch(context, f) {
  return Meteor.bindEnvironment(withoutInvocation(f), context);
}

// Meteor.setTimeout and Meteor.setInterval callbacks scheduled
// inside a server method are not part of the method invocation and
// should clear out the CurrentMethodInvocation environment variable.

/**
 * @memberOf Meteor
 * @summary Call a function in the future after waiting for a specified delay.
 * @locus Anywhere
 * @param {Function} func The function to run
 * @param {Number} delay Number of milliseconds to wait before calling function
 */
Meteor.setTimeout = function (f, duration) {
  return setTimeout(bindAndCatch("setTimeout callback", f), duration);
};

/**
 * @memberOf Meteor
 * @summary Call a function repeatedly, with a time delay between calls.
 * @locus Anywhere
 * @param {Function} func The function to run
 * @param {Number} delay Number of milliseconds to wait between each function call.
 */
Meteor.setInterval = function (f, duration) {
  return setInterval(bindAndCatch("setInterval callback", f), duration);
};

/**
 * @memberOf Meteor
 * @summary Cancel a repeating function call scheduled by `Meteor.setInterval`.
 * @locus Anywhere
 * @param {Object} id The handle returned by `Meteor.setInterval`
 */
Meteor.clearInterval = function(x) {
  return clearInterval(x);
};

/**
 * @memberOf Meteor
 * @summary Cancel a function call scheduled by `Meteor.setTimeout`.
 * @locus Anywhere
 * @param {Object} id The handle returned by `Meteor.setTimeout`
 */
Meteor.clearTimeout = function(x) {
  return clearTimeout(x);
};

// XXX consider making this guarantee ordering of defer'd callbacks, like
// Tracker.afterFlush or Node's nextTick (in practice). Then tests can do:
//    callSomethingThatDefersSomeWork();
//    Meteor.defer(expect(somethingThatValidatesThatTheWorkHappened));

/**
 * @memberOf Meteor
 * @summary Defer execution of a function to run asynchronously in the background (similar to `Meteor.setTimeout(func, 0)`.
 * @locus Anywhere
 * @param {Function} func The function to run
 */
Meteor.defer = function (f) {
  Meteor._setImmediate(bindAndCatch("defer callback", f));
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/errors.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Makes an error subclass which properly contains a stack trace in most
// environments. constructor can set fields on `this` (and should probably set
// `message`, which is what gets displayed at the top of a stack trace).
//
Meteor.makeErrorType = function (name, constructor) {
  var errorClass = function (/*arguments*/) {
    // Ensure we get a proper stack trace in most Javascript environments
    if (Error.captureStackTrace) {
      // V8 environments (Chrome and Node.js)
      Error.captureStackTrace(this, errorClass);
    } else {
      // Borrow the .stack property of a native Error object.
      this.stack = new Error().stack;
    }
    // Safari magically works.

    constructor.apply(this, arguments);

    this.errorType = name;
  };

  Meteor._inherits(errorClass, Error);

  return errorClass;
};

// This should probably be in the livedata package, but we don't want
// to require you to use the livedata package to get it. Eventually we
// should probably rename it to DDP.Error and put it back in the
// 'livedata' package (which we should rename to 'ddp' also.)
//
// Note: The DDP server assumes that Meteor.Error EJSON-serializes as an object
// containing 'error' and optionally 'reason' and 'details'.
// The DDP client manually puts these into Meteor.Error objects. (We don't use
// EJSON.addType here because the type is determined by location in the
// protocol, not text on the wire.)

/**
 * @summary This class represents a symbolic error thrown by a method.
 * @locus Anywhere
 * @class
 * @param {String} error A string code uniquely identifying this kind of error.
 * This string should be used by callers of the method to determine the
 * appropriate action to take, instead of attempting to parse the reason
 * or details fields.
 *
 * For legacy reasons, some built-in Meteor functions such as `check` throw
 * errors with a number in this field.
 *
 * @param {String} [reason] Optional.  A short human-readable summary of the
 * error, like 'Not Found'.
 * @param {String} [details] Optional.  Additional information about the error,
 * like a textual stack trace.
 */
Meteor.Error = Meteor.makeErrorType(
  "Meteor.Error",
  function (error, reason, details) {
    var self = this;

    // Newer versions of DDP use this property to signify that an error
    // can be sent back and reconstructed on the calling client.
    self.isClientSafe = true;

    // String code uniquely identifying this kind of error.
    self.error = error;

    // Optional: A short human-readable summary of the error. Not
    // intended to be shown to end users, just developers. ("Not Found",
    // "Internal Server Error")
    self.reason = reason;

    // Optional: Additional information about the error, say for
    // debugging. It might be a (textual) stack trace if the server is
    // willing to provide one. The corresponding thing in HTTP would be
    // the body of a 404 or 500 response. (The difference is that we
    // never expect this to be shown to end users, only developers, so
    // it doesn't need to be pretty.)
    self.details = details;

    // This is what gets displayed at the top of a stack trace. Current
    // format is "[404]" (if no reason is set) or "File not found [404]"
    if (self.reason)
      self.message = self.reason + ' [' + self.error + ']';
    else
      self.message = '[' + self.error + ']';
  });

// Meteor.Error is basically data and is sent over DDP, so you should be able to
// properly EJSON-clone it. This is especially important because if a
// Meteor.Error is thrown through a Future, the error, reason, and details
// properties become non-enumerable so a standard Object clone won't preserve
// them and they will be lost from DDP.
Meteor.Error.prototype.clone = function () {
  var self = this;
  return new Meteor.Error(self.error, self.reason, self.details);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/asl-helpers.js                                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// In Meteor versions with fibers, __meteor_bootstrap__.isFibersDisabled
// is always undefined.
Meteor.isFibersDisabled = typeof __meteor_bootstrap__ === 'object' &&
  __meteor_bootstrap__.isFibersDisabled !== undefined;
Meteor._isFibersEnabled = !Meteor.isFibersDisabled;

function getAsl() {
  if (!Meteor.isFibersDisabled) {
    throw new Error('Can not use async hooks when fibers are enabled');
  }

  if (!global.__METEOR_ASYNC_LOCAL_STORAGE) {
    // lazily create __METEOR_ASYNC_LOCAL_STORAGE since this might run in older Meteor
    // versions that are incompatible with async hooks
    var AsyncLocalStorage = Npm.require('async_hooks').AsyncLocalStorage;
    global.__METEOR_ASYNC_LOCAL_STORAGE = new AsyncLocalStorage();
  }

  return global.__METEOR_ASYNC_LOCAL_STORAGE;
}

function getAslStore() {
  if (!Meteor.isServer) {
    return {};
  }

  var als = getAsl();
  return als.getStore() || {};
}

function getValueFromAslStore(key) {
  return getAslStore()[key];
}

function updateAslStore(key, value) {
  return getAslStore()[key] = value;
}

function runFresh(fn) {
  var als = getAsl();
  return als.run({}, fn);
}

Meteor._getAsl = getAsl;
Meteor._getAslStore = getAslStore;
Meteor._getValueFromAslStore = getValueFromAslStore;
Meteor._updateAslStore = updateAslStore;
Meteor._runFresh = runFresh;

Meteor._runAsync = function (fn, ctx, store) {
  if (store === undefined) {
    store = {};
  }
  var als = getAsl();

  return als.run(
    store || Meteor._getAslStore(),
    function () {
      return fn.call(ctx);
    }
  );
};

Meteor._isPromise = function (r) {
  return r && typeof r.then === 'function';
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/async_helpers.js                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor._noYieldsAllowed = function (f) {
  var result = f();
  if (Meteor._isPromise(result)) {
    throw new Error("function is a promise when calling Meteor._noYieldsAllowed");
  }
  return result
};

function FakeDoubleEndedQueue () {
  this.queue = [];
}

FakeDoubleEndedQueue.prototype.push = function (task) {
  this.queue.push(task);
};

FakeDoubleEndedQueue.prototype.shift = function () {
  return this.queue.shift();
};

FakeDoubleEndedQueue.prototype.isEmpty = function () {
  return this.queue.length === 0;
};

Meteor._DoubleEndedQueue = Meteor.isServer ? Npm.require('denque') : FakeDoubleEndedQueue;

// Meteor._SynchronousQueue is a queue which runs task functions serially.
// Tasks are assumed to be synchronous: ie, it's assumed that they are
// done when they return.
//
// It has two methods:
//   - queueTask queues a task to be run, and returns immediately.
//   - runTask queues a task to be run, and then yields. It returns
//     when the task finishes running.
//
// It's safe to call queueTask from within a task, but not runTask (unless
// you're calling runTask from a nested Fiber).
//
// Somewhat inspired by async.queue, but specific to blocking tasks.
// XXX break this out into an NPM module?
// XXX could maybe use the npm 'schlock' module instead, which would
//     also support multiple concurrent "read" tasks
//
function AsynchronousQueue () {
  this._taskHandles = new Meteor._DoubleEndedQueue();
  this._runningOrRunScheduled = false;
  // This is true if we're currently draining.  While we're draining, a further
  // drain is a noop, to prevent infinite loops.  "drain" is a heuristic type
  // operation, that has a meaning like unto "what a naive person would expect
  // when modifying a table from an observe"
  this._draining = false;
}
Object.assign(AsynchronousQueue.prototype, {
  queueTask(task) {
    const self = this;
    self._taskHandles.push({
      task: task,
      name: task.name
    });
    self._scheduleRun();
  },

  async _scheduleRun() {
    // Already running or scheduled? Do nothing.
    if (this._runningOrRunScheduled)
      return;

    this._runningOrRunScheduled = true;

    let resolve;
    const promise = new Promise(r => resolve = r);
    const runImmediateHandle = (fn) => {
      if (Meteor.isServer) {
        Meteor._runFresh(() => setImmediate(fn))
        return;
      }
      setTimeout(fn, 0);
    };
    runImmediateHandle(() => {
      this._run().finally(resolve);
    });
    return promise;
  },

  async _run() {
    if (!this._runningOrRunScheduled)
      throw new Error("expected to be _runningOrRunScheduled");

    if (this._taskHandles.isEmpty()) {
      // Done running tasks! Don't immediately schedule another run, but
      // allow future tasks to do so.
      this._runningOrRunScheduled = false;
      return;
    }
    const taskHandle = this._taskHandles.shift();
    let exception;
    // Run the task.
    try {
      await taskHandle.task();
    } catch (err) {
      if (taskHandle.resolver) {
        // We'll throw this exception through runTask.
        exception = err;
      } else {
        Meteor._debug("Exception in queued task", err);
      }
    }

    // Soon, run the next task, if there is any.
    this._runningOrRunScheduled = false;
    this._scheduleRun();

    if (taskHandle.resolver) {
      if (exception) {
        taskHandle.resolver(null, exception);
      } else {
        taskHandle.resolver();
      }
    }
  },

  async runTask(task) {
    let resolver;
    const promise = new Promise(
      (resolve, reject) =>
      (resolver = (res, rej) => {
        if (rej) {
          reject(rej);
          return;
        }
        resolve(res);
      })
    );

    const handle = {
      task: Meteor.bindEnvironment(task, function (e) {
        Meteor._debug('Exception from task', e);
        throw e;
      }),
      name: task.name,
      resolver,
    };
    this._taskHandles.push(handle);
    await this._scheduleRun();
    return promise;
  },

  flush() {
    return this.runTask(() => { });
  },

  async drain() {
    if (this._draining)
      return;

    this._draining = true;
    while (!this._taskHandles.isEmpty()) {
      await this.flush();
    }
    this._draining = false;
  }
});

Meteor._AsynchronousQueue = AsynchronousQueue;


// Sleep. Mostly used for debugging (eg, inserting latency into server
// methods).
//
const _sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
Meteor._sleepForMs = function (ms) {
  return _sleep(ms);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/startup_server.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup = function startup(callback) {
  callback = Meteor.wrapFn(callback);
  if (process.env.METEOR_PROFILE) {
    // Create a temporary error to capture the current stack trace.
    var error = new Error("Meteor.startup");

    // Capture the stack trace of the Meteor.startup call, excluding the
    // startup stack frame itself.
    Error.captureStackTrace(error, startup);

    callback.stack = error.stack
      .split(/\n\s*/) // Split lines and remove leading whitespace.
      .slice(0, 2) // Only include the call site.
      .join(" ") // Collapse to one line.
      .replace(/^Error: /, ""); // Not really an Error per se.
  }

  var bootstrap = global.__meteor_bootstrap__;
  if (bootstrap &&
      bootstrap.startupHooks) {
    bootstrap.startupHooks.push(callback);
  } else {
    // We already started up. Just call it now.
    callback();
  }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/debug.js                                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
if (Meteor.isServer) {
  if (typeof __meteor_runtime_config__ === 'object') {
    __meteor_runtime_config__.debug =
      !!process.env.NODE_INSPECTOR_IPC ||
      !!process.env.VSCODE_INSPECTOR_OPTIONS ||
      process.execArgv.some(function(_arg) {
        return /^--(inspect|debug)(-brk)?(=\d+)?$/i.test(_arg);
      });
  }
}

Meteor.isDebug = Meteor.isClient
  ? typeof window === 'object' && !!window.__meteor_runtime_config__.debug
  : typeof __meteor_runtime_config__ === 'object' &&
  !!__meteor_runtime_config__.debug;

var suppress = 0;

// replacement for console.log. This is a temporary API. We should
// provide a real logging API soon (possibly just a polyfill for
// console?)
//
// NOTE: this is used on the server to print the warning about
// having autopublish enabled when you probably meant to turn it
// off. it's not really the proper use of something called
// _debug. the intent is for this message to go to the terminal and
// be very visible. if you change _debug to go someplace else, etc,
// please fix the autopublish code to do something reasonable.
//
Meteor._debug = function (/* arguments */) {
  if (suppress) {
    suppress--;
    return;
  }
  if (typeof console !== 'undefined' &&
      typeof console.log !== 'undefined') {
    if (arguments.length == 0) { // IE Companion breaks otherwise
      // IE10 PP4 requires at least one argument
      console.log('');
    } else {
      // IE doesn't have console.log.apply, it's not a real Object.
      // http://stackoverflow.com/questions/5538972/console-log-apply-not-working-in-ie9
      // http://patik.com/blog/complete-cross-browser-console-log/
      if (typeof console.log.apply === "function") {
        // Most browsers

        // Chrome and Safari only hyperlink URLs to source files in first argument of
        // console.log, so try to call it with one argument if possible.
        // Approach taken here: If all arguments are strings, join them on space.
        // See https://github.com/meteor/meteor/pull/732#issuecomment-13975991
        var allArgumentsOfTypeString = true;
        for (var i = 0; i < arguments.length; i++)
          if (typeof arguments[i] !== "string")
            allArgumentsOfTypeString = false;

        if (allArgumentsOfTypeString)
          console.log.apply(console, [Array.prototype.join.call(arguments, " ")]);
        else
          console.log.apply(console, arguments);

      } else if (typeof Function.prototype.bind === "function") {
        // IE9
        var log = Function.prototype.bind.call(console.log, console);
        log.apply(console, arguments);
      }
    }
  }
};

// Suppress the next 'count' Meteor._debug messsages. Use this to
// stop tests from spamming the console.
//
Meteor._suppress_log = function (count) {
  suppress += count;
};

Meteor._suppressed_log_expected = function () {
  return suppress !== 0;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/string_utils.js                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Like Perl's quotemeta: quotes all regexp metacharacters.
// Code taken from
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
Meteor._escapeRegExp = function (string) {
    return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/test_environment.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //


var TEST_METADATA_STR;
if (Meteor.isClient) {
  TEST_METADATA_STR = meteorEnv.TEST_METADATA;
} else {
  TEST_METADATA_STR = process.env.TEST_METADATA;
}

var TEST_METADATA = JSON.parse(TEST_METADATA_STR || "{}");
var testDriverPackageName = TEST_METADATA.driverPackage;

// Note that if we are in test-packages mode neither of these will be set,
// but we will have a test driver package
/** 
 *@memberof Meteor
 * @summary Boolean variable. True when running unit tests (false if running
 * tests in full app mode).
 * @locus Anywhere
 * @static
 * @type {Boolean}
 */
Meteor.isTest = !!TEST_METADATA.isTest;

/** 
 *@memberof Meteor
 * @summary Boolean variable.  True if running tests against your application i.e `meteor test --full-app`.
 * @locus Anywhere
 * @static
 * @type {Boolean}
 */
Meteor.isAppTest = !!TEST_METADATA.isAppTest;

/** 
 *@memberof Meteor
 * @summary Boolean variable.  True if running tests against a Meteor package.
 * @locus Anywhere
 * @static
 * @type {Boolean}
 */
Meteor.isPackageTest = !!testDriverPackageName && !Meteor.isTest && !Meteor.isAppTest; 

if (typeof testDriverPackageName === "string") {
  Meteor.startup(function() {
    var testDriverPackage = Package[testDriverPackageName];
    if (! testDriverPackage) {
      throw new Error("Can't find test driver package: " + testDriverPackageName);
    }

    // On the client, the test driver *must* define `runTests`
    if (Meteor.isClient) {
      if (typeof testDriverPackage.runTests !== "function") {
        throw new Error("Test driver package " + testDriverPackageName
          + " missing `runTests` export");
      }
      testDriverPackage.runTests();
    } else {
      // The server can optionally define `start`
      if (typeof testDriverPackage.start === "function") {
        testDriverPackage.start();
      }
    }
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/dynamics_nodejs.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Implementation of dynamic scoping, for use on the server with AsyncLocalStorage
let nextSlot = 0;
let callAsyncMethodRunning = false;

const CURRENT_VALUE_KEY_NAME = "currentValue";
const UPPER_CALL_DYNAMICS_KEY_NAME = "upperCallDynamics";

const SLOT_CALL_KEY = "slotCall";
/**
 * @memberOf Meteor
 * @summary Constructor for EnvironmentVariable
 * @locus Anywhere
 * @class
 */
class EnvironmentVariableAsync {
  constructor() {
    this.slot = nextSlot++;
  }

  /**
   * @memberOf Meteor.EnvironmentVariable
   * @summary Getter for the current value of the variable, or `undefined` if
   * called from outside a `withValue` callback.
   * @method get
   * @locus Anywhere
   * @returns {any} The current value of the variable, or `undefined` if no
   */
  get() {
    if (this.slot !== Meteor._getValueFromAslStore(SLOT_CALL_KEY)) {
      const dynamics = Meteor._getValueFromAslStore(UPPER_CALL_DYNAMICS_KEY_NAME) || {};

      return dynamics[this.slot];
    }
    return Meteor._getValueFromAslStore(CURRENT_VALUE_KEY_NAME);
  }

  getOrNullIfOutsideFiber() {
    return this.get();
  }

  /**
   * @summary takes a value and a function, calls the function with the value set for the duration of the call
   * @memberof Meteor.EnvironmentVariable
   * @method withValue
   * @param {any} value The value to set for the duration of the function call
   * @param {Function} func The function to call with the new value of the
   * @param {Object} [options] Optional additional properties for adding in [asl](https://nodejs.org/api/async_context.html#class-asynclocalstorage)
   * @returns {Promise<any>} The return value of the function
   */
  withValue(value, func, options = {}) {
    const self = this;
    const slotCall = self.slot;
    const dynamics = Object.assign(
      {},
      Meteor._getValueFromAslStore(UPPER_CALL_DYNAMICS_KEY_NAME) || {}
    );

    if (slotCall != null) {
      dynamics[slotCall] = value;
    }

    return Meteor._runAsync(
      function () {
        Meteor._updateAslStore(CURRENT_VALUE_KEY_NAME, value);
        Meteor._updateAslStore(UPPER_CALL_DYNAMICS_KEY_NAME, dynamics);
        return func();
      },
      self,
      Object.assign(
        {
          callId: `${this.slot}-${Math.random()}`,
          [SLOT_CALL_KEY]: this.slot,
        },
        options,
      ),
    );
  }

  _set(context) {
    const _meteor_dynamics =
      Meteor._getValueFromAslStore("_meteor_dynamics") || [];
    _meteor_dynamics[this.slot] = context;
  }

  _setNewContextAndGetCurrent(value) {
    let _meteor_dynamics = Meteor._getValueFromAslStore("_meteor_dynamics");
    if (!_meteor_dynamics) {
      _meteor_dynamics = [];
    }

    const saved = _meteor_dynamics[this.slot];
    this._set(value);
    return saved;
  }

  _isCallAsyncMethodRunning() {
    return callAsyncMethodRunning;
  }

  _setCallAsyncMethodRunning(value) {
    callAsyncMethodRunning = value;
  }
}

/**
 * @memberOf Meteor
 * @summary Constructor for EnvironmentVariable
 * @locus Anywhere
 * @class
 */
Meteor.EnvironmentVariable = EnvironmentVariableAsync;

// Meteor application code is always supposed to be run inside a
// fiber. bindEnvironment ensures that the function it wraps is run from
// inside a fiber and ensures it sees the values of Meteor environment
// variables that are set at the time bindEnvironment is called.
//
// If an environment-bound function is called from outside a fiber (eg, from
// an asynchronous callback from a non-Meteor library such as MongoDB), it'll
// kick off a new fiber to execute the function, and returns undefined as soon
// as that fiber returns or yields (and func's return value is ignored).
//
// If it's called inside a fiber, it works normally (the
// return value of the function will be passed through, and no new
// fiber will be created.)
//
// `onException` should be a function or a string.  When it is a
// function, it is called as a callback when the bound function raises
// an exception.  If it is a string, it should be a description of the
// callback, and when an exception is raised a debug message will be
// printed with the description.
/**
 * @summary Stores the current Meteor environment variables, and wraps the
 * function to run with the environment variables restored. On the server, the
 * function is wrapped within Async Local Storage.
 *
 *  This function has two reasons:
 *  1. Return the function to be executed on the MeteorJS context, having it assigned in Async Local Storage.
 *  2. Better error handling, the error message will be more clear.
 * @locus Anywhere
 * @memberOf Meteor
 * @param {Function} func Function that is wrapped
 * @param {Function} onException
 * @param {Object} _this Optional `this` object against which the original function will be invoked
 * @return {Function} The wrapped function
 */
Meteor.bindEnvironment = (func, onException, _this) => {
  const dynamics = Meteor._getValueFromAslStore(CURRENT_VALUE_KEY_NAME);
  const currentSlot = Meteor._getValueFromAslStore(SLOT_CALL_KEY);

  if (!onException || typeof onException === "string") {
    var description = onException || "callback of async function";
    onException = function (error) {
      Meteor._debug("Exception in " + description + ":", error);
    };
  } else if (typeof onException !== "function") {
    throw new Error(
      "onException argument must be a function, string or undefined for Meteor.bindEnvironment()."
    );
  }

  return function (/* arguments */) {
    var args = Array.prototype.slice.call(arguments);

    var runWithEnvironment = function () {
      return Meteor._runAsync(
        () => {
          let ret;
          try {
            if (currentSlot) {
              Meteor._updateAslStore(CURRENT_VALUE_KEY_NAME, dynamics);
            }
            ret = func.apply(_this, args);

            // Using this strategy to be consistent between client and server and stop always returning a promise from the server
            if (Meteor._isPromise(ret)) {
              ret = ret.catch(onException);
            }
          } catch (e) {
            onException(e);
          }
          return ret;
        },
        _this,
        {
          callId: `bindEnvironment-${Math.random()}`,
          [SLOT_CALL_KEY]: currentSlot,
        }
      );
    };

    if (Meteor._getAslStore()) {
      return runWithEnvironment();
    }

    return Meteor._getAsl().run({}, runWithEnvironment);
  };
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/url_server.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
if (process.env.ROOT_URL &&
    typeof __meteor_runtime_config__ === "object") {
  __meteor_runtime_config__.ROOT_URL = process.env.ROOT_URL;
  if (__meteor_runtime_config__.ROOT_URL) {
    var parsedUrl = Npm.require('url').parse(__meteor_runtime_config__.ROOT_URL);
    // Sometimes users try to pass, eg, ROOT_URL=mydomain.com.
    if (!parsedUrl.host || ['http:', 'https:'].indexOf(parsedUrl.protocol) === -1) {
      throw Error("$ROOT_URL, if specified, must be an URL");
    }
    var pathPrefix = parsedUrl.pathname;
    if (pathPrefix.slice(-1) === '/') {
      // remove trailing slash (or turn "/" into "")
      pathPrefix = pathPrefix.slice(0, -1);
    }
    __meteor_runtime_config__.ROOT_URL_PATH_PREFIX = pathPrefix;
  } else {
    __meteor_runtime_config__.ROOT_URL_PATH_PREFIX = "";
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/url_common.js                                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * @summary Generate an absolute URL pointing to the application. The server reads from the `ROOT_URL` environment variable to determine where it is running. This is taken care of automatically for apps deployed to Galaxy, but must be provided when using `meteor build`.
 * @locus Anywhere
 * @param {String} [path] A path to append to the root URL. Do not include a leading "`/`".
 * @param {Object} [options]
 * @param {Boolean} options.secure Create an HTTPS URL.
 * @param {Boolean} options.replaceLocalhost Replace localhost with 127.0.0.1. Useful for services that don't recognize localhost as a domain name.
 * @param {String} options.rootUrl Override the default ROOT_URL from the server environment. For example: "`http://foo.example.com`"
 */
Meteor.absoluteUrl = function (path, options) {
  // path is optional
  if (!options && typeof path === 'object') {
    options = path;
    path = undefined;
  }
  // merge options with defaults
  options = Object.assign({}, Meteor.absoluteUrl.defaultOptions, options || {});

  var url = options.rootUrl;
  if (!url)
    throw new Error("Must pass options.rootUrl or set ROOT_URL in the server environment");

  if (!/^http[s]?:\/\//i.test(url)) // url starts with 'http://' or 'https://'
    url = 'http://' + url; // we will later fix to https if options.secure is set

  if (! url.endsWith("/")) {
    url += "/";
  }

  if (path) {
    // join url and path with a / separator
    while (path.startsWith("/")) {
      path = path.slice(1);
    }
    url += path;
  }

  // turn http to https if secure option is set, and we're not talking
  // to localhost.
  if (options.secure &&
      /^http:/.test(url) && // url starts with 'http:'
      !/http:\/\/localhost[:\/]/.test(url) && // doesn't match localhost
      !/http:\/\/127\.0\.0\.1[:\/]/.test(url)) // or 127.0.0.1
    url = url.replace(/^http:/, 'https:');

  if (options.replaceLocalhost)
  {
    url = url.replace( /^http:\/\/localhost([:\/].*)/, 'http://127.0.0.1$1');
  }
  return url;
};

// allow later packages to override default options
var defaultOptions = Meteor.absoluteUrl.defaultOptions = {};

// available only in a browser environment
var location = typeof window === "object" && window.location;

if (typeof __meteor_runtime_config__ === "object" &&
    __meteor_runtime_config__.ROOT_URL) {
  defaultOptions.rootUrl = __meteor_runtime_config__.ROOT_URL;
} else if (location &&
           location.protocol &&
           location.host) {
  defaultOptions.rootUrl = location.protocol + "//" + location.host;
}

// Make absolute URLs use HTTPS by default if the current window.location
// uses HTTPS. Since this is just a default, it can be overridden by
// passing { secure: false } if necessary.
if (location &&
    location.protocol === "https:") {
  defaultOptions.secure = true;
}

Meteor._relativeToSiteRootUrl = function (link) {
  if (typeof __meteor_runtime_config__ === "object" &&
      link.substr(0, 1) === "/")
    link = (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || "") + link;
  return link;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/flush-buffers-on-exit-in-windows.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
if (process.platform === "win32") {
  /*
   * Based on https://github.com/cowboy/node-exit
   *
   * Copyright (c) 2013 "Cowboy" Ben Alman
   * Licensed under the MIT license.
   */
  var origProcessExit = process.exit.bind(process);
  process.exit = function (exitCode) {
    var streams = [process.stdout, process.stderr];
    var drainCount = 0;
    // Actually exit if all streams are drained.
    function tryToExit() {
      if (drainCount === streams.length) {
        origProcessExit(exitCode);
      }
    }
    streams.forEach(function(stream) {
      // Count drained streams now, but monitor non-drained streams.
      if (stream.bufferSize === 0) {
        drainCount++;
      } else {
        stream.write('', 'utf-8', function() {
          drainCount++;
          tryToExit();
        });
      }
      // Prevent further writing.
      stream.write = function() {};
    });
    // If all streams were already drained, exit now.
    tryToExit();
    // In Windows, when run as a Node.js child process, a script utilizing
    // this library might just exit with a 0 exit code, regardless. This code,
    // despite the fact that it looks a bit crazy, appears to fix that.
    process.on('exit', function() {
      origProcessExit(exitCode);
    });
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/meteor/emitter-promise.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const { EventEmitter } = Npm.require('events');

const DEFAULT_TIMEOUT =
  Meteor.settings && Meteor.settings.EMITTER_PROMISE_DEFAULT_TIMEOUT || 3000;

/**
 *
 * @param emitter { EventEmitter } - EventEmitter used to trigger events emitter.emit("data", OBJ) or emitter.emit("error", ERROR_OBJ).
 * @param timeout { Number } - Timout em ms to wait for events. Default 3000ms.
 * @param onSuccess {function(data)} - Function called on succeceful receive data.
 * @param onError {function(err)} - Function called when error or timeout occur.
 * @returns {{promise: Promise<unknown>, emitter: EventEmitter}}
 */
const newPromiseResolver = ({
  emitter = new EventEmitter(),
  timeout = DEFAULT_TIMEOUT,
  onSuccess,
  onError,
} = {}) => {
  const promise = new Promise((resolve, reject) => {
    const handler = setTimeout(() => {
      emitter.emit(
        'error',
        new Meteor.Error(`EmitterPromise timeout: ${timeout}ms.`)
      );
    }, timeout);
    emitter.once('data', (data) => {
      clearTimeout(handler);
      emitter.removeAllListeners();
      resolve(data);
      if (onSuccess) {
        onSuccess(data);
      }
    });
    emitter.once('error', (err) => {
      clearTimeout(handler);
      emitter.removeAllListeners();
      reject(err);
      if (onError) {
        onError(err);
      }
    });
  });
  return {
    emitter,
    promise,
  };
};

EmitterPromise = {
  newPromiseResolver,
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
return {
  export: function () { return {
      Meteor: Meteor,
      global: global,
      meteorEnv: meteorEnv,
      EmitterPromise: EmitterPromise
    };}
}});
