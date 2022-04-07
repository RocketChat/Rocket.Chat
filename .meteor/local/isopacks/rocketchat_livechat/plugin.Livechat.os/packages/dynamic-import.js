(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;
var fetch = Package.fetch.fetch;

var require = meteorInstall({"node_modules":{"meteor":{"dynamic-import":{"server.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/dynamic-import/server.js                                                                     //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
"use strict";

const assert = require("assert");
const { readFileSync } = require("fs");
const {
  join: pathJoin,
  normalize: pathNormalize,
} = require("path");
const { fetchURL } = require("./common.js");
const { Meteor } = require("meteor/meteor");
const hasOwn = Object.prototype.hasOwnProperty;

require("./security.js");

const client = require("./client.js");

Meteor.startup(() => {
  if (! Package.webapp) {
    // If the webapp package is not in use, there's no way for the
    // dynamic-import package to fetch dynamic modules, so we should
    // abandon the rest of the logic in this module.
    //
    // If api.use("webapp") appeared in dynamic-import/package.js, then
    // Package.webapp would always be defined here, of course, but that
    // would be a bad idea, because the dynamic-import package should not
    // single-handedly force a dependency on webapp if the program does
    // not otherwise need a web server (e.g., when the program is an
    // isopacket or build plugin instead of a web application).
    //
    // Note that the client.js module (imported above) still defines
    // Module.prototype.dynamicImport, which will work as long as no
    // modules need to be fetched.
    return;
  }

  Object.keys(dynamicImportInfo).forEach(setUpPlatform);

  Package.webapp.WebAppInternals.meteorInternalHandlers.use(
    fetchURL,
    middleware
  );
});

function setUpPlatform(platform) {
  const info = dynamicImportInfo[platform];

  if (info.dynamicRoot) {
    info.dynamicRoot = pathNormalize(info.dynamicRoot);
  }

  if (platform === "server") {
    client.setSecretKey(info.key = randomId(40));
  }
}

function randomId(n) {
  let s = "";
  while (s.length < n) {
    s += Math.random().toString(36).slice(2);
  }
  return s.slice(0, n);
}

function middleware(request, response) {
  // Allow dynamic import() requests from any origin.
  response.setHeader("Access-Control-Allow-Origin", "*");

  if (request.method === "OPTIONS") {
    const acrh = request.headers["access-control-request-headers"];
    response.setHeader('Allow', 'OPTIONS, POST');
    response.setHeader('Content-Length', '0');
    response.setHeader(
      "Access-Control-Allow-Headers",
      typeof acrh === "string" ? acrh : "*"
    );
    response.setHeader("Access-Control-Allow-Methods", "POST");
    response.end();

  } else if (request.method === "POST") {
    const chunks = [];
    request.on("data", chunk => chunks.push(chunk));
    request.on("end", () => {
      try {
        const tree = JSON.stringify(readTree(
          JSON.parse(Buffer.concat(chunks)),
          getPlatform(request)
        ), null, 2);

        response.writeHead(200, {
          "Content-Type": "application/json"
        });

        response.end(tree);

      } catch (e) {
        response.writeHead(400, {
          "Content-Type": "application/json"
        });

        response.end(JSON.stringify(
          Meteor.isDevelopment && e.message || "bad request"
        ));
      }
    });

  } else {
    const body = `method ${request.method} not allowed`;
    response.writeHead(405, {
      Allow: "OPTIONS, POST",
      'Content-Length': Buffer.byteLength(body),
      "Cache-Control": "no-cache"
    });
    response.end(body);
  }
}

function getPlatform(request) {
  // If the __dynamicImport request includes a secret key, and it matches
  // dynamicImportInfo[platform].key, use platform instead of the default
  // platform, web.browser.
  const secretKey = request.query.key;
  if (typeof secretKey === "string") {
    for (const p of Object.keys(dynamicImportInfo)) {
      if (secretKey === dynamicImportInfo[p].key) {
        return p;
      }
    }
  }

  return Package.webapp.WebApp.categorizeRequest(request).arch;
}

function readTree(tree, platform) {
  const pathParts = [];

  function walk(node) {
    if (! node) {
      return null;
    }

    if (typeof node !== "object") {
      return read(pathParts, platform);
    }

    let empty = true;

    Object.keys(node).forEach(name => {
      pathParts.push(name);
      const result = walk(node[name]);
      if (result === null) {
        // If the read function returns null, omit this module from the
        // resulting tree.
        delete node[name];
      } else {
        node[name] = result;
        empty = false;
      }
      assert.strictEqual(pathParts.pop(), name);
    });

    if (empty) {
      // If every recursive call to walk(node[name]) returned null,
      // remove this node from the resulting tree by returning null.
      return null;
    }

    return node;
  }

  return walk(tree);
}

function read(pathParts, platform) {
  const { dynamicRoot } = dynamicImportInfo[platform];
  const absPath = pathNormalize(pathJoin(
    dynamicRoot,
    pathJoin(...pathParts).replace(/:/g, "_")
  ));

  if (! absPath.startsWith(dynamicRoot)) {
    console.error("bad dynamic import path:", absPath);
    return null;
  }

  const cache = getCache(platform);
  if (hasOwn.call(cache, absPath)) {
    return cache[absPath];
  }

  try {
    return cache[absPath] = readFileSync(absPath, "utf8");
  } catch (e) {
    console.error(e.stack || e);
    return null;
  }
}

const cachesByPlatform = Object.create(null);
function getCache(platform) {
  return hasOwn.call(cachesByPlatform, platform)
    ? cachesByPlatform[platform]
    : cachesByPlatform[platform] = Object.create(null);
}

const { onMessage } = require("meteor/inter-process-messaging");

onMessage("client-refresh", () => {
  // The caches for the web.browser[.legacy] platforms need to be
  // discarded whenever a client-only refresh occurs, so the new client
  // bundle does not fetch stale module data from dynamic import(). This
  // message is sent by tools/runners/run-app.js and also consumed by the
  // autoupdate package.
  Object.keys(cachesByPlatform).forEach(platform => {
    delete cachesByPlatform[platform];
  });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cache.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/dynamic-import/cache.js                                                                      //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
var dbPromise;

var canUseCache =
  // The server doesn't benefit from dynamic module fetching, and almost
  // certainly doesn't support IndexedDB.
  Meteor.isClient &&
  // Cordova bundles all modules into the monolithic initial bundle, so
  // the dynamic module cache won't be necessary.
  ! Meteor.isCordova &&
  // Caching can be confusing in development, and is designed to be a
  // transparent optimization for production performance.
  Meteor.isProduction;

function getIDB() {
  if (typeof indexedDB !== "undefined") return indexedDB;
  if (typeof webkitIndexedDB !== "undefined") return webkitIndexedDB;
  if (typeof mozIndexedDB !== "undefined") return mozIndexedDB;
  if (typeof OIndexedDB !== "undefined") return OIndexedDB;
  if (typeof msIndexedDB !== "undefined") return msIndexedDB;
}

function withDB(callback) {
  dbPromise = dbPromise || new Promise(function (resolve, reject) {
    var idb = getIDB();
    if (! idb) {
      throw new Error("IndexedDB not available");
    }

    // Incrementing the version number causes all existing object stores
    // to be deleted and recreates those specified by objectStoreMap.
    var request = idb.open("MeteorDynamicImportCache", 2);

    request.onupgradeneeded = function (event) {
      var db = event.target.result;

      // It's fine to delete existing object stores since onupgradeneeded
      // is only called when we change the DB version number, and the data
      // we're storing is disposable/reconstructible.
      Array.from(db.objectStoreNames).forEach(db.deleteObjectStore, db);

      Object.keys(objectStoreMap).forEach(function (name) {
        db.createObjectStore(name, objectStoreMap[name]);
      });
    };

    request.onerror = makeOnError(reject, "indexedDB.open");
    request.onsuccess = function (event) {
      resolve(event.target.result);
    };
  });

  return dbPromise.then(callback, function (error) {
    return callback(null);
  });
}

var objectStoreMap = {
  sourcesByVersion: { keyPath: "version" }
};

function makeOnError(reject, source) {
  return function (event) {
    reject(new Error(
      "IndexedDB failure in " + source + " " +
        JSON.stringify(event.target)
    ));

    // Returning true from an onerror callback function prevents an
    // InvalidStateError in Firefox during Private Browsing. Silencing
    // that error is safe because we handle the error more gracefully by
    // passing it to the Promise reject function above.
    // https://github.com/meteor/meteor/issues/8697
    return true;
  };
}

var checkCount = 0;

exports.checkMany = function (versions) {
  var ids = Object.keys(versions);
  var sourcesById = Object.create(null);

  // Initialize sourcesById with null values to indicate all sources are
  // missing (unless replaced with actual sources below).
  ids.forEach(function (id) {
    sourcesById[id] = null;
  });

  if (! canUseCache) {
    return Promise.resolve(sourcesById);
  }

  return withDB(function (db) {
    if (! db) {
      // We thought we could used IndexedDB, but something went wrong
      // while opening the database, so err on the side of safety.
      return sourcesById;
    }

    var txn = db.transaction([
      "sourcesByVersion"
    ], "readonly");

    var sourcesByVersion = txn.objectStore("sourcesByVersion");

    ++checkCount;

    function finish() {
      --checkCount;
      return sourcesById;
    }

    return Promise.all(ids.map(function (id) {
      return new Promise(function (resolve, reject) {
        var version = versions[id];
        if (version) {
          var sourceRequest = sourcesByVersion.get(version);
          sourceRequest.onerror = makeOnError(reject, "sourcesByVersion.get");
          sourceRequest.onsuccess = function (event) {
            var result = event.target.result;
            if (result) {
              sourcesById[id] = result.source;
            }
            resolve();
          };
        } else resolve();
      });
    })).then(finish, finish);
  });
};

var pendingVersionsAndSourcesById = Object.create(null);

exports.setMany = function (versionsAndSourcesById) {
  if (canUseCache) {
    Object.assign(
      pendingVersionsAndSourcesById,
      versionsAndSourcesById
    );

    // Delay the call to flushSetMany so that it doesn't contribute to the
    // amount of time it takes to call module.dynamicImport.
    if (! flushSetMany.timer) {
      flushSetMany.timer = setTimeout(flushSetMany, 100);
    }
  }
};

function flushSetMany() {
  if (checkCount > 0) {
    // If checkMany is currently underway, postpone the flush until later,
    // since updating the cache is less important than reading from it.
    return flushSetMany.timer = setTimeout(flushSetMany, 100);
  }

  flushSetMany.timer = null;

  var versionsAndSourcesById = pendingVersionsAndSourcesById;
  pendingVersionsAndSourcesById = Object.create(null);

  return withDB(function (db) {
    if (! db) {
      // We thought we could used IndexedDB, but something went wrong
      // while opening the database, so err on the side of safety.
      return;
    }

    var setTxn = db.transaction([
      "sourcesByVersion"
    ], "readwrite");

    var sourcesByVersion = setTxn.objectStore("sourcesByVersion");

    return Promise.all(
      Object.keys(versionsAndSourcesById).map(function (id) {
        var info = versionsAndSourcesById[id];
        return new Promise(function (resolve, reject) {
          var request = sourcesByVersion.put({
            version: info.version,
            source: info.source
          });
          request.onerror = makeOnError(reject, "sourcesByVersion.put");
          request.onsuccess = resolve;
        });
      })
    );
  });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"client.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/dynamic-import/client.js                                                                     //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
var Module = module.constructor;
var cache = require("./cache.js");
var meteorInstall = require("meteor/modules").meteorInstall;
var dynamicVersions = require("./dynamic-versions.js");

// Fix for Safari 14 bug (https://bugs.webkit.org/show_bug.cgi?id=226547), do not delete this unused var
var idb = global.indexedDB;

var dynamicImportSettings = Meteor.settings
    && Meteor.settings.public
    && Meteor.settings.public.packages
    && Meteor.settings.public.packages['dynamic-import'] || {};

// Call module.dynamicImport(id) to fetch a module and any/all of its
// dependencies that have not already been fetched, and evaluate them as
// soon as they arrive. This runtime API makes it very easy to implement
// ECMAScript dynamic import(...) syntax.
Module.prototype.dynamicImport = function (id) {
  var module = this;
  return module.prefetch(id).then(function () {
    return getNamespace(module, id);
  });
};

// Called by Module.prototype.prefetch if there are any missing dynamic
// modules that need to be fetched.
meteorInstall.fetch = function (ids) {
  var tree = Object.create(null);
  var versions = Object.create(null);
  var missing;

  function addSource(id, source) {
    addToTree(tree, id, makeModuleFunction(id, source, ids[id].options));
  }

  function addMissing(id) {
    addToTree(missing = missing || Object.create(null), id, 1);
  }

  Object.keys(ids).forEach(function (id) {
    var version = dynamicVersions.get(id);
    if (version) {
      versions[id] = version;
    } else {
      addMissing(id);
    }
  });

  return cache.checkMany(versions).then(function (sources) {
    Object.keys(sources).forEach(function (id) {
      var source = sources[id];
      if (source) {
        addSource(id, source);
      } else {
        addMissing(id);
      }
    });

    return missing && fetchMissing(missing).then(function (results) {
      var versionsAndSourcesById = Object.create(null);
      var flatResults = flattenModuleTree(results);

      Object.keys(flatResults).forEach(function (id) {
        var source = flatResults[id];
        addSource(id, source);

        var version = dynamicVersions.get(id);
        if (version) {
          versionsAndSourcesById[id] = {
            version: version,
            source: source
          };
        }
      });

      cache.setMany(versionsAndSourcesById);
    });

  }).then(function () {
    return tree;
  });
};

function flattenModuleTree(tree) {
  var parts = [""];
  var result = Object.create(null);

  function walk(t) {
    if (t && typeof t === "object") {
      Object.keys(t).forEach(function (key) {
        parts.push(key);
        walk(t[key]);
        parts.pop();
      });
    } else if (typeof t === "string") {
      result[parts.join("/")] = t;
    }
  }

  walk(tree);

  return result;
}

function makeModuleFunction(id, source, options) {
  // By calling (options && options.eval || eval) in a wrapper function,
  // we delay the cost of parsing and evaluating the module code until the
  // module is first imported.
  return function () {
    // If an options.eval function was provided in the second argument to
    // meteorInstall when this bundle was first installed, use that
    // function to parse and evaluate the dynamic module code in the scope
    // of the package. Otherwise fall back to indirect (global) eval.
    return (options && options.eval || eval)(
      // Wrap the function(require,exports,module){...} expression in
      // parentheses to force it to be parsed as an expression.
      "(" + source + ")\n//# sourceURL=" + id
    ).apply(this, arguments);
  };
}

var secretKey = null;
exports.setSecretKey = function (key) {
  secretKey = key;
};

var fetchURL = require("./common.js").fetchURL;

function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

function fetchMissing(missingTree) {
  // If the hostname of the URL returned by Meteor.absoluteUrl differs
  // from location.host, then we'll be making a cross-origin request here,
  // but that's fine because the dynamic-import server sets appropriate
  // CORS headers to enable fetching dynamic modules from any
  // origin. Browsers that check CORS do so by sending an additional
  // preflight OPTIONS request, which may add latency to the first dynamic
  // import() request, so it's a good idea for ROOT_URL to match
  // location.host if possible, though not strictly necessary.

  var url = fetchURL;

  var useLocationOrigin = dynamicImportSettings.useLocationOrigin;

  var disableLocationOriginIframe = dynamicImportSettings.disableLocationOriginIframe;

  if (useLocationOrigin && location && !(disableLocationOriginIframe && inIframe())) {
    url = location.origin.concat(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '', url);
  } else {
    url = Meteor.absoluteUrl(url);
  }

  if (secretKey) {
    url += "key=" + secretKey;
  }

  return fetch(url, {
    method: "POST",
    body: JSON.stringify(missingTree)
  }).then(function (res) {
    if (! res.ok) throw res;
    return res.json();
  });
}

function addToTree(tree, id, value) {
  var parts = id.split("/");
  var lastIndex = parts.length - 1;
  parts.forEach(function (part, i) {
    if (part) {
      tree = tree[part] = tree[part] ||
        (i < lastIndex ? Object.create(null) : value);
    }
  });
}

function getNamespace(module, id) {
  var namespace;

  module.link(id, {
    "*": function (ns) {
      namespace = ns;
    }
  });

  // This helps with Babel interop, since we're not just returning the
  // module.exports object.
  Object.defineProperty(namespace, "__esModule", {
    value: true,
    enumerable: false
  });

  return namespace;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"common.js":function module(require,exports){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/dynamic-import/common.js                                                                     //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
exports.fetchURL = "/__meteor__/dynamic-import/fetch";

///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dynamic-versions.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/dynamic-import/dynamic-versions.js                                                           //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
// This magic double-underscored identifier gets replaced in
// tools/isobuild/bundler.js with a tree of hashes of all dynamic
// modules, for use in client.js and cache.js.
var versions = {};

const METEOR_PREFIX = '/node_modules/meteor/';

exports.get = function (id) {
  var tree = versions;
  var version = null;

  id.split("/").some(function (part) {
    if (part) {
      // If the tree contains identifiers for Meteor packages with colons
      // in their names, the colons should not have been replaced by
      // underscores, but there's a bug that results in that behavior, so
      // for now it seems safest to be tolerant of underscores here.
      // https://github.com/meteor/meteor/pull/9103
      tree = tree[part] || tree[part.replace(":", "_")];
    }

    if (! tree) {
      // Terminate the search without reassigning version.
      return true;
    }

    if (typeof tree === "string") {
      version = tree;
      return true;
    }
  });

  return version;
};

function getFlatModuleArray(tree) {
  var parts = [""];
  var result = [];

  function walk(t) {
    if (t && typeof t === "object") {
      Object.keys(t).forEach(function (key) {
        parts.push(key);
        walk(t[key]);
        parts.pop();
      });
    } else if (typeof t === "string") {
      result.push(parts.join("/"));
    }
  }

  walk(tree);

  return result;
}

// If Package.appcache is loaded, preload additional modules after the
// core bundle has been loaded.
function precacheOnLoad(event) {
  // Check inside onload to make sure Package.appcache has had a chance to
  // become available.
  if (! Package.appcache) {
    return;
  }

  // Prefetch in chunks to reduce overhead. If we call module.prefetch(id)
  // multiple times in the same tick of the event loop, all those modules
  // will be fetched in one HTTP POST request.
  function prefetchInChunks(modules, amount) {
    Promise.all(modules.splice(0, amount).map(function (id) {
      return new Promise(function (resolve, reject) {
        module.prefetch(id).then(resolve).catch(
          function (err) {
            // we probably have a : _ mismatch
            // what can get wrong if we do the replacement
            // 1. a package with a name like a_b:package will not resolve
            // 2. someone falsely imports a_package that does not exist but a
            // package a:package exists, so this one gets imported and its usage
            // will fail
            if (id.indexOf(METEOR_PREFIX) === 0) {
              module.prefetch(
                METEOR_PREFIX + id.replace(METEOR_PREFIX, '').replace('_', ':')
              ).then(resolve).catch(reject);
            } else {
              reject(err);
            }
          })
      });
    })).then(function () {
      if (modules.length > 0) {
        setTimeout(function () {
          prefetchInChunks(modules, amount);
        }, 0);
      }
    });
  }

  // Get a flat array of modules and start prefetching.
  prefetchInChunks(getFlatModuleArray(versions), 50);
}

// Use window.onload to only prefetch after the main bundle has loaded.
if (global.addEventListener) {
  global.addEventListener('load', precacheOnLoad, false);
} else if (global.attachEvent) {
  global.attachEvent('onload', precacheOnLoad);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"security.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/dynamic-import/security.js                                                                   //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.startup(function () {
  const bpc = Package["browser-policy-content"];
  const BP = bpc && bpc.BrowserPolicy;
  const BPc = BP && BP.content;
  if (BPc) {
    // The ability to evaluate new code is essential for loading dynamic
    // modules. Without eval, we would be forced to load modules using
    // <script src=...> tags, and then there would be no way to save those
    // modules to a local cache (or load them from the cache) without the
    // unique response caching abilities of service workers, which are not
    // available in all browsers, and cannot be polyfilled in a way that
    // satisfies Content Security Policy eval restrictions. Moreover, eval
    // allows us to evaluate dynamic module code in the original package
    // scope, which would never be possible using <script> tags. If you're
    // deploying an app in an environment that demands a Content Security
    // Policy that forbids eval, your only option is to bundle all dynamic
    // modules in the initial bundle. Fortunately, that works perfectly
    // well; you just won't get the performance benefits of dynamic module
    // fetching.
    BPc.allowEval();
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/dynamic-import/server.js");

/* Exports */
Package._define("dynamic-import", exports);

})();
