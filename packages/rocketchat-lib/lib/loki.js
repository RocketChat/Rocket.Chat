/**
 * LokiJS
 * @author Joe Minichino <joe.minichino@gmail.com>
 *
 * A lightweight document oriented javascript database
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.loki = factory();
  }
}(this, function () {

  return (function () {
    'use strict';

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    var Utils = {
      copyProperties: function (src, dest) {
        var prop;
        for (prop in src) {
          dest[prop] = src[prop];
        }
      },
      // used to recursively scan hierarchical transform step object for param substitution
      resolveTransformObject: function (subObj, params, depth) {
        var prop,
          pname;

        if (typeof depth !== 'number') {
          depth = 0;
        }

        if (++depth >= 10) return subObj;

        for (prop in subObj) {
          if (typeof subObj[prop] === 'string' && subObj[prop].indexOf("[%lktxp]") === 0) {
            pname = subObj[prop].substring(8);
            if (params.hasOwnProperty(pname)) {
              subObj[prop] = params[pname];
            }
          } else if (typeof subObj[prop] === "object") {
            subObj[prop] = Utils.resolveTransformObject(subObj[prop], params, depth);
          }
        }

        return subObj;
      },
      // top level utility to resolve an entire (single) transform (array of steps) for parameter substitution
      resolveTransformParams: function (transform, params) {
        var idx,
          clonedStep,
          resolvedTransform = [];

        if (typeof params === 'undefined') return transform;

        // iterate all steps in the transform array
        for (idx = 0; idx < transform.length; idx++) {
          // clone transform so our scan and replace can operate directly on cloned transform
          clonedStep = JSON.parse(JSON.stringify(transform[idx]));
          resolvedTransform.push(Utils.resolveTransformObject(clonedStep, params));
        }

        return resolvedTransform;
      }
    };

    /** Helper function for determining 'less-than' conditions for ops, sorting, and binary indices.
     *     In the future we might want $lt and $gt ops to use their own functionality/helper.
     *     Since binary indices on a property might need to index [12, NaN, new Date(), Infinity], we
     *     need this function (as well as gtHelper) to always ensure one value is LT, GT, or EQ to another.
     */
    function ltHelper(prop1, prop2, equal) {
      var cv1, cv2;

      // 'falsy' and Boolean handling
      if (!prop1 || !prop2 || prop1 === true || prop2 === true) {
        if ((prop1 === true || prop1 === false) && (prop2 === true || prop2 === false)) {
          if (equal) {
            return prop1 === prop2;
          } else {
            if (prop1) {
              return false;
            } else {
              return prop2;
            }
          }
        }

        if (prop2 === undefined || prop2 === null || prop1 === true || prop2 === false) {
            return equal;
        }
        if (prop1 === undefined || prop1 === null || prop1 === false || prop2 === true) {
          return true;
        }
      }

      if (prop1 === prop2) {
        return equal;
      }

      if (prop1 < prop2) {
        return true;
      }

      if (prop1 > prop2) {
        return false;
      }

      // not strict equal nor less than nor gt so must be mixed types, convert to string and use that to compare
      cv1 = prop1.toString();
      cv2 = prop2.toString();

      if (cv1 == cv2) {
        return equal;
      }

      if (cv1 < cv2) {
        return true;
      }

      return false;
    }

    function gtHelper(prop1, prop2, equal) {
      var cv1, cv2;

      // 'falsy' and Boolean handling
      if (!prop1 || !prop2 || prop1 === true || prop2 === true) {
        if ((prop1 === true || prop1 === false) && (prop2 === true || prop2 === false)) {
          if (equal) {
            return prop1 === prop2;
          } else {
            if (prop1) {
              return !prop2;
            } else {
              return false;
            }
          }
        }

        if (prop1 === undefined || prop1 === null || prop1 === false || prop2 === true) {
          return equal;
        }
        if (prop2 === undefined || prop2 === null || prop1 === true || prop2 === false) {
          return true;
        }
      }

      if (prop1 === prop2) {
        return equal;
      }

      if (prop1 > prop2) {
        return true;
      }

      if (prop1 < prop2) {
        return false;
      }

      // not strict equal nor less than nor gt so must be mixed types, convert to string and use that to compare
      cv1 = prop1.toString();
      cv2 = prop2.toString();

      if (cv1 == cv2) {
        return equal;
      }

      if (cv1 > cv2) {
        return true;
      }

      return false;
    }

    function sortHelper(prop1, prop2, desc) {
      if (prop1 === prop2) {
        return 0;
      }

      if (ltHelper(prop1, prop2, false)) {
        return (desc) ? (1) : (-1);
      }

      if (gtHelper(prop1, prop2, false)) {
        return (desc) ? (-1) : (1);
      }

      // not lt, not gt so implied equality-- date compatible
      return 0;
    }

    /**
     * compoundeval() - helper function for compoundsort(), performing individual object comparisons
     *
     * @param {array} properties - array of property names, in order, by which to evaluate sort order
     * @param {object} obj1 - first object to compare
     * @param {object} obj2 - second object to compare
     * @returns {integer} 0, -1, or 1 to designate if identical (sortwise) or which should be first
     */
    function compoundeval(properties, obj1, obj2) {
      var res = 0;
      var prop, field;
      for (var i = 0, len = properties.length; i < len; i++) {
        prop = properties[i];
        field = prop[0];
        res = sortHelper(obj1[field], obj2[field], prop[1]);
        if (res !== 0) {
          return res;
        }
      }
      return 0;
    }

    /**
     * dotSubScan - helper function used for dot notation queries.
     *
     * @param {object} root - object to traverse
     * @param {array} paths - array of properties to drill into
     * @param {function} fun - evaluation function to test with
     * @param {any} value - comparative value to also pass to (compare) fun
     */
    function dotSubScan(root, paths, fun, value) {
      var arrayRef = null;
      var pathIndex, subIndex;
      var path;

      for (pathIndex = 0; pathIndex < paths.length; pathIndex++) {
        path = paths[pathIndex];

        // foreach already detected parent was array so this must be where we iterate
        if (arrayRef) {
          // iterate all sub-array items to see if any yield hits
          for (subIndex = 0; subIndex < arrayRef.length; subIndex++) {
            if (fun(arrayRef[subIndex][path], value)) {
              return true;
            }
          }
        }
        // else not yet determined if subarray scan is involved
        else {
          // if the dot notation is invalid for the current document, then ignore this document
          if (typeof root === 'undefined' || root === null || !root.hasOwnProperty(path)) {
            return false;
          }
          root = root[path];

          if (root === undefined || root === null) {
            return false;
          }

          if (Array.isArray(root)) {
            arrayRef = root;
          }
        }
      }

      // made it this far so must be dot notation on non-array property
      return fun(root, value);
    }

    function containsCheckFn(a) {
      if (typeof a === 'string' || Array.isArray(a)) {
        return function (b) {
          return a.indexOf(b) !== -1;
        };
      } else if (typeof a === 'object' && a !== null) {
        return function (b) {
          return hasOwnProperty.call(a, b);
        };
      }
      return null;
    }

    function doQueryOp(val, op) {
      for (var p in op) {
        if (hasOwnProperty.call(op, p)) {
          return LokiOps[p](val, op[p]);
        }
      }
      return false;
    }

    var LokiOps = {
      // comparison operators
      // a is the value in the collection
      // b is the query value
      $eq: function (a, b) {
        return a === b;
      },

      // abstract/loose equality
      $aeq: function (a, b) {
        return a == b;
      },

      $ne: function (a, b) {
        // ecma 5 safe test for NaN
        if (b !== b) {
          // ecma 5 test value is not NaN
          return (a === a);
        }

        return a !== b;
      },

      $dteq: function(a, b) {
        if (ltHelper(a, b, false)) {
          return false;
        }
        return !gtHelper(a, b, false);
      },

      $gt: function (a, b) {
        return gtHelper(a, b, false);
      },

      $gte: function (a, b) {
        return gtHelper(a, b, true);
      },

      $lt: function (a, b) {
        return ltHelper(a, b, false);
      },

      $lte: function (a, b) {
        return ltHelper(a, b, true);
      },

      $in: function (a, b) {
        return b.indexOf(a) !== -1;
      },

      $nin: function (a, b) {
        return b.indexOf(a) === -1;
      },

      $keyin: function (a, b) {
        return a in b;
      },

      $nkeyin: function (a, b) {
        return !(a in b);
      },

      $definedin: function (a, b) {
        return b[a] !== undefined;
      },

      $undefinedin: function (a, b) {
        return b[a] === undefined;
      },

      $regex: function (a, b) {
        return b.test(a);
      },

      $containsString: function (a, b) {
        return (typeof a === 'string') && (a.indexOf(b) !== -1);
      },

      $containsNone: function (a, b) {
        return !LokiOps.$containsAny(a, b);
      },

      $containsAny: function (a, b) {
        var checkFn = containsCheckFn(a);
        if (checkFn !== null) {
          return (Array.isArray(b)) ? (b.some(checkFn)) : (checkFn(b));
        }
        return false;
      },

      $contains: function (a, b) {
        var checkFn = containsCheckFn(a);
        if (checkFn !== null) {
          return (Array.isArray(b)) ? (b.every(checkFn)) : (checkFn(b));
        }
        return false;
      },

      $type: function (a, b) {
        var type = typeof a;
        if (type === 'object') {
          if (Array.isArray(a)) {
            type = 'array';
          } else if (a instanceof Date) {
            type = 'date';
          }
        }
        return (typeof b !== 'object') ? (type === b) : doQueryOp(type, b);
      },

      $size: function (a, b) {
        if (Array.isArray(a)) {
          return (typeof b !== 'object') ? (a.length === b) : doQueryOp(a.length, b);
        }
        return false;
      },

      $len: function (a, b) {
        if (typeof a === 'string') {
          return (typeof b !== 'object') ? (a.length === b) : doQueryOp(a.length, b);
        }
        return false;
      },

      $where: function (a, b) {
        return b(a) === true;
      },

      // field-level logical operators
      // a is the value in the collection
      // b is the nested query operation (for '$not')
      //   or an array of nested query operations (for '$and' and '$or')
      $not: function (a, b) {
        return !doQueryOp(a, b);
      },

      $and: function (a, b) {
        for (var idx = 0, len = b.length; idx < len; idx += 1) {
          if (!doQueryOp(a, b[idx])) {
            return false;
          }
        }
        return true;
      },

      $or: function (a, b) {
        for (var idx = 0, len = b.length; idx < len; idx += 1) {
          if (doQueryOp(a, b[idx])) {
            return true;
          }
        }
        return false;
      }
    };

    // making indexing opt-in... our range function knows how to deal with these ops :
    var indexedOpsList = ['$eq', '$aeq', '$dteq', '$gt', '$gte', '$lt', '$lte'];

    function clone(data, method) {
      var cloneMethod = method || 'parse-stringify',
        cloned;

      switch (cloneMethod) {
        case "parse-stringify":
          cloned = JSON.parse(JSON.stringify(data));
          break;
        case "jquery-extend-deep":
          cloned = jQuery.extend(true, {}, data);
          break;
        case "shallow":
          cloned = Object.create(data.prototype || null);
          Object.keys(data).map(function (i) {
            cloned[i] = data[i];
          });
          break;
        default:
          break;
      }

      //if (cloneMethod === 'parse-stringify') {
      //  cloned = JSON.parse(JSON.stringify(data));
      //}
      return cloned;
    }

    function cloneObjectArray(objarray, method) {
      var i,
        result = [];

      if (method == "parse-stringify") {
        return clone(objarray, method);
      }

      i = objarray.length-1;

      for(;i<=0;i--) {
        result.push(clone(objarray[i], method));
      }

      return result;
    }

    function localStorageAvailable() {
      try {
        return (window && window.localStorage !== undefined && window.localStorage !== null);
      } catch (e) {
        return false;
      }
    }


    /**
     * LokiEventEmitter is a minimalist version of EventEmitter. It enables any
     * constructor that inherits EventEmitter to emit events and trigger
     * listeners that have been added to the event through the on(event, callback) method
     *
     * @constructor LokiEventEmitter
     */
    function LokiEventEmitter() {}

    /**
     * @prop {hashmap} events - a hashmap, with each property being an array of callbacks
     * @memberof LokiEventEmitter
     */
    LokiEventEmitter.prototype.events = {};

    /**
     * @prop {boolean} asyncListeners - boolean determines whether or not the callbacks associated with each event
     * should happen in an async fashion or not
     * Default is false, which means events are synchronous
     * @memberof LokiEventEmitter
     */
    LokiEventEmitter.prototype.asyncListeners = false;

    /**
     * on(eventName, listener) - adds a listener to the queue of callbacks associated to an event
     * @param {string} eventName - the name of the event to listen to
     * @param {function} listener - callback function of listener to attach
     * @returns {int} the index of the callback in the array of listeners for a particular event
     * @memberof LokiEventEmitter
     */
    LokiEventEmitter.prototype.on = function (eventName, listener) {
      var event = this.events[eventName];
      if (!event) {
        event = this.events[eventName] = [];
      }
      event.push(listener);
      return listener;
    };

    /**
     * emit(eventName, data) - emits a particular event
     * with the option of passing optional parameters which are going to be processed by the callback
     * provided signatures match (i.e. if passing emit(event, arg0, arg1) the listener should take two parameters)
     * @param {string} eventName - the name of the event
     * @param {object=} data - optional object passed with the event
     * @memberof LokiEventEmitter
     */
    LokiEventEmitter.prototype.emit = function (eventName, data) {
      var self = this;
      if (eventName && this.events[eventName]) {
        this.events[eventName].forEach(function (listener) {
          if (self.asyncListeners) {
            setTimeout(function () {
              listener(data);
            }, 1);
          } else {
            listener(data);
          }

        });
      } else {
        throw new Error('No event ' + eventName + ' defined');
      }
    };

    /**
     * removeListener() - removes the listener at position 'index' from the event 'eventName'
     * @param {string} eventName - the name of the event which the listener is attached to
     * @param {function} listener - the listener callback function to remove from emitter
     * @memberof LokiEventEmitter
     */
    LokiEventEmitter.prototype.removeListener = function (eventName, listener) {
      if (this.events[eventName]) {
        var listeners = this.events[eventName];
        listeners.splice(listeners.indexOf(listener), 1);
      }
    };

    /**
     * Loki: The main database class
     * @constructor Loki
     * @implements LokiEventEmitter
     * @param {string} filename - name of the file to be saved to
     * @param {object=} options - (Optional) config options object
     * @param {string} options.env - override environment detection as 'NODEJS', 'BROWSER', 'CORDOVA'
     * @param {boolean} options.verbose - enable console output (default is 'false')
     * @param {boolean} options.autosave - enables autosave
     * @param {int} options.autosaveInterval - time interval (in milliseconds) between saves (if dirty)
     * @param {boolean} options.autoload - enables autoload on loki instantiation
     * @param {function} options.autoloadCallback - user callback called after database load
     * @param {adapter} options.adapter - an instance of a loki persistence adapter
     */
    function Loki(filename, options) {
      this.filename = filename || 'loki.db';
      this.collections = [];

      // persist version of code which created the database to the database.
      // could use for upgrade scenarios
      this.databaseVersion = 1.1;
      this.engineVersion = 1.1;

      // autosave support (disabled by default)
      // pass autosave: true, autosaveInterval: 6000 in options to set 6 second autosave
      this.autosave = false;
      this.autosaveInterval = 5000;
      this.autosaveHandle = null;

      this.options = {};

      // currently keeping persistenceMethod and persistenceAdapter as loki level properties that
      // will not or cannot be deserialized.  You are required to configure persistence every time
      // you instantiate a loki object (or use default environment detection) in order to load the database anyways.

      // persistenceMethod could be 'fs', 'localStorage', or 'adapter'
      // this is optional option param, otherwise environment detection will be used
      // if user passes their own adapter we will force this method to 'adapter' later, so no need to pass method option.
      this.persistenceMethod = null;

      // retain reference to optional (non-serializable) persistenceAdapter 'instance'
      this.persistenceAdapter = null;

      // enable console output if verbose flag is set (disabled by default)
      this.verbose = options && options.hasOwnProperty('verbose') ? options.verbose : false;

      this.events = {
        'init': [],
        'loaded': [],
        'flushChanges': [],
        'close': [],
        'changes': [],
        'warning': []
      };

      var getENV = function () {
        // if (typeof global !== 'undefined' && (global.android || global.NSObject)) {
        //   //If no adapter is set use the default nativescript adapter
        //   if (!options.adapter) {
        //     var LokiNativescriptAdapter = require('./loki-nativescript-adapter');
        //     options.adapter=new LokiNativescriptAdapter();
        //   }
        //   return 'NATIVESCRIPT'; //nativescript
        // }

        if (typeof window === 'undefined') {
          return 'NODEJS';
        }

        if (typeof global !== 'undefined' && global.window) {
          return 'NODEJS'; //node-webkit
        }

        if (typeof document !== 'undefined') {
          if (document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1) {
            return 'CORDOVA';
          }
          return 'BROWSER';
        }
        return 'CORDOVA';
      };

      // refactored environment detection due to invalid detection for browser environments.
      // if they do not specify an options.env we want to detect env rather than default to nodejs.
      // currently keeping two properties for similar thing (options.env and options.persistenceMethod)
      //   might want to review whether we can consolidate.
      if (options && options.hasOwnProperty('env')) {
        this.ENV = options.env;
      } else {
        this.ENV = getENV();
      }

      // not sure if this is necessary now that i have refactored the line above
      if (this.ENV === 'undefined') {
        this.ENV = 'NODEJS';
      }

      //if (typeof (options) !== 'undefined') {
      this.configureOptions(options, true);
      //}

      this.on('init', this.clearChanges);

    }

    // db class is an EventEmitter
    Loki.prototype = new LokiEventEmitter();

    // experimental support for browserify's abstract syntax scan to pick up dependency of indexed adapter.
    // Hopefully, once this hits npm a browserify require of lokijs should scan the main file and detect this indexed adapter reference.
    Loki.prototype.getIndexedAdapter = function () {
      var adapter;

      if (typeof require === 'function') {
        adapter = require("./loki-indexed-adapter.js");
      }

      return adapter;
    };


    /**
     * Allows reconfiguring database options
     *
     * @param {object} options - configuration options to apply to loki db object
     * @param {string} options.env - override environment detection as 'NODEJS', 'BROWSER', 'CORDOVA'
     * @param {boolean} options.verbose - enable console output (default is 'false')
     * @param {boolean} options.autosave - enables autosave
     * @param {int} options.autosaveInterval - time interval (in milliseconds) between saves (if dirty)
     * @param {boolean} options.autoload - enables autoload on loki instantiation
     * @param {function} options.autoloadCallback - user callback called after database load
     * @param {adapter} options.adapter - an instance of a loki persistence adapter
     * @param {boolean} initialConfig - (internal) true is passed when loki ctor is invoking
     * @memberof Loki
     */
    Loki.prototype.configureOptions = function (options, initialConfig) {
      var defaultPersistence = {
          'NODEJS': 'fs',
          'BROWSER': 'localStorage',
          'CORDOVA': 'localStorage'
        },
        persistenceMethods = {
          'fs': LokiFsAdapter,
          'localStorage': LokiLocalStorageAdapter
        };

      this.options = {};

      this.persistenceMethod = null;
      // retain reference to optional persistence adapter 'instance'
      // currently keeping outside options because it can't be serialized
      this.persistenceAdapter = null;

      // process the options
      if (typeof (options) !== 'undefined') {
        this.options = options;


        if (this.options.hasOwnProperty('persistenceMethod')) {
          // check if the specified persistence method is known
          if (typeof (persistenceMethods[options.persistenceMethod]) == 'function') {
            this.persistenceMethod = options.persistenceMethod;
            this.persistenceAdapter = new persistenceMethods[options.persistenceMethod]();
          }
          // should be throw an error here, or just fall back to defaults ??
        }

        // if user passes adapter, set persistence mode to adapter and retain persistence adapter instance
        if (this.options.hasOwnProperty('adapter')) {
          this.persistenceMethod = 'adapter';
          this.persistenceAdapter = options.adapter;
          this.options.adapter = null;
        }


        // if they want to load database on loki instantiation, now is a good time to load... after adapter set and before possible autosave initiation
        if (options.autoload && initialConfig) {
          // for autoload, let the constructor complete before firing callback
          var self = this;
          setTimeout(function () {
            self.loadDatabase(options, options.autoloadCallback);
          }, 1);
        }

        if (this.options.hasOwnProperty('autosaveInterval')) {
          this.autosaveDisable();
          this.autosaveInterval = parseInt(this.options.autosaveInterval, 10);
        }

        if (this.options.hasOwnProperty('autosave') && this.options.autosave) {
          this.autosaveDisable();
          this.autosave = true;

          if (this.options.hasOwnProperty('autosaveCallback')) {
            this.autosaveEnable(options, options.autosaveCallback);
          } else {
            this.autosaveEnable();
          }
        }
      } // end of options processing

      // if by now there is no adapter specified by user nor derived from persistenceMethod: use sensible defaults
      if (this.persistenceAdapter === null) {
        this.persistenceMethod = defaultPersistence[this.ENV];
        if (this.persistenceMethod) {
          this.persistenceAdapter = new persistenceMethods[this.persistenceMethod]();
        }
      }

    };

    /**
     * Shorthand method for quickly creating and populating an anonymous collection.
     *    This collection is not referenced internally so upon losing scope it will be garbage collected.
     *
     * @example
     * var results = new loki().anonym(myDocArray).find({'age': {'$gt': 30} });
     *
     * @param {Array} docs - document array to initialize the anonymous collection with
     * @param {object} options - configuration object, see {@link Loki#addCollection} options
     * @returns {Collection} New collection which you can query or chain
     * @memberof Loki
     */
    Loki.prototype.anonym = function (docs, options) {
      var collection = new Collection('anonym', options);
      collection.insert(docs);

      if(this.verbose)
        collection.console = console;

      return collection;
    };

    /**
     * Adds a collection to the database.
     * @param {string} name - name of collection to add
     * @param {object=} options - (optional) options to configure collection with.
     * @param {array} options.unique - array of property names to define unique constraints for
     * @param {array} options.exact - array of property names to define exact constraints for
     * @param {array} options.indices - array property names to define binary indexes for
     * @param {boolean} options.asyncListeners - default is false
     * @param {boolean} options.disableChangesApi - default is true
     * @param {boolean} options.autoupdate - use Object.observe to update objects automatically (default: false)
     * @param {boolean} options.clone - specify whether inserts and queries clone to/from user
     * @param {string} options.cloneMethod - 'parse-stringify' (default), 'jquery-extend-deep', 'shallow'
     * @param {int} options.ttlInterval - time interval for clearing out 'aged' documents; not set by default.
     * @returns {Collection} a reference to the collection which was just added
     * @memberof Loki
     */
    Loki.prototype.addCollection = function (name, options) {
      var collection = new Collection(name, options);
      this.collections.push(collection);

      if(this.verbose)
        collection.console = console;

      return collection;
    };

    Loki.prototype.loadCollection = function (collection) {
      if (!collection.name) {
        throw new Error('Collection must have a name property to be loaded');
      }
      this.collections.push(collection);
    };

    /**
     * Retrieves reference to a collection by name.
     * @param {string} collectionName - name of collection to look up
     * @returns {Collection} Reference to collection in database by that name, or null if not found
     * @memberof Loki
     */
    Loki.prototype.getCollection = function (collectionName) {
      var i,
        len = this.collections.length;

      for (i = 0; i < len; i += 1) {
        if (this.collections[i].name === collectionName) {
          return this.collections[i];
        }
      }

      // no such collection
      this.emit('warning', 'collection ' + collectionName + ' not found');
      return null;
    };

    Loki.prototype.listCollections = function () {

      var i = this.collections.length,
        colls = [];

      while (i--) {
        colls.push({
          name: this.collections[i].name,
          type: this.collections[i].objType,
          count: this.collections[i].data.length
        });
      }
      return colls;
    };

    /**
     * Removes a collection from the database.
     * @param {string} collectionName - name of collection to remove
     * @memberof Loki
     */
    Loki.prototype.removeCollection = function (collectionName) {
      var i,
        len = this.collections.length;

      for (i = 0; i < len; i += 1) {
        if (this.collections[i].name === collectionName) {
          var tmpcol = new Collection(collectionName, {});
          var curcol = this.collections[i];
          for (var prop in curcol) {
            if (curcol.hasOwnProperty(prop) && tmpcol.hasOwnProperty(prop)) {
                curcol[prop] = tmpcol[prop];
            }
          }
          this.collections.splice(i, 1);
          return;
        }
      }
    };

    Loki.prototype.getName = function () {
      return this.name;
    };

    /**
     * serializeReplacer - used to prevent certain properties from being serialized
     *
     */
    Loki.prototype.serializeReplacer = function (key, value) {
      switch (key) {
      case 'autosaveHandle':
      case 'persistenceAdapter':
      case 'constraints':
        return null;
      default:
        return value;
      }
    };

    /**
     * Serialize database to a string which can be loaded via {@link Loki#loadJSON}
     *
     * @returns {string} Stringified representation of the loki database.
     * @memberof Loki
     */
    Loki.prototype.serialize = function () {
      return JSON.stringify(this, this.serializeReplacer);
    };
    // alias of serialize
    Loki.prototype.toJson = Loki.prototype.serialize;

    /**
     * Inflates a loki database from a serialized JSON string
     *
     * @param {string} serializedDb - a serialized loki database string
     * @param {object} options - apply or override collection level settings
     * @memberof Loki
     */
    Loki.prototype.loadJSON = function (serializedDb, options) {
      var dbObject;
      if (serializedDb.length === 0) {
        dbObject = {};
      } else {
        dbObject = JSON.parse(serializedDb);
      }

      this.loadJSONObject(dbObject, options);
    };

    /**
     * Inflates a loki database from a JS object
     *
     * @param {object} dbObject - a serialized loki database string
     * @param {object} options - apply or override collection level settings
     * @memberof Loki
     */
    Loki.prototype.loadJSONObject = function (dbObject, options) {
      var i = 0,
        len = dbObject.collections ? dbObject.collections.length : 0,
        coll,
        copyColl,
        clen,
        j;

      this.name = dbObject.name;

      // restore database version
      this.databaseVersion = 1.0;
      if (dbObject.hasOwnProperty('databaseVersion')) {
        this.databaseVersion = dbObject.databaseVersion;
      }

      this.collections = [];

      for (i; i < len; i += 1) {
        coll = dbObject.collections[i];
        copyColl = this.addCollection(coll.name);

        copyColl.transactional = coll.transactional;
        copyColl.asyncListeners = coll.asyncListeners;
        copyColl.disableChangesApi = coll.disableChangesApi;
        copyColl.cloneObjects = coll.cloneObjects;
        copyColl.cloneMethod = coll.cloneMethod || "parse-stringify";
        copyColl.autoupdate = coll.autoupdate;

        // load each element individually
        clen = coll.data.length;
        j = 0;
        if (options && options.hasOwnProperty(coll.name)) {

          var loader = options[coll.name].inflate ? options[coll.name].inflate : Utils.copyProperties;

          for (j; j < clen; j++) {
            var collObj = new(options[coll.name].proto)();
            loader(coll.data[j], collObj);
            copyColl.data[j] = collObj;
            copyColl.addAutoUpdateObserver(collObj);
          }
        } else {

          for (j; j < clen; j++) {
            copyColl.data[j] = coll.data[j];
            copyColl.addAutoUpdateObserver(copyColl.data[j]);
          }
        }

        copyColl.maxId = (coll.data.length === 0) ? 0 : coll.maxId;
        copyColl.idIndex = coll.idIndex;
        if (typeof (coll.binaryIndices) !== 'undefined') {
          copyColl.binaryIndices = coll.binaryIndices;
        }
        if (typeof coll.transforms !== 'undefined') {
          copyColl.transforms = coll.transforms;
        }

        copyColl.ensureId();

        // regenerate unique indexes
        copyColl.uniqueNames = [];
        if (coll.hasOwnProperty("uniqueNames")) {
          copyColl.uniqueNames = coll.uniqueNames;
          for (j = 0; j < copyColl.uniqueNames.length; j++) {
            copyColl.ensureUniqueIndex(copyColl.uniqueNames[j]);
          }
        }

        // in case they are loading a database created before we added dynamic views, handle undefined
        if (typeof (coll.DynamicViews) === 'undefined') continue;

        // reinflate DynamicViews and attached Resultsets
        for (var idx = 0; idx < coll.DynamicViews.length; idx++) {
          var colldv = coll.DynamicViews[idx];

          var dv = copyColl.addDynamicView(colldv.name, colldv.options);
          dv.resultdata = colldv.resultdata;
          dv.resultsdirty = colldv.resultsdirty;
          dv.filterPipeline = colldv.filterPipeline;

          dv.sortCriteria = colldv.sortCriteria;
          dv.sortFunction = null;

          dv.sortDirty = colldv.sortDirty;
          dv.resultset.filteredrows = colldv.resultset.filteredrows;
          dv.resultset.searchIsChained = colldv.resultset.searchIsChained;
          dv.resultset.filterInitialized = colldv.resultset.filterInitialized;

          dv.rematerialize({
            removeWhereFilters: true
          });
        }
      }
    };

    /**
     * Emits the close event. In autosave scenarios, if the database is dirty, this will save and disable timer.
     * Does not actually destroy the db.
     *
     * @param {function=} callback - (Optional) if supplied will be registered with close event before emitting.
     * @memberof Loki
     */
    Loki.prototype.close = function (callback) {
      // for autosave scenarios, we will let close perform final save (if dirty)
      // For web use, you might call from window.onbeforeunload to shutdown database, saving pending changes
      if (this.autosave) {
        this.autosaveDisable();
        if (this.autosaveDirty()) {
          this.saveDatabase(callback);
          callback = undefined;
        }
      }

      if (callback) {
        this.on('close', callback);
      }
      this.emit('close');
    };

    /**-------------------------+
    | Changes API               |
    +--------------------------*/

    /**
     * The Changes API enables the tracking the changes occurred in the collections since the beginning of the session,
     * so it's possible to create a differential dataset for synchronization purposes (possibly to a remote db)
     */

    /**
     * (Changes API) : takes all the changes stored in each
     * collection and creates a single array for the entire database. If an array of names
     * of collections is passed then only the included collections will be tracked.
     *
     * @param {array=} optional array of collection names. No arg means all collections are processed.
     * @returns {array} array of changes
     * @see private method createChange() in Collection
     * @memberof Loki
     */
    Loki.prototype.generateChangesNotification = function (arrayOfCollectionNames) {
      function getCollName(coll) {
        return coll.name;
      }
      var changes = [],
        selectedCollections = arrayOfCollectionNames || this.collections.map(getCollName);

      this.collections.forEach(function (coll) {
        if (selectedCollections.indexOf(getCollName(coll)) !== -1) {
          changes = changes.concat(coll.getChanges());
        }
      });
      return changes;
    };

    /**
     * (Changes API) - stringify changes for network transmission
     * @returns {string} string representation of the changes
     * @memberof Loki
     */
    Loki.prototype.serializeChanges = function (collectionNamesArray) {
      return JSON.stringify(this.generateChangesNotification(collectionNamesArray));
    };

    /**
     * (Changes API) : clears all the changes in all collections.
     * @memberof Loki
     */
    Loki.prototype.clearChanges = function () {
      this.collections.forEach(function (coll) {
        if (coll.flushChanges) {
          coll.flushChanges();
        }
      });
    };

    /*------------------+
    | PERSISTENCE       |
    -------------------*/


    /** there are two build in persistence adapters for internal use
     * fs             for use in Nodejs type environments
     * localStorage   for use in browser environment
     * defined as helper classes here so its easy and clean to use
     */

    /**
     * A loki persistence adapter which persists using node fs module
     * @constructor LokiFsAdapter
     */
    function LokiFsAdapter() {
      this.fs = require('fs');
    }

    /**
     * loadDatabase() - Load data from file, will throw an error if the file does not exist
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     * @memberof LokiFsAdapter
     */
    LokiFsAdapter.prototype.loadDatabase = function loadDatabase(dbname, callback) {
      this.fs.readFile(dbname, {
        encoding: 'utf8'
      }, function readFileCallback(err, data) {
        if (err) {
          callback(new Error(err));
        } else {
          callback(data);
        }
      });
    };

    /**
     * saveDatabase() - save data to file, will throw an error if the file can't be saved
     * might want to expand this to avoid dataloss on partial save
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     * @memberof LokiFsAdapter
     */
    LokiFsAdapter.prototype.saveDatabase = function saveDatabase(dbname, dbstring, callback) {
      this.fs.writeFile(dbname, dbstring, callback);
    };

    /**
     * deleteDatabase() - delete the database file, will throw an error if the
     * file can't be deleted
     * @param {string} dbname - the filename of the database to delete
     * @param {function} callback - the callback to handle the result
     * @memberof LokiFsAdapter
     */
    LokiFsAdapter.prototype.deleteDatabase = function deleteDatabase(dbname, callback) {
      this.fs.unlink(dbname, function deleteDatabaseCallback(err) {
        if (err) {
          callback(new Error(err));
        } else {
          callback();
        }
      });
    };


    /**
     * A loki persistence adapter which persists to web browser's local storage object
     * @constructor LokiLocalStorageAdapter
     */
    function LokiLocalStorageAdapter() {}

    /**
     * loadDatabase() - Load data from localstorage
     * @param {string} dbname - the name of the database to load
     * @param {function} callback - the callback to handle the result
     * @memberof LokiLocalStorageAdapter
     */
    LokiLocalStorageAdapter.prototype.loadDatabase = function loadDatabase(dbname, callback) {
      if (localStorageAvailable()) {
        callback(localStorage.getItem(dbname));
      } else {
        callback(new Error('localStorage is not available'));
      }
    };

    /**
     * saveDatabase() - save data to localstorage, will throw an error if the file can't be saved
     * might want to expand this to avoid dataloss on partial save
     * @param {string} dbname - the filename of the database to load
     * @param {function} callback - the callback to handle the result
     * @memberof LokiLocalStorageAdapter
     */
    LokiLocalStorageAdapter.prototype.saveDatabase = function saveDatabase(dbname, dbstring, callback) {
      if (localStorageAvailable()) {
        localStorage.setItem(dbname, dbstring);
        callback(null);
      } else {
        callback(new Error('localStorage is not available'));
      }
    };

    /**
     * deleteDatabase() - delete the database from localstorage, will throw an error if it
     * can't be deleted
     * @param {string} dbname - the filename of the database to delete
     * @param {function} callback - the callback to handle the result
     * @memberof LokiLocalStorageAdapter
     */
    LokiLocalStorageAdapter.prototype.deleteDatabase = function deleteDatabase(dbname, callback) {
      if (localStorageAvailable()) {
        localStorage.removeItem(dbname);
        callback(null);
      } else {
        callback(new Error('localStorage is not available'));
      }
    };

    /**
     * Handles loading from file system, local storage, or adapter (indexeddb)
     *    This method utilizes loki configuration options (if provided) to determine which
     *    persistence method to use, or environment detection (if configuration was not provided).
     *
     * @param {object} options - not currently used (remove or allow overrides?)
     * @param {function=} callback - (Optional) user supplied async callback / error handler
     * @memberof Loki
     */
    Loki.prototype.loadDatabase = function (options, callback) {
      var cFun = callback || function (err, data) {
          if (err) {
            throw err;
          }
        },
        self = this;

      // the persistenceAdapter should be present if all is ok, but check to be sure.
      if (this.persistenceAdapter !== null) {

        this.persistenceAdapter.loadDatabase(this.filename, function loadDatabaseCallback(dbString) {
          if (typeof (dbString) === 'string') {
            var parseSuccess = false;
            try {
              self.loadJSON(dbString, options || {});
              parseSuccess = true;
            } catch (err) {
              cFun(err);
            }
            if (parseSuccess) {
              cFun(null);
              self.emit('loaded', 'database ' + self.filename + ' loaded');
            }
          } else {
            // if adapter has returned an js object (other than null or error) attempt to load from JSON object
            if (typeof (dbString) === "object" && dbString !== null && !(dbString instanceof Error)) {
              self.loadJSONObject(dbString, options || {});
              cFun(null); // return null on success
              self.emit('loaded', 'database ' + self.filename + ' loaded');
            } else {
              // error from adapter (either null or instance of error), pass on to 'user' callback
              cFun(dbString);
            }
          }
        });

      } else {
        cFun(new Error('persistenceAdapter not configured'));
      }
    };

    /**
     * Handles saving to file system, local storage, or adapter (indexeddb)
     *    This method utilizes loki configuration options (if provided) to determine which
     *    persistence method to use, or environment detection (if configuration was not provided).
     *
     * @param {function=} callback - (Optional) user supplied async callback / error handler
     * @memberof Loki
     */
    Loki.prototype.saveDatabase = function (callback) {
      var cFun = callback || function (err) {
          if (err) {
            throw err;
          }
          return;
        },
        self = this;

      // the persistenceAdapter should be present if all is ok, but check to be sure.
      if (this.persistenceAdapter !== null) {
        // check if the adapter is requesting (and supports) a 'reference' mode export
        if (this.persistenceAdapter.mode === "reference" && typeof this.persistenceAdapter.exportDatabase === "function") {
          // filename may seem redundant but loadDatabase will need to expect this same filename
          this.persistenceAdapter.exportDatabase(this.filename, this, function exportDatabaseCallback(err) {
            self.autosaveClearFlags();
            cFun(err);
          });
        }
        // otherwise just pass the serialized database to adapter
        else {
          this.persistenceAdapter.saveDatabase(this.filename, self.serialize(), function saveDatabasecallback(err) {
            self.autosaveClearFlags();
            cFun(err);
          });
        }
      } else {
        cFun(new Error('persistenceAdapter not configured'));
      }
    };

    // alias
    Loki.prototype.save = Loki.prototype.saveDatabase;

    /**
     * Handles deleting a database from file system, local
     *    storage, or adapter (indexeddb)
     *    This method utilizes loki configuration options (if provided) to determine which
     *    persistence method to use, or environment detection (if configuration was not provided).
     *
     * @param {object} options - not currently used (remove or allow overrides?)
     * @param {function=} callback - (Optional) user supplied async callback / error handler
     * @memberof Loki
     */
    Loki.prototype.deleteDatabase = function (options, callback) {
      var cFun = callback || function (err, data) {
          if (err) {
            throw err;
          }
        };

      // the persistenceAdapter should be present if all is ok, but check to be sure.
      if (this.persistenceAdapter !== null) {
        this.persistenceAdapter.deleteDatabase(this.filename, function deleteDatabaseCallback(err) {
          cFun(err);
        });
      } else {
        cFun(new Error('persistenceAdapter not configured'));
      }
    };

    /**
     * autosaveDirty - check whether any collections are 'dirty' meaning we need to save (entire) database
     *
     * @returns {boolean} - true if database has changed since last autosave, false if not.
     */
    Loki.prototype.autosaveDirty = function () {
      for (var idx = 0; idx < this.collections.length; idx++) {
        if (this.collections[idx].dirty) {
          return true;
        }
      }

      return false;
    };

    /**
     * autosaveClearFlags - resets dirty flags on all collections.
     *    Called from saveDatabase() after db is saved.
     *
     */
    Loki.prototype.autosaveClearFlags = function () {
      for (var idx = 0; idx < this.collections.length; idx++) {
        this.collections[idx].dirty = false;
      }
    };

    /**
     * autosaveEnable - begin a javascript interval to periodically save the database.
     *
     * @param {object} options - not currently used (remove or allow overrides?)
     * @param {function=} callback - (Optional) user supplied async callback
     */
    Loki.prototype.autosaveEnable = function (options, callback) {
      this.autosave = true;

      var delay = 5000,
        self = this;

      if (typeof (this.autosaveInterval) !== 'undefined' && this.autosaveInterval !== null) {
        delay = this.autosaveInterval;
      }

      this.autosaveHandle = setInterval(function autosaveHandleInterval() {
        // use of dirty flag will need to be hierarchical since mods are done at collection level with no visibility of 'db'
        // so next step will be to implement collection level dirty flags set on insert/update/remove
        // along with loki level isdirty() function which iterates all collections to see if any are dirty

        if (self.autosaveDirty()) {
          self.saveDatabase(callback);
        }
      }, delay);
    };

    /**
     * autosaveDisable - stop the autosave interval timer.
     *
     */
    Loki.prototype.autosaveDisable = function () {
      if (typeof (this.autosaveHandle) !== 'undefined' && this.autosaveHandle !== null) {
        clearInterval(this.autosaveHandle);
        this.autosaveHandle = null;
      }
    };


    /**
     * Resultset class allowing chainable queries.  Intended to be instanced internally.
     *    Collection.find(), Collection.where(), and Collection.chain() instantiate this.
     *
     * @example
     *    mycollection.chain()
     *      .find({ 'doors' : 4 })
     *      .where(function(obj) { return obj.name === 'Toyota' })
     *      .data();
     *
     * @constructor Resultset
     * @param {Collection} collection - The collection which this Resultset will query against.
     * @param {Object=} options - Object containing one or more options.
     * @param {string} options.queryObj - Optional mongo-style query object to initialize resultset with.
     * @param {function} options.queryFunc - Optional javascript filter function to initialize resultset with.
     * @param {bool} options.firstOnly - Optional boolean used by collection.findOne().
     */
    function Resultset(collection, options) {
      options = options || {};

      options.queryObj = options.queryObj || null;
      options.queryFunc = options.queryFunc || null;
      options.firstOnly = options.firstOnly || false;

      // retain reference to collection we are querying against
      this.collection = collection;

      // if chain() instantiates with null queryObj and queryFunc, so we will keep flag for later
      this.searchIsChained = (!options.queryObj && !options.queryFunc);
      this.filteredrows = [];
      this.filterInitialized = false;

      // if user supplied initial queryObj or queryFunc, apply it
      if (typeof (options.queryObj) !== "undefined" && options.queryObj !== null) {
        return this.find(options.queryObj, options.firstOnly);
      }
      if (typeof (options.queryFunc) !== "undefined" && options.queryFunc !== null) {
        return this.where(options.queryFunc);
      }

      // otherwise return unfiltered Resultset for future filtering
      return this;
    }

    /**
     * reset() - Reset the resultset to its initial state.
     *
     * @returns {Resultset} Reference to this resultset, for future chain operations.
     */
    Resultset.prototype.reset = function () {
      if (this.filteredrows.length > 0) {
        this.filteredrows = [];
      }
      this.filterInitialized = false;
      return this;
    };

    /**
     * toJSON() - Override of toJSON to avoid circular references
     *
     */
    Resultset.prototype.toJSON = function () {
      var copy = this.copy();
      copy.collection = null;
      return copy;
    };

    /**
     * Allows you to limit the number of documents passed to next chain operation.
     *    A resultset copy() is made to avoid altering original resultset.
     *
     * @param {int} qty - The number of documents to return.
     * @returns {Resultset} Returns a copy of the resultset, limited by qty, for subsequent chain ops.
     * @memberof Resultset
     */
    Resultset.prototype.limit = function (qty) {
      // if this is chained resultset with no filters applied, we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      var rscopy = new Resultset(this.collection);
      rscopy.filteredrows = this.filteredrows.slice(0, qty);
      rscopy.filterInitialized = true;
      return rscopy;
    };

    /**
     * Used for skipping 'pos' number of documents in the resultset.
     *
     * @param {int} pos - Number of documents to skip; all preceding documents are filtered out.
     * @returns {Resultset} Returns a copy of the resultset, containing docs starting at 'pos' for subsequent chain ops.
     * @memberof Resultset
     */
    Resultset.prototype.offset = function (pos) {
      // if this is chained resultset with no filters applied, we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      var rscopy = new Resultset(this.collection);
      rscopy.filteredrows = this.filteredrows.slice(pos);
      rscopy.filterInitialized = true;
      return rscopy;
    };

    /**
     * copy() - To support reuse of resultset in branched query situations.
     *
     * @returns {Resultset} Returns a copy of the resultset (set) but the underlying document references will be the same.
     * @memberof Resultset
     */
    Resultset.prototype.copy = function () {
      var result = new Resultset(this.collection);

      if (this.filteredrows.length > 0) {
        result.filteredrows = this.filteredrows.slice();
      }
      result.filterInitialized = this.filterInitialized;

      return result;
    };

    /**
     * Alias of copy()
     * @memberof Resultset
     */
    Resultset.prototype.branch = Resultset.prototype.copy;

    /**
     * transform() - executes a named collection transform or raw array of transform steps against the resultset.
     *
     * @param transform {(string|array)} - name of collection transform or raw transform array
     * @param parameters {object=} - (Optional) object property hash of parameters, if the transform requires them.
     * @returns {Resultset} either (this) resultset or a clone of of this resultset (depending on steps)
     * @memberof Resultset
     */
    Resultset.prototype.transform = function (transform, parameters) {
      var idx,
        step,
        rs = this;

      // if transform is name, then do lookup first
      if (typeof transform === 'string') {
        if (this.collection.transforms.hasOwnProperty(transform)) {
          transform = this.collection.transforms[transform];
        }
      }

      // either they passed in raw transform array or we looked it up, so process
      if (typeof transform !== 'object' || !Array.isArray(transform)) {
          throw new Error("Invalid transform");
      }

      if (typeof parameters !== 'undefined') {
        transform = Utils.resolveTransformParams(transform, parameters);
      }

      for (idx = 0; idx < transform.length; idx++) {
        step = transform[idx];

        switch (step.type) {
        case "find":
          rs.find(step.value);
          break;
        case "where":
          rs.where(step.value);
          break;
        case "simplesort":
          rs.simplesort(step.property, step.desc);
          break;
        case "compoundsort":
          rs.compoundsort(step.value);
          break;
        case "sort":
          rs.sort(step.value);
          break;
        case "limit":
          rs = rs.limit(step.value);
          break; // limit makes copy so update reference
        case "offset":
          rs = rs.offset(step.value);
          break; // offset makes copy so update reference
        case "map":
          rs = rs.map(step.value);
          break;
        case "eqJoin":
          rs = rs.eqJoin(step.joinData, step.leftJoinKey, step.rightJoinKey, step.mapFun);
          break;
          // following cases break chain by returning array data so make any of these last in transform steps
        case "mapReduce":
          rs = rs.mapReduce(step.mapFunction, step.reduceFunction);
          break;
          // following cases update documents in current filtered resultset (use carefully)
        case "update":
          rs.update(step.value);
          break;
        case "remove":
          rs.remove();
          break;
        default:
          break;
        }
      }

      return rs;
    };

    /**
     * User supplied compare function is provided two documents to compare. (chainable)
     * @example
     *    rslt.sort(function(obj1, obj2) {
     *      if (obj1.name === obj2.name) return 0;
     *      if (obj1.name > obj2.name) return 1;
     *      if (obj1.name < obj2.name) return -1;
     *    });
     *
     * @param {function} comparefun - A javascript compare function used for sorting.
     * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
     * @memberof Resultset
     */
    Resultset.prototype.sort = function (comparefun) {
      // if this is chained resultset with no filters applied, just we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      var wrappedComparer =
        (function (userComparer, data) {
          return function (a, b) {
            return userComparer(data[a], data[b]);
          };
        })(comparefun, this.collection.data);

      this.filteredrows.sort(wrappedComparer);

      return this;
    };

    /**
     * Simpler, loose evaluation for user to sort based on a property name. (chainable).
     *    Sorting based on the same lt/gt helper functions used for binary indices.
     *
     * @param {string} propname - name of property to sort by.
     * @param {bool=} isdesc - (Optional) If true, the property will be sorted in descending order
     * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
     * @memberof Resultset
     */
    Resultset.prototype.simplesort = function (propname, isdesc) {
      // if this is chained resultset with no filters applied, just we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      if (typeof (isdesc) === 'undefined') {
        isdesc = false;
      }

      var wrappedComparer =
        (function (prop, desc, data) {
          return function (a, b) {
            return sortHelper(data[a][prop], data[b][prop], desc);
          };
        })(propname, isdesc, this.collection.data);

      this.filteredrows.sort(wrappedComparer);

      return this;
    };

    /**
     * Allows sorting a resultset based on multiple columns.
     * @example
     * // to sort by age and then name (both ascending)
     * rs.compoundsort(['age', 'name']);
     * // to sort by age (ascending) and then by name (descending)
     * rs.compoundsort(['age', ['name', true]);
     *
     * @param {array} properties - array of property names or subarray of [propertyname, isdesc] used evaluate sort order
     * @returns {Resultset} Reference to this resultset, sorted, for future chain operations.
     * @memberof Resultset
     */
    Resultset.prototype.compoundsort = function (properties) {
      if (properties.length === 0) {
        throw new Error("Invalid call to compoundsort, need at least one property");
      }

      var prop;
      if (properties.length === 1) {
        prop = properties[0];
        if (Array.isArray(prop)) {
          return this.simplesort(prop[0], prop[1]);
        }
        return this.simplesort(prop, false);
      }

      // unify the structure of 'properties' to avoid checking it repeatedly while sorting
      for (var i = 0, len = properties.length; i < len; i += 1) {
        prop = properties[i];
        if (!Array.isArray(prop)) {
          properties[i] = [prop, false];
        }
      }

      // if this is chained resultset with no filters applied, just we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      var wrappedComparer =
        (function (props, data) {
          return function (a, b) {
            return compoundeval(props, data[a], data[b]);
          };
        })(properties, this.collection.data);

      this.filteredrows.sort(wrappedComparer);

      return this;
    };

    /**
     * calculateRange() - Binary Search utility method to find range/segment of values matching criteria.
     *    this is used for collection.find() and first find filter of resultset/dynview
     *    slightly different than get() binary search in that get() hones in on 1 value,
     *    but we have to hone in on many (range)
     * @param {string} op - operation, such as $eq
     * @param {string} prop - name of property to calculate range for
     * @param {object} val - value to use for range calculation.
     * @returns {array} [start, end] index array positions
     */
    Resultset.prototype.calculateRange = function (op, prop, val) {
      var rcd = this.collection.data;
      var index = this.collection.binaryIndices[prop].values;
      var min = 0;
      var max = index.length - 1;
      var mid = 0;

      // when no documents are in collection, return empty range condition
      if (rcd.length === 0) {
        return [0, -1];
      }

      var minVal = rcd[index[min]][prop];
      var maxVal = rcd[index[max]][prop];

      // if value falls outside of our range return [0, -1] to designate no results
      switch (op) {
      case '$eq':
      case '$aeq':
        if (ltHelper(val, minVal, false) || gtHelper(val, maxVal, false)) {
          return [0, -1];
        }
        break;
      case '$dteq':
        if (ltHelper(val, minVal, false) || gtHelper(val, maxVal, false)) {
          return [0, -1];
        }
        break;
      case '$gt':
        if (gtHelper(val, maxVal, true)) {
          return [0, -1];
        }
        break;
      case '$gte':
        if (gtHelper(val, maxVal, false)) {
          return [0, -1];
        }
        break;
      case '$lt':
        if (ltHelper(val, minVal, true)) {
          return [0, -1];
        }
        if (ltHelper(maxVal, val, false)) {
          return [0, rcd.length - 1];
        }
        break;
      case '$lte':
        if (ltHelper(val, minVal, false)) {
          return [0, -1];
        }
        if (ltHelper(maxVal, val, true)) {
          return [0, rcd.length - 1];
        }
        break;
      }

      // hone in on start position of value
      while (min < max) {
        mid = (min + max) >> 1;

        if (ltHelper(rcd[index[mid]][prop], val, false)) {
          min = mid + 1;
        } else {
          max = mid;
        }
      }

      var lbound = min;

      // do not reset min, as the upper bound cannot be prior to the found low bound
      max = index.length - 1;

      // hone in on end position of value
      while (min < max) {
        mid = (min + max) >> 1;

        if (ltHelper(val, rcd[index[mid]][prop], false)) {
          max = mid;
        } else {
          min = mid + 1;
        }
      }

      var ubound = max;

      var lval = rcd[index[lbound]][prop];
      var uval = rcd[index[ubound]][prop];

      switch (op) {
      case '$eq':
        if (lval !== val) {
          return [0, -1];
        }
        if (uval !== val) {
          ubound--;
        }

        return [lbound, ubound];
      case '$dteq':
        if (lval > val || lval < val) {
          return [0, -1];
        }
        if (uval > val || uval < val) {
          ubound--;
        }

        return [lbound, ubound];


      case '$gt':
        if (ltHelper(uval, val, true)) {
          return [0, -1];
        }

        return [ubound, rcd.length - 1];

      case '$gte':
        if (ltHelper(lval, val, false)) {
          return [0, -1];
        }

        return [lbound, rcd.length - 1];

      case '$lt':
        if (lbound === 0 && ltHelper(lval, val, false)) {
          return [0, 0];
        }
        return [0, lbound - 1];

      case '$lte':
        if (uval !== val) {
          ubound--;
        }

        if (ubound === 0 && ltHelper(uval, val, false)) {
          return [0, 0];
        }
        return [0, ubound];

      default:
        return [0, rcd.length - 1];
      }
    };

    /**
     * findOr() - oversee the operation of OR'ed query expressions.
     *    OR'ed expression evaluation runs each expression individually against the full collection,
     *    and finally does a set OR on each expression's results.
     *    Each evaluation can utilize a binary index to prevent multiple linear array scans.
     *
     * @param {array} expressionArray - array of expressions
     * @returns {Resultset} this resultset for further chain ops.
     */
    Resultset.prototype.findOr = function (expressionArray) {
      var fr = null,
          fri = 0, frlen = 0,
          docset = [], idxset = [], idx = 0,
          origCount = this.count();

      // If filter is already initialized, then we query against only those items already in filter.
      // This means no index utilization for fields, so hopefully its filtered to a smallish filteredrows.
      for (var ei = 0, elen = expressionArray.length; ei < elen; ei++) {
        // we need to branch existing query to run each filter separately and combine results
        fr = this.branch().find(expressionArray[ei]).filteredrows;
        frlen = fr.length;
        // if the find operation did not reduce the initial set, then the initial set is the actual result
        if (frlen === origCount) {
          return this;
        }

        // add any document 'hits'
        for (fri = 0; fri < frlen; fri++) {
          idx = fr[fri];
          if (idxset[idx] === undefined) {
            idxset[idx] = true;
            docset.push(idx);
          }
        }
      }

      this.filteredrows = docset;
      this.filterInitialized = true;

      return this;
    };
    Resultset.prototype.$or = Resultset.prototype.findOr;

    /**
     * findAnd() - oversee the operation of AND'ed query expressions.
     *    AND'ed expression evaluation runs each expression progressively against the full collection,
     *    internally utilizing existing chained resultset functionality.
     *    Only the first filter can utilize a binary index.
     *
     * @param {array} expressionArray - array of expressions
     * @returns {Resultset} this resultset for further chain ops.
     */
    Resultset.prototype.findAnd = function (expressionArray) {
      // we have already implementing method chaining in this (our Resultset class)
      // so lets just progressively apply user supplied and filters
      for (var i = 0, len = expressionArray.length; i < len; i++) {
        if (this.count() === 0) {
          return this;
        }
        this.find(expressionArray[i]);
      }
      return this;
    };
    Resultset.prototype.$and = Resultset.prototype.findAnd;

    /**
     * Used for querying via a mongo-style query object.
     *
     * @param {object} query - A mongo-style query object used for filtering current results.
     * @param {boolean=} firstOnly - (Optional) Used by collection.findOne()
     * @returns {Resultset} this resultset for further chain ops.
     * @memberof Resultset
     */
    Resultset.prototype.find = function (query, firstOnly) {
      if (this.collection.data.length === 0) {
        if (this.searchIsChained) {
          this.filteredrows = [];
          this.filterInitialized = true;
          return this;
        }
        return [];
      }

      var queryObject = query || 'getAll',
          p,
          property,
          queryObjectOp,
          operator,
          value,
          key,
          searchByIndex = false,
          result = [],
          index = null;

      // if this was note invoked via findOne()
      firstOnly = firstOnly || false;

      if (typeof queryObject === 'object') {
        for (p in queryObject) {
          if (hasOwnProperty.call(queryObject, p)) {
            property = p;
            queryObjectOp = queryObject[p];
            break;
          }
        }
      }

      // apply no filters if they want all
      if (!property || queryObject === 'getAll') {
        // Chained queries can just do coll.chain().data() but let's
        // be versatile and allow this also coll.chain().find().data()

        // If a chained search, simply leave everything as-is.
        // Note: If no filter at this point, it will be properly
        // created by the follow-up queries or sorts that need it.
        // If not chained, then return the collection data array copy.
        return (this.searchIsChained) ? (this) : (this.collection.data.slice());
      }

      // injecting $and and $or expression tree evaluation here.
      if (property === '$and' || property === '$or') {
        if (this.searchIsChained) {
          this[property](queryObjectOp);

          // for chained find with firstonly,
          if (firstOnly && this.filteredrows.length > 1) {
            this.filteredrows = this.filteredrows.slice(0, 1);
          }

          return this;
        } else {
          // our $and operation internally chains filters
          result = this.collection.chain()[property](queryObjectOp).data();

          // if this was coll.findOne() return first object or empty array if null
          // since this is invoked from a constructor we can't return null, so we will
          // make null in coll.findOne();
          if (firstOnly) {
            return (result.length === 0) ? ([]) : (result[0]);
          }

          // not first only return all results
          return result;
        }
      }

      // see if query object is in shorthand mode (assuming eq operator)
      if (queryObjectOp === null || (typeof queryObjectOp !== 'object' || queryObjectOp instanceof Date)) {
        operator = '$eq';
        value = queryObjectOp;
      } else if (typeof queryObjectOp === 'object') {
        for (key in queryObjectOp) {
          if (hasOwnProperty.call(queryObjectOp, key)) {
            operator = key;
            value = queryObjectOp[key];
            break;
          }
        }
      } else {
        throw new Error('Do not know what you want to do.');
      }

      // for regex ops, precompile
      if (operator === '$regex') {
        if (Array.isArray(value)) {
          value = new RegExp(value[0], value[1]);
        }
        else if (!(value instanceof RegExp)) {
          value = new RegExp(value);
        }
      }

      // if user is deep querying the object such as find('name.first': 'odin')
      var usingDotNotation = (property.indexOf('.') !== -1);

      // if an index exists for the property being queried against, use it
      // for now only enabling for non-chained query (who's set of docs matches index)
      // or chained queries where it is the first filter applied and prop is indexed
      var doIndexCheck = !usingDotNotation &&
          (!this.searchIsChained || !this.filterInitialized);

      if (doIndexCheck && this.collection.binaryIndices[property] &&
          indexedOpsList.indexOf(operator) !== -1) {
        // this is where our lazy index rebuilding will take place
        // basically we will leave all indexes dirty until we need them
        // so here we will rebuild only the index tied to this property
        // ensureIndex() will only rebuild if flagged as dirty since we are not passing force=true param
        this.collection.ensureIndex(property);

        searchByIndex = true;
        index = this.collection.binaryIndices[property];
      }

      // the comparison function
      var fun = LokiOps[operator];

      // "shortcut" for collection data
      var t = this.collection.data;
      // filter data length
      var i = 0;

      // Query executed differently depending on :
      //    - whether it is chained or not
      //    - whether the property being queried has an index defined
      //    - if chained, we handle first pass differently for initial filteredrows[] population
      //
      // For performance reasons, each case has its own if block to minimize in-loop calculations

      // If not a chained query, bypass filteredrows and work directly against data
      if (!this.searchIsChained) {
        if (!searchByIndex) {
          i = t.length;

          if (firstOnly) {
            if (usingDotNotation) {
              property = property.split('.');
              while (i--) {
                if (dotSubScan(t[i], property, fun, value)) {
                  return (t[i]);
                }
              }
            } else {
              while (i--) {
                if (fun(t[i][property], value)) {
                  return (t[i]);
                }
              }
            }

            return [];
          }

          // if using dot notation then treat property as keypath such as 'name.first'.
          // currently supporting dot notation for non-indexed conditions only
          if (usingDotNotation) {
            property = property.split('.');
            while (i--) {
              if (dotSubScan(t[i], property, fun, value)) {
                result.push(t[i]);
              }
            }
          } else {
            while (i--) {
              if (fun(t[i][property], value)) {
                result.push(t[i]);
              }
            }
          }
        } else {
          // searching by binary index via calculateRange() utility method
          var seg = this.calculateRange(operator, property, value);

          // not chained so this 'find' was designated in Resultset constructor
          // so return object itself
          if (firstOnly) {
            if (seg[1] !== -1) {
              return t[index.values[seg[0]]];
            }
            return [];
          }

          for (i = seg[0]; i <= seg[1]; i++) {
            result.push(t[index.values[i]]);
          }
        }

        // not a chained query so return result as data[]
        return result;
      }


      // Otherwise this is a chained query

      var filter, rowIdx = 0;

      // If the filteredrows[] is already initialized, use it
      if (this.filterInitialized) {
        filter = this.filteredrows;
        i = filter.length;

        // currently supporting dot notation for non-indexed conditions only
        if (usingDotNotation) {
          property = property.split('.');
          while (i--) {
            rowIdx = filter[i];
            if (dotSubScan(t[rowIdx], property, fun, value)) {
              result.push(rowIdx);
            }
          }
        } else {
          while (i--) {
            rowIdx = filter[i];
            if (fun(t[rowIdx][property], value)) {
              result.push(rowIdx);
            }
          }
        }
      }
      // first chained query so work against data[] but put results in filteredrows
      else {
        // if not searching by index
        if (!searchByIndex) {
          i = t.length;

          if (usingDotNotation) {
            property = property.split('.');
            while (i--) {
              if (dotSubScan(t[i], property, fun, value)) {
                result.push(i);
              }
            }
          } else {
            while (i--) {
              if (fun(t[i][property], value)) {
                result.push(i);
              }
            }
          }
        } else {
          // search by index
          var segm = this.calculateRange(operator, property, value);

          for (i = segm[0]; i <= segm[1]; i++) {
            result.push(index.values[i]);
          }
        }

        this.filterInitialized = true; // next time work against filteredrows[]
      }

      this.filteredrows = result;
      return this;
    };


    /**
     * where() - Used for filtering via a javascript filter function.
     *
     * @param {function} fun - A javascript function used for filtering current results by.
     * @returns {Resultset} this resultset for further chain ops.
     * @memberof Resultset
     */
    Resultset.prototype.where = function (fun) {
      var viewFunction,
        result = [];

      if ('function' === typeof fun) {
        viewFunction = fun;
      } else {
        throw new TypeError('Argument is not a stored view or a function');
      }
      try {
        // if not a chained query then run directly against data[] and return object []
        if (!this.searchIsChained) {
          var i = this.collection.data.length;

          while (i--) {
            if (viewFunction(this.collection.data[i]) === true) {
              result.push(this.collection.data[i]);
            }
          }

          // not a chained query so returning result as data[]
          return result;
        }
        // else chained query, so run against filteredrows
        else {
          // If the filteredrows[] is already initialized, use it
          if (this.filterInitialized) {
            var j = this.filteredrows.length;

            while (j--) {
              if (viewFunction(this.collection.data[this.filteredrows[j]]) === true) {
                result.push(this.filteredrows[j]);
              }
            }

            this.filteredrows = result;

            return this;
          }
          // otherwise this is initial chained op, work against data, push into filteredrows[]
          else {
            var k = this.collection.data.length;

            while (k--) {
              if (viewFunction(this.collection.data[k]) === true) {
                result.push(k);
              }
            }

            this.filteredrows = result;
            this.filterInitialized = true;

            return this;
          }
        }
      } catch (err) {
        throw err;
      }
    };

    /**
     * count() - returns the number of documents in the resultset.
     *
     * @returns {number} The number of documents in the resultset.
     * @memberof Resultset
     */
    Resultset.prototype.count = function () {
      if (this.searchIsChained && this.filterInitialized) {
        return this.filteredrows.length;
      }
      return this.collection.count();
    };

    /**
     * Terminates the chain and returns array of filtered documents
     *
     * @param {object=} options - allows specifying 'forceClones' and 'forceCloneMethod' options.
     * @param {boolean} options.forceClones - Allows forcing the return of cloned objects even when
     *        the collection is not configured for clone object.
     * @param {string} options.forceCloneMethod - Allows overriding the default or collection specified cloning method.
     *        Possible values include 'parse-stringify', 'jquery-extend-deep', and 'shallow'
     *
     * @returns {array} Array of documents in the resultset
     * @memberof Resultset
     */
    Resultset.prototype.data = function (options) {
      var result = [],
        data = this.collection.data,
        len,
        i,
        method;

      options = options || {};

      // if this is chained resultset with no filters applied, just return collection.data
      if (this.searchIsChained && !this.filterInitialized) {
        if (this.filteredrows.length === 0) {
          // determine whether we need to clone objects or not
          if (this.collection.cloneObjects || options.forceClones) {
            len = data.length;
            method = options.forceCloneMethod || this.collection.cloneMethod;

            for (i = 0; i < len; i++) {
              result.push(clone(data[i], method));
            }
            return result;
          }
          // otherwise we are not cloning so return sliced array with same object references
          else {
            return data.slice();
          }
        } else {
          // filteredrows must have been set manually, so use it
          this.filterInitialized = true;
        }
      }

      var fr = this.filteredrows;
      len = fr.length;

      if (this.collection.cloneObjects || options.forceClones) {
        method = options.forceCloneMethod || this.collection.cloneMethod;
        for (i = 0; i < len; i++) {
          result.push(clone(data[fr[i]], method));
        }
      }
      else {
        for (i = 0; i < len; i++) {
          result.push(data[fr[i]]);
        }
      }
      return result;
    };

    /**
     * Used to run an update operation on all documents currently in the resultset.
     *
     * @param {function} updateFunction - User supplied updateFunction(obj) will be executed for each document object.
     * @returns {Resultset} this resultset for further chain ops.
     * @memberof Resultset
     */
    Resultset.prototype.update = function (updateFunction) {

      if (typeof (updateFunction) !== "function") {
        throw new TypeError('Argument is not a function');
      }

      // if this is chained resultset with no filters applied, we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      var len = this.filteredrows.length,
        rcd = this.collection.data;

      for (var idx = 0; idx < len; idx++) {
        // pass in each document object currently in resultset to user supplied updateFunction
        updateFunction(rcd[this.filteredrows[idx]]);

        // notify collection we have changed this object so it can update meta and allow DynamicViews to re-evaluate
        this.collection.update(rcd[this.filteredrows[idx]]);
      }

      return this;
    };

    /**
     * Removes all document objects which are currently in resultset from collection (as well as resultset)
     *
     * @returns {Resultset} this (empty) resultset for further chain ops.
     * @memberof Resultset
     */
    Resultset.prototype.remove = function () {

      // if this is chained resultset with no filters applied, we need to populate filteredrows first
      if (this.searchIsChained && !this.filterInitialized && this.filteredrows.length === 0) {
        this.filteredrows = this.collection.prepareFullDocIndex();
      }

      this.collection.remove(this.data());

      this.filteredrows = [];

      return this;
    };

    /**
     * data transformation via user supplied functions
     *
     * @param {function} mapFunction - this function accepts a single document for you to transform and return
     * @param {function} reduceFunction - this function accepts many (array of map outputs) and returns single value
     * @returns {value} The output of your reduceFunction
     * @memberof Resultset
     */
    Resultset.prototype.mapReduce = function (mapFunction, reduceFunction) {
      try {
        return reduceFunction(this.data().map(mapFunction));
      } catch (err) {
        throw err;
      }
    };

    /**
     * eqJoin() - Left joining two sets of data. Join keys can be defined or calculated properties
     * eqJoin expects the right join key values to be unique.  Otherwise left data will be joined on the last joinData object with that key
     * @param {Array} joinData - Data array to join to.
     * @param {(string|function)} leftJoinKey - Property name in this result set to join on or a function to produce a value to join on
     * @param {(string|function)} rightJoinKey - Property name in the joinData to join on or a function to produce a value to join on
     * @param {function=} mapFun - (Optional) A function that receives each matching pair and maps them into output objects - function(left,right){return joinedObject}
     * @returns {Resultset} A resultset with data in the format [{left: leftObj, right: rightObj}]
     * @memberof Resultset
     */
    Resultset.prototype.eqJoin = function (joinData, leftJoinKey, rightJoinKey, mapFun) {

      var leftData = [],
        leftDataLength,
        rightData = [],
        rightDataLength,
        key,
        result = [],
        leftKeyisFunction = typeof leftJoinKey === 'function',
        rightKeyisFunction = typeof rightJoinKey === 'function',
        joinMap = {};

      //get the left data
      leftData = this.data();
      leftDataLength = leftData.length;

      //get the right data
      if (joinData instanceof Resultset) {
        rightData = joinData.data();
      } else if (Array.isArray(joinData)) {
        rightData = joinData;
      } else {
        throw new TypeError('joinData needs to be an array or result set');
      }
      rightDataLength = rightData.length;

      //construct a lookup table

      for (var i = 0; i < rightDataLength; i++) {
        key = rightKeyisFunction ? rightJoinKey(rightData[i]) : rightData[i][rightJoinKey];
        joinMap[key] = rightData[i];
      }

      if (!mapFun) {
        mapFun = function (left, right) {
          return {
            left: left,
            right: right
          };
        };
      }

      //Run map function over each object in the resultset
      for (var j = 0; j < leftDataLength; j++) {
        key = leftKeyisFunction ? leftJoinKey(leftData[j]) : leftData[j][leftJoinKey];
        result.push(mapFun(leftData[j], joinMap[key] || {}));
      }

      //return return a new resultset with no filters
      this.collection = new Collection('joinData');
      this.collection.insert(result);
      this.filteredrows = [];
      this.filterInitialized = false;

      return this;
    };

    Resultset.prototype.map = function (mapFun) {
      var data = this.data().map(mapFun);
      //return return a new resultset with no filters
      this.collection = new Collection('mappedData');
      this.collection.insert(data);
      this.filteredrows = [];
      this.filterInitialized = false;

      return this;
    };

    /**
     * DynamicView class is a versatile 'live' view class which can have filters and sorts applied.
     *    Collection.addDynamicView(name) instantiates this DynamicView object and notifies it
     *    whenever documents are add/updated/removed so it can remain up-to-date. (chainable)
     *
     * @example
     * var mydv = mycollection.addDynamicView('test');  // default is non-persistent
     * mydv.applyFind({ 'doors' : 4 });
     * mydv.applyWhere(function(obj) { return obj.name === 'Toyota'; });
     * var results = mydv.data();
     *
     * @constructor DynamicView
     * @implements LokiEventEmitter
     * @param {Collection} collection - A reference to the collection to work against
     * @param {string} name - The name of this dynamic view
     * @param {object=} options - (Optional) Pass in object with 'persistent' and/or 'sortPriority' options.
     * @param {boolean} options.persistent - indicates if view is to main internal results array in 'resultdata'
     * @param {string} options.sortPriority - 'passive' (sorts performed on call to data) or 'active' (after updates)
     * @param {number} options.minRebuildInterval - minimum rebuild interval (need clarification to docs here)
     * @see {@link Collection#addDynamicView} to construct instances of DynamicView
     */
    function DynamicView(collection, name, options) {
      this.collection = collection;
      this.name = name;
      this.rebuildPending = false;
      this.options = options || {};

      if (!this.options.hasOwnProperty('persistent')) {
        this.options.persistent = false;
      }

      // 'persistentSortPriority':
      // 'passive' will defer the sort phase until they call data(). (most efficient overall)
      // 'active' will sort async whenever next idle. (prioritizes read speeds)
      if (!this.options.hasOwnProperty('sortPriority')) {
        this.options.sortPriority = 'passive';
      }

      if (!this.options.hasOwnProperty('minRebuildInterval')) {
        this.options.minRebuildInterval = 1;
      }

      this.resultset = new Resultset(collection);
      this.resultdata = [];
      this.resultsdirty = false;

      this.cachedresultset = null;

      // keep ordered filter pipeline
      this.filterPipeline = [];

      // sorting member variables
      // we only support one active search, applied using applySort() or applySimpleSort()
      this.sortFunction = null;
      this.sortCriteria = null;
      this.sortDirty = false;

      // for now just have 1 event for when we finally rebuilt lazy view
      // once we refactor transactions, i will tie in certain transactional events

      this.events = {
        'rebuild': []
      };
    }

    DynamicView.prototype = new LokiEventEmitter();


    /**
     * rematerialize() - intended for use immediately after deserialization (loading)
     *    This will clear out and reapply filterPipeline ops, recreating the view.
     *    Since where filters do not persist correctly, this method allows
     *    restoring the view to state where user can re-apply those where filters.
     *
     * @param {Object=} options - (Optional) allows specification of 'removeWhereFilters' option
     * @returns {DynamicView} This dynamic view for further chained ops.
     * @memberof DynamicView
     * @fires DynamicView.rebuild
     */
    DynamicView.prototype.rematerialize = function (options) {
      var fpl,
        fpi,
        idx;

      options = options || {};

      this.resultdata = [];
      this.resultsdirty = true;
      this.resultset = new Resultset(this.collection);

      if (this.sortFunction || this.sortCriteria) {
        this.sortDirty = true;
      }

      if (options.hasOwnProperty('removeWhereFilters')) {
        // for each view see if it had any where filters applied... since they don't
        // serialize those functions lets remove those invalid filters
        fpl = this.filterPipeline.length;
        fpi = fpl;
        while (fpi--) {
          if (this.filterPipeline[fpi].type === 'where') {
            if (fpi !== this.filterPipeline.length - 1) {
              this.filterPipeline[fpi] = this.filterPipeline[this.filterPipeline.length - 1];
            }

            this.filterPipeline.length--;
          }
        }
      }

      // back up old filter pipeline, clear filter pipeline, and reapply pipeline ops
      var ofp = this.filterPipeline;
      this.filterPipeline = [];

      // now re-apply 'find' filterPipeline ops
      fpl = ofp.length;
      for (idx = 0; idx < fpl; idx++) {
        this.applyFind(ofp[idx].val);
      }

      // during creation of unit tests, i will remove this forced refresh and leave lazy
      this.data();

      // emit rebuild event in case user wants to be notified
      this.emit('rebuild', this);

      return this;
    };

    /**
     * branchResultset() - Makes a copy of the internal resultset for branched queries.
     *    Unlike this dynamic view, the branched resultset will not be 'live' updated,
     *    so your branched query should be immediately resolved and not held for future evaluation.
     *
     * @param {(string|array=)} transform - Optional name of collection transform, or an array of transform steps
     * @param {object=} parameters - optional parameters (if optional transform requires them)
     * @returns {Resultset} A copy of the internal resultset for branched queries.
     * @memberof DynamicView
     */
    DynamicView.prototype.branchResultset = function (transform, parameters) {
      var rs = this.resultset.branch();

      if (typeof transform === 'undefined') {
        return rs;
      }

      return rs.transform(transform, parameters);
    };

    /**
     * toJSON() - Override of toJSON to avoid circular references
     *
     */
    DynamicView.prototype.toJSON = function () {
      var copy = new DynamicView(this.collection, this.name, this.options);

      copy.resultset = this.resultset;
      copy.resultdata = []; // let's not save data (copy) to minimize size
      copy.resultsdirty = true;
      copy.filterPipeline = this.filterPipeline;
      copy.sortFunction = this.sortFunction;
      copy.sortCriteria = this.sortCriteria;
      copy.sortDirty = this.sortDirty;

      // avoid circular reference, reapply in db.loadJSON()
      copy.collection = null;

      return copy;
    };

    /**
     * removeFilters() - Used to clear pipeline and reset dynamic view to initial state.
     *     Existing options should be retained.
     * @memberof DynamicView
     */
    DynamicView.prototype.removeFilters = function () {
      this.rebuildPending = false;
      this.resultset.reset();
      this.resultdata = [];
      this.resultsdirty = false;

      this.cachedresultset = null;

      // keep ordered filter pipeline
      this.filterPipeline = [];

      // sorting member variables
      // we only support one active search, applied using applySort() or applySimpleSort()
      this.sortFunction = null;
      this.sortCriteria = null;
      this.sortDirty = false;
    };

    /**
     * applySort() - Used to apply a sort to the dynamic view
     * @example
     * dv.applySort(function(obj1, obj2) {
     *   if (obj1.name === obj2.name) return 0;
     *   if (obj1.name > obj2.name) return 1;
     *   if (obj1.name < obj2.name) return -1;
     * });
     *
     * @param {function} comparefun - a javascript compare function used for sorting
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     * @memberof DynamicView
     */
    DynamicView.prototype.applySort = function (comparefun) {
      this.sortFunction = comparefun;
      this.sortCriteria = null;

      this.queueSortPhase();

      return this;
    };

    /**
     * applySimpleSort() - Used to specify a property used for view translation.
     * @example
     * dv.applySimpleSort("name");
     *
     * @param {string} propname - Name of property by which to sort.
     * @param {boolean=} isdesc - (Optional) If true, the sort will be in descending order.
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     * @memberof DynamicView
     */
    DynamicView.prototype.applySimpleSort = function (propname, isdesc) {
      this.sortCriteria = [
        [propname, isdesc || false]
      ];
      this.sortFunction = null;

      this.queueSortPhase();

      return this;
    };

    /**
     * applySortCriteria() - Allows sorting a resultset based on multiple columns.
     * @example
     * // to sort by age and then name (both ascending)
     * dv.applySortCriteria(['age', 'name']);
     * // to sort by age (ascending) and then by name (descending)
     * dv.applySortCriteria(['age', ['name', true]);
     * // to sort by age (descending) and then by name (descending)
     * dv.applySortCriteria(['age', true], ['name', true]);
     *
     * @param {array} properties - array of property names or subarray of [propertyname, isdesc] used evaluate sort order
     * @returns {DynamicView} Reference to this DynamicView, sorted, for future chain operations.
     * @memberof DynamicView
     */
    DynamicView.prototype.applySortCriteria = function (criteria) {
      this.sortCriteria = criteria;
      this.sortFunction = null;

      this.queueSortPhase();

      return this;
    };

    /**
     * startTransaction() - marks the beginning of a transaction.
     *
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.startTransaction = function () {
      this.cachedresultset = this.resultset.copy();

      return this;
    };

    /**
     * commit() - commits a transaction.
     *
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.commit = function () {
      this.cachedresultset = null;

      return this;
    };

    /**
     * rollback() - rolls back a transaction.
     *
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.rollback = function () {
      this.resultset = this.cachedresultset;

      if (this.options.persistent) {
        // for now just rebuild the persistent dynamic view data in this worst case scenario
        // (a persistent view utilizing transactions which get rolled back), we already know the filter so not too bad.
        this.resultdata = this.resultset.data();

        this.emit('rebuild', this);
      }

      return this;
    };


    /**
     * Implementation detail.
     * _indexOfFilterWithId() - Find the index of a filter in the pipeline, by that filter's ID.
     *
     * @param {(string|number)} uid - The unique ID of the filter.
     * @returns {number}: index of the referenced filter in the pipeline; -1 if not found.
     */
    DynamicView.prototype._indexOfFilterWithId = function (uid) {
      if (typeof uid === 'string' || typeof uid === 'number') {
        for (var idx = 0, len = this.filterPipeline.length; idx < len; idx += 1) {
          if (uid === this.filterPipeline[idx].uid) {
            return idx;
          }
        }
      }
      return -1;
    };

    /**
     * Implementation detail.
     * _addFilter() - Add the filter object to the end of view's filter pipeline and apply the filter to the resultset.
     *
     * @param {object} filter - The filter object. Refer to applyFilter() for extra details.
     */
    DynamicView.prototype._addFilter = function (filter) {
      this.filterPipeline.push(filter);
      this.resultset[filter.type](filter.val);
    };

    /**
     * reapplyFilters() - Reapply all the filters in the current pipeline.
     *
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     */
    DynamicView.prototype.reapplyFilters = function () {
      this.resultset.reset();

      this.cachedresultset = null;
      if (this.options.persistent) {
        this.resultdata = [];
        this.resultsdirty = true;
      }

      var filters = this.filterPipeline;
      this.filterPipeline = [];

      for (var idx = 0, len = filters.length; idx < len; idx += 1) {
        this._addFilter(filters[idx]);
      }

      if (this.sortFunction || this.sortCriteria) {
        this.queueSortPhase();
      } else {
        this.queueRebuildEvent();
      }

      return this;
    };

    /**
     * applyFilter() - Adds or updates a filter in the DynamicView filter pipeline
     *
     * @param {object} filter - A filter object to add to the pipeline.
     *    The object is in the format { 'type': filter_type, 'val', filter_param, 'uid', optional_filter_id }
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     * @memberof DynamicView
     */
    DynamicView.prototype.applyFilter = function (filter) {
      var idx = this._indexOfFilterWithId(filter.uid);
      if (idx >= 0) {
        this.filterPipeline[idx] = filter;
        return this.reapplyFilters();
      }

      this.cachedresultset = null;
      if (this.options.persistent) {
        this.resultdata = [];
        this.resultsdirty = true;
      }

      this._addFilter(filter);

      if (this.sortFunction || this.sortCriteria) {
        this.queueSortPhase();
      } else {
        this.queueRebuildEvent();
      }

      return this;
    };

    /**
     * applyFind() - Adds or updates a mongo-style query option in the DynamicView filter pipeline
     *
     * @param {object} query - A mongo-style query object to apply to pipeline
     * @param {(string|number)=} uid - Optional: The unique ID of this filter, to reference it in the future.
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     * @memberof DynamicView
     */
    DynamicView.prototype.applyFind = function (query, uid) {
      this.applyFilter({
        type: 'find',
        val: query,
        uid: uid
      });
      return this;
    };

    /**
     * applyWhere() - Adds or updates a javascript filter function in the DynamicView filter pipeline
     *
     * @param {function} fun - A javascript filter function to apply to pipeline
     * @param {(string|number)=} uid - Optional: The unique ID of this filter, to reference it in the future.
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     * @memberof DynamicView
     */
    DynamicView.prototype.applyWhere = function (fun, uid) {
      this.applyFilter({
        type: 'where',
        val: fun,
        uid: uid
      });
      return this;
    };

    /**
     * removeFilter() - Remove the specified filter from the DynamicView filter pipeline
     *
     * @param {(string|number)} uid - The unique ID of the filter to be removed.
     * @returns {DynamicView} this DynamicView object, for further chain ops.
     * @memberof DynamicView
     */
    DynamicView.prototype.removeFilter = function (uid) {
      var idx = this._indexOfFilterWithId(uid);
      if (idx < 0) {
        throw new Error("Dynamic view does not contain a filter with ID: " + uid);
      }

      this.filterPipeline.splice(idx, 1);
      this.reapplyFilters();
      return this;
    };

    /**
     * count() - returns the number of documents representing the current DynamicView contents.
     *
     * @returns {number} The number of documents representing the current DynamicView contents.
     * @memberof DynamicView
     */
    DynamicView.prototype.count = function () {
      if (this.options.persistent) {
        return this.resultdata.length;
      }
      return this.resultset.count();
    };

    /**
     * data() - resolves and pending filtering and sorting, then returns document array as result.
     *
     * @returns {array} An array of documents representing the current DynamicView contents.
     * @memberof DynamicView
     */
    DynamicView.prototype.data = function () {
      // using final sort phase as 'catch all' for a few use cases which require full rebuild
      if (this.sortDirty || this.resultsdirty) {
        this.performSortPhase({suppressRebuildEvent: true});
      }
      return (this.options.persistent) ? (this.resultdata) : (this.resultset.data());
    };

    /**
     * queueRebuildEvent() - When the view is not sorted we may still wish to be notified of rebuild events.
     *     This event will throttle and queue a single rebuild event when batches of updates affect the view.
     */
    DynamicView.prototype.queueRebuildEvent = function () {
      if (this.rebuildPending) {
        return;
      }
      this.rebuildPending = true;

      var self = this;
      setTimeout(function () {
        if (self.rebuildPending) {
          self.rebuildPending = false;
          self.emit('rebuild', self);
        }
      }, this.options.minRebuildInterval);
    };

    /**
     * queueSortPhase : If the view is sorted we will throttle sorting to either :
     *    (1) passive - when the user calls data(), or
     *    (2) active - once they stop updating and yield js thread control
     */
    DynamicView.prototype.queueSortPhase = function () {
      // already queued? exit without queuing again
      if (this.sortDirty) {
        return;
      }
      this.sortDirty = true;

      var self = this;
      if (this.options.sortPriority === "active") {
        // active sorting... once they are done and yield js thread, run async performSortPhase()
        setTimeout(function () {
          self.performSortPhase();
        }, this.options.minRebuildInterval);
      } else {
        // must be passive sorting... since not calling performSortPhase (until data call), lets use queueRebuildEvent to
        // potentially notify user that data has changed.
        this.queueRebuildEvent();
      }
    };

    /**
     * performSortPhase() - invoked synchronously or asynchronously to perform final sort phase (if needed)
     *
     */
    DynamicView.prototype.performSortPhase = function (options) {
      // async call to this may have been pre-empted by synchronous call to data before async could fire
      if (!this.sortDirty && !this.resultsdirty) {
        return;
      }

      options = options || {};

      if (this.sortDirty) {
        if (this.sortFunction) {
          this.resultset.sort(this.sortFunction);
        } else if (this.sortCriteria) {
          this.resultset.compoundsort(this.sortCriteria);
        }

        this.sortDirty = false;
      }

      if (this.options.persistent) {
        // persistent view, rebuild local resultdata array
        this.resultdata = this.resultset.data();
        this.resultsdirty = false;
      }

      if (!options.suppressRebuildEvent) {
        this.emit('rebuild', this);
      }
    };

    /**
     * evaluateDocument() - internal method for (re)evaluating document inclusion.
     *    Called by : collection.insert() and collection.update().
     *
     * @param {int} objIndex - index of document to (re)run through filter pipeline.
     * @param {bool} isNew - true if the document was just added to the collection.
     */
    DynamicView.prototype.evaluateDocument = function (objIndex, isNew) {
      var ofr = this.resultset.filteredrows;
      var oldPos = (isNew) ? (-1) : (ofr.indexOf(+objIndex));
      var oldlen = ofr.length;

      // creating a 1-element resultset to run filter chain ops on to see if that doc passes filters;
      // mostly efficient algorithm, slight stack overhead price (this function is called on inserts and updates)
      var evalResultset = new Resultset(this.collection);
      evalResultset.filteredrows = [objIndex];
      evalResultset.filterInitialized = true;
      var filter;
      for (var idx = 0, len = this.filterPipeline.length; idx < len; idx++) {
        filter = this.filterPipeline[idx];
        evalResultset[filter.type](filter.val);
      }

      // not a true position, but -1 if not pass our filter(s), 0 if passed filter(s)
      var newPos = (evalResultset.filteredrows.length === 0) ? -1 : 0;

      // wasn't in old, shouldn't be now... do nothing
      if (oldPos === -1 && newPos === -1) return;

      // wasn't in resultset, should be now... add
      if (oldPos === -1 && newPos !== -1) {
        ofr.push(objIndex);

        if (this.options.persistent) {
          this.resultdata.push(this.collection.data[objIndex]);
        }

        // need to re-sort to sort new document
        if (this.sortFunction || this.sortCriteria) {
          this.queueSortPhase();
        } else {
          this.queueRebuildEvent();
        }

        return;
      }

      // was in resultset, shouldn't be now... delete
      if (oldPos !== -1 && newPos === -1) {
        if (oldPos < oldlen - 1) {
          // http://dvolvr.davidwaterston.com/2013/06/09/restating-the-obvious-the-fastest-way-to-truncate-an-array-in-javascript/comment-page-1/
          ofr[oldPos] = ofr[oldlen - 1];
          ofr.length = oldlen - 1;

          if (this.options.persistent) {
            this.resultdata[oldPos] = this.resultdata[oldlen - 1];
            this.resultdata.length = oldlen - 1;
          }
        } else {
          ofr.length = oldlen - 1;

          if (this.options.persistent) {
            this.resultdata.length = oldlen - 1;
          }
        }

        // in case changes to data altered a sort column
        if (this.sortFunction || this.sortCriteria) {
          this.queueSortPhase();
        } else {
          this.queueRebuildEvent();
        }

        return;
      }

      // was in resultset, should still be now... (update persistent only?)
      if (oldPos !== -1 && newPos !== -1) {
        if (this.options.persistent) {
          // in case document changed, replace persistent view data with the latest collection.data document
          this.resultdata[oldPos] = this.collection.data[objIndex];
        }

        // in case changes to data altered a sort column
        if (this.sortFunction || this.sortCriteria) {
          this.queueSortPhase();
        } else {
          this.queueRebuildEvent();
        }

        return;
      }
    };

    /**
     * removeDocument() - internal function called on collection.delete()
     */
    DynamicView.prototype.removeDocument = function (objIndex) {
      var ofr = this.resultset.filteredrows;
      var oldPos = ofr.indexOf(+objIndex);
      var oldlen = ofr.length;
      var idx;

      if (oldPos !== -1) {
        // if not last row in resultdata, swap last to hole and truncate last row
        if (oldPos < oldlen - 1) {
          ofr[oldPos] = ofr[oldlen - 1];
          ofr.length = oldlen - 1;

          if (this.options.persistent) {
            this.resultdata[oldPos] = this.resultdata[oldlen - 1];
            this.resultdata.length = oldlen - 1;
          }
        }
        // last row, so just truncate last row
        else {
          ofr.length = oldlen - 1;

          if (this.options.persistent) {
            this.resultdata.length = oldlen - 1;
          }
        }

        // in case changes to data altered a sort column
        if (this.sortFunction || this.sortCriteria) {
          this.queueSortPhase();
        } else {
          this.queueRebuildEvent();
        }
      }

      // since we are using filteredrows to store data array positions
      // if they remove a document (whether in our view or not),
      // we need to adjust array positions -1 for all document array references after that position
      oldlen = ofr.length;
      for (idx = 0; idx < oldlen; idx++) {
        if (ofr[idx] > objIndex) {
          ofr[idx]--;
        }
      }
    };

    /**
     * mapReduce() - data transformation via user supplied functions
     *
     * @param {function} mapFunction - this function accepts a single document for you to transform and return
     * @param {function} reduceFunction - this function accepts many (array of map outputs) and returns single value
     * @returns The output of your reduceFunction
     * @memberof DynamicView
     */
    DynamicView.prototype.mapReduce = function (mapFunction, reduceFunction) {
      try {
        return reduceFunction(this.data().map(mapFunction));
      } catch (err) {
        throw err;
      }
    };


    /**
     * Collection class that handles documents of same type
     * @constructor Collection
     * @implements LokiEventEmitter
     * @param {string} name - collection name
     * @param {(array|object)=} options - (optional) array of property names to be indicized OR a configuration object
     * @param {array} options.unique - array of property names to define unique constraints for
     * @param {array} options.exact - array of property names to define exact constraints for
     * @param {array} options.indices - array property names to define binary indexes for
     * @param {boolean} options.asyncListeners - default is false
     * @param {boolean} options.disableChangesApi - default is true
     * @param {boolean} options.autoupdate - use Object.observe to update objects automatically (default: false)
     * @param {boolean} options.clone - specify whether inserts and queries clone to/from user
     * @param {string} options.cloneMethod - 'parse-stringify' (default), 'jquery-extend-deep', 'shallow'
     * @param {int} options.ttlInterval - time interval for clearing out 'aged' documents; not set by default.
     * @see {@link Loki#addCollection} for normal creation of collections
     */
    function Collection(name, options) {
      // the name of the collection

      this.name = name;
      // the data held by the collection
      this.data = [];
      this.idIndex = []; // index of id
      this.binaryIndices = {}; // user defined indexes
      this.constraints = {
        unique: {},
        exact: {}
      };

      // unique contraints contain duplicate object references, so they are not persisted.
      // we will keep track of properties which have unique contraint applied here, and regenerate on load
      this.uniqueNames = [];

      // transforms will be used to store frequently used query chains as a series of steps
      // which itself can be stored along with the database.
      this.transforms = {};

      // the object type of the collection
      this.objType = name;

      // in autosave scenarios we will use collection level dirty flags to determine whether save is needed.
      // currently, if any collection is dirty we will autosave the whole database if autosave is configured.
      // defaulting to true since this is called from addCollection and adding a collection should trigger save
      this.dirty = true;

      // private holders for cached data
      this.cachedIndex = null;
      this.cachedBinaryIndex = null;
      this.cachedData = null;
      var self = this;

      /* OPTIONS */
      options = options || {};

      // exact match and unique constraints
      if (options.hasOwnProperty('unique')) {
        if (!Array.isArray(options.unique)) {
          options.unique = [options.unique];
        }
        options.unique.forEach(function (prop) {
          self.uniqueNames.push(prop); // used to regenerate on subsequent database loads
          self.constraints.unique[prop] = new UniqueIndex(prop);
        });
      }

      if (options.hasOwnProperty('exact')) {
        options.exact.forEach(function (prop) {
          self.constraints.exact[prop] = new ExactIndex(prop);
        });
      }

      // is collection transactional
      this.transactional = options.hasOwnProperty('transactional') ? options.transactional : false;

      // options to clone objects when inserting them
      this.cloneObjects = options.hasOwnProperty('clone') ? options.clone : false;

      // default clone method (if enabled) is parse-stringify
      this.cloneMethod = options.hasOwnProperty('cloneMethod') ? options.cloneMethod : "parse-stringify";

      // option to make event listeners async, default is sync
      this.asyncListeners = options.hasOwnProperty('asyncListeners') ? options.asyncListeners : false;

      // disable track changes
      this.disableChangesApi = options.hasOwnProperty('disableChangesApi') ? options.disableChangesApi : true;

      // option to observe objects and update them automatically, ignored if Object.observe is not supported
      this.autoupdate = options.hasOwnProperty('autoupdate') ? options.autoupdate : false;

      //option to activate a cleaner daemon - clears "aged" documents at set intervals.
      this.ttl = {
        age: null,
        ttlInterval: null,
        daemon: null
      };
      this.setTTL(options.ttl || -1, options.ttlInterval);

      // currentMaxId - change manually at your own peril!
      this.maxId = 0;

      this.DynamicViews = [];

      // events
      this.events = {
        'insert': [],
        'update': [],
        'pre-insert': [],
        'pre-update': [],
        'close': [],
        'flushbuffer': [],
        'error': [],
        'delete': [],
        'warning': []
      };

      // changes are tracked by collection and aggregated by the db
      this.changes = [];

      // initialize the id index
      this.ensureId();
      var indices = [];
      // initialize optional user-supplied indices array ['age', 'lname', 'zip']
      if (options && options.indices) {
        if (Object.prototype.toString.call(options.indices) === '[object Array]') {
          indices = options.indices;
        } else if (typeof options.indices === 'string') {
          indices = [options.indices];
        } else {
          throw new TypeError('Indices needs to be a string or an array of strings');
        }
      }

      for (var idx = 0; idx < indices.length; idx++) {
        this.ensureIndex(indices[idx]);
      }

      function observerCallback(changes) {

        var changedObjects = typeof Set === 'function' ? new Set() : [];

        if(!changedObjects.add)
          changedObjects.add = function(object) {
            if(this.indexOf(object) === -1)
              this.push(object);
            return this;
          };

        changes.forEach(function (change) {
          changedObjects.add(change.object);
        });

        changedObjects.forEach(function (object) {
          if(!hasOwnProperty.call(object, '$loki'))
            return self.removeAutoUpdateObserver(object);
          try {
            self.update(object);
          } catch(err) {}
        });
      }

      this.observerCallback = observerCallback;

      /**
       * This method creates a clone of the current status of an object and associates operation and collection name,
       * so the parent db can aggregate and generate a changes object for the entire db
       */
      function createChange(name, op, obj) {
        self.changes.push({
          name: name,
          operation: op,
          obj: JSON.parse(JSON.stringify(obj))
        });
      }

      // clear all the changes
      function flushChanges() {
        self.changes = [];
      }

      this.getChanges = function () {
        return self.changes;
      };

      this.flushChanges = flushChanges;

      /**
       * If the changes API is disabled make sure only metadata is added without re-evaluating everytime if the changesApi is enabled
       */
      function insertMeta(obj) {
        if (!obj) {
          return;
        }
        if (!obj.meta) {
          obj.meta = {};
        }

        obj.meta.created = (new Date()).getTime();
        obj.meta.revision = 0;
      }

      function updateMeta(obj) {
        if (!obj) {
          return;
        }
        obj.meta.updated = (new Date()).getTime();
        obj.meta.revision += 1;
      }

      function createInsertChange(obj) {
        createChange(self.name, 'I', obj);
      }

      function createUpdateChange(obj) {
        createChange(self.name, 'U', obj);
      }

      function insertMetaWithChange(obj) {
        insertMeta(obj);
        createInsertChange(obj);
      }

      function updateMetaWithChange(obj) {
        updateMeta(obj);
        createUpdateChange(obj);
      }


      /* assign correct handler based on ChangesAPI flag */
      var insertHandler, updateHandler;

      function setHandlers() {
        insertHandler = self.disableChangesApi ? insertMeta : insertMetaWithChange;
        updateHandler = self.disableChangesApi ? updateMeta : updateMetaWithChange;
      }

      setHandlers();

      this.setChangesApi = function (enabled) {
        self.disableChangesApi = !enabled;
        setHandlers();
      };
      /**
       * built-in events
       */
      this.on('insert', function insertCallback(obj) {
        insertHandler(obj);
      });

      this.on('update', function updateCallback(obj) {
        updateHandler(obj);
      });

      this.on('delete', function deleteCallback(obj) {
        if (!self.disableChangesApi) {
          createChange(self.name, 'R', obj);
        }
      });

      this.on('warning', function (warning) {
        self.console.warn(warning);
      });
      // for de-serialization purposes
      flushChanges();
    }

    Collection.prototype = new LokiEventEmitter();

    Collection.prototype.console = {
      log: function () {},
      warn: function () {},
      error: function () {},
    };

    Collection.prototype.addAutoUpdateObserver = function (object) {
      if(!this.autoupdate || typeof Object.observe !== 'function')
        return;

      Object.observe(object, this.observerCallback, ['add', 'update', 'delete', 'reconfigure', 'setPrototype']);
    };

    Collection.prototype.removeAutoUpdateObserver = function (object) {
      if(!this.autoupdate || typeof Object.observe !== 'function')
        return;

      Object.unobserve(object, this.observerCallback);
    };

    /**
     * Adds a named collection transform to the collection
     * @param {string} name - name to associate with transform
     * @param {array} transform - an array of transformation 'step' objects to save into the collection
     * @memberof Collection
     */
    Collection.prototype.addTransform = function (name, transform) {
      if (this.transforms.hasOwnProperty(name)) {
        throw new Error("a transform by that name already exists");
      }

      this.transforms[name] = transform;
    };

    /**
     * Updates a named collection transform to the collection
     * @param {string} name - name to associate with transform
     * @param {object} transform - a transformation object to save into collection
     * @memberof Collection
     */
    Collection.prototype.setTransform = function (name, transform) {
      this.transforms[name] = transform;
    };

    /**
     * Removes a named collection transform from the collection
     * @param {string} name - name of collection transform to remove
     * @memberof Collection
     */
    Collection.prototype.removeTransform = function (name) {
      delete this.transforms[name];
    };

    Collection.prototype.byExample = function (template) {
      var k, obj, query;
      query = [];
      for (k in template) {
        if (!template.hasOwnProperty(k)) continue;
        query.push((
          obj = {},
          obj[k] = template[k],
          obj
        ));
      }
      return {
        '$and': query
      };
    };

    Collection.prototype.findObject = function (template) {
      return this.findOne(this.byExample(template));
    };

    Collection.prototype.findObjects = function (template) {
      return this.find(this.byExample(template));
    };

    /*----------------------------+
    | TTL daemon                  |
    +----------------------------*/
    Collection.prototype.ttlDaemonFuncGen = function () {
      var collection = this;
      var age = this.ttl.age;
      return function ttlDaemon() {
        var now = Date.now();
        var toRemove = collection.chain().where(function daemonFilter(member) {
          var timestamp = member.meta.updated || member.meta.created;
          var diff = now - timestamp;
          return age < diff;
        });
        toRemove.remove();
      };
    };

    Collection.prototype.setTTL = function (age, interval) {
      if (age < 0) {
        clearInterval(this.ttl.daemon);
      }
      else {
        this.ttl.age = age;
        this.ttl.ttlInterval = interval;
        this.ttl.daemon = setInterval(this.ttlDaemonFuncGen(), interval);
      }
    };

    /*----------------------------+
    | INDEXING                    |
    +----------------------------*/

    /**
     * create a row filter that covers all documents in the collection
     */
    Collection.prototype.prepareFullDocIndex = function () {
      var len = this.data.length;
      var indexes = new Array(len);
      for (var i = 0; i < len; i += 1) {
        indexes[i] = i;
      }
      return indexes;
    };

    /**
     * Ensure binary index on a certain field
     * @param {string} property - name of property to create binary index on
     * @param {boolean=} force - (Optional) flag indicating whether to construct index immediately
     * @memberof Collection
     */
    Collection.prototype.ensureIndex = function (property, force) {
      // optional parameter to force rebuild whether flagged as dirty or not
      if (typeof (force) === 'undefined') {
        force = false;
      }

      if (property === null || property === undefined) {
        throw new Error('Attempting to set index without an associated property');
      }

      if (this.binaryIndices[property] && !force) {
        if (!this.binaryIndices[property].dirty) return;
      }

      var index = {
        'name': property,
        'dirty': true,
        'values': this.prepareFullDocIndex()
      };
      this.binaryIndices[property] = index;

      var wrappedComparer =
        (function (p, data) {
          return function (a, b) {
            var objAp = data[a][p],
                objBp = data[b][p];
            if (objAp !== objBp) {
              if (ltHelper(objAp, objBp, false)) return -1;
              if (gtHelper(objAp, objBp, false)) return 1;
            }
            return 0;
          };
        })(property, this.data);

      index.values.sort(wrappedComparer);
      index.dirty = false;

      this.dirty = true; // for autosave scenarios
    };

    Collection.prototype.getSequencedIndexValues = function(property) {
      var idx, idxvals = this.binaryIndices[property].values;
      var result = "";

      for(idx=0; idx<idxvals.length; idx++) {
        result += " [" + idx + "] " + this.data[idxvals[idx]][property];
      }

      return result;
    };

    Collection.prototype.ensureUniqueIndex = function (field) {
      var index = this.constraints.unique[field];
      if (!index) {
        // keep track of new unique index for regenerate after database (re)load.
        if (this.uniqueNames.indexOf(field) == -1) {
          this.uniqueNames.push(field);
        }
      }

      // if index already existed, (re)loading it will likely cause collisions, rebuild always
      this.constraints.unique[field] = index = new UniqueIndex(field);
      this.data.forEach(function (obj) {
        index.set(obj);
      });
      return index;
    };

    /**
     * Ensure all binary indices
     */
    Collection.prototype.ensureAllIndexes = function (force) {
      var key, bIndices = this.binaryIndices;
      for (key in bIndices) {
        if (hasOwnProperty.call(bIndices, key)) {
          this.ensureIndex(key, force);
        }
      }
    };

    Collection.prototype.flagBinaryIndexesDirty = function () {
      var key, bIndices = this.binaryIndices;
      for (key in bIndices) {
        if (hasOwnProperty.call(bIndices, key)) {
          bIndices[key].dirty = true;
        }
      }
    };

    Collection.prototype.flagBinaryIndexDirty = function (index) {
      if(this.binaryIndices[index])
        this.binaryIndices[index].dirty = true;
    };

    /**
     * Quickly determine number of documents in collection (or query)
     * @param {object=} query - (optional) query object to count results of
     * @returns {number} number of documents in the collection
     * @memberof Collection
     */
    Collection.prototype.count = function (query) {
      if (!query) {
        return this.data.length;
      }

      return this.chain().find(query).filteredrows.length;
    };

    /**
     * Rebuild idIndex
     */
    Collection.prototype.ensureId = function () {
      var len = this.data.length,
        i = 0;

      this.idIndex = [];
      for (i; i < len; i += 1) {
        this.idIndex.push(this.data[i].$loki);
      }
    };

    /**
     * Rebuild idIndex async with callback - useful for background syncing with a remote server
     */
    Collection.prototype.ensureIdAsync = function (callback) {
      this.async(function () {
        this.ensureId();
      }, callback);
    };

    /**
     * Add a dynamic view to the collection
     * @param {string} name - name of dynamic view to add
     * @param {object=} options - (optional) options to configure dynamic view with
     * @param {boolean} options.persistent - indicates if view is to main internal results array in 'resultdata'
     * @param {string} options.sortPriority - 'passive' (sorts performed on call to data) or 'active' (after updates)
     * @param {number} options.minRebuildInterval - minimum rebuild interval (need clarification to docs here)
     * @returns {DynamicView} reference to the dynamic view added
     * @memberof Collection
     **/

    Collection.prototype.addDynamicView = function (name, options) {
      var dv = new DynamicView(this, name, options);
      this.DynamicViews.push(dv);

      return dv;
    };

    /**
     * Remove a dynamic view from the collection
     * @param {string} name - name of dynamic view to remove
     * @memberof Collection
     **/
    Collection.prototype.removeDynamicView = function (name) {
      for (var idx = 0; idx < this.DynamicViews.length; idx++) {
        if (this.DynamicViews[idx].name === name) {
          this.DynamicViews.splice(idx, 1);
        }
      }
    };

    /**
     * Look up dynamic view reference from within the collection
     * @param {string} name - name of dynamic view to retrieve reference of
     * @returns {DynamicView} A reference to the dynamic view with that name
     * @memberof Collection
     **/
    Collection.prototype.getDynamicView = function (name) {
      for (var idx = 0; idx < this.DynamicViews.length; idx++) {
        if (this.DynamicViews[idx].name === name) {
          return this.DynamicViews[idx];
        }
      }

      return null;
    };

    /**
     * find and update: pass a filtering function to select elements to be updated
     * and apply the updatefunctino to those elements iteratively
     * @param {function} filterFunction - filter function whose results will execute update
     * @param {function} updateFunction - update function to run against filtered documents
     * @memberof Collection
     */
    Collection.prototype.findAndUpdate = function (filterFunction, updateFunction) {
      var results = this.where(filterFunction),
        i = 0,
        obj;
      try {
        for (i; i < results.length; i++) {
          obj = updateFunction(results[i]);
          this.update(obj);
        }

      } catch (err) {
        this.rollback();
        this.console.error(err.message);
      }
    };

    /**
     * Adds object(s) to collection, ensure object(s) have meta properties, clone it if necessary, etc.
     * @param {(object|array)} doc - the document (or array of documents) to be inserted
     * @returns {(object|array)} document or documents inserted
     * @memberof Collection
     */
    Collection.prototype.insert = function (doc) {
      if (!Array.isArray(doc)) {
        return this.insertOne(doc);
      }

      // holder to the clone of the object inserted if collections is set to clone objects
      var obj;
      var results = [];
      for (var i = 0, len = doc.length; i < len; i++) {
        obj = this.insertOne(doc[i]);
        if (!obj) {
          return undefined;
        }
        results.push(obj);
      }
      return results.length === 1 ? results[0] : results;
    };

    /**
     * Adds a single object, ensures it has meta properties, clone it if necessary, etc.
     * @param {object} doc - the document to be inserted
     * @returns {object} document or 'undefined' if there was a problem inserting it
     * @memberof Collection
     */
    Collection.prototype.insertOne = function (doc) {
      var err = null;
      if (typeof doc !== 'object') {
        err = new TypeError('Document needs to be an object');
      } else if (doc === null) {
        err = new TypeError('Object cannot be null');
      }

      if (err !== null) {
        this.emit('error', err);
        throw err;
      }

      // if configured to clone, do so now... otherwise just use same obj reference
      var obj = this.cloneObjects ? clone(doc, this.cloneMethod) : doc;

      if (typeof obj.meta === 'undefined') {
        obj.meta = {
          revision: 0,
          created: 0
        };
      }

      this.emit('pre-insert', obj);
      if (!this.add(obj)) {
        return undefined;
      }

      this.addAutoUpdateObserver(obj);
      this.emit('insert', obj);
      return obj;
    };

    /**
     * Empties the collection.
     * @memberof Collection
     */
    Collection.prototype.clear = function () {
      this.data = [];
      this.idIndex = [];
      this.binaryIndices = {};
      this.cachedIndex = null;
      this.cachedBinaryIndex = null;
      this.cachedData = null;
      this.maxId = 0;
      this.DynamicViews = [];
      this.dirty = true;
    };

    /**
     * Updates an object and notifies collection that the document has changed.
     * @param {object} doc - document to update within the collection
     * @memberof Collection
     */
    Collection.prototype.update = function (doc) {
      this.flagBinaryIndexesDirty();

      if (Array.isArray(doc)) {
        var k = 0,
          len = doc.length;
        for (k; k < len; k += 1) {
          this.update(doc[k]);
        }
        return;
      }

      // verify object is a properly formed document
      if (!hasOwnProperty.call(doc, '$loki')) {
        throw new Error('Trying to update unsynced document. Please save the document first by using insert() or addMany()');
      }
      try {
        this.startTransaction();
        var arr = this.get(doc.$loki, true),
          obj,
          position,
          self = this;

        obj = arr[0]; // -internal- obj ref
        position = arr[1]; // position in data array

        if (!arr) {
          throw new Error('Trying to update a document not in collection.');
        }
        this.emit('pre-update', doc);

        Object.keys(this.constraints.unique).forEach(function (key) {
          self.constraints.unique[key].update(obj, doc);
        });

        // operate the update
        this.data[position] = doc;

        if(obj !== doc) {
          this.addAutoUpdateObserver(doc);
        }

        // now that we can efficiently determine the data[] position of newly added document,
        // submit it for all registered DynamicViews to evaluate for inclusion/exclusion
        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
          this.DynamicViews[idx].evaluateDocument(position, false);
        }

        this.idIndex[position] = obj.$loki;

        this.commit();
        this.dirty = true; // for autosave scenarios
        this.emit('update', doc);
        return doc;
      } catch (err) {
        this.rollback();
        this.console.error(err.message);
        this.emit('error', err);
        throw (err); // re-throw error so user does not think it succeeded
      }
    };

    /**
     * Add object to collection
     */
    Collection.prototype.add = function (obj) {
      // if parameter isn't object exit with throw
      if ('object' !== typeof obj) {
        throw new TypeError('Object being added needs to be an object');
      }
      // if object you are adding already has id column it is either already in the collection
      // or the object is carrying its own 'id' property.  If it also has a meta property,
      // then this is already in collection so throw error, otherwise rename to originalId and continue adding.
      if (typeof(obj.$loki) !== 'undefined') {
        throw new Error('Document is already in collection, please use update()');
      }

      this.flagBinaryIndexesDirty();

      /*
       * try adding object to collection
       */
      try {
        this.startTransaction();
        this.maxId++;

        if (isNaN(this.maxId)) {
          this.maxId = (this.data[this.data.length - 1].$loki + 1);
        }

        obj.$loki = this.maxId;
        obj.meta.version = 0;

        var key, constrUnique = this.constraints.unique;
        for (key in constrUnique) {
          if (hasOwnProperty.call(constrUnique, key)) {
            constrUnique[key].set(obj);
          }
        }

        // add new obj id to idIndex
        this.idIndex.push(obj.$loki);

        // add the object
        this.data.push(obj);

        // now that we can efficiently determine the data[] position of newly added document,
        // submit it for all registered DynamicViews to evaluate for inclusion/exclusion
        var addedPos = this.data.length - 1;
        var dvlen = this.DynamicViews.length;
        for (var i = 0; i < dvlen; i++) {
          this.DynamicViews[i].evaluateDocument(addedPos, true);
        }

        this.commit();
        this.dirty = true; // for autosave scenarios

        return (this.cloneObjects) ? (clone(obj, this.cloneMethod)) : (obj);
      } catch (err) {
        this.rollback();
        this.console.error(err.message);
        this.emit('error', err);
        throw (err); // re-throw error so user does not think it succeeded
      }
    };


    /**
     * Remove all documents matching supplied filter object
     * @param {object} query - query object to filter on
     * @memberof Collection
     */
    Collection.prototype.removeWhere = function (query) {
      var list;
      if (typeof query === 'function') {
        list = this.data.filter(query);
      } else {
        list = new Resultset(this, {
          queryObj: query
        });
      }
      this.remove(list);
    };

    Collection.prototype.removeDataOnly = function () {
      this.remove(this.data.slice());
    };

    /**
     * Remove a document from the collection
     * @param {object} doc - document to remove from collection
     * @memberof Collection
     */
    Collection.prototype.remove = function (doc) {
      if (typeof doc === 'number') {
        doc = this.get(doc);
      }

      if ('object' !== typeof doc) {
        throw new Error('Parameter is not an object');
      }
      if (Array.isArray(doc)) {
        var k = 0,
          len = doc.length;
        for (k; k < len; k += 1) {
          this.remove(doc[k]);
        }
        return;
      }

      if (!hasOwnProperty.call(doc, '$loki')) {
        throw new Error('Object is not a document stored in the collection');
      }

      this.flagBinaryIndexesDirty();

      try {
        this.startTransaction();
        var arr = this.get(doc.$loki, true),
          // obj = arr[0],
          position = arr[1];
        var self = this;
        Object.keys(this.constraints.unique).forEach(function (key) {
          if (doc[key] !== null && typeof doc[key] !== 'undefined') {
            self.constraints.unique[key].remove(doc[key]);
          }
        });
        // now that we can efficiently determine the data[] position of newly added document,
        // submit it for all registered DynamicViews to remove
        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
          this.DynamicViews[idx].removeDocument(position);
        }

        this.data.splice(position, 1);
        this.removeAutoUpdateObserver(doc);

        // remove id from idIndex
        this.idIndex.splice(position, 1);

        this.commit();
        this.dirty = true; // for autosave scenarios
        this.emit('delete', arr[0]);
        delete doc.$loki;
        delete doc.meta;
        return doc;

      } catch (err) {
        this.rollback();
        this.console.error(err.message);
        this.emit('error', err);
        return null;
      }
    };

    /*---------------------+
    | Finding methods     |
    +----------------------*/

    /**
     * Get by Id - faster than other methods because of the searching algorithm
     * @param {int} id - $loki id of document you want to retrieve
     * @param {boolean} returnPosition - if 'true' we will return [object, position]
     * @returns {(object|array|null)} Object reference if document was found, null if not,
     *     or an array if 'returnPosition' was passed.
     * @memberof Collection
     */
    Collection.prototype.get = function (id, returnPosition) {
      var retpos = returnPosition || false,
          data = this.idIndex,
          max = data.length - 1,
          min = 0,
          mid = (min + max) >> 1;

      id = typeof id === 'number' ? id : parseInt(id, 10);

      if (isNaN(id)) {
        throw new TypeError('Passed id is not an integer');
      }

      while (data[min] < data[max]) {
        mid = (min + max) >> 1;

        if (data[mid] < id) {
          min = mid + 1;
        } else {
          max = mid;
        }
      }

      if (max === min && data[min] === id) {
        if (retpos) {
          return [this.data[min], min];
        }
        return this.data[min];
      }
      return null;

    };

    /**
     * Retrieve doc by Unique index
     * @param {string} field - name of uniquely indexed property to use when doing lookup
     * @param {value} value - unique value to search for
     * @returns {object} document matching the value passed
     * @memberof Collection
     */
    Collection.prototype.by = function (field, value) {
      var self;
      if (value === undefined) {
        self = this;
        return function (value) {
          return self.by(field, value);
        };
      }

      var result = this.constraints.unique[field].get(value);
      if (!this.cloneObjects) {
        return result;
      }
      else {
        return clone(result, this.cloneMethod);
      }
    };

    /**
     * Find one object by index property, by property equal to value
     * @param {object} query - query object used to perform search with
     * @returns {(object|null)} First matching document, or null if none
     * @memberof Collection
     */
    Collection.prototype.findOne = function (query) {
      // Instantiate Resultset and exec find op passing firstOnly = true param
      var result = new Resultset(this, {
        queryObj: query,
        firstOnly: true
      });
      if (Array.isArray(result) && result.length === 0) {
        return null;
      } else {
        if (!this.cloneObjects) {
          return result;
        }
        else {
          return clone(result, this.cloneMethod);
        }
      }
    };

    /**
     * Chain method, used for beginning a series of chained find() and/or view() operations
     * on a collection.
     *
     * @param {array} transform - Ordered array of transform step objects similar to chain
     * @param {object} parameters - Object containing properties representing parameters to substitute
     * @returns {Resultset} (this) resultset, or data array if any map or join functions where called
     * @memberof Collection
     */
    Collection.prototype.chain = function (transform, parameters) {
      var rs = new Resultset(this);

      if (typeof transform === 'undefined') {
        return rs;
      }

      return rs.transform(transform, parameters);
    };

    /**
     * Find method, api is similar to mongodb.
     * for more complex queries use [chain()]{@link Collection#chain} or [where()]{@link Collection#where}.
     * @example {@tutorial Query Examples}
     * @param {object} query - 'mongo-like' query object
     * @returns {array} Array of matching documents
     * @memberof Collection
     */
    Collection.prototype.find = function (query) {
      if (typeof (query) === 'undefined') {
        query = 'getAll';
      }

      var results = new Resultset(this, {
        queryObj: query
      });
      if (!this.cloneObjects) {
        return results;
      }
      else {
        return cloneObjectArray(results, this.cloneMethod);
      }
    };

    /**
     * Find object by unindexed field by property equal to value,
     * simply iterates and returns the first element matching the query
     */
    Collection.prototype.findOneUnindexed = function (prop, value) {
      var i = this.data.length,
        doc;
      while (i--) {
        if (this.data[i][prop] === value) {
          doc = this.data[i];
          return doc;
        }
      }
      return null;
    };

    /**
     * Transaction methods
     */

    /** start the transation */
    Collection.prototype.startTransaction = function () {
      if (this.transactional) {
        this.cachedData = clone(this.data, this.cloneMethod);
        this.cachedIndex = this.idIndex;
        this.cachedBinaryIndex = this.binaryIndices;

        // propagate startTransaction to dynamic views
        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
          this.DynamicViews[idx].startTransaction();
        }
      }
    };

    /** commit the transation */
    Collection.prototype.commit = function () {
      if (this.transactional) {
        this.cachedData = null;
        this.cachedIndex = null;
        this.cachedBinaryIndex = null;

        // propagate commit to dynamic views
        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
          this.DynamicViews[idx].commit();
        }
      }
    };

    /** roll back the transation */
    Collection.prototype.rollback = function () {
      if (this.transactional) {
        if (this.cachedData !== null && this.cachedIndex !== null) {
          this.data = this.cachedData;
          this.idIndex = this.cachedIndex;
          this.binaryIndices = this.cachedBinaryIndex;
        }

        // propagate rollback to dynamic views
        for (var idx = 0; idx < this.DynamicViews.length; idx++) {
          this.DynamicViews[idx].rollback();
        }
      }
    };

    // async executor. This is only to enable callbacks at the end of the execution.
    Collection.prototype.async = function (fun, callback) {
      setTimeout(function () {
        if (typeof fun === 'function') {
          fun();
          callback();
        } else {
          throw new TypeError('Argument passed for async execution is not a function');
        }
      }, 0);
    };

    /**
     * Query the collection by supplying a javascript filter function.
     * @example
     * var results = coll.where(function(obj) {
     *   return obj.legs === 8;
     * });
     *
     * @param {function} fun - filter function to run against all collection docs
     * @returns {array} all documents which pass your filter function
     * @memberof Collection
     */
    Collection.prototype.where = function (fun) {
      var results = new Resultset(this, {
        queryFunc: fun
      });
      if (!this.cloneObjects) {
        return results;
      }
      else {
        return cloneObjectArray(results, this.cloneMethod);
      }
    };

    /**
     * Map Reduce operation
     *
     * @param {function} mapFunction - function to use as map function
     * @param {function} reduceFunction - function to use as reduce function
     * @returns {data} The result of your mapReduce operation
     * @memberof Collection
     */
    Collection.prototype.mapReduce = function (mapFunction, reduceFunction) {
      try {
        return reduceFunction(this.data.map(mapFunction));
      } catch (err) {
        throw err;
      }
    };

    /**
     * Join two collections on specified properties
     *
     * @param {array} joinData - array of documents to 'join' to this collection
     * @param {string} leftJoinProp - property name in collection
     * @param {string} rightJoinProp - property name in joinData
     * @param {function=} mapFun - (Optional) map function to use
     * @returns {Resultset} Result of the mapping operation
     * @memberof Collection
     */
    Collection.prototype.eqJoin = function (joinData, leftJoinProp, rightJoinProp, mapFun) {
      // logic in Resultset class
      return new Resultset(this).eqJoin(joinData, leftJoinProp, rightJoinProp, mapFun);
    };

    /* ------ STAGING API -------- */
    /**
     * stages: a map of uniquely identified 'stages', which hold copies of objects to be
     * manipulated without affecting the data in the original collection
     */
    Collection.prototype.stages = {};

    /**
     * (Staging API) create a stage and/or retrieve it
     * @memberof Collection
     */
    Collection.prototype.getStage = function (name) {
      if (!this.stages[name]) {
        this.stages[name] = {};
      }
      return this.stages[name];
    };
    /**
     * a collection of objects recording the changes applied through a commmitStage
     */
    Collection.prototype.commitLog = [];

    /**
     * (Staging API) create a copy of an object and insert it into a stage
     * @memberof Collection
     */
    Collection.prototype.stage = function (stageName, obj) {
      var copy = JSON.parse(JSON.stringify(obj));
      this.getStage(stageName)[obj.$loki] = copy;
      return copy;
    };

    /**
     * (Staging API) re-attach all objects to the original collection, so indexes and views can be rebuilt
     * then create a message to be inserted in the commitlog
     * @param {string} stageName - name of stage
     * @param {string} message
     * @memberof Collection
     */
    Collection.prototype.commitStage = function (stageName, message) {
      var stage = this.getStage(stageName),
        prop,
        timestamp = new Date().getTime();

      for (prop in stage) {

        this.update(stage[prop]);
        this.commitLog.push({
          timestamp: timestamp,
          message: message,
          data: JSON.parse(JSON.stringify(stage[prop]))
        });
      }
      this.stages[stageName] = {};
    };

    Collection.prototype.no_op = function () {
      return;
    };

    /**
     * @memberof Collection
     */
    Collection.prototype.extract = function (field) {
      var i = 0,
        len = this.data.length,
        isDotNotation = isDeepProperty(field),
        result = [];
      for (i; i < len; i += 1) {
        result.push(deepProperty(this.data[i], field, isDotNotation));
      }
      return result;
    };

    /**
     * @memberof Collection
     */
    Collection.prototype.max = function (field) {
      return Math.max.apply(null, this.extract(field));
    };

    /**
     * @memberof Collection
     */
    Collection.prototype.min = function (field) {
      return Math.min.apply(null, this.extract(field));
    };

    /**
     * @memberof Collection
     */
    Collection.prototype.maxRecord = function (field) {
      var i = 0,
        len = this.data.length,
        deep = isDeepProperty(field),
        result = {
          index: 0,
          value: undefined
        },
        max;

      for (i; i < len; i += 1) {
        if (max !== undefined) {
          if (max < deepProperty(this.data[i], field, deep)) {
            max = deepProperty(this.data[i], field, deep);
            result.index = this.data[i].$loki;
          }
        } else {
          max = deepProperty(this.data[i], field, deep);
          result.index = this.data[i].$loki;
        }
      }
      result.value = max;
      return result;
    };

    /**
     * @memberof Collection
     */
    Collection.prototype.minRecord = function (field) {
      var i = 0,
        len = this.data.length,
        deep = isDeepProperty(field),
        result = {
          index: 0,
          value: undefined
        },
        min;

      for (i; i < len; i += 1) {
        if (min !== undefined) {
          if (min > deepProperty(this.data[i], field, deep)) {
            min = deepProperty(this.data[i], field, deep);
            result.index = this.data[i].$loki;
          }
        } else {
          min = deepProperty(this.data[i], field, deep);
          result.index = this.data[i].$loki;
        }
      }
      result.value = min;
      return result;
    };

    /**
     * @memberof Collection
     */
    Collection.prototype.extractNumerical = function (field) {
      return this.extract(field).map(parseBase10).filter(Number).filter(function (n) {
        return !(isNaN(n));
      });
    };

    /**
     * Calculates the average numerical value of a property
     *
     * @param {string} field - name of property in docs to average
     * @returns {number} average of property in all docs in the collection
     * @memberof Collection
     */
    Collection.prototype.avg = function (field) {
      return average(this.extractNumerical(field));
    };

    /**
     * Calculate standard deviation of a field
     * @memberof Collection
     * @param {string} field
     */
    Collection.prototype.stdDev = function (field) {
      return standardDeviation(this.extractNumerical(field));
    };

    /**
     * @memberof Collection
     * @param {string} field
     */
    Collection.prototype.mode = function (field) {
      var dict = {},
        data = this.extract(field);
      data.forEach(function (obj) {
        if (dict[obj]) {
          dict[obj] += 1;
        } else {
          dict[obj] = 1;
        }
      });
      var max,
        prop, mode;
      for (prop in dict) {
        if (max) {
          if (max < dict[prop]) {
            mode = prop;
          }
        } else {
          mode = prop;
          max = dict[prop];
        }
      }
      return mode;
    };

    /**
     * @memberof Collection
     * @param {string} field - property name
     */
    Collection.prototype.median = function (field) {
      var values = this.extractNumerical(field);
      values.sort(sub);

      var half = Math.floor(values.length / 2);

      if (values.length % 2) {
        return values[half];
      } else {
        return (values[half - 1] + values[half]) / 2.0;
      }
    };

    /**
     * General utils, including statistical functions
     */
    function isDeepProperty(field) {
      return field.indexOf('.') !== -1;
    }

    function parseBase10(num) {
      return parseFloat(num, 10);
    }

    function isNotUndefined(obj) {
      return obj !== undefined;
    }

    function add(a, b) {
      return a + b;
    }

    function sub(a, b) {
      return a - b;
    }

    function median(values) {
      values.sort(sub);
      var half = Math.floor(values.length / 2);
      return (values.length % 2) ? values[half] : ((values[half - 1] + values[half]) / 2.0);
    }

    function average(array) {
      return (array.reduce(add, 0)) / array.length;
    }

    function standardDeviation(values) {
      var avg = average(values);
      var squareDiffs = values.map(function (value) {
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
      });

      var avgSquareDiff = average(squareDiffs);

      var stdDev = Math.sqrt(avgSquareDiff);
      return stdDev;
    }

    function deepProperty(obj, property, isDeep) {
      if (isDeep === false) {
        // pass without processing
        return obj[property];
      }
      var pieces = property.split('.'),
        root = obj;
      while (pieces.length > 0) {
        root = root[pieces.shift()];
      }
      return root;
    }

    function binarySearch(array, item, fun) {
      var lo = 0,
        hi = array.length,
        compared,
        mid;
      while (lo < hi) {
        mid = (lo + hi) >> 1;
        compared = fun.apply(null, [item, array[mid]]);
        if (compared === 0) {
          return {
            found: true,
            index: mid
          };
        } else if (compared < 0) {
          hi = mid;
        } else {
          lo = mid + 1;
        }
      }
      return {
        found: false,
        index: hi
      };
    }

    function BSonSort(fun) {
      return function (array, item) {
        return binarySearch(array, item, fun);
      };
    }

    function KeyValueStore() {}

    KeyValueStore.prototype = {
      keys: [],
      values: [],
      sort: function (a, b) {
        return (a < b) ? -1 : ((a > b) ? 1 : 0);
      },
      setSort: function (fun) {
        this.bs = new BSonSort(fun);
      },
      bs: function () {
        return new BSonSort(this.sort);
      },
      set: function (key, value) {
        var pos = this.bs(this.keys, key);
        if (pos.found) {
          this.values[pos.index] = value;
        } else {
          this.keys.splice(pos.index, 0, key);
          this.values.splice(pos.index, 0, value);
        }
      },
      get: function (key) {
        return this.values[binarySearch(this.keys, key, this.sort).index];
      }
    };

    function UniqueIndex(uniqueField) {
      this.field = uniqueField;
      this.keyMap = {};
      this.lokiMap = {};
    }
    UniqueIndex.prototype.keyMap = {};
    UniqueIndex.prototype.lokiMap = {};
    UniqueIndex.prototype.set = function (obj) {
      var fieldValue = obj[this.field];
      if (fieldValue !== null && typeof (fieldValue) !== 'undefined') {
        if (this.keyMap[fieldValue]) {
          throw new Error('Duplicate key for property ' + this.field + ': ' + fieldValue);
        } else {
          this.keyMap[fieldValue] = obj;
          this.lokiMap[obj.$loki] = fieldValue;
        }
      }
    };
    UniqueIndex.prototype.get = function (key) {
      return this.keyMap[key];
    };

    UniqueIndex.prototype.byId = function (id) {
      return this.keyMap[this.lokiMap[id]];
    };
    /**
     * Updates a document's unique index given an updated object.
     * @param  {Object} obj Original document object
     * @param  {Object} doc New document object (likely the same as obj)
     */
    UniqueIndex.prototype.update = function (obj, doc) {
      if (this.lokiMap[obj.$loki] !== doc[this.field]) {
        var old = this.lokiMap[obj.$loki];
        this.set(doc);
        // make the old key fail bool test, while avoiding the use of delete (mem-leak prone)
        this.keyMap[old] = undefined;
      } else {
        this.keyMap[obj[this.field]] = doc;
      }
    };
    UniqueIndex.prototype.remove = function (key) {
      var obj = this.keyMap[key];
      if (obj !== null && typeof obj !== 'undefined') {
        this.keyMap[key] = undefined;
        this.lokiMap[obj.$loki] = undefined;
      } else {
        throw new Error('Key is not in unique index: ' + this.field);
      }
    };
    UniqueIndex.prototype.clear = function () {
      this.keyMap = {};
      this.lokiMap = {};
    };

    function ExactIndex(exactField) {
      this.index = {};
      this.field = exactField;
    }

    // add the value you want returned to the key in the index
    ExactIndex.prototype = {
      set: function add(key, val) {
        if (this.index[key]) {
          this.index[key].push(val);
        } else {
          this.index[key] = [val];
        }
      },

      // remove the value from the index, if the value was the last one, remove the key
      remove: function remove(key, val) {
        var idxSet = this.index[key];
        for (var i in idxSet) {
          if (idxSet[i] == val) {
            idxSet.splice(i, 1);
          }
        }
        if (idxSet.length < 1) {
          this.index[key] = undefined;
        }
      },

      // get the values related to the key, could be more than one
      get: function get(key) {
        return this.index[key];
      },

      // clear will zap the index
      clear: function clear(key) {
        this.index = {};
      }
    };

    function SortedIndex(sortedField) {
      this.field = sortedField;
    }

    SortedIndex.prototype = {
      keys: [],
      values: [],
      // set the default sort
      sort: function (a, b) {
        return (a < b) ? -1 : ((a > b) ? 1 : 0);
      },
      bs: function () {
        return new BSonSort(this.sort);
      },
      // and allow override of the default sort
      setSort: function (fun) {
        this.bs = new BSonSort(fun);
      },
      // add the value you want returned  to the key in the index
      set: function (key, value) {
        var pos = binarySearch(this.keys, key, this.sort);
        if (pos.found) {
          this.values[pos.index].push(value);
        } else {
          this.keys.splice(pos.index, 0, key);
          this.values.splice(pos.index, 0, [value]);
        }
      },
      // get all values which have a key == the given key
      get: function (key) {
        var bsr = binarySearch(this.keys, key, this.sort);
        if (bsr.found) {
          return this.values[bsr.index];
        } else {
          return [];
        }
      },
      // get all values which have a key < the given key
      getLt: function (key) {
        var bsr = binarySearch(this.keys, key, this.sort);
        var pos = bsr.index;
        if (bsr.found) pos--;
        return this.getAll(key, 0, pos);
      },
      // get all values which have a key > the given key
      getGt: function (key) {
        var bsr = binarySearch(this.keys, key, this.sort);
        var pos = bsr.index;
        if (bsr.found) pos++;
        return this.getAll(key, pos, this.keys.length);
      },

      // get all vals from start to end
      getAll: function (key, start, end) {
        var results = [];
        for (var i = start; i < end; i++) {
          results = results.concat(this.values[i]);
        }
        return results;
      },
      // just in case someone wants to do something smart with ranges
      getPos: function (key) {
        return binarySearch(this.keys, key, this.sort);
      },
      // remove the value from the index, if the value was the last one, remove the key
      remove: function (key, value) {
        var pos = binarySearch(this.keys, key, this.sort).index;
        var idxSet = this.values[pos];
        for (var i in idxSet) {
          if (idxSet[i] == value) idxSet.splice(i, 1);
        }
        if (idxSet.length < 1) {
          this.keys.splice(pos, 1);
          this.values.splice(pos, 1);
        }
      },
      // clear will zap the index
      clear: function () {
        this.keys = [];
        this.values = [];
      }
    };


    Loki.LokiOps = LokiOps;
    Loki.Collection = Collection;
    Loki.KeyValueStore = KeyValueStore;
    Loki.persistenceAdapters = {
      fs: LokiFsAdapter,
      localStorage: LokiLocalStorageAdapter
    };
    return Loki;
  }());

}));
