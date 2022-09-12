(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;

/* Package-scope variables */
var makeInstaller, meteorInstall;

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// packages/modules-runtime/.npm/package/node_modules/install/install.js     //
// This file is in bare mode and is not in its own closure.                  //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
                                                                             //
makeInstaller = function (options) {
  "use strict";

  options = options || {};

  // These file extensions will be appended to required module identifiers
  // if they do not exactly match an installed module.
  var defaultExtensions = options.extensions || [".js", ".json"];

  // If defined, the options.fallback function will be called when no
  // installed module is found for a required module identifier. Often
  // options.fallback will be implemented in terms of the native Node
  // require function, which has the ability to load binary modules.
  var fallback = options.fallback;

  // List of fields to look for in package.json files to determine the
  // main entry module of the package. The first field listed here whose
  // value is a string will be used to resolve the entry module.
  var mainFields = options.mainFields ||
    // If options.mainFields is absent and options.browser is truthy,
    // package resolution will prefer the "browser" field of package.json
    // files to the "main" field. Note that this only supports
    // string-valued "browser" fields for now, though in the future it
    // might make sense to support the object version, a la browserify.
    (options.browser ? ["browser", "main"] : ["main"]);

  var hasOwn = {}.hasOwnProperty;
  function strictHasOwn(obj, key) {
    return isObject(obj) && isString(key) && hasOwn.call(obj, key);
  }

  // Cache for looking up File objects given absolute module identifiers.
  // Invariants:
  //   filesByModuleId[module.id] === fileAppendId(root, module.id)
  //   filesByModuleId[module.id].module === module
  var filesByModuleId = {};

  // The file object representing the root directory of the installed
  // module tree.
  var root = new File("/", new File("/.."));
  var rootRequire = makeRequire(root);

  // Merges the given tree of directories and module factory functions
  // into the tree of installed modules and returns a require function
  // that behaves as if called from a module in the root directory.
  function install(tree, options) {
    if (isObject(tree)) {
      fileMergeContents(root, tree, options);
    }
    return rootRequire;
  }

  // Replace this function to enable Module.prototype.prefetch.
  install.fetch = function (ids) {
    throw new Error("fetch not implemented");
  };

  // This constructor will be used to instantiate the module objects
  // passed to module factory functions (i.e. the third argument after
  // require and exports), and is exposed as install.Module in case the
  // caller of makeInstaller wishes to modify Module.prototype.
  function Module(id) {
    this.id = id;

    // The Node implementation of module.children unfortunately includes
    // only those child modules that were imported for the first time by
    // this parent module (i.e., child.parent === this).
    this.children = [];

    // This object is an install.js extension that includes all child
    // modules imported by this module, even if this module is not the
    // first to import them.
    this.childrenById = {};
  }

  // Used to keep module.prefetch promise resolutions well-ordered.
  var lastPrefetchPromise;

  // May be shared by multiple sequential calls to module.prefetch.
  // Initialized to {} only when necessary.
  var missing;

  Module.prototype.prefetch = function (id) {
    var module = this;
    var parentFile = getOwn(filesByModuleId, module.id);

    lastPrefetchPromise = lastPrefetchPromise || Promise.resolve();
    var previousPromise = lastPrefetchPromise;

    function walk(module) {
      var file = getOwn(filesByModuleId, module.id);
      if (fileIsDynamic(file) && ! file.pending) {
        file.pending = true;
        missing = missing || {};

        // These are the data that will be exposed to the install.fetch
        // callback, so it's worth documenting each item with a comment.
        missing[module.id] = {
          // The CommonJS module object that will be exposed to this
          // dynamic module when it is evaluated. Note that install.fetch
          // could decide to populate module.exports directly, instead of
          // fetching anything. In that case, install.fetch should omit
          // this module from the tree that it produces.
          module: file.module,
          // List of module identifier strings imported by this module.
          // Note that the missing object already contains all available
          // dependencies (including transitive dependencies), so
          // install.fetch should not need to traverse these dependencies
          // in most cases; however, they may be useful for other reasons.
          // Though the strings are unique, note that two different
          // strings could resolve to the same module.
          deps: Object.keys(file.deps),
          // The options (if any) that were passed as the second argument
          // to the install(tree, options) function when this stub was
          // first registered. Typically contains options.extensions, but
          // could contain any information appropriate for the entire tree
          // as originally installed. These options will be automatically
          // inherited by the newly fetched modules, so install.fetch
          // should not need to modify them.
          options: file.options,
          // Any stub data included in the array notation from the
          // original entry for this dynamic module. Typically contains
          // "main" and/or "browser" fields for package.json files, and is
          // otherwise undefined.
          stub: file.stub
        };

        each(file.deps, function (parentId, id) {
          fileResolve(file, id);
        });

        each(module.childrenById, walk);
      }
    }

    return lastPrefetchPromise = new Promise(function (resolve) {
      var absChildId = module.resolve(id);
      each(module.childrenById, walk);
      resolve(absChildId);

    }).then(function (absChildId) {
      // Grab the current missing object and fetch its contents.
      var toBeFetched = missing;
      missing = null;

      function clearPending() {
        if (toBeFetched) {
          Object.keys(toBeFetched).forEach(function (id) {
            getOwn(filesByModuleId, id).pending = false;
          });
        }
      }

      return new Promise(function (resolve) {
        // The install.fetch function takes an object mapping missing
        // dynamic module identifiers to options objects, and should
        // return a Promise that resolves to a module tree that can be
        // installed. As an optimization, if there were no missing dynamic
        // modules, then we can skip calling install.fetch entirely.
        resolve(toBeFetched && install.fetch(toBeFetched));

      }).then(function (tree) {
        function both() {
          install(tree);
          clearPending();
          return absChildId;
        }

        // Although we want multiple install.fetch calls to run in
        // parallel, it is important that the promises returned by
        // module.prefetch are resolved in the same order as the original
        // calls to module.prefetch, because previous fetches may include
        // modules assumed to exist by more recent module.prefetch calls.
        // Whether previousPromise was resolved or rejected, carry on with
        // the installation regardless.
        return previousPromise.then(both, both);

      }, function (error) {
        // Fixes https://github.com/meteor/meteor/issues/10182.
        clearPending();
        throw error;
      });
    });
  };

  install.Module = Module;

  function getOwn(obj, key) {
    return strictHasOwn(obj, key) && obj[key];
  }

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function isFunction(value) {
    return typeof value === "function";
  }

  function isString(value) {
    return typeof value === "string";
  }

  function makeMissingError(id) {
    return new Error("Cannot find module '" + id + "'");
  }

  Module.prototype.resolve = function (id) {
    var file = fileResolve(filesByModuleId[this.id], id);
    if (file) return file.module.id;
    var error = makeMissingError(id);
    if (fallback && isFunction(fallback.resolve)) {
      return fallback.resolve(id, this.id, error);
    }
    throw error;
  };

  Module.prototype.require = function require(id) {
    var result = fileResolve(filesByModuleId[this.id], id);
    if (result) {
      return fileEvaluate(result, this);
    }

    var error = makeMissingError(id);

    if (isFunction(fallback)) {
      return fallback(
        id, // The missing module identifier.
        this.id, // ID of the parent module.
        error // The error we would have thrown.
      );
    }

    throw error;
  };

  function makeRequire(file) {
    var module = file.module;

    function require(id) {
      return module.require(id);
    }

    require.extensions = fileGetExtensions(file).slice(0);

    require.resolve = function resolve(id) {
      return module.resolve(id);
    };

    return require;
  }

  // File objects represent either directories or modules that have been
  // installed. When a `File` respresents a directory, its `.contents`
  // property is an object containing the names of the files (or
  // directories) that it contains. When a `File` represents a module, its
  // `.contents` property is a function that can be invoked with the
  // appropriate `(require, exports, module)` arguments to evaluate the
  // module. If the `.contents` property is a string, that string will be
  // resolved as a module identifier, and the exports of the resulting
  // module will provide the exports of the original file. The `.parent`
  // property of a File is either a directory `File` or `null`. Note that
  // a child may claim another `File` as its parent even if the parent
  // does not have an entry for that child in its `.contents` object.
  // This is important for implementing anonymous files, and preventing
  // child modules from using `../relative/identifier` syntax to examine
  // unrelated modules.
  function File(moduleId, parent) {
    var file = this;

    // Link to the parent file.
    file.parent = parent = parent || null;

    // The module object for this File, which will eventually boast an
    // .exports property when/if the file is evaluated.
    file.module = new Module(moduleId);
    filesByModuleId[moduleId] = file;

    // The .contents of the file can be either (1) an object, if the file
    // represents a directory containing other files; (2) a factory
    // function, if the file represents a module that can be imported; (3)
    // a string, if the file is an alias for another file; or (4) null, if
    // the file's contents are not (yet) available.
    file.contents = null;

    // Set of module identifiers imported by this module. Note that this
    // set is not necessarily complete, so don't rely on it unless you
    // know what you're doing.
    file.deps = {};
  }

  function fileEvaluate(file, parentModule) {
    var module = file.module;
    if (! strictHasOwn(module, "exports")) {
      var contents = file.contents;
      if (! contents) {
        // If this file was installed with array notation, and the array
        // contained one or more objects but no functions, then the combined
        // properties of the objects are treated as a temporary stub for
        // file.module.exports. This is particularly important for partial
        // package.json modules, so that the resolution logic can know the
        // value of the "main" and/or "browser" fields, at least, even if
        // the rest of the package.json file is not (yet) available.
        if (file.stub) {
          return file.stub;
        }

        throw makeMissingError(module.id);
      }

      if (parentModule) {
        module.parent = parentModule;
        var children = parentModule.children;
        if (Array.isArray(children)) {
          children.push(module);
        }
      }

      contents(
        makeRequire(file),
        // If the file had a .stub, reuse the same object for exports.
        module.exports = file.stub || {},
        module,
        file.module.id,
        file.parent.module.id
      );

      module.loaded = true;
    }

    // The module.runModuleSetters method will be deprecated in favor of
    // just module.runSetters: https://github.com/benjamn/reify/pull/160
    var runSetters = module.runSetters || module.runModuleSetters;
    if (isFunction(runSetters)) {
      runSetters.call(module);
    }

    return module.exports;
  }

  function fileIsDirectory(file) {
    return file && isObject(file.contents);
  }

  function fileIsDynamic(file) {
    return file && file.contents === null;
  }

  function fileMergeContents(file, contents, options) {
    if (Array.isArray(contents)) {
      contents.forEach(function (item) {
        if (isString(item)) {
          file.deps[item] = file.module.id;
        } else if (isFunction(item)) {
          contents = item;
        } else if (isObject(item)) {
          file.stub = file.stub || {};
          each(item, function (value, key) {
            file.stub[key] = value;
          });
        }
      });

      if (! isFunction(contents)) {
        // If the array did not contain a function, merge nothing.
        contents = null;
      }

    } else if (! isFunction(contents) &&
               ! isString(contents) &&
               ! isObject(contents)) {
      // If contents is neither an array nor a function nor a string nor
      // an object, just give up and merge nothing.
      contents = null;
    }

    if (contents) {
      file.contents = file.contents || (isObject(contents) ? {} : contents);
      if (isObject(contents) && fileIsDirectory(file)) {
        each(contents, function (value, key) {
          if (key === "..") {
            child = file.parent;

          } else {
            var child = getOwn(file.contents, key);

            if (! child) {
              child = file.contents[key] = new File(
                file.module.id.replace(/\/*$/, "/") + key,
                file
              );

              child.options = options;
            }
          }

          fileMergeContents(child, value, options);
        });
      }
    }
  }

  function each(obj, callback, context) {
    Object.keys(obj).forEach(function (key) {
      callback.call(this, obj[key], key);
    }, context);
  }

  function fileGetExtensions(file) {
    return file.options
      && file.options.extensions
      || defaultExtensions;
  }

  function fileAppendIdPart(file, part, extensions) {
    // Always append relative to a directory.
    while (file && ! fileIsDirectory(file)) {
      file = file.parent;
    }

    if (! file || ! part || part === ".") {
      return file;
    }

    if (part === "..") {
      return file.parent;
    }

    var exactChild = getOwn(file.contents, part);

    // Only consider multiple file extensions if this part is the last
    // part of a module identifier and not equal to `.` or `..`, and there
    // was no exact match or the exact match was a directory.
    if (extensions && (! exactChild || fileIsDirectory(exactChild))) {
      for (var e = 0; e < extensions.length; ++e) {
        var child = getOwn(file.contents, part + extensions[e]);
        if (child && ! fileIsDirectory(child)) {
          return child;
        }
      }
    }

    return exactChild;
  }

  function fileAppendId(file, id, extensions) {
    var parts = id.split("/");

    // Use `Array.prototype.every` to terminate iteration early if
    // `fileAppendIdPart` returns a falsy value.
    parts.every(function (part, i) {
      return file = i < parts.length - 1
        ? fileAppendIdPart(file, part)
        : fileAppendIdPart(file, part, extensions);
    });

    return file;
  }

  function recordChild(parentModule, childFile) {
    var childModule = childFile && childFile.module;
    if (parentModule && childModule) {
      parentModule.childrenById[childModule.id] = childModule;
    }
  }

  function fileResolve(file, id, parentModule, seenDirFiles) {
    var parentModule = parentModule || file.module;
    var extensions = fileGetExtensions(file);

    file =
      // Absolute module identifiers (i.e. those that begin with a `/`
      // character) are interpreted relative to the root directory, which
      // is a slight deviation from Node, which has access to the entire
      // file system.
      id.charAt(0) === "/" ? fileAppendId(root, id, extensions) :
      // Relative module identifiers are interpreted relative to the
      // current file, naturally.
      id.charAt(0) === "." ? fileAppendId(file, id, extensions) :
      // Top-level module identifiers are interpreted as referring to
      // packages in `node_modules` directories.
      nodeModulesLookup(file, id, extensions);

    // If the identifier resolves to a directory, we use the same logic as
    // Node to find an `index.js` or `package.json` file to evaluate.
    while (fileIsDirectory(file)) {
      seenDirFiles = seenDirFiles || [];

      // If the "main" field of a `package.json` file resolves to a
      // directory we've already considered, then we should not attempt to
      // read the same `package.json` file again. Using an array as a set
      // is acceptable here because the number of directories to consider
      // is rarely greater than 1 or 2. Also, using indexOf allows us to
      // store File objects instead of strings.
      if (seenDirFiles.indexOf(file) < 0) {
        seenDirFiles.push(file);

        var pkgJsonFile = fileAppendIdPart(file, "package.json");
        var pkg = pkgJsonFile && fileEvaluate(pkgJsonFile, parentModule);
        var mainFile, resolved = pkg && mainFields.some(function (name) {
          var main = pkg[name];
          if (isString(main)) {
            // The "main" field of package.json does not have to begin
            // with ./ to be considered relative, so first we try
            // simply appending it to the directory path before
            // falling back to a full fileResolve, which might return
            // a package from a node_modules directory.
            return mainFile = fileAppendId(file, main, extensions) ||
              fileResolve(file, main, parentModule, seenDirFiles);
          }
        });

        if (resolved && mainFile) {
          file = mainFile;
          recordChild(parentModule, pkgJsonFile);
          // The fileAppendId call above may have returned a directory,
          // so continue the loop to make sure we resolve it to a
          // non-directory file.
          continue;
        }
      }

      // If we didn't find a `package.json` file, or it didn't have a
      // resolvable `.main` property, the only possibility left to
      // consider is that this directory contains an `index.js` module.
      // This assignment almost always terminates the while loop, because
      // there's very little chance `fileIsDirectory(file)` will be true
      // for `fileAppendIdPart(file, "index", extensions)`. However, in
      // principle it is remotely possible that a file called `index.js`
      // could be a directory instead of a file.
      file = fileAppendIdPart(file, "index", extensions);
    }

    if (file && isString(file.contents)) {
      file = fileResolve(file, file.contents, parentModule, seenDirFiles);
    }

    recordChild(parentModule, file);

    return file;
  };

  function nodeModulesLookup(file, id, extensions) {
    for (var resolved; file && ! resolved; file = file.parent) {
      resolved = fileIsDirectory(file) &&
        fileAppendId(file, "node_modules/" + id, extensions);
    }
    return resolved;
  }

  return install;
};

if (typeof exports === "object") {
  exports.makeInstaller = makeInstaller;
}

///////////////////////////////////////////////////////////////////////////////







(function(){

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// packages/modules-runtime/server.js                                        //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
                                                                             //
// Options that will be populated below and then passed to makeInstaller.
var makeInstallerOptions = {};

// RegExp matching strings that don't start with a `.` or a `/`.
var topLevelIdPattern = /^[^./]/;

// This function will be called whenever a module identifier that hasn't
// been installed is required. For backwards compatibility, and so that we
// can require binary dependencies on the server, we implement the
// fallback in terms of Npm.require.
makeInstallerOptions.fallback = function (id, parentId, error) {
  // For simplicity, we honor only top-level module identifiers here.
  // We could try to honor relative and absolute module identifiers by
  // somehow combining `id` with `dir`, but we'd have to be really careful
  // that the resulting modules were located in a known directory (not
  // some arbitrary location on the file system), and we only really need
  // the fallback for dependencies installed in node_modules directories.
  if (topLevelIdPattern.test(id)) {
    if (id && id.startsWith('meteor/')) {
      const [meteorPrefix, packageName] = id.split('/', 2);
      throw new Error(
        `Cannot find package "${packageName}". ` +
        `Try "meteor add ${packageName}".`
      );
    }
    if (typeof Npm === "object" &&
        typeof Npm.require === "function") {
      return Npm.require(id, error);
    }
  }

  throw error;
};

makeInstallerOptions.fallback.resolve = function (id, parentId, error) {
  if (topLevelIdPattern.test(id)) {
    // Allow any top-level identifier to resolve to itself on the server,
    // so that makeInstallerOptions.fallback has a chance to handle it.
    return id;
  }

  throw error;
};

meteorInstall = makeInstaller(makeInstallerOptions);
var Module = meteorInstall.Module;

Module.prototype.useNode = function () {
  if (typeof npmRequire !== "function") {
    // Can't use Node if npmRequire is not defined.
    return false;
  }

  var parts = this.id.split("/");
  var start = 0;
  if (parts[start] === "") ++start;
  if (parts[start] === "node_modules" &&
      parts[start + 1] === "meteor") {
    start += 2;
  }

  if (parts.indexOf("node_modules", start) < 0) {
    // Don't try to use Node for modules that aren't in node_modules
    // directories.
    return false;
  }

  try {
    npmRequire.resolve(this.id);
  } catch (e) {
    return false;
  }

  this.exports = npmRequire(this.id);

  return true;
};

///////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// packages/modules-runtime/profile.js                                       //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
                                                                             //
if (typeof Profile === "function" &&
    process.env.METEOR_PROFILE) {
  var Mp = meteorInstall.Module.prototype;
  Mp.require = Profile(function (id) {
    return "require(" + JSON.stringify(id) + ")";
  }, Mp.require);
}

///////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("modules-runtime", {
  meteorInstall: meteorInstall
});

})();
