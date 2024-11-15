"use strict";

// This module should be compatible with PhantomJS v1, just like the other files
// in reify/lib/runtime. Node 4+ features like const/let and arrow functions are
// not acceptable here, and importing any npm packages should be contemplated
// with extreme skepticism.

var utils = require("./utils.js");
var Entry = require("./entry.js");

var handleAsSync = Object.create(null);

// The exports.enable method can be used to enable the Reify runtime for
// specific module objects, or for Module.prototype (where implemented),
// to make the runtime available throughout the entire module system.
exports.enable = function (mod) {
  if (mod.link !== moduleLink) {
    mod.link = moduleLink;
    mod["export"] = moduleExport;
    mod.exportDefault = moduleExportDefault;
    mod.exportAs = moduleExportAs;
    mod.runSetters = runSetters;
    mod.wrapAsync = wrapAsync;

    // Legacy shorthand for mod.exportAs("*").
    mod.makeNsSetter = moduleMakeNsSetter;

    var origRequire = mod.require;
    mod.require = function (id) {
      var exports = origRequire.call(this, id);
      var path = this.resolve(id);
      var entry = Entry.getOrNull(path);

      if (
        entry &&
        entry.asyncEvaluation &&
        !handleAsSync[path]
      ) {
        var promise = new Promise(function (resolve, reject) {
          if (entry.status === 'evaluated') {
            if (entry.evaluationError) {
              return reject(entry.evaluationError);
            }

            return resolve(exports);
          }

          entry._onEvaluated.push(function () {
            if (entry.evaluationError) {
              return reject(entry.evaluationError);
            }

            resolve(exports);
          });
        });

        Object.defineProperty(promise, '__reifyAsyncModule', {
          value: exports,
          enumerable: false,
          writable: false,
          configurable: true
        });

        return promise;
      }

      return exports;
    }

    return true;
  }


  return false;
};

exports._requireAsSync = function (path) {
  handleAsSync[path] = true;
}

// Calling module.link(id, setters) resolves the given ID using
// module.resolve(id), which should return a canonical absolute module
// identifier string (like require.resolve); then creates an Entry object
// for the child module and evaluates its code (if this is the first time
// it has been imported) by calling module.require(id). Finally, the
// provided setter functions will be called with values exported by the
// module, possibly multiple times when/if those exported values change.
// The module.link name is intended to evoke the "liveness" of the
// exported bindings, since we are subscribing to all future exports of
// the child module, not just taking a snapshot of its current exports.
function moduleLink(id, setters, key) {
  utils.setESModule(this.exports);
  var parentEntry = Entry.getOrCreate(this.id, this);

  var absChildId = this.resolve(id);
  var childEntry = Entry.getOrCreate(absChildId);

  if (utils.isObject(setters)) {
    childEntry.addSetters(this, setters, key);
  }

  var exports = this.require(absChildId);

  // TODO: If we can use the original require, this code would no longer be needed
  if (
    utils.isObject(exports) &&
    Object.prototype.hasOwnProperty.call(exports, '__reifyAsyncModule')
  ) {
    // If it fails, the error will be handled by the async wrapper and entry
    exports.catch(function () {});
    exports = exports.__reifyAsyncModule;
  }

  if (childEntry.module === null) {
    childEntry.module = {
      id: absChildId,
      exports: exports
    };
  }

  childEntry.runSetters();

  if (
    childEntry.asyncEvaluation &&
    // If the parent module is no longer linking, then it can't wait
    // for the async module to finish being evaluated
    parentEntry.status !== 'linking' &&
    // If the child entry is evaluated, then there is no need to wait
    // and we can allow the nested import
    // This is needed for dynamic imports to work in Meteor
    childEntry.status !== 'evaluated'
    ) {
    throw new Error('Nested imports can not import an async module');
  }

  if (childEntry.asyncEvaluation) {
    parentEntry.addAsyncDep(childEntry);
  }
}

// Register getter functions for local variables in the scope of an export
// statement. Pass true as the second argument to indicate that the getter
// functions always return the same values.
function moduleExport(getters, constant) {
  utils.setESModule(this.exports);
  var entry = Entry.getOrCreate(this.id, this);
  entry.addGetters(getters, constant);
  if (this.loaded) {
    // If the module has already been evaluated, then we need to trigger
    // another round of entry.runSetters calls, which begins by calling
    // entry.runModuleGetters(module).
    entry.runSetters();
  }
}

// Register a getter function that always returns the given value.
function moduleExportDefault(value) {
  return this["export"]({
    "default": function () {
      return value;
    }
  }, true);
}

// Returns a function suitable for passing as a setter callback to
// module.link. If name is an identifier, calling the function will set
// the export of that name to the given value. If the name is "*", all
// properties of the value object will be exported by name, except for
// "default" (use "*+" instead of "*" to include it). Why the "default"
// property is skipped: https://github.com/tc39/ecma262/issues/948
function moduleExportAs(name) {
  var entry = this;
  var includeDefault = name === "*+";
  var setter = function (value) {
    if (name === "*" || name === "*+") {
      Object.keys(value).forEach(function (key) {
        if (includeDefault || key !== "default") {
          utils.copyKey(key, entry.exports, value);
        }
      });
    } else {
      entry.exports[name] = value;
    }
  };

  if (name !== '*+' && name !== "*") {
    setter.exportAs = name;
  }

  return setter;
}

// Platform-specific code should find a way to call this method whenever
// the module system is about to return module.exports from require. This
// might happen more than once per module, in case of dependency cycles,
// so we want Module.prototype.runSetters to run each time.
function runSetters(valueToPassThrough, names) {
  Entry.getOrCreate(this.id, this).runSetters(names, true);

  // Assignments to exported local variables get wrapped with calls to
  // module.runSetters, so module.runSetters returns the
  // valueToPassThrough parameter to allow the value of the original
  // expression to pass through. For example,
  //
  //   export var a = 1;
  //   console.log(a += 3);
  //
  // becomes
  //
  //   module.export("a", () => a);
  //   var a = 1;
  //   console.log(module.runSetters(a += 3));
  //
  // This ensures module.runSetters runs immediately after the assignment,
  // and does not interfere with the larger computation.
  return valueToPassThrough;
}

// Legacy helper that returns a function that takes a namespace object and
// copies the properties of the namespace to module.exports, excluding any
// "default" property (unless includeDefault is true), which is useful for
// implementing `export * from "module"`.
//
// Instead of using this helper like so:
//
//   module.link(id, { "*": module.makeNsSetter() });
//
// non-legacy code should simply use a string-valued setter:
//
//   module.link(id, { "*": "*" });
//
// or, to include the "default" property:
//
//   module.link(id, { "*": "*+" });
//
// This helper may be removed in a future version of Reify.
function moduleMakeNsSetter(includeDefault) {
  return this.exportAs(includeDefault ? "*+" : "*");
}

function wrapAsync(body, options) {
  var module = this;
  var entry = Entry.getOrCreate(module.id, module);
  entry.hasTLA = options.async;

  // Caches the result for waitForDeps. This can be:
  // - undefined before waitForDeps was called
  // - null if there are no deps to wait for
  // - a promise if there are deps to wait for
  var waitForDepsResult = undefined;

  body.call(options.self, module, function waitForDeps() {
    // waitForDeps is called twice, once to check if the module should wait
    // and again to await the promise
    if (waitForDepsResult === undefined) {

      // This code should run immediately after all deps are synchronously required
      // By setting entry.asyncEvaluation here, we avoid issues of dead locks from
      // circular deps - this module's deps won't be able to add
      // an _onEvaluating hook to this module
      entry.setAsyncEvaluation();

      if (entry.pendingAsyncDeps === 0) {
        waitForDepsResult = null;
        if (entry.status !== 'evaluating') {
          entry.changeStatus('evaluating');
        }

        // See the explanation for the duplicate if statement further down
        if (entry.asyncEvaluation && !entry.hasTLA) {
          entry.changeStatus('evaluated');
        }
      } else {
        var resolve;
        waitForDepsResult = new Promise(function (_resolve) {
          resolve = _resolve;
        });
        entry._onEvaluating.push(function () {
          // Resolves with a function that can be called to check errors.
          // This allows handling errors that happened between resolving this
          // promise, and the resolved function running. Errors can happen
          // between then when the module's deps do not use TLA, but have
          // asyncEvaluation set to true.
          resolve(function checkForError() {
            if (entry.evaluationError) {
              throw entry.evaluationError;
            }
          });

          // If the module has async deps but doesn't use TLA,
          // then any sync parent modules need to run
          // synchronously afterwards. Technically we aren't able to do that since
          // the parent module is awaiting a promise to know when to run.
          // However, resolving that promise now will cause the parent to run
          // before any microtasks created by this module, which in practice
          // should be close enough.
          if (entry.asyncEvaluation && !entry.hasTLA) {
            entry.changeStatus('evaluated');
          }
        });
      }
    }

    return waitForDepsResult;
  },
  function finish(error) {
    if (error) {
      entry.setEvaluationError(error);
    }

    if (entry.asyncEvaluation) {
      entry.runSetters();
    }

    if (entry.status !== 'evaluated') {
      entry.changeStatus('evaluated');
    }

    // The module and its deps have finished being evaluated,
    // so there will be no more errors to propagate.
    entry.allAsyncParents = [];
  }
  );

  if (entry.evaluationError && !entry.asyncEvaluation) {
    // This is a sync module. The error is thrown here so
    // it is outside of the async function
    // If you are trying to find where this error is from, set a breakpoint
    // above on the line that calls entry.setEvaluationError
    throw entry.evaluationError;
  }
}
