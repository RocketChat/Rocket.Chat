"use strict";

// This module should be compatible with PhantomJS v1, just like the other files
// in reify/lib/runtime. Node 4+ features like const/let and arrow functions are
// not acceptable here, and importing any npm packages should be contemplated
// with extreme skepticism.

var utils = require("./utils.js");

var GETTER_ERROR = {};
var NAN = {};
var UNDEFINED = {};
var hasOwn = Object.prototype.hasOwnProperty;
var keySalt = 0;

function Entry(id) {
  // The canonical absolute module ID of the module this Entry manages.
  this.id = id;

  // The Module object this Entry manages, unknown until module.export or
  // module.link is called for the first time.
  this.module = null;

  // The normalized namespace object that importers receive when they use
  // `import * as namespace from "..."` syntax.
  this.namespace = utils.createNamespace();

  // Getters for local variables exported from the managed module.
  this.getters = Object.create(null);

  // Setters for assigning to local variables in parent modules.
  this.setters = Object.create(null);

  // Map of setters added since the last broadcast (in the same shape as
  // entry.setters[name][key]), which should receive a broadcast the next time
  // entry.runSetters() is called, regardless of whether entry.snapshots[name]
  // has changed or not. Once called, setters are removed from this.newSetters,
  // but remain in this.setters.
  this.newSetters = Object.create(null);

  // Map from local names to snapshots of the corresponding local values, used
  // to determine when local values have changed and need to be re-broadcast.
  this.snapshots = Object.create(null);
}

var Ep = utils.setPrototypeOf(Entry.prototype, null);
var entryMap = Object.create(null);

Entry.getOrCreate = function (id, mod) {
  var entry = hasOwn.call(entryMap, id)
    ? entryMap[id]
    : entryMap[id] = new Entry(id);

  if (utils.isObject(mod) &&
      mod.id === entry.id) {
    entry.module = mod;
  }

  return entry;
};

function safeKeys(obj) {
  var keys = Object.keys(obj);
  var esModuleIndex = keys.indexOf("__esModule");
  if (esModuleIndex >= 0) {
    keys.splice(esModuleIndex, 1);
  }
  return keys;
}

Ep.addGetters = function (getters, constant) {
  var names = safeKeys(getters);
  var nameCount = names.length;
  constant = !! constant;

  for (var i = 0; i < nameCount; ++i) {
    var name = names[i];
    var getter = getters[name];

    if (typeof getter === "function" &&
        // Should this throw if this.getters[name] exists?
        ! (name in this.getters)) {
      this.getters[name] = getter;
      getter.constant = constant;
      getter.runCount = 0;
    }
  }
};

Ep.addSetters = function (parent, setters, key) {
  var names = safeKeys(setters);
  var nameCount = names.length;

  if (! nameCount) {
    return;
  }

  // If no key is provided, make a unique key. Otherwise, make sure the key is
  // distinct from keys provided by other parent modules.
  key = key === void 0
    ? makeUniqueKey()
    : parent.id + ":" + key;

  var entry = this;

  for (var i = 0; i < nameCount; ++i) {
    var name = names[i];
    var setter = normalizeSetterValue(parent, setters[name]);

    if (typeof setter === "function") {
      setter.parent = parent;
      // Store the setter as entry.setters[name][key], and also record it
      // temporarily in entry.newSetters, so we can be sure to run it when we
      // call entry.runSetters(names) below, even though entry.snapshots[name]
      // likely will not have changed for this name.
      utils.ensureObjectProperty(entry.setters, name)[key] = setter;
      utils.ensureObjectProperty(entry.newSetters, name)[key] = setter;
    }
  }

  entry.runSetters(names);
};

function normalizeSetterValue(module, setter) {
  if (typeof setter === "function") {
    return setter;
  }

  if (typeof setter === "string") {
    // If the value of the setter property is a string, the setter will
    // re-export the imported value using that string as the name of the
    // exported value. If the string is "*", all properties of the value
    // object will be re-exported as individual exports, except for the
    // "default" property (use "*+" instead of "*" to include it).
    return module.exportAs(setter);
  }

  if (Array.isArray(setter)) {
    switch (setter.length) {
    case 0: return null;
    case 1: return normalizeSetterValue(module, setter[0]);
    default:
      var setterFns = setter.map(function (elem) {
        return normalizeSetterValue(module, elem);
      });

      // Return a combined function that calls all of the nested setter
      // functions with the same value.
      return function (value) {
        setterFns.forEach(function (fn) {
          fn(value);
        });
      };
    }
  }

  return null;
}

Ep.runGetters = function (names) {
  // Before running getters, copy anything added to the exports object
  // over to the namespace. Values returned by getters take precedence
  // over these values, but we don't want to miss anything.
  syncExportsToNamespace(this, names);

  if (names === void 0 ||
      names.indexOf("*") >= 0) {
    names = Object.keys(this.getters);
  }

  var nameCount = names.length;

  for (var i = 0; i < nameCount; ++i) {
    var name = names[i];
    var value = runGetter(this, name);

    // If the getter is run without error, update both entry.namespace and
    // module.exports with the current value so that CommonJS require
    // calls remain consistent with module.watch.
    if (value !== GETTER_ERROR) {
      this.namespace[name] = value;
      this.module.exports[name] = value;
    }
  }
};

function syncExportsToNamespace(entry, names) {
  var setDefault = false;

  if (entry.module === null) return;
  var exports = entry.module.exports;

  if (! utils.getESModule(exports)) {
    // If the module entry is managing overrides module.exports, that
    // value should be exposed as the .default property of the namespace,
    // unless module.exports is marked as an ECMASCript module.
    entry.namespace.default = exports;
    setDefault = true;
  }

  if (! utils.isObjectLike(exports)) {
    return;
  }

  if (names === void 0 ||
      names.indexOf("*") >= 0) {
    names = Object.keys(exports);
  }

  names.forEach(function (key) {
    // Don't set any properties for which a getter function exists in
    // entry.getters, don't accidentally override entry.namespace.default,
    // and only copy own properties from entry.module.exports.
    if (! hasOwn.call(entry.getters, key) &&
        ! (setDefault && key === "default") &&
        hasOwn.call(exports, key)) {
      utils.copyKey(key, entry.namespace, exports);
    }
  });
}

// Called whenever module.exports might have changed, to trigger any
// setters associated with the newly exported values. The names parameter
// is optional; without it, all getters and setters will run.
// If the '*' setter needs to be run, but not the '*' getter (names includes
// all exports/getters that changed), the runNsSetter option can be enabled.
Ep.runSetters = function (names, runNsSetter) {
  // Make sure entry.namespace and module.exports are up to date before we
  // call getExportByName(entry, name).
  this.runGetters(names);

  if (runNsSetter && names !== void 0) {
    names.push('*');
  }

  // Lazily-initialized object mapping parent module identifiers to parent
  // module objects whose setters we might need to run.
  var parents;
  var parentNames;

  forEachSetter(this, names, function (setter, name, value) {
    if (parents === void 0) {
      parents = Object.create(null);
    }

    if (parentNames === void 0) {
      parentNames = Object.create(null);
    }

    var parentId = setter.parent.id;

    // When setters use the shorthand for re-exporting values, we know
    // which exports in the parent module were modified, and can do less work
    // when running the parent setters.
    // parentNames[parentId] is set to false if there are any setters that we do
    // not know which exports they modify
    if (setter.exportAs !== void 0 && parentNames[parentId] !== false) {
      parentNames[parentId] = parentNames[parentId] || [];
      parentNames[parentId].push(setter.exportAs);
    } else if (parentNames[parentId] !== false) {
      parentNames[parentId] = false;
    }

    parents[parentId] = setter.parent;

    // The param order for setters is `value` then `name` because the `name`
    // param is only used by namespace exports.
    setter(value, name);
  });

  if (! parents) {
    return;
  }

  // If any of the setters updated the module.exports of a parent module,
  // or updated local variables that are exported by that parent module,
  // then we must re-run any setters registered by that parent module.
  var parentIDs = Object.keys(parents);
  var parentIDCount = parentIDs.length;

  for (var i = 0; i < parentIDCount; ++i) {
    // What happens if parents[parentIDs[id]] === module, or if
    // longer cycles exist in the parent chain? Thanks to our snapshot
    // bookkeeping above, the runSetters broadcast will only proceed
    // as far as there are any actual changes to report.
    var parent = parents[parentIDs[i]];
    var parentEntry = entryMap[parent.id];
    if (parentEntry) {
      parentEntry.runSetters(
        parentNames[parentIDs[i]] || void 0,
        !!parentNames[parentIDs[i]]
      );
    }
  }
};

function createSnapshot(entry, name, newValue) {
  var newSnapshot = Object.create(null);
  var newKeys = [];

  if (name === "*") {
    safeKeys(newValue).forEach(function (keyOfValue) {
      // Evaluating value[key] is risky because the property might be
      // defined by a getter function that logs a deprecation warning (or
      // worse) when evaluated. For example, Node uses this trick to display
      // a deprecation warning whenever crypto.createCredentials is
      // accessed. Fortunately, when value[key] is defined by a getter
      // function, it's enough to check whether the getter function itself
      // has changed, since we are careful elsewhere to preserve getters
      // rather than prematurely evaluating them.
      newKeys.push(keyOfValue);
      newSnapshot[keyOfValue] = normalizeSnapshotValue(
        utils.valueOrGetter(newValue, keyOfValue)
      );
    });
  } else {
    newKeys.push(name);
    newSnapshot[name] = normalizeSnapshotValue(newValue);
  }

  var oldSnapshot = entry.snapshots[name];
  if (
    oldSnapshot &&
    newKeys.every(function (key) {
      return oldSnapshot[key] === newSnapshot[key]
    }) &&
    newKeys.length === Object.keys(oldSnapshot).length
  ) {
    return oldSnapshot;
  }

  return newSnapshot;
}

function normalizeSnapshotValue(value) {
  if (value === void 0) return UNDEFINED;
  if (value !== value && isNaN(value)) return NAN;
  return value;
}

// Obtain an array of keys in entry.setters[name] for which we need to run a
// setter function. If successful, entry.snapshot[name] will be updated and/or
// entry.newSetters[name] will be removed, so the returned keys will not be
// returned again until after the snapshot changes again. If the snapshot hasn't
// changed and there aren't any entry.newSetters[name] keys, this function
// returns undefined, to avoid allocating an empty array in the common case.
function consumeKeysGivenSnapshot(entry, name, snapshot) {
  if (entry.snapshots[name] !== snapshot) {
    entry.snapshots[name] = snapshot;
    // Since the keys of entry.newSetters[name] are a subset of those of
    // entry.setters[name], we can consume entry.newSetters[name] here too.
    delete entry.newSetters[name];
    return Object.keys(entry.setters[name]);
  }

  // If new setters have been added to entry.setters (and thus also to
  // entry.newSetters) since we last recorded entry.snapshots[name], we need to
  // run those setters (for the first time) in order to consider them up-to-date
  // with respect to entry.snapshots[name].
  var news = entry.newSetters[name];
  var newKeys = news && Object.keys(news);
  if (newKeys && newKeys.length) {
    // Consume the new keys so we don't consider them again.
    delete entry.newSetters[name];
    return newKeys;
  }
}

// Invoke the given callback once for every (setter, name, value) that needs to
// be called. Note that forEachSetter does not call any setters itself, only the
// given callback.
function forEachSetter(entry, names, callback) {
  if (names === void 0) {
    names = Object.keys(entry.setters);
  }

  names.forEach(function (name) {
    // Ignore setters asking for module.exports.__esModule.
    if (name === "__esModule") return;

    var settersByKey = entry.setters[name];
    if (!settersByKey) return;

    var getter = entry.getters[name];
    var alreadyCalledConstantGetter =
      typeof getter === "function" &&
      // Sometimes a getter function will throw because it's called
      // before the variable it's supposed to return has been
      // initialized, so we need to know that the getter function has
      // run to completion at least once.
      getter.runCount > 0 &&
      getter.constant;

    var value = getExportByName(entry, name);

    // Although we may have multiple setter functions with different keys in
    // settersByKey, we can compute a snapshot of value and check it against
    // entry.snapshots[name] before iterating over the individual setter
    // functions
    var snapshot = createSnapshot(entry, name, value);

    var keys = consumeKeysGivenSnapshot(entry, name, snapshot);
    if (keys === void 0) return;

    keys.forEach(function (key) {
      var setter = settersByKey[key];
      if (!setter) {
        return;
      }

      // Invoke the setter function with the updated value.
      callback(setter, name, value);

      if (alreadyCalledConstantGetter) {
        // If we happen to know this getter function has run successfully
        // (getter.runCount > 0), and will never return a different value
        // (getter.constant), then we can forget the corresponding setter,
        // because we've already reported that constant value. Note that we
        // can't forget the getter, because we need to remember the original
        // value in case anyone tampers with entry.module.exports[name].
        delete settersByKey[key];
      }
    });
  });
}

function getExportByName(entry, name) {
  if (name === "*") {
    return entry.namespace;
  }

  if (hasOwn.call(entry.namespace, name)) {
    return entry.namespace[name];
  }

  if (entry.module === null) return;
  var exports = entry.module.exports;

  if (name === "default" &&
      ! (utils.getESModule(exports) &&
         "default" in exports)) {
    return exports;
  }

  if (exports == null) {
    return;
  }

  return exports[name];
}

function makeUniqueKey() {
  return Math.random()
    .toString(36)
    // Add an incrementing salt to help track key ordering and also
    // absolutely guarantee we never return the same key twice.
    .replace("0.", ++keySalt + "$");
}

function runGetter(entry, name) {
  var getter = entry.getters[name];
  if (!getter) return GETTER_ERROR;
  try {
    var result = getter();
    ++getter.runCount;
    return result;
  } catch (e) {}
  return GETTER_ERROR;
}

module.exports = Entry;
