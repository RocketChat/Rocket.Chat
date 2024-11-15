(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Bugsnag = f()}})(function(){var define,module,exports;
var _$breadcrumbTypes_8 = ['navigation', 'request', 'process', 'log', 'user', 'state', 'error', 'manual'];

// Array#reduce
var _$reduce_17 = function (arr, fn, accum) {
  var val = accum;

  for (var i = 0, len = arr.length; i < len; i++) {
    val = fn(val, arr[i], i, arr);
  }

  return val;
};

/* removed: var _$reduce_17 = require('./reduce'); */; // Array#filter


var _$filter_12 = function (arr, fn) {
  return _$reduce_17(arr, function (accum, item, i, arr) {
    return !fn(item, i, arr) ? accum : accum.concat(item);
  }, []);
};

/* removed: var _$reduce_17 = require('./reduce'); */; // Array#includes


var _$includes_13 = function (arr, x) {
  return _$reduce_17(arr, function (accum, item, i, arr) {
    return accum === true || item === x;
  }, false);
};

// Array#isArray
var _$isArray_14 = function (obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
};

/* eslint-disable-next-line no-prototype-builtins */
var _hasDontEnumBug = !{
  toString: null
}.propertyIsEnumerable('toString');

var _dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor']; // Object#keys

var _$keys_15 = function (obj) {
  // stripped down version of
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/Keys
  var result = [];
  var prop;

  for (prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) result.push(prop);
  }

  if (!_hasDontEnumBug) return result;

  for (var i = 0, len = _dontEnums.length; i < len; i++) {
    if (Object.prototype.hasOwnProperty.call(obj, _dontEnums[i])) result.push(_dontEnums[i]);
  }

  return result;
};

var _$intRange_24 = function (min, max) {
  if (min === void 0) {
    min = 1;
  }

  if (max === void 0) {
    max = Infinity;
  }

  return function (value) {
    return typeof value === 'number' && parseInt('' + value, 10) === value && value >= min && value <= max;
  };
};

/* removed: var _$filter_12 = require('../es-utils/filter'); */;

/* removed: var _$isArray_14 = require('../es-utils/is-array'); */;

var _$listOfFunctions_25 = function (value) {
  return typeof value === 'function' || _$isArray_14(value) && _$filter_12(value, function (f) {
    return typeof f === 'function';
  }).length === value.length;
};

var _$stringWithLength_26 = function (value) {
  return typeof value === 'string' && !!value.length;
};

var _$config_5 = {};
/* removed: var _$filter_12 = require('./lib/es-utils/filter'); */;

/* removed: var _$reduce_17 = require('./lib/es-utils/reduce'); */;

/* removed: var _$keys_15 = require('./lib/es-utils/keys'); */;

/* removed: var _$isArray_14 = require('./lib/es-utils/is-array'); */;

/* removed: var _$includes_13 = require('./lib/es-utils/includes'); */;

/* removed: var _$intRange_24 = require('./lib/validators/int-range'); */;

/* removed: var _$stringWithLength_26 = require('./lib/validators/string-with-length'); */;

/* removed: var _$listOfFunctions_25 = require('./lib/validators/list-of-functions'); */;

/* removed: var _$breadcrumbTypes_8 = require('./lib/breadcrumb-types'); */;

var defaultErrorTypes = function () {
  return {
    unhandledExceptions: true,
    unhandledRejections: true
  };
};

_$config_5.schema = {
  apiKey: {
    defaultValue: function () {
      return null;
    },
    message: 'is required',
    validate: _$stringWithLength_26
  },
  appVersion: {
    defaultValue: function () {
      return undefined;
    },
    message: 'should be a string',
    validate: function (value) {
      return value === undefined || _$stringWithLength_26(value);
    }
  },
  appType: {
    defaultValue: function () {
      return undefined;
    },
    message: 'should be a string',
    validate: function (value) {
      return value === undefined || _$stringWithLength_26(value);
    }
  },
  autoDetectErrors: {
    defaultValue: function () {
      return true;
    },
    message: 'should be true|false',
    validate: function (value) {
      return value === true || value === false;
    }
  },
  enabledErrorTypes: {
    defaultValue: function () {
      return defaultErrorTypes();
    },
    message: 'should be an object containing the flags { unhandledExceptions:true|false, unhandledRejections:true|false }',
    allowPartialObject: true,
    validate: function (value) {
      // ensure we have an object
      if (typeof value !== 'object' || !value) return false;
      var providedKeys = _$keys_15(value);
      var defaultKeys = _$keys_15(defaultErrorTypes()); // ensure it only has a subset of the allowed keys

      if (_$filter_12(providedKeys, function (k) {
        return _$includes_13(defaultKeys, k);
      }).length < providedKeys.length) return false; // ensure all of the values are boolean

      if (_$filter_12(_$keys_15(value), function (k) {
        return typeof value[k] !== 'boolean';
      }).length > 0) return false;
      return true;
    }
  },
  onError: {
    defaultValue: function () {
      return [];
    },
    message: 'should be a function or array of functions',
    validate: _$listOfFunctions_25
  },
  onSession: {
    defaultValue: function () {
      return [];
    },
    message: 'should be a function or array of functions',
    validate: _$listOfFunctions_25
  },
  onBreadcrumb: {
    defaultValue: function () {
      return [];
    },
    message: 'should be a function or array of functions',
    validate: _$listOfFunctions_25
  },
  endpoints: {
    defaultValue: function () {
      return {
        notify: 'https://notify.bugsnag.com',
        sessions: 'https://sessions.bugsnag.com'
      };
    },
    message: 'should be an object containing endpoint URLs { notify, sessions }',
    validate: function (val) {
      return (// first, ensure it's an object
        val && typeof val === 'object' && // notify and sessions must always be set
        _$stringWithLength_26(val.notify) && _$stringWithLength_26(val.sessions) && // ensure no keys other than notify/session are set on endpoints object
        _$filter_12(_$keys_15(val), function (k) {
          return !_$includes_13(['notify', 'sessions'], k);
        }).length === 0
      );
    }
  },
  autoTrackSessions: {
    defaultValue: function (val) {
      return true;
    },
    message: 'should be true|false',
    validate: function (val) {
      return val === true || val === false;
    }
  },
  enabledReleaseStages: {
    defaultValue: function () {
      return null;
    },
    message: 'should be an array of strings',
    validate: function (value) {
      return value === null || _$isArray_14(value) && _$filter_12(value, function (f) {
        return typeof f === 'string';
      }).length === value.length;
    }
  },
  releaseStage: {
    defaultValue: function () {
      return 'production';
    },
    message: 'should be a string',
    validate: function (value) {
      return typeof value === 'string' && value.length;
    }
  },
  maxBreadcrumbs: {
    defaultValue: function () {
      return 25;
    },
    message: 'should be a number ≤100',
    validate: function (value) {
      return _$intRange_24(0, 100)(value);
    }
  },
  enabledBreadcrumbTypes: {
    defaultValue: function () {
      return _$breadcrumbTypes_8;
    },
    message: "should be null or a list of available breadcrumb types (" + _$breadcrumbTypes_8.join(',') + ")",
    validate: function (value) {
      return value === null || _$isArray_14(value) && _$reduce_17(value, function (accum, maybeType) {
        if (accum === false) return accum;
        return _$includes_13(_$breadcrumbTypes_8, maybeType);
      }, true);
    }
  },
  context: {
    defaultValue: function () {
      return undefined;
    },
    message: 'should be a string',
    validate: function (value) {
      return value === undefined || typeof value === 'string';
    }
  },
  user: {
    defaultValue: function () {
      return {};
    },
    message: 'should be an object with { id, email, name } properties',
    validate: function (value) {
      return value === null || value && _$reduce_17(_$keys_15(value), function (accum, key) {
        return accum && _$includes_13(['id', 'email', 'name'], key);
      }, true);
    }
  },
  metadata: {
    defaultValue: function () {
      return {};
    },
    message: 'should be an object',
    validate: function (value) {
      return typeof value === 'object' && value !== null;
    }
  },
  logger: {
    defaultValue: function () {
      return undefined;
    },
    message: 'should be null or an object with methods { debug, info, warn, error }',
    validate: function (value) {
      return !value || value && _$reduce_17(['debug', 'info', 'warn', 'error'], function (accum, method) {
        return accum && typeof value[method] === 'function';
      }, true);
    }
  },
  redactedKeys: {
    defaultValue: function () {
      return ['password'];
    },
    message: 'should be an array of strings|regexes',
    validate: function (value) {
      return _$isArray_14(value) && value.length === _$filter_12(value, function (s) {
        return typeof s === 'string' || s && typeof s.test === 'function';
      }).length;
    }
  },
  plugins: {
    defaultValue: function () {
      return [];
    },
    message: 'should be an array of plugin objects',
    validate: function (value) {
      return _$isArray_14(value) && value.length === _$filter_12(value, function (p) {
        return p && typeof p === 'object' && typeof p.load === 'function';
      }).length;
    }
  },
  featureFlags: {
    defaultValue: function () {
      return [];
    },
    message: 'should be an array of objects that have a "name" property',
    validate: function (value) {
      return _$isArray_14(value) && value.length === _$filter_12(value, function (feature) {
        return feature && typeof feature === 'object' && typeof feature.name === 'string';
      }).length;
    }
  }
};

// extends helper from babel
// https://github.com/babel/babel/blob/916429b516e6466fd06588ee820e40e025d7f3a3/packages/babel-helpers/src/helpers.js#L377-L393
var _$assign_11 = function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

/* removed: var _$reduce_17 = require('./reduce'); */; // Array#map


var _$map_16 = function (arr, fn) {
  return _$reduce_17(arr, function (accum, item, i, arr) {
    return accum.concat(fn(item, i, arr));
  }, []);
};

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var schema = _$config_5.schema;

/* removed: var _$map_16 = require('@bugsnag/core/lib/es-utils/map'); */;

/* removed: var _$assign_11 = require('@bugsnag/core/lib/es-utils/assign'); */;

var _$config_1 = {
  releaseStage: _$assign_11({}, schema.releaseStage, {
    defaultValue: function () {
      if (/^localhost(:\d+)?$/.test(window.location.host)) return 'development';
      return 'production';
    }
  }),
  appType: _extends({}, schema.appType, {
    defaultValue: function () {
      return 'browser';
    }
  }),
  logger: _$assign_11({}, schema.logger, {
    defaultValue: function () {
      return (// set logger based on browser capability
        typeof console !== 'undefined' && typeof console.debug === 'function' ? getPrefixedConsole() : undefined
      );
    }
  })
};

var getPrefixedConsole = function () {
  var logger = {};
  var consoleLog = console.log;
  _$map_16(['debug', 'info', 'warn', 'error'], function (method) {
    var consoleMethod = console[method];
    logger[method] = typeof consoleMethod === 'function' ? consoleMethod.bind(console, '[bugsnag]') : consoleLog.bind(console, '[bugsnag]');
  });
  return logger;
};

var Breadcrumb = /*#__PURE__*/function () {
  function Breadcrumb(message, metadata, type, timestamp) {
    if (timestamp === void 0) {
      timestamp = new Date();
    }

    this.type = type;
    this.message = message;
    this.metadata = metadata;
    this.timestamp = timestamp;
  }

  var _proto = Breadcrumb.prototype;

  _proto.toJSON = function toJSON() {
    return {
      type: this.type,
      name: this.message,
      timestamp: this.timestamp,
      metaData: this.metadata
    };
  };

  return Breadcrumb;
}();

var _$Breadcrumb_3 = Breadcrumb;

var _$stackframe_34 = {};
(function (root, factory) {
  'use strict'; // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

  /* istanbul ignore next */

  if (typeof define === 'function' && define.amd) {
    define('stackframe', [], factory);
  } else if (typeof _$stackframe_34 === 'object') {
    _$stackframe_34 = factory();
  } else {
    root.StackFrame = factory();
  }
})(this, function () {
  'use strict';

  function _isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  }

  function _getter(p) {
    return function () {
      return this[p];
    };
  }

  var booleanProps = ['isConstructor', 'isEval', 'isNative', 'isToplevel'];
  var numericProps = ['columnNumber', 'lineNumber'];
  var stringProps = ['fileName', 'functionName', 'source'];
  var arrayProps = ['args'];
  var props = booleanProps.concat(numericProps, stringProps, arrayProps);

  function StackFrame(obj) {
    if (obj instanceof Object) {
      for (var i = 0; i < props.length; i++) {
        if (obj.hasOwnProperty(props[i]) && obj[props[i]] !== undefined) {
          this['set' + _capitalize(props[i])](obj[props[i]]);
        }
      }
    }
  }

  StackFrame.prototype = {
    getArgs: function () {
      return this.args;
    },
    setArgs: function (v) {
      if (Object.prototype.toString.call(v) !== '[object Array]') {
        throw new TypeError('Args must be an Array');
      }

      this.args = v;
    },
    getEvalOrigin: function () {
      return this.evalOrigin;
    },
    setEvalOrigin: function (v) {
      if (v instanceof StackFrame) {
        this.evalOrigin = v;
      } else if (v instanceof Object) {
        this.evalOrigin = new StackFrame(v);
      } else {
        throw new TypeError('Eval Origin must be an Object or StackFrame');
      }
    },
    toString: function () {
      var functionName = this.getFunctionName() || '{anonymous}';
      var args = '(' + (this.getArgs() || []).join(',') + ')';
      var fileName = this.getFileName() ? '@' + this.getFileName() : '';
      var lineNumber = _isNumber(this.getLineNumber()) ? ':' + this.getLineNumber() : '';
      var columnNumber = _isNumber(this.getColumnNumber()) ? ':' + this.getColumnNumber() : '';
      return functionName + args + fileName + lineNumber + columnNumber;
    }
  };

  for (var i = 0; i < booleanProps.length; i++) {
    StackFrame.prototype['get' + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);

    StackFrame.prototype['set' + _capitalize(booleanProps[i])] = function (p) {
      return function (v) {
        this[p] = Boolean(v);
      };
    }(booleanProps[i]);
  }

  for (var j = 0; j < numericProps.length; j++) {
    StackFrame.prototype['get' + _capitalize(numericProps[j])] = _getter(numericProps[j]);

    StackFrame.prototype['set' + _capitalize(numericProps[j])] = function (p) {
      return function (v) {
        if (!_isNumber(v)) {
          throw new TypeError(p + ' must be a Number');
        }

        this[p] = Number(v);
      };
    }(numericProps[j]);
  }

  for (var k = 0; k < stringProps.length; k++) {
    StackFrame.prototype['get' + _capitalize(stringProps[k])] = _getter(stringProps[k]);

    StackFrame.prototype['set' + _capitalize(stringProps[k])] = function (p) {
      return function (v) {
        this[p] = String(v);
      };
    }(stringProps[k]);
  }

  return StackFrame;
});

var _$errorStackParser_31 = {};
(function (root, factory) {
  'use strict'; // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

  /* istanbul ignore next */

  if (typeof define === 'function' && define.amd) {
    define('error-stack-parser', ['stackframe'], factory);
  } else if (typeof _$errorStackParser_31 === 'object') {
    _$errorStackParser_31 = factory(_$stackframe_34);
  } else {
    root.ErrorStackParser = factory(root.StackFrame);
  }
})(this, function ErrorStackParser(StackFrame) {
  'use strict';

  var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+\:\d+/;
  var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+\:\d+|\(native\))/m;
  var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code\])?$/;
  return {
    /**
     * Given an Error object, extract the most information from it.
     *
     * @param {Error} error object
     * @return {Array} of StackFrames
     */
    parse: function ErrorStackParser$$parse(error) {
      if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
        return this.parseOpera(error);
      } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
        return this.parseV8OrIE(error);
      } else if (error.stack) {
        return this.parseFFOrSafari(error);
      } else {
        throw new Error('Cannot parse given Error object');
      }
    },
    // Separate line and column numbers from a string of the form: (URI:Line:Column)
    extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
      // Fail-fast but return locations like "(native)"
      if (urlLike.indexOf(':') === -1) {
        return [urlLike];
      }

      var regExp = /(.+?)(?:\:(\d+))?(?:\:(\d+))?$/;
      var parts = regExp.exec(urlLike.replace(/[\(\)]/g, ''));
      return [parts[1], parts[2] || undefined, parts[3] || undefined];
    },
    parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
      var filtered = error.stack.split('\n').filter(function (line) {
        return !!line.match(CHROME_IE_STACK_REGEXP);
      }, this);
      return filtered.map(function (line) {
        if (line.indexOf('(eval ') > -1) {
          // Throw away eval information until we implement stacktrace.js/stackframe#8
          line = line.replace(/eval code/g, 'eval').replace(/(\(eval at [^\()]*)|(\)\,.*$)/g, '');
        }

        var sanitizedLine = line.replace(/^\s+/, '').replace(/\(eval code/g, '('); // capture and preseve the parenthesized location "(/foo/my bar.js:12:87)" in
        // case it has spaces in it, as the string is split on \s+ later on

        var location = sanitizedLine.match(/ (\((.+):(\d+):(\d+)\)$)/); // remove the parenthesized location from the line, if it was matched

        sanitizedLine = location ? sanitizedLine.replace(location[0], '') : sanitizedLine;
        var tokens = sanitizedLine.split(/\s+/).slice(1); // if a location was matched, pass it to extractLocation() otherwise pop the last token

        var locationParts = this.extractLocation(location ? location[1] : tokens.pop());
        var functionName = tokens.join(' ') || undefined;
        var fileName = ['eval', '<anonymous>'].indexOf(locationParts[0]) > -1 ? undefined : locationParts[0];
        return new StackFrame({
          functionName: functionName,
          fileName: fileName,
          lineNumber: locationParts[1],
          columnNumber: locationParts[2],
          source: line
        });
      }, this);
    },
    parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
      var filtered = error.stack.split('\n').filter(function (line) {
        return !line.match(SAFARI_NATIVE_CODE_REGEXP);
      }, this);
      return filtered.map(function (line) {
        // Throw away eval information until we implement stacktrace.js/stackframe#8
        if (line.indexOf(' > eval') > -1) {
          line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval\:\d+\:\d+/g, ':$1');
        }

        if (line.indexOf('@') === -1 && line.indexOf(':') === -1) {
          // Safari eval frames only have function names and nothing else
          return new StackFrame({
            functionName: line
          });
        } else {
          var functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
          var matches = line.match(functionNameRegex);
          var functionName = matches && matches[1] ? matches[1] : undefined;
          var locationParts = this.extractLocation(line.replace(functionNameRegex, ''));
          return new StackFrame({
            functionName: functionName,
            fileName: locationParts[0],
            lineNumber: locationParts[1],
            columnNumber: locationParts[2],
            source: line
          });
        }
      }, this);
    },
    parseOpera: function ErrorStackParser$$parseOpera(e) {
      if (!e.stacktrace || e.message.indexOf('\n') > -1 && e.message.split('\n').length > e.stacktrace.split('\n').length) {
        return this.parseOpera9(e);
      } else if (!e.stack) {
        return this.parseOpera10(e);
      } else {
        return this.parseOpera11(e);
      }
    },
    parseOpera9: function ErrorStackParser$$parseOpera9(e) {
      var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
      var lines = e.message.split('\n');
      var result = [];

      for (var i = 2, len = lines.length; i < len; i += 2) {
        var match = lineRE.exec(lines[i]);

        if (match) {
          result.push(new StackFrame({
            fileName: match[2],
            lineNumber: match[1],
            source: lines[i]
          }));
        }
      }

      return result;
    },
    parseOpera10: function ErrorStackParser$$parseOpera10(e) {
      var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
      var lines = e.stacktrace.split('\n');
      var result = [];

      for (var i = 0, len = lines.length; i < len; i += 2) {
        var match = lineRE.exec(lines[i]);

        if (match) {
          result.push(new StackFrame({
            functionName: match[3] || undefined,
            fileName: match[2],
            lineNumber: match[1],
            source: lines[i]
          }));
        }
      }

      return result;
    },
    // Opera 10.65+ Error.stack very similar to FF/Safari
    parseOpera11: function ErrorStackParser$$parseOpera11(error) {
      var filtered = error.stack.split('\n').filter(function (line) {
        return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
      }, this);
      return filtered.map(function (line) {
        var tokens = line.split('@');
        var locationParts = this.extractLocation(tokens.pop());
        var functionCall = tokens.shift() || '';
        var functionName = functionCall.replace(/<anonymous function(: (\w+))?>/, '$2').replace(/\([^\)]*\)/g, '') || undefined;
        var argsRaw;

        if (functionCall.match(/\(([^\)]*)\)/)) {
          argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
        }

        var args = argsRaw === undefined || argsRaw === '[arguments not available]' ? undefined : argsRaw.split(',');
        return new StackFrame({
          functionName: functionName,
          args: args,
          fileName: locationParts[0],
          lineNumber: locationParts[1],
          columnNumber: locationParts[2],
          source: line
        });
      }, this);
    }
  };
});

var _$errorStackParser_10 = _$errorStackParser_31;

var _$safeJsonStringify_30 = function (data, replacer, space, opts) {
  var redactedKeys = opts && opts.redactedKeys ? opts.redactedKeys : [];
  var redactedPaths = opts && opts.redactedPaths ? opts.redactedPaths : [];
  return JSON.stringify(prepareObjForSerialization(data, redactedKeys, redactedPaths), replacer, space);
};

var MAX_DEPTH = 20;
var MAX_EDGES = 25000;
var MIN_PRESERVED_DEPTH = 8;
var REPLACEMENT_NODE = '...';

function isError(o) {
  return o instanceof Error || /^\[object (Error|(Dom)?Exception)\]$/.test(Object.prototype.toString.call(o));
}

function throwsMessage(err) {
  return '[Throws: ' + (err ? err.message : '?') + ']';
}

function find(haystack, needle) {
  for (var i = 0, len = haystack.length; i < len; i++) {
    if (haystack[i] === needle) return true;
  }

  return false;
} // returns true if the string `path` starts with any of the provided `paths`


function isDescendent(paths, path) {
  for (var i = 0, len = paths.length; i < len; i++) {
    if (path.indexOf(paths[i]) === 0) return true;
  }

  return false;
}

function shouldRedact(patterns, key) {
  for (var i = 0, len = patterns.length; i < len; i++) {
    if (typeof patterns[i] === 'string' && patterns[i].toLowerCase() === key.toLowerCase()) return true;
    if (patterns[i] && typeof patterns[i].test === 'function' && patterns[i].test(key)) return true;
  }

  return false;
}

function __isArray_30(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

function safelyGetProp(obj, prop) {
  try {
    return obj[prop];
  } catch (err) {
    return throwsMessage(err);
  }
}

function prepareObjForSerialization(obj, redactedKeys, redactedPaths) {
  var seen = []; // store references to objects we have seen before

  var edges = 0;

  function visit(obj, path) {
    function edgesExceeded() {
      return path.length > MIN_PRESERVED_DEPTH && edges > MAX_EDGES;
    }

    edges++;
    if (path.length > MAX_DEPTH) return REPLACEMENT_NODE;
    if (edgesExceeded()) return REPLACEMENT_NODE;
    if (obj === null || typeof obj !== 'object') return obj;
    if (find(seen, obj)) return '[Circular]';
    seen.push(obj);

    if (typeof obj.toJSON === 'function') {
      try {
        // we're not going to count this as an edge because it
        // replaces the value of the currently visited object
        edges--;
        var fResult = visit(obj.toJSON(), path);
        seen.pop();
        return fResult;
      } catch (err) {
        return throwsMessage(err);
      }
    }

    var er = isError(obj);

    if (er) {
      edges--;
      var eResult = visit({
        name: obj.name,
        message: obj.message
      }, path);
      seen.pop();
      return eResult;
    }

    if (__isArray_30(obj)) {
      var aResult = [];

      for (var i = 0, len = obj.length; i < len; i++) {
        if (edgesExceeded()) {
          aResult.push(REPLACEMENT_NODE);
          break;
        }

        aResult.push(visit(obj[i], path.concat('[]')));
      }

      seen.pop();
      return aResult;
    }

    var result = {};

    try {
      for (var prop in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, prop)) continue;

        if (isDescendent(redactedPaths, path.join('.')) && shouldRedact(redactedKeys, prop)) {
          result[prop] = '[REDACTED]';
          continue;
        }

        if (edgesExceeded()) {
          result[prop] = REPLACEMENT_NODE;
          break;
        }

        result[prop] = visit(safelyGetProp(obj, prop), path.concat(prop));
      }
    } catch (e) {}

    seen.pop();
    return result;
  }

  return visit(obj, []);
}

/* removed: var _$map_16 = require('./es-utils/map'); */;

/* removed: var _$filter_12 = require('./es-utils/filter'); */;

/* removed: var _$isArray_14 = require('./es-utils/is-array'); */;

/* removed: var _$safeJsonStringify_30 = require('@bugsnag/safe-json-stringify'); */;

function add(existingFeatures, existingFeatureKeys, name, variant) {
  if (typeof name !== 'string') {
    return;
  }

  if (variant === undefined) {
    variant = null;
  } else if (variant !== null && typeof variant !== 'string') {
    variant = _$safeJsonStringify_30(variant);
  }

  var existingIndex = existingFeatureKeys[name];

  if (typeof existingIndex === 'number') {
    existingFeatures[existingIndex] = {
      name: name,
      variant: variant
    };
    return;
  }

  existingFeatures.push({
    name: name,
    variant: variant
  });
  existingFeatureKeys[name] = existingFeatures.length - 1;
}

function merge(existingFeatures, newFeatures, existingFeatureKeys) {
  if (!_$isArray_14(newFeatures)) {
    return;
  }

  for (var i = 0; i < newFeatures.length; ++i) {
    var feature = newFeatures[i];

    if (feature === null || typeof feature !== 'object') {
      continue;
    } // 'add' will handle if 'name' doesn't exist & 'variant' is optional


    add(existingFeatures, existingFeatureKeys, feature.name, feature.variant);
  }

  return existingFeatures;
} // convert feature flags from a map of 'name -> variant' into the format required
// by the Bugsnag Event API:
//   [{ featureFlag: 'name', variant: 'variant' }, { featureFlag: 'name 2' }]


function toEventApi(featureFlags) {
  return _$map_16(_$filter_12(featureFlags, Boolean), function (_ref) {
    var name = _ref.name,
        variant = _ref.variant;
    var flag = {
      featureFlag: name
    }; // don't add a 'variant' property unless there's actually a value

    if (typeof variant === 'string') {
      flag.variant = variant;
    }

    return flag;
  });
}

function clear(features, featuresIndex, name) {
  var existingIndex = featuresIndex[name];

  if (typeof existingIndex === 'number') {
    features[existingIndex] = null;
    delete featuresIndex[name];
  }
}

var _$featureFlagDelegate_18 = {
  add: add,
  clear: clear,
  merge: merge,
  toEventApi: toEventApi
};

// Given `err` which may be an error, does it have a stack property which is a string?
var _$hasStack_19 = function (err) {
  return !!err && (!!err.stack || !!err.stacktrace || !!err['opera#sourceloc']) && typeof (err.stack || err.stacktrace || err['opera#sourceloc']) === 'string' && err.stack !== err.name + ": " + err.message;
};

/**
 * Expose `isError`.
 */
var _$isError_32 = __isError_32;
/**
 * Test whether `value` is error object.
 *
 * @param {*} value
 * @returns {boolean}
 */

function __isError_32(value) {
  switch (Object.prototype.toString.call(value)) {
    case '[object Error]':
      return true;

    case '[object Exception]':
      return true;

    case '[object DOMException]':
      return true;

    default:
      return value instanceof Error;
  }
}

var _$iserror_20 = _$isError_32;

/* removed: var _$assign_11 = require('./es-utils/assign'); */;

var __add_22 = function (state, section, keyOrObj, maybeVal) {
  var _updates;

  if (!section) return;
  var updates; // addMetadata("section", null) -> clears section

  if (keyOrObj === null) return __clear_22(state, section); // normalise the two supported input types into object form

  if (typeof keyOrObj === 'object') updates = keyOrObj;
  if (typeof keyOrObj === 'string') updates = (_updates = {}, _updates[keyOrObj] = maybeVal, _updates); // exit if we don't have an updates object at this point

  if (!updates) return; // ensure a section with this name exists

  if (!state[section]) state[section] = {}; // merge the updates with the existing section

  state[section] = _$assign_11({}, state[section], updates);
};

var get = function (state, section, key) {
  if (typeof section !== 'string') return undefined;

  if (!key) {
    return state[section];
  }

  if (state[section]) {
    return state[section][key];
  }

  return undefined;
};

var __clear_22 = function (state, section, key) {
  if (typeof section !== 'string') return; // clear an entire section

  if (!key) {
    delete state[section];
    return;
  } // clear a single value from a section


  if (state[section]) {
    delete state[section][key];
  }
};

var _$metadataDelegate_22 = {
  add: __add_22,
  get: get,
  clear: __clear_22
};

var _$stackGenerator_33 = {};
(function (root, factory) {
  'use strict'; // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, Rhino, and browsers.

  /* istanbul ignore next */

  if (typeof define === 'function' && define.amd) {
    define('stack-generator', ['stackframe'], factory);
  } else if (typeof _$stackGenerator_33 === 'object') {
    _$stackGenerator_33 = factory(_$stackframe_34);
  } else {
    root.StackGenerator = factory(root.StackFrame);
  }
})(this, function (StackFrame) {
  return {
    backtrace: function StackGenerator$$backtrace(opts) {
      var stack = [];
      var maxStackSize = 10;

      if (typeof opts === 'object' && typeof opts.maxStackSize === 'number') {
        maxStackSize = opts.maxStackSize;
      }

      var curr = arguments.callee;

      while (curr && stack.length < maxStackSize && curr['arguments']) {
        // Allow V8 optimizations
        var args = new Array(curr['arguments'].length);

        for (var i = 0; i < args.length; ++i) {
          args[i] = curr['arguments'][i];
        }

        if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
          stack.push(new StackFrame({
            functionName: RegExp.$1 || undefined,
            args: args
          }));
        } else {
          stack.push(new StackFrame({
            args: args
          }));
        }

        try {
          curr = curr.caller;
        } catch (e) {
          break;
        }
      }

      return stack;
    }
  };
});

/* removed: var _$errorStackParser_10 = require('./lib/error-stack-parser'); */;

/* removed: var _$stackGenerator_33 = require('stack-generator'); */;

/* removed: var _$hasStack_19 = require('./lib/has-stack'); */;

/* removed: var _$map_16 = require('./lib/es-utils/map'); */;

/* removed: var _$reduce_17 = require('./lib/es-utils/reduce'); */;

/* removed: var _$filter_12 = require('./lib/es-utils/filter'); */;

/* removed: var _$assign_11 = require('./lib/es-utils/assign'); */;

/* removed: var _$metadataDelegate_22 = require('./lib/metadata-delegate'); */;

/* removed: var _$featureFlagDelegate_18 = require('./lib/feature-flag-delegate'); */;

/* removed: var _$iserror_20 = require('./lib/iserror'); */;

var Event = /*#__PURE__*/function () {
  function Event(errorClass, errorMessage, stacktrace, handledState, originalError) {
    if (stacktrace === void 0) {
      stacktrace = [];
    }

    if (handledState === void 0) {
      handledState = defaultHandledState();
    }

    this.apiKey = undefined;
    this.context = undefined;
    this.groupingHash = undefined;
    this.originalError = originalError;
    this._handledState = handledState;
    this.severity = this._handledState.severity;
    this.unhandled = this._handledState.unhandled;
    this.app = {};
    this.device = {};
    this.request = {};
    this.breadcrumbs = [];
    this.threads = [];
    this._metadata = {};
    this._features = [];
    this._featuresIndex = {};
    this._user = {};
    this._session = undefined;
    this.errors = [createBugsnagError(errorClass, errorMessage, Event.__type, stacktrace)]; // Flags.
    // Note these are not initialised unless they are used
    // to save unnecessary bytes in the browser bundle

    /* this.attemptImmediateDelivery, default: true */
  }

  var _proto = Event.prototype;

  _proto.addMetadata = function addMetadata(section, keyOrObj, maybeVal) {
    return _$metadataDelegate_22.add(this._metadata, section, keyOrObj, maybeVal);
  };

  _proto.getMetadata = function getMetadata(section, key) {
    return _$metadataDelegate_22.get(this._metadata, section, key);
  };

  _proto.clearMetadata = function clearMetadata(section, key) {
    return _$metadataDelegate_22.clear(this._metadata, section, key);
  };

  _proto.addFeatureFlag = function addFeatureFlag(name, variant) {
    if (variant === void 0) {
      variant = null;
    }

    _$featureFlagDelegate_18.add(this._features, this._featuresIndex, name, variant);
  };

  _proto.addFeatureFlags = function addFeatureFlags(featureFlags) {
    _$featureFlagDelegate_18.merge(this._features, featureFlags, this._featuresIndex);
  };

  _proto.getFeatureFlags = function getFeatureFlags() {
    return _$featureFlagDelegate_18.toEventApi(this._features);
  };

  _proto.clearFeatureFlag = function clearFeatureFlag(name) {
    _$featureFlagDelegate_18.clear(this._features, this._featuresIndex, name);
  };

  _proto.clearFeatureFlags = function clearFeatureFlags() {
    this._features = [];
    this._featuresIndex = {};
  };

  _proto.getUser = function getUser() {
    return this._user;
  };

  _proto.setUser = function setUser(id, email, name) {
    this._user = {
      id: id,
      email: email,
      name: name
    };
  };

  _proto.toJSON = function toJSON() {
    return {
      payloadVersion: '4',
      exceptions: _$map_16(this.errors, function (er) {
        return _$assign_11({}, er, {
          message: er.errorMessage
        });
      }),
      severity: this.severity,
      unhandled: this._handledState.unhandled,
      severityReason: this._handledState.severityReason,
      app: this.app,
      device: this.device,
      request: this.request,
      breadcrumbs: this.breadcrumbs,
      context: this.context,
      groupingHash: this.groupingHash,
      metaData: this._metadata,
      user: this._user,
      session: this._session,
      featureFlags: this.getFeatureFlags()
    };
  };

  return Event;
}(); // takes a stacktrace.js style stackframe (https://github.com/stacktracejs/stackframe)
// and returns a Bugsnag compatible stackframe (https://docs.bugsnag.com/api/error-reporting/#json-payload)


var formatStackframe = function (frame) {
  var f = {
    file: frame.fileName,
    method: normaliseFunctionName(frame.functionName),
    lineNumber: frame.lineNumber,
    columnNumber: frame.columnNumber,
    code: undefined,
    inProject: undefined
  }; // Some instances result in no file:
  // - calling notify() from chrome's terminal results in no file/method.
  // - non-error exception thrown from global code in FF
  // This adds one.

  if (f.lineNumber > -1 && !f.file && !f.method) {
    f.file = 'global code';
  }

  return f;
};

var normaliseFunctionName = function (name) {
  return /^global code$/i.test(name) ? 'global code' : name;
};

var defaultHandledState = function () {
  return {
    unhandled: false,
    severity: 'warning',
    severityReason: {
      type: 'handledException'
    }
  };
};

var ensureString = function (str) {
  return typeof str === 'string' ? str : '';
};

function createBugsnagError(errorClass, errorMessage, type, stacktrace) {
  return {
    errorClass: ensureString(errorClass),
    errorMessage: ensureString(errorMessage),
    type: type,
    stacktrace: _$reduce_17(stacktrace, function (accum, frame) {
      var f = formatStackframe(frame); // don't include a stackframe if none of its properties are defined

      try {
        if (JSON.stringify(f) === '{}') return accum;
        return accum.concat(f);
      } catch (e) {
        return accum;
      }
    }, [])
  };
}

function getCauseStack(error) {
  if (error.cause) {
    return [error].concat(getCauseStack(error.cause));
  } else {
    return [error];
  }
} // Helpers


Event.getStacktrace = function (error, errorFramesToSkip, backtraceFramesToSkip) {
  if (_$hasStack_19(error)) return _$errorStackParser_10.parse(error).slice(errorFramesToSkip); // error wasn't provided or didn't have a stacktrace so try to walk the callstack

  try {
    return _$filter_12(_$stackGenerator_33.backtrace(), function (frame) {
      return (frame.functionName || '').indexOf('StackGenerator$$') === -1;
    }).slice(1 + backtraceFramesToSkip);
  } catch (e) {
    return [];
  }
};

Event.create = function (maybeError, tolerateNonErrors, handledState, component, errorFramesToSkip, logger) {
  if (errorFramesToSkip === void 0) {
    errorFramesToSkip = 0;
  }

  var _normaliseError = normaliseError(maybeError, tolerateNonErrors, component, logger),
      error = _normaliseError[0],
      internalFrames = _normaliseError[1];

  var event;

  try {
    var stacktrace = Event.getStacktrace(error, // if an error was created/throw in the normaliseError() function, we need to
    // tell the getStacktrace() function to skip the number of frames we know will
    // be from our own functions. This is added to the number of frames deep we
    // were told about
    internalFrames > 0 ? 1 + internalFrames + errorFramesToSkip : 0, // if there's no stacktrace, the callstack may be walked to generated one.
    // this is how many frames should be removed because they come from our library
    1 + errorFramesToSkip);
    event = new Event(error.name, error.message, stacktrace, handledState, maybeError);
  } catch (e) {
    event = new Event(error.name, error.message, [], handledState, maybeError);
  }

  if (error.name === 'InvalidError') {
    event.addMetadata("" + component, 'non-error parameter', makeSerialisable(maybeError));
  }

  if (error.cause) {
    var _event$errors;

    var causes = getCauseStack(error).slice(1);
    var normalisedCauses = _$map_16(causes, function (cause) {
      // Only get stacktrace for error causes that are a valid JS Error and already have a stack
      var stacktrace = _$iserror_20(cause) && _$hasStack_19(cause) ? _$errorStackParser_10.parse(cause) : [];

      var _normaliseError2 = normaliseError(cause, true, 'error cause'),
          error = _normaliseError2[0];

      if (error.name === 'InvalidError') event.addMetadata('error cause', makeSerialisable(cause));
      return createBugsnagError(error.name, error.message, Event.__type, stacktrace);
    });

    (_event$errors = event.errors).push.apply(_event$errors, normalisedCauses);
  }

  return event;
};

var makeSerialisable = function (err) {
  if (err === null) return 'null';
  if (err === undefined) return 'undefined';
  return err;
};

var normaliseError = function (maybeError, tolerateNonErrors, component, logger) {
  var error;
  var internalFrames = 0;

  var createAndLogInputError = function (reason) {
    var verb = component === 'error cause' ? 'was' : 'received';
    if (logger) logger.warn(component + " " + verb + " a non-error: \"" + reason + "\"");
    var err = new Error(component + " " + verb + " a non-error. See \"" + component + "\" tab for more detail.");
    err.name = 'InvalidError';
    return err;
  }; // In some cases:
  //
  //  - the promise rejection handler (both in the browser and node)
  //  - the node uncaughtException handler
  //
  // We are really limited in what we can do to get a stacktrace. So we use the
  // tolerateNonErrors option to ensure that the resulting error communicates as
  // such.


  if (!tolerateNonErrors) {
    if (_$iserror_20(maybeError)) {
      error = maybeError;
    } else {
      error = createAndLogInputError(typeof maybeError);
      internalFrames += 2;
    }
  } else {
    switch (typeof maybeError) {
      case 'string':
      case 'number':
      case 'boolean':
        error = new Error(String(maybeError));
        internalFrames += 1;
        break;

      case 'function':
        error = createAndLogInputError('function');
        internalFrames += 2;
        break;

      case 'object':
        if (maybeError !== null && _$iserror_20(maybeError)) {
          error = maybeError;
        } else if (maybeError !== null && hasNecessaryFields(maybeError)) {
          error = new Error(maybeError.message || maybeError.errorMessage);
          error.name = maybeError.name || maybeError.errorClass;
          internalFrames += 1;
        } else {
          error = createAndLogInputError(maybeError === null ? 'null' : 'unsupported object');
          internalFrames += 2;
        }

        break;

      default:
        error = createAndLogInputError('nothing');
        internalFrames += 2;
    }
  }

  if (!_$hasStack_19(error)) {
    // in IE10/11 a new Error() doesn't have a stacktrace until you throw it, so try that here
    try {
      throw error;
    } catch (e) {
      if (_$hasStack_19(e)) {
        error = e; // if the error only got a stacktrace after we threw it here, we know it
        // will only have one extra internal frame from this function, regardless
        // of whether it went through createAndLogInputError() or not

        internalFrames = 1;
      }
    }
  }

  return [error, internalFrames];
}; // default value for stacktrace.type


Event.__type = 'browserjs';

var hasNecessaryFields = function (error) {
  return (typeof error.name === 'string' || typeof error.errorClass === 'string') && (typeof error.message === 'string' || typeof error.errorMessage === 'string');
};

var _$Event_6 = Event;

// This is a heavily modified/simplified version of
//   https://github.com/othiym23/async-some
// with the logic flipped so that it is akin to the
// synchronous "every" method instead of "some".
// run the asynchronous test function (fn) over each item in the array (arr)
// in series until:
//   - fn(item, cb) => calls cb(null, false)
//   - or the end of the array is reached
// the callback (cb) will be passed (null, false) if any of the items in arr
// caused fn to call back with false, otherwise it will be passed (null, true)
var _$asyncEvery_7 = function (arr, fn, cb) {
  var index = 0;

  var next = function () {
    if (index >= arr.length) return cb(null, true);
    fn(arr[index], function (err, result) {
      if (err) return cb(err);
      if (result === false) return cb(null, false);
      index++;
      next();
    });
  };

  next();
};

/* removed: var _$asyncEvery_7 = require('./async-every'); */;

var _$callbackRunner_9 = function (callbacks, event, onCallbackError, cb) {
  // This function is how we support different kinds of callback:
  //  - synchronous - return value
  //  - node-style async with callback - cb(err, value)
  //  - promise/thenable - resolve(value)
  // It normalises each of these into the lowest common denominator – a node-style callback
  var runMaybeAsyncCallback = function (fn, cb) {
    if (typeof fn !== 'function') return cb(null);

    try {
      // if function appears sync…
      if (fn.length !== 2) {
        var ret = fn(event); // check if it returned a "thenable" (promise)

        if (ret && typeof ret.then === 'function') {
          return ret.then( // resolve
          function (val) {
            return setTimeout(function () {
              return cb(null, val);
            });
          }, // reject
          function (err) {
            setTimeout(function () {
              onCallbackError(err);
              return cb(null, true);
            });
          });
        }

        return cb(null, ret);
      } // if function is async…


      fn(event, function (err, result) {
        if (err) {
          onCallbackError(err);
          return cb(null);
        }

        cb(null, result);
      });
    } catch (e) {
      onCallbackError(e);
      cb(null);
    }
  };

  _$asyncEvery_7(callbacks, runMaybeAsyncCallback, cb);
};

var _$syncCallbackRunner_23 = function (callbacks, callbackArg, callbackType, logger) {
  var ignore = false;
  var cbs = callbacks.slice();

  while (!ignore) {
    if (!cbs.length) break;

    try {
      ignore = cbs.pop()(callbackArg) === false;
    } catch (e) {
      logger.error("Error occurred in " + callbackType + " callback, continuing anyway\u2026");
      logger.error(e);
    }
  }

  return ignore;
};

var _$pad_29 = function pad(num, size) {
  var s = '000000000' + num;
  return s.substr(s.length - size);
};

/* removed: var _$pad_29 = require('./pad.js'); */;

var env = typeof window === 'object' ? window : self;
var globalCount = 0;

for (var prop in env) {
  if (Object.hasOwnProperty.call(env, prop)) globalCount++;
}

var mimeTypesLength = navigator.mimeTypes ? navigator.mimeTypes.length : 0;
var clientId = _$pad_29((mimeTypesLength + navigator.userAgent.length).toString(36) + globalCount.toString(36), 4);

var _$fingerprint_28 = function fingerprint() {
  return clientId;
};

/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */
/* removed: var _$fingerprint_28 = require('./lib/fingerprint.js'); */;

/* removed: var _$pad_29 = require('./lib/pad.js'); */;

var c = 0,
    blockSize = 4,
    base = 36,
    discreteValues = Math.pow(base, blockSize);

function randomBlock() {
  return _$pad_29((Math.random() * discreteValues << 0).toString(base), blockSize);
}

function safeCounter() {
  c = c < discreteValues ? c : 0;
  c++; // this is not subliminal

  return c - 1;
}

function cuid() {
  // Starting with a lowercase letter makes
  // it HTML element ID friendly.
  var letter = 'c',
      // hard-coded allows for sequential access
  // timestamp
  // warning: this exposes the exact date and time
  // that the uid was created.
  timestamp = new Date().getTime().toString(base),
      // Prevent same-machine collisions.
  counter = _$pad_29(safeCounter().toString(base), blockSize),
      // A few chars to generate distinct ids for different
  // clients (so different computers are far less
  // likely to generate the same id)
  print = _$fingerprint_28(),
      // Grab some more chars from Math.random()
  random = randomBlock() + randomBlock();
  return letter + timestamp + counter + print + random;
}

cuid.fingerprint = _$fingerprint_28;
var _$cuid_27 = cuid;

/* removed: var _$cuid_27 = require('@bugsnag/cuid'); */;

var Session = /*#__PURE__*/function () {
  function Session() {
    this.id = _$cuid_27();
    this.startedAt = new Date();
    this._handled = 0;
    this._unhandled = 0;
    this._user = {};
    this.app = {};
    this.device = {};
  }

  var _proto = Session.prototype;

  _proto.getUser = function getUser() {
    return this._user;
  };

  _proto.setUser = function setUser(id, email, name) {
    this._user = {
      id: id,
      email: email,
      name: name
    };
  };

  _proto.toJSON = function toJSON() {
    return {
      id: this.id,
      startedAt: this.startedAt,
      events: {
        handled: this._handled,
        unhandled: this._unhandled
      }
    };
  };

  _proto._track = function _track(event) {
    this[event._handledState.unhandled ? '_unhandled' : '_handled'] += 1;
  };

  return Session;
}();

var _$Session_35 = Session;

/* removed: var _$config_5 = require('./config'); */;

/* removed: var _$Event_6 = require('./event'); */;

/* removed: var _$Breadcrumb_3 = require('./breadcrumb'); */;

/* removed: var _$Session_35 = require('./session'); */;

/* removed: var _$map_16 = require('./lib/es-utils/map'); */;

/* removed: var _$includes_13 = require('./lib/es-utils/includes'); */;

/* removed: var _$filter_12 = require('./lib/es-utils/filter'); */;

/* removed: var _$reduce_17 = require('./lib/es-utils/reduce'); */;

/* removed: var _$keys_15 = require('./lib/es-utils/keys'); */;

/* removed: var _$assign_11 = require('./lib/es-utils/assign'); */;

/* removed: var _$callbackRunner_9 = require('./lib/callback-runner'); */;

/* removed: var _$metadataDelegate_22 = require('./lib/metadata-delegate'); */;

/* removed: var _$syncCallbackRunner_23 = require('./lib/sync-callback-runner'); */;

/* removed: var _$breadcrumbTypes_8 = require('./lib/breadcrumb-types'); */;

var __add_4 = _$featureFlagDelegate_18.add,
    __clear_4 = _$featureFlagDelegate_18.clear,
    __merge_4 = _$featureFlagDelegate_18.merge;

var noop = function () {};

var Client = /*#__PURE__*/function () {
  function Client(configuration, schema, internalPlugins, notifier) {
    var _this = this;

    if (schema === void 0) {
      schema = _$config_5.schema;
    }

    if (internalPlugins === void 0) {
      internalPlugins = [];
    }

    // notifier id
    this._notifier = notifier; // intialise opts and config

    this._config = {};
    this._schema = schema; // i/o

    this._delivery = {
      sendSession: noop,
      sendEvent: noop
    };
    this._logger = {
      debug: noop,
      info: noop,
      warn: noop,
      error: noop
    }; // plugins

    this._plugins = {}; // state

    this._breadcrumbs = [];
    this._session = null;
    this._metadata = {};
    this._featuresIndex = {};
    this._features = [];
    this._context = undefined;
    this._user = {}; // callbacks:
    //  e: onError
    //  s: onSession
    //  sp: onSessionPayload
    //  b: onBreadcrumb
    // (note these names are minified by hand because object
    // properties are not safe to minify automatically)

    this._cbs = {
      e: [],
      s: [],
      sp: [],
      b: []
    }; // expose internal constructors

    this.Client = Client;
    this.Event = _$Event_6;
    this.Breadcrumb = _$Breadcrumb_3;
    this.Session = _$Session_35;
    this._config = this._configure(configuration, internalPlugins);
    _$map_16(internalPlugins.concat(this._config.plugins), function (pl) {
      if (pl) _this._loadPlugin(pl);
    }); // when notify() is called we need to know how many frames are from our own source
    // this inital value is 1 not 0 because we wrap notify() to ensure it is always
    // bound to have the client as its `this` value – see below.

    this._depth = 1;
    var self = this;
    var notify = this.notify;

    this.notify = function () {
      return notify.apply(self, arguments);
    };
  }

  var _proto = Client.prototype;

  _proto.addMetadata = function addMetadata(section, keyOrObj, maybeVal) {
    return _$metadataDelegate_22.add(this._metadata, section, keyOrObj, maybeVal);
  };

  _proto.getMetadata = function getMetadata(section, key) {
    return _$metadataDelegate_22.get(this._metadata, section, key);
  };

  _proto.clearMetadata = function clearMetadata(section, key) {
    return _$metadataDelegate_22.clear(this._metadata, section, key);
  };

  _proto.addFeatureFlag = function addFeatureFlag(name, variant) {
    if (variant === void 0) {
      variant = null;
    }

    __add_4(this._features, this._featuresIndex, name, variant);
  };

  _proto.addFeatureFlags = function addFeatureFlags(featureFlags) {
    __merge_4(this._features, featureFlags, this._featuresIndex);
  };

  _proto.clearFeatureFlag = function clearFeatureFlag(name) {
    __clear_4(this._features, this._featuresIndex, name);
  };

  _proto.clearFeatureFlags = function clearFeatureFlags() {
    this._features = [];
    this._featuresIndex = {};
  };

  _proto.getContext = function getContext() {
    return this._context;
  };

  _proto.setContext = function setContext(c) {
    this._context = c;
  };

  _proto._configure = function _configure(opts, internalPlugins) {
    var schema = _$reduce_17(internalPlugins, function (schema, plugin) {
      if (plugin && plugin.configSchema) return _$assign_11({}, schema, plugin.configSchema);
      return schema;
    }, this._schema); // accumulate configuration and error messages

    var _reduce = _$reduce_17(_$keys_15(schema), function (accum, key) {
      var defaultValue = schema[key].defaultValue(opts[key]);

      if (opts[key] !== undefined) {
        var valid = schema[key].validate(opts[key]);

        if (!valid) {
          accum.errors[key] = schema[key].message;
          accum.config[key] = defaultValue;
        } else {
          if (schema[key].allowPartialObject) {
            accum.config[key] = _$assign_11(defaultValue, opts[key]);
          } else {
            accum.config[key] = opts[key];
          }
        }
      } else {
        accum.config[key] = defaultValue;
      }

      return accum;
    }, {
      errors: {},
      config: {}
    }),
        errors = _reduce.errors,
        config = _reduce.config;

    if (schema.apiKey) {
      // missing api key is the only fatal error
      if (!config.apiKey) throw new Error('No Bugsnag API Key set'); // warn about an apikey that is not of the expected format

      if (!/^[0-9a-f]{32}$/i.test(config.apiKey)) errors.apiKey = 'should be a string of 32 hexadecimal characters';
    } // update and elevate some options


    this._metadata = _$assign_11({}, config.metadata);
    __merge_4(this._features, config.featureFlags, this._featuresIndex);
    this._user = _$assign_11({}, config.user);
    this._context = config.context;
    if (config.logger) this._logger = config.logger; // add callbacks

    if (config.onError) this._cbs.e = this._cbs.e.concat(config.onError);
    if (config.onBreadcrumb) this._cbs.b = this._cbs.b.concat(config.onBreadcrumb);
    if (config.onSession) this._cbs.s = this._cbs.s.concat(config.onSession); // finally warn about any invalid config where we fell back to the default

    if (_$keys_15(errors).length) {
      this._logger.warn(generateConfigErrorMessage(errors, opts));
    }

    return config;
  };

  _proto.getUser = function getUser() {
    return this._user;
  };

  _proto.setUser = function setUser(id, email, name) {
    this._user = {
      id: id,
      email: email,
      name: name
    };
  };

  _proto._loadPlugin = function _loadPlugin(plugin) {
    var result = plugin.load(this); // JS objects are not the safest way to store arbitrarily keyed values,
    // so bookend the key with some characters that prevent tampering with
    // stuff like __proto__ etc. (only store the result if the plugin had a
    // name)

    if (plugin.name) this._plugins["~" + plugin.name + "~"] = result;
    return this;
  };

  _proto.getPlugin = function getPlugin(name) {
    return this._plugins["~" + name + "~"];
  };

  _proto._setDelivery = function _setDelivery(d) {
    this._delivery = d(this);
  };

  _proto.startSession = function startSession() {
    var session = new _$Session_35();
    session.app.releaseStage = this._config.releaseStage;
    session.app.version = this._config.appVersion;
    session.app.type = this._config.appType;
    session._user = _$assign_11({}, this._user); // run onSession callbacks

    var ignore = _$syncCallbackRunner_23(this._cbs.s, session, 'onSession', this._logger);

    if (ignore) {
      this._logger.debug('Session not started due to onSession callback');

      return this;
    }

    return this._sessionDelegate.startSession(this, session);
  };

  _proto.addOnError = function addOnError(fn, front) {
    if (front === void 0) {
      front = false;
    }

    this._cbs.e[front ? 'unshift' : 'push'](fn);
  };

  _proto.removeOnError = function removeOnError(fn) {
    this._cbs.e = _$filter_12(this._cbs.e, function (f) {
      return f !== fn;
    });
  };

  _proto._addOnSessionPayload = function _addOnSessionPayload(fn) {
    this._cbs.sp.push(fn);
  };

  _proto.addOnSession = function addOnSession(fn) {
    this._cbs.s.push(fn);
  };

  _proto.removeOnSession = function removeOnSession(fn) {
    this._cbs.s = _$filter_12(this._cbs.s, function (f) {
      return f !== fn;
    });
  };

  _proto.addOnBreadcrumb = function addOnBreadcrumb(fn, front) {
    if (front === void 0) {
      front = false;
    }

    this._cbs.b[front ? 'unshift' : 'push'](fn);
  };

  _proto.removeOnBreadcrumb = function removeOnBreadcrumb(fn) {
    this._cbs.b = _$filter_12(this._cbs.b, function (f) {
      return f !== fn;
    });
  };

  _proto.pauseSession = function pauseSession() {
    return this._sessionDelegate.pauseSession(this);
  };

  _proto.resumeSession = function resumeSession() {
    return this._sessionDelegate.resumeSession(this);
  };

  _proto.leaveBreadcrumb = function leaveBreadcrumb(message, metadata, type) {
    // coerce bad values so that the defaults get set
    message = typeof message === 'string' ? message : '';
    type = typeof type === 'string' && _$includes_13(_$breadcrumbTypes_8, type) ? type : 'manual';
    metadata = typeof metadata === 'object' && metadata !== null ? metadata : {}; // if no message, discard

    if (!message) return;
    var crumb = new _$Breadcrumb_3(message, metadata, type); // run onBreadcrumb callbacks

    var ignore = _$syncCallbackRunner_23(this._cbs.b, crumb, 'onBreadcrumb', this._logger);

    if (ignore) {
      this._logger.debug('Breadcrumb not attached due to onBreadcrumb callback');

      return;
    } // push the valid crumb onto the queue and maintain the length


    this._breadcrumbs.push(crumb);

    if (this._breadcrumbs.length > this._config.maxBreadcrumbs) {
      this._breadcrumbs = this._breadcrumbs.slice(this._breadcrumbs.length - this._config.maxBreadcrumbs);
    }
  };

  _proto._isBreadcrumbTypeEnabled = function _isBreadcrumbTypeEnabled(type) {
    var types = this._config.enabledBreadcrumbTypes;
    return types === null || _$includes_13(types, type);
  };

  _proto.notify = function notify(maybeError, onError, postReportCallback) {
    if (postReportCallback === void 0) {
      postReportCallback = noop;
    }

    var event = _$Event_6.create(maybeError, true, undefined, 'notify()', this._depth + 1, this._logger);

    this._notify(event, onError, postReportCallback);
  };

  _proto._notify = function _notify(event, onError, postReportCallback) {
    var _this2 = this;

    if (postReportCallback === void 0) {
      postReportCallback = noop;
    }

    event.app = _$assign_11({}, event.app, {
      releaseStage: this._config.releaseStage,
      version: this._config.appVersion,
      type: this._config.appType
    });
    event.context = event.context || this._context;
    event._metadata = _$assign_11({}, event._metadata, this._metadata);
    event._user = _$assign_11({}, event._user, this._user);
    event.breadcrumbs = this._breadcrumbs.slice();
    __merge_4(event._features, this._features, event._featuresIndex); // exit early if events should not be sent on the current releaseStage

    if (this._config.enabledReleaseStages !== null && !_$includes_13(this._config.enabledReleaseStages, this._config.releaseStage)) {
      this._logger.warn('Event not sent due to releaseStage/enabledReleaseStages configuration');

      return postReportCallback(null, event);
    }

    var originalSeverity = event.severity;

    var onCallbackError = function (err) {
      // errors in callbacks are tolerated but we want to log them out
      _this2._logger.error('Error occurred in onError callback, continuing anyway…');

      _this2._logger.error(err);
    };

    var callbacks = [].concat(this._cbs.e).concat(onError);
    _$callbackRunner_9(callbacks, event, onCallbackError, function (err, shouldSend) {
      if (err) onCallbackError(err);

      if (!shouldSend) {
        _this2._logger.debug('Event not sent due to onError callback');

        return postReportCallback(null, event);
      }

      if (_this2._isBreadcrumbTypeEnabled('error')) {
        // only leave a crumb for the error if actually got sent
        Client.prototype.leaveBreadcrumb.call(_this2, event.errors[0].errorClass, {
          errorClass: event.errors[0].errorClass,
          errorMessage: event.errors[0].errorMessage,
          severity: event.severity
        }, 'error');
      }

      if (originalSeverity !== event.severity) {
        event._handledState.severityReason = {
          type: 'userCallbackSetSeverity'
        };
      }

      if (event.unhandled !== event._handledState.unhandled) {
        event._handledState.severityReason.unhandledOverridden = true;
        event._handledState.unhandled = event.unhandled;
      }

      if (_this2._session) {
        _this2._session._track(event);

        event._session = _this2._session;
      }

      _this2._delivery.sendEvent({
        apiKey: event.apiKey || _this2._config.apiKey,
        notifier: _this2._notifier,
        events: [event]
      }, function (err) {
        return postReportCallback(err, event);
      });
    });
  };

  return Client;
}();

var generateConfigErrorMessage = function (errors, rawInput) {
  var er = new Error("Invalid configuration\n" + _$map_16(_$keys_15(errors), function (key) {
    return "  - " + key + " " + errors[key] + ", got " + stringify(rawInput[key]);
  }).join('\n\n'));
  return er;
};

var stringify = function (val) {
  switch (typeof val) {
    case 'string':
    case 'number':
    case 'object':
      return JSON.stringify(val);

    default:
      return String(val);
  }
};

var _$Client_4 = Client;

var _$jsonPayload_21 = {};
/* removed: var _$safeJsonStringify_30 = require('@bugsnag/safe-json-stringify'); */;

var EVENT_REDACTION_PATHS = ['events.[].metaData', 'events.[].breadcrumbs.[].metaData', 'events.[].request'];

_$jsonPayload_21.event = function (event, redactedKeys) {
  var payload = _$safeJsonStringify_30(event, null, null, {
    redactedPaths: EVENT_REDACTION_PATHS,
    redactedKeys: redactedKeys
  });

  if (payload.length > 10e5) {
    event.events[0]._metadata = {
      notifier: "WARNING!\nSerialized payload was " + payload.length / 10e5 + "MB (limit = 1MB)\nmetadata was removed"
    };
    payload = _$safeJsonStringify_30(event, null, null, {
      redactedPaths: EVENT_REDACTION_PATHS,
      redactedKeys: redactedKeys
    });
  }

  return payload;
};

_$jsonPayload_21.session = function (session, redactedKeys) {
  var payload = _$safeJsonStringify_30(session, null, null);
  return payload;
};

var _$delivery_36 = {};
/* removed: var _$jsonPayload_21 = require('@bugsnag/core/lib/json-payload'); */;

_$delivery_36 = function (client, win) {
  if (win === void 0) {
    win = window;
  }

  return {
    sendEvent: function (event, cb) {
      if (cb === void 0) {
        cb = function () {};
      }

      var url = getApiUrl(client._config, 'notify', '4', win);
      var body = _$jsonPayload_21.event(event, client._config.redactedKeys);
      var req = new win.XDomainRequest();

      req.onload = function () {
        cb(null);
      };

      req.onerror = function () {
        var err = new Error('Event failed to send');

        client._logger.error('Event failed to send…', err);

        if (body.length > 10e5) {
          client._logger.warn("Event oversized (" + (body.length / 10e5).toFixed(2) + " MB)");
        }

        cb(err);
      };

      req.open('POST', url);
      setTimeout(function () {
        try {
          req.send(body);
        } catch (e) {
          client._logger.error(e);

          cb(e);
        }
      }, 0);
    },
    sendSession: function (session, cb) {
      if (cb === void 0) {
        cb = function () {};
      }

      var url = getApiUrl(client._config, 'sessions', '1', win);
      var req = new win.XDomainRequest();

      req.onload = function () {
        cb(null);
      };

      req.open('POST', url);
      setTimeout(function () {
        try {
          req.send(_$jsonPayload_21.session(session, client._config.redactedKeys));
        } catch (e) {
          client._logger.error(e);

          cb(e);
        }
      }, 0);
    }
  };
};

var getApiUrl = function (config, endpoint, version, win) {
  // IE8 doesn't support Date.prototype.toISOstring(), but it does convert a date
  // to an ISO string when you use JSON stringify. Simply parsing the result of
  // JSON.stringify is smaller than using a toISOstring() polyfill.
  var isoDate = JSON.parse(JSON.stringify(new Date()));
  var url = matchPageProtocol(config.endpoints[endpoint], win.location.protocol);
  return url + "?apiKey=" + encodeURIComponent(config.apiKey) + "&payloadVersion=" + version + "&sentAt=" + encodeURIComponent(isoDate);
};

var matchPageProtocol = _$delivery_36._matchPageProtocol = function (endpoint, pageProtocol) {
  return pageProtocol === 'http:' ? endpoint.replace(/^https:/, 'http:') : endpoint;
};

/* removed: var _$jsonPayload_21 = require('@bugsnag/core/lib/json-payload'); */;

var _$delivery_37 = function (client, win) {
  if (win === void 0) {
    win = window;
  }

  return {
    sendEvent: function (event, cb) {
      if (cb === void 0) {
        cb = function () {};
      }

      try {
        var url = client._config.endpoints.notify;
        var req = new win.XMLHttpRequest();
        var body = _$jsonPayload_21.event(event, client._config.redactedKeys);

        req.onreadystatechange = function () {
          if (req.readyState === win.XMLHttpRequest.DONE) {
            var status = req.status;

            if (status === 0 || status >= 400) {
              var err = new Error("Request failed with status " + status);

              client._logger.error('Event failed to send…', err);

              if (body.length > 10e5) {
                client._logger.warn("Event oversized (" + (body.length / 10e5).toFixed(2) + " MB)");
              }

              cb(err);
            } else {
              cb(null);
            }
          }
        };

        req.open('POST', url);
        req.setRequestHeader('Content-Type', 'application/json');
        req.setRequestHeader('Bugsnag-Api-Key', event.apiKey || client._config.apiKey);
        req.setRequestHeader('Bugsnag-Payload-Version', '4');
        req.setRequestHeader('Bugsnag-Sent-At', new Date().toISOString());
        req.send(body);
      } catch (e) {
        client._logger.error(e);
      }
    },
    sendSession: function (session, cb) {
      if (cb === void 0) {
        cb = function () {};
      }

      try {
        var url = client._config.endpoints.sessions;
        var req = new win.XMLHttpRequest();

        req.onreadystatechange = function () {
          if (req.readyState === win.XMLHttpRequest.DONE) {
            var status = req.status;

            if (status === 0 || status >= 400) {
              var err = new Error("Request failed with status " + status);

              client._logger.error('Session failed to send…', err);

              cb(err);
            } else {
              cb(null);
            }
          }
        };

        req.open('POST', url);
        req.setRequestHeader('Content-Type', 'application/json');
        req.setRequestHeader('Bugsnag-Api-Key', client._config.apiKey);
        req.setRequestHeader('Bugsnag-Payload-Version', '1');
        req.setRequestHeader('Bugsnag-Sent-At', new Date().toISOString());
        req.send(_$jsonPayload_21.session(session, client._config.redactedKeys));
      } catch (e) {
        client._logger.error(e);
      }
    }
  };
};

var appStart = new Date();

var reset = function () {
  appStart = new Date();
};

var _$app_38 = {
  name: 'appDuration',
  load: function (client) {
    client.addOnError(function (event) {
      var now = new Date();
      event.app.duration = now - appStart;
    }, true);
    return {
      reset: reset
    };
  }
};

/*
 * Sets the default context to be the current URL
 */
var _$context_39 = function (win) {
  if (win === void 0) {
    win = window;
  }

  return {
    load: function (client) {
      client.addOnError(function (event) {
        if (event.context !== undefined) return;
        event.context = win.location.pathname;
      }, true);
    }
  };
};

var _$pad_43 = function pad(num, size) {
  var s = '000000000' + num;
  return s.substr(s.length - size);
};

/* removed: var _$pad_43 = require('./pad.js'); */;

var __env_42 = typeof window === 'object' ? window : self;
var __globalCount_42 = 0;

for (var __prop_42 in __env_42) {
  if (Object.hasOwnProperty.call(__env_42, __prop_42)) __globalCount_42++;
}

var __mimeTypesLength_42 = navigator.mimeTypes ? navigator.mimeTypes.length : 0;
var __clientId_42 = _$pad_43((__mimeTypesLength_42 + navigator.userAgent.length).toString(36) + __globalCount_42.toString(36), 4);

var _$fingerprint_42 = function fingerprint() {
  return __clientId_42;
};

/**
 * cuid.js
 * Collision-resistant UID generator for browsers and node.
 * Sequential for fast db lookups and recency sorting.
 * Safe for element IDs and server-side lookups.
 *
 * Extracted from CLCTR
 *
 * Copyright (c) Eric Elliott 2012
 * MIT License
 */
/* removed: var _$fingerprint_42 = require('./lib/fingerprint.js'); */;

/* removed: var _$pad_43 = require('./lib/pad.js'); */;

var __c_41 = 0,
    __blockSize_41 = 4,
    __base_41 = 36,
    __discreteValues_41 = Math.pow(__base_41, __blockSize_41);

function __randomBlock_41() {
  return _$pad_43((Math.random() * __discreteValues_41 << 0).toString(__base_41), __blockSize_41);
}

function __safeCounter_41() {
  __c_41 = __c_41 < __discreteValues_41 ? __c_41 : 0;
  __c_41++; // this is not subliminal

  return __c_41 - 1;
}

function __cuid_41() {
  // Starting with a lowercase letter makes
  // it HTML element ID friendly.
  var letter = 'c',
      // hard-coded allows for sequential access
  // timestamp
  // warning: this exposes the exact date and time
  // that the uid was created.
  timestamp = new Date().getTime().toString(__base_41),
      // Prevent same-machine collisions.
  counter = _$pad_43(__safeCounter_41().toString(__base_41), __blockSize_41),
      // A few chars to generate distinct ids for different
  // clients (so different computers are far less
  // likely to generate the same id)
  print = _$fingerprint_42(),
      // Grab some more chars from Math.random()
  random = __randomBlock_41() + __randomBlock_41();
  return letter + timestamp + counter + print + random;
}

__cuid_41.fingerprint = _$fingerprint_42;
var _$cuid_41 = __cuid_41;

/* removed: var _$assign_11 = require('@bugsnag/core/lib/es-utils/assign'); */;

var BUGSNAG_ANONYMOUS_ID_KEY = 'bugsnag-anonymous-id';

var getDeviceId = function (win) {
  try {
    var storage = win.localStorage;
    var id = storage.getItem(BUGSNAG_ANONYMOUS_ID_KEY); // If we get an ID, make sure it looks like a valid cuid. The length can
    // fluctuate slightly, so some leeway is built in

    if (id && /^c[a-z0-9]{20,32}$/.test(id)) {
      return id;
    }

    /* removed: var _$cuid_41 = require('@bugsnag/cuid'); */;

    id = _$cuid_41();
    storage.setItem(BUGSNAG_ANONYMOUS_ID_KEY, id);
    return id;
  } catch (err) {// If localStorage is not available (e.g. because it's disabled) then give up
  }
};
/*
 * Automatically detects browser device details
 */


var _$device_40 = function (nav, win) {
  if (nav === void 0) {
    nav = navigator;
  }

  if (win === void 0) {
    win = window;
  }

  return {
    load: function (client) {
      var device = {
        locale: nav.browserLanguage || nav.systemLanguage || nav.userLanguage || nav.language,
        userAgent: nav.userAgent
      };

      if (win && win.screen && win.screen.orientation && win.screen.orientation.type) {
        device.orientation = win.screen.orientation.type;
      } else if (win && win.document) {
        device.orientation = win.document.documentElement.clientWidth > win.document.documentElement.clientHeight ? 'landscape' : 'portrait';
      }

      if (client._config.generateAnonymousId) {
        device.id = getDeviceId(win);
      }

      client.addOnSession(function (session) {
        session.device = _$assign_11({}, session.device, device); // only set device id if collectUserIp is false

        if (!client._config.collectUserIp) setDefaultUserId(session);
      }); // add time just as the event is sent

      client.addOnError(function (event) {
        event.device = _$assign_11({}, event.device, device, {
          time: new Date()
        });
        if (!client._config.collectUserIp) setDefaultUserId(event);
      }, true);
    },
    configSchema: {
      generateAnonymousId: {
        validate: function (value) {
          return value === true || value === false;
        },
        defaultValue: function () {
          return true;
        },
        message: 'should be true|false'
      }
    }
  };
};

var setDefaultUserId = function (eventOrSession) {
  // device id is also used to populate the user id field, if it's not already set
  var user = eventOrSession.getUser();

  if (!user || !user.id) {
    eventOrSession.setUser(eventOrSession.device.id);
  }
};

/* removed: var _$assign_11 = require('@bugsnag/core/lib/es-utils/assign'); */;
/*
 * Sets the event request: { url } to be the current href
 */


var _$request_44 = function (win) {
  if (win === void 0) {
    win = window;
  }

  return {
    load: function (client) {
      client.addOnError(function (event) {
        if (event.request && event.request.url) return;
        event.request = _$assign_11({}, event.request, {
          url: win.location.href
        });
      }, true);
    }
  };
};

/* removed: var _$includes_13 = require('@bugsnag/core/lib/es-utils/includes'); */;

var _$session_45 = {
  load: function (client) {
    client._sessionDelegate = sessionDelegate;
  }
};
var sessionDelegate = {
  startSession: function (client, session) {
    var sessionClient = client;
    sessionClient._session = session;
    sessionClient._pausedSession = null; // exit early if the current releaseStage is not enabled

    if (sessionClient._config.enabledReleaseStages !== null && !_$includes_13(sessionClient._config.enabledReleaseStages, sessionClient._config.releaseStage)) {
      sessionClient._logger.warn('Session not sent due to releaseStage/enabledReleaseStages configuration');

      return sessionClient;
    }

    sessionClient._delivery.sendSession({
      notifier: sessionClient._notifier,
      device: session.device,
      app: session.app,
      sessions: [{
        id: session.id,
        startedAt: session.startedAt,
        user: session._user
      }]
    });

    return sessionClient;
  },
  resumeSession: function (client) {
    // Do nothing if there's already an active session
    if (client._session) {
      return client;
    } // If we have a paused session then make it the active session


    if (client._pausedSession) {
      client._session = client._pausedSession;
      client._pausedSession = null;
      return client;
    } // Otherwise start a new session


    return client.startSession();
  },
  pauseSession: function (client) {
    client._pausedSession = client._session;
    client._session = null;
  }
};

/* removed: var _$assign_11 = require('@bugsnag/core/lib/es-utils/assign'); */;
/*
 * Prevent collection of user IPs
 */


var _$clientIp_46 = {
  load: function (client) {
    if (client._config.collectUserIp) return;
    client.addOnError(function (event) {
      // If user.id is explicitly undefined, it will be missing from the payload. It needs
      // removing so that the following line replaces it
      if (event._user && typeof event._user.id === 'undefined') delete event._user.id;
      event._user = _$assign_11({
        id: '[REDACTED]'
      }, event._user);
      event.request = _$assign_11({
        clientIp: '[REDACTED]'
      }, event.request);
    });
  },
  configSchema: {
    collectUserIp: {
      defaultValue: function () {
        return true;
      },
      message: 'should be true|false',
      validate: function (value) {
        return value === true || value === false;
      }
    }
  }
};

var _$consoleBreadcrumbs_47 = {};
/* removed: var _$map_16 = require('@bugsnag/core/lib/es-utils/map'); */;

/* removed: var _$reduce_17 = require('@bugsnag/core/lib/es-utils/reduce'); */;

/* removed: var _$filter_12 = require('@bugsnag/core/lib/es-utils/filter'); */;
/*
 * Leaves breadcrumbs when console log methods are called
 */


_$consoleBreadcrumbs_47.load = function (client) {
  var isDev = /^(local-)?dev(elopment)?$/.test(client._config.releaseStage);
  if (isDev || !client._isBreadcrumbTypeEnabled('log')) return;
  _$map_16(CONSOLE_LOG_METHODS, function (method) {
    var original = console[method];

    console[method] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      client.leaveBreadcrumb('Console output', _$reduce_17(args, function (accum, arg, i) {
        // do the best/simplest stringification of each argument
        var stringified = '[Unknown value]'; // this may fail if the input is:
        // - an object whose [[Prototype]] is null (no toString)
        // - an object with a broken toString or @@toPrimitive implementation

        try {
          stringified = String(arg);
        } catch (e) {} // if it stringifies to [object Object] attempt to JSON stringify


        if (stringified === '[object Object]') {
          // catch stringify errors and fallback to [object Object]
          try {
            stringified = JSON.stringify(arg);
          } catch (e) {}
        }

        accum["[" + i + "]"] = stringified;
        return accum;
      }, {
        severity: method.indexOf('group') === 0 ? 'log' : method
      }), 'log');
      original.apply(console, args);
    };

    console[method]._restore = function () {
      console[method] = original;
    };
  });
};

if ("production" !== 'production') {
  _$consoleBreadcrumbs_47.destroy = function () {
    return CONSOLE_LOG_METHODS.forEach(function (method) {
      if (typeof console[method]._restore === 'function') console[method]._restore();
    });
  };
}

var CONSOLE_LOG_METHODS = _$filter_12(['log', 'debug', 'info', 'warn', 'error'], function (method) {
  return typeof console !== 'undefined' && typeof console[method] === 'function';
});

/* removed: var _$map_16 = require('@bugsnag/core/lib/es-utils/map'); */;

/* removed: var _$reduce_17 = require('@bugsnag/core/lib/es-utils/reduce'); */;

/* removed: var _$filter_12 = require('@bugsnag/core/lib/es-utils/filter'); */;

var MAX_LINE_LENGTH = 200;
var MAX_SCRIPT_LENGTH = 500000;

var _$inlineScriptContent_48 = function (doc, win) {
  if (doc === void 0) {
    doc = document;
  }

  if (win === void 0) {
    win = window;
  }

  return {
    load: function (client) {
      if (!client._config.trackInlineScripts) return;
      var originalLocation = win.location.href;
      var html = ''; // in IE8-10 the 'interactive' state can fire too soon (before scripts have finished executing), so in those
      // we wait for the 'complete' state before assuming that synchronous scripts are no longer executing

      var isOldIe = !!doc.attachEvent;
      var DOMContentLoaded = isOldIe ? doc.readyState === 'complete' : doc.readyState !== 'loading';

      var getHtml = function () {
        return doc.documentElement.outerHTML;
      }; // get whatever HTML exists at this point in time


      html = getHtml();
      var prev = doc.onreadystatechange; // then update it when the DOM content has loaded

      doc.onreadystatechange = function () {
        // IE8 compatible alternative to document#DOMContentLoaded
        if (doc.readyState === 'interactive') {
          html = getHtml();
          DOMContentLoaded = true;
        }

        try {
          prev.apply(this, arguments);
        } catch (e) {}
      };

      var _lastScript = null;

      var updateLastScript = function (script) {
        _lastScript = script;
      };

      var getCurrentScript = function () {
        var script = doc.currentScript || _lastScript;

        if (!script && !DOMContentLoaded) {
          var scripts = doc.scripts || doc.getElementsByTagName('script');
          script = scripts[scripts.length - 1];
        }

        return script;
      };

      var addSurroundingCode = function (lineNumber) {
        // get whatever html has rendered at this point
        if (!DOMContentLoaded || !html) html = getHtml(); // simulate the raw html

        var htmlLines = ['<!-- DOC START -->'].concat(html.split('\n'));
        var zeroBasedLine = lineNumber - 1;
        var start = Math.max(zeroBasedLine - 3, 0);
        var end = Math.min(zeroBasedLine + 3, htmlLines.length);
        return _$reduce_17(htmlLines.slice(start, end), function (accum, line, i) {
          accum[start + 1 + i] = line.length <= MAX_LINE_LENGTH ? line : line.substr(0, MAX_LINE_LENGTH);
          return accum;
        }, {});
      };

      client.addOnError(function (event) {
        // remove any of our own frames that may be part the stack this
        // happens before the inline script check as it happens for all errors
        event.errors[0].stacktrace = _$filter_12(event.errors[0].stacktrace, function (f) {
          return !/__trace__$/.test(f.method);
        });
        var frame = event.errors[0].stacktrace[0]; // if frame.file exists and is not the original location of the page, this can't be an inline script

        if (frame && frame.file && frame.file.replace(/#.*$/, '') !== originalLocation.replace(/#.*$/, '')) return; // grab the last script known to have run

        var currentScript = getCurrentScript();

        if (currentScript) {
          var content = currentScript.innerHTML;
          event.addMetadata('script', 'content', content.length <= MAX_SCRIPT_LENGTH ? content : content.substr(0, MAX_SCRIPT_LENGTH)); // only attempt to grab some surrounding code if we have a line number

          if (frame && frame.lineNumber) {
            frame.code = addSurroundingCode(frame.lineNumber);
          }
        }
      }, true); // Proxy all the timer functions whose callback is their 0th argument.
      // Keep a reference to the original setTimeout because we need it later

      var _map = _$map_16(['setTimeout', 'setInterval', 'setImmediate', 'requestAnimationFrame'], function (fn) {
        return __proxy(win, fn, function (original) {
          return __traceOriginalScript(original, function (args) {
            return {
              get: function () {
                return args[0];
              },
              replace: function (fn) {
                args[0] = fn;
              }
            };
          });
        });
      }),
          _setTimeout = _map[0]; // Proxy all the host objects whose prototypes have an addEventListener function


      _$map_16(['EventTarget', 'Window', 'Node', 'ApplicationCache', 'AudioTrackList', 'ChannelMergerNode', 'CryptoOperation', 'EventSource', 'FileReader', 'HTMLUnknownElement', 'IDBDatabase', 'IDBRequest', 'IDBTransaction', 'KeyOperation', 'MediaController', 'MessagePort', 'ModalWindow', 'Notification', 'SVGElementInstance', 'Screen', 'TextTrack', 'TextTrackCue', 'TextTrackList', 'WebSocket', 'WebSocketWorker', 'Worker', 'XMLHttpRequest', 'XMLHttpRequestEventTarget', 'XMLHttpRequestUpload'], function (o) {
        if (!win[o] || !win[o].prototype || !Object.prototype.hasOwnProperty.call(win[o].prototype, 'addEventListener')) return;

        __proxy(win[o].prototype, 'addEventListener', function (original) {
          return __traceOriginalScript(original, eventTargetCallbackAccessor);
        });

        __proxy(win[o].prototype, 'removeEventListener', function (original) {
          return __traceOriginalScript(original, eventTargetCallbackAccessor, true);
        });
      });

      function __traceOriginalScript(fn, callbackAccessor, alsoCallOriginal) {
        if (alsoCallOriginal === void 0) {
          alsoCallOriginal = false;
        }

        return function () {
          // this is required for removeEventListener to remove anything added with
          // addEventListener before the functions started being wrapped by Bugsnag
          var args = [].slice.call(arguments);

          try {
            var cba = callbackAccessor(args);
            var cb = cba.get();
            if (alsoCallOriginal) fn.apply(this, args);
            if (typeof cb !== 'function') return fn.apply(this, args);

            if (cb.__trace__) {
              cba.replace(cb.__trace__);
            } else {
              var script = getCurrentScript(); // this function mustn't be annonymous due to a bug in the stack
              // generation logic, meaning it gets tripped up
              // see: https://github.com/stacktracejs/stack-generator/issues/6

              cb.__trace__ = function __trace__() {
                // set the script that called this function
                updateLastScript(script); // immediately unset the currentScript synchronously below, however
                // if this cb throws an error the line after will not get run so schedule
                // an almost-immediate aysnc update too

                _setTimeout(function () {
                  updateLastScript(null);
                }, 0);

                var ret = cb.apply(this, arguments);
                updateLastScript(null);
                return ret;
              };

              cb.__trace__.__trace__ = cb.__trace__;
              cba.replace(cb.__trace__);
            }
          } catch (e) {// swallow these errors on Selenium:
            // Permission denied to access property '__trace__'
            // WebDriverException: Message: Permission denied to access property "handleEvent"
          } // IE8 doesn't let you call .apply() on setTimeout/setInterval


          if (fn.apply) return fn.apply(this, args);

          switch (args.length) {
            case 1:
              return fn(args[0]);

            case 2:
              return fn(args[0], args[1]);

            default:
              return fn();
          }
        };
      }
    },
    configSchema: {
      trackInlineScripts: {
        validate: function (value) {
          return value === true || value === false;
        },
        defaultValue: function () {
          return true;
        },
        message: 'should be true|false'
      }
    }
  };
};

function __proxy(host, name, replacer) {
  var original = host[name];
  if (!original) return original;
  var replacement = replacer(original);
  host[name] = replacement;
  return original;
}

function eventTargetCallbackAccessor(args) {
  var isEventHandlerObj = !!args[1] && typeof args[1].handleEvent === 'function';
  return {
    get: function () {
      return isEventHandlerObj ? args[1].handleEvent : args[1];
    },
    replace: function (fn) {
      if (isEventHandlerObj) {
        args[1].handleEvent = fn;
      } else {
        args[1] = fn;
      }
    }
  };
}

/*
 * Leaves breadcrumbs when the user interacts with the DOM
 */
var _$interactionBreadcrumbs_49 = function (win) {
  if (win === void 0) {
    win = window;
  }

  return {
    load: function (client) {
      if (!('addEventListener' in win)) return;
      if (!client._isBreadcrumbTypeEnabled('user')) return;
      win.addEventListener('click', function (event) {
        var targetText, targetSelector;

        try {
          targetText = getNodeText(event.target);
          targetSelector = getNodeSelector(event.target, win);
        } catch (e) {
          targetText = '[hidden]';
          targetSelector = '[hidden]';

          client._logger.error('Cross domain error when tracking click event. See docs: https://tinyurl.com/yy3rn63z');
        }

        client.leaveBreadcrumb('UI click', {
          targetText: targetText,
          targetSelector: targetSelector
        }, 'user');
      }, true);
    }
  };
};

var trimStart = /^\s+/;
var trimEnd = /(^|[^\s])\s+$/;

function getNodeText(el) {
  var text = el.textContent || el.innerText || '';

  if (!text && (el.type === 'submit' || el.type === 'button')) {
    text = el.value;
  }

  text = text.replace(trimStart, '').replace(trimEnd, '$1');

  if (text.length > 140) {
    return text.slice(0, 135) + '(...)';
  }

  return text;
} // Create a label from tagname, id and css class of the element


function getNodeSelector(el, win) {
  var parts = [el.tagName];
  if (el.id) parts.push('#' + el.id);
  if (el.className && el.className.length) parts.push("." + el.className.split(' ').join('.')); // Can't get much more advanced with the current browser

  if (!win.document.querySelectorAll || !Array.prototype.indexOf) return parts.join('');

  try {
    if (win.document.querySelectorAll(parts.join('')).length === 1) return parts.join('');
  } catch (e) {
    // Sometimes the query selector can be invalid just return it as-is
    return parts.join('');
  } // try to get a more specific selector if this one matches more than one element


  if (el.parentNode.childNodes.length > 1) {
    var index = Array.prototype.indexOf.call(el.parentNode.childNodes, el) + 1;
    parts.push(":nth-child(" + index + ")");
  }

  if (win.document.querySelectorAll(parts.join('')).length === 1) return parts.join(''); // try prepending the parent node selector

  if (el.parentNode) return getNodeSelector(el.parentNode, win) + " > " + parts.join('');
  return parts.join('');
}

var _$navigationBreadcrumbs_50 = {};
/*
* Leaves breadcrumbs when navigation methods are called or events are emitted
*/
_$navigationBreadcrumbs_50 = function (win) {
  if (win === void 0) {
    win = window;
  }

  var plugin = {
    load: function (client) {
      if (!('addEventListener' in win)) return;
      if (!client._isBreadcrumbTypeEnabled('navigation')) return; // returns a function that will drop a breadcrumb with a given name

      var drop = function (name) {
        return function () {
          return client.leaveBreadcrumb(name, {}, 'navigation');
        };
      }; // simple drops – just names, no meta


      win.addEventListener('pagehide', drop('Page hidden'), true);
      win.addEventListener('pageshow', drop('Page shown'), true);
      win.addEventListener('load', drop('Page loaded'), true);
      win.document.addEventListener('DOMContentLoaded', drop('DOMContentLoaded'), true); // some browsers like to emit popstate when the page loads, so only add the popstate listener after that

      win.addEventListener('load', function () {
        return win.addEventListener('popstate', drop('Navigated back'), true);
      }); // hashchange has some metadata that we care about

      win.addEventListener('hashchange', function (event) {
        var metadata = event.oldURL ? {
          from: relativeLocation(event.oldURL, win),
          to: relativeLocation(event.newURL, win),
          state: getCurrentState(win)
        } : {
          to: relativeLocation(win.location.href, win)
        };
        client.leaveBreadcrumb('Hash changed', metadata, 'navigation');
      }, true); // the only way to know about replaceState/pushState is to wrap them… >_<

      if (win.history.replaceState) wrapHistoryFn(client, win.history, 'replaceState', win);
      if (win.history.pushState) wrapHistoryFn(client, win.history, 'pushState', win);
    }
  };

  if ("production" !== 'production') {
    plugin.destroy = function (win) {
      if (win === void 0) {
        win = window;
      }

      win.history.replaceState._restore();

      win.history.pushState._restore();
    };
  }

  return plugin;
};

if ("production" !== 'production') {
  _$navigationBreadcrumbs_50.destroy = function (win) {
    if (win === void 0) {
      win = window;
    }

    win.history.replaceState._restore();

    win.history.pushState._restore();
  };
} // takes a full url like http://foo.com:1234/pages/01.html?yes=no#section-2 and returns
// just the path and hash parts, e.g. /pages/01.html?yes=no#section-2


var relativeLocation = function (url, win) {
  var a = win.document.createElement('A');
  a.href = url;
  return "" + a.pathname + a.search + a.hash;
};

var stateChangeToMetadata = function (win, state, title, url) {
  var currentPath = relativeLocation(win.location.href, win);
  return {
    title: title,
    state: state,
    prevState: getCurrentState(win),
    to: url || currentPath,
    from: currentPath
  };
};

var wrapHistoryFn = function (client, target, fn, win) {
  var orig = target[fn];

  target[fn] = function (state, title, url) {
    client.leaveBreadcrumb("History " + fn, stateChangeToMetadata(win, state, title, url), 'navigation'); // if throttle plugin is in use, reset the event sent count

    if (typeof client.resetEventCount === 'function') client.resetEventCount(); // if the client is operating in auto session-mode, a new route should trigger a new session

    if (client._config.autoTrackSessions) client.startSession(); // Internet Explorer will convert `undefined` to a string when passed, causing an unintended redirect
    // to '/undefined'. therefore we only pass the url if it's not undefined.

    orig.apply(target, [state, title].concat(url !== undefined ? url : []));
  };

  if ("production" !== 'production') {
    target[fn]._restore = function () {
      target[fn] = orig;
    };
  }
};

var getCurrentState = function (win) {
  try {
    return win.history.state;
  } catch (e) {}
};

var BREADCRUMB_TYPE = 'request';

/* removed: var _$includes_13 = require('@bugsnag/core/lib/es-utils/includes'); */;
/*
 * Leaves breadcrumbs when network requests occur
 */


var _$networkBreadcrumbs_51 = function (_ignoredUrls, win) {
  if (_ignoredUrls === void 0) {
    _ignoredUrls = [];
  }

  if (win === void 0) {
    win = window;
  }

  var restoreFunctions = [];
  var plugin = {
    load: function (client) {
      if (!client._isBreadcrumbTypeEnabled('request')) return;
      var ignoredUrls = [client._config.endpoints.notify, client._config.endpoints.sessions].concat(_ignoredUrls);
      monkeyPatchXMLHttpRequest();
      monkeyPatchFetch(); // XMLHttpRequest monkey patch

      function monkeyPatchXMLHttpRequest() {
        if (!('addEventListener' in win.XMLHttpRequest.prototype)) return;
        var nativeOpen = win.XMLHttpRequest.prototype.open; // override native open()

        win.XMLHttpRequest.prototype.open = function open(method, url) {
          var _this = this;

          var requestSetupKey = false;

          var error = function () {
            return handleXHRError(method, url);
          };

          var load = function () {
            return handleXHRLoad(method, url, _this.status);
          }; // if we have already setup listeners, it means open() was called twice, we need to remove
          // the listeners and recreate them


          if (requestSetupKey) {
            this.removeEventListener('load', load);
            this.removeEventListener('error', error);
          } // attach load event listener


          this.addEventListener('load', load); // attach error event listener

          this.addEventListener('error', error);
          requestSetupKey = true;
          nativeOpen.apply(this, arguments);
        };

        if ("production" !== 'production') {
          restoreFunctions.push(function () {
            win.XMLHttpRequest.prototype.open = nativeOpen;
          });
        }
      }

      function handleXHRLoad(method, url, status) {
        if (url === undefined) {
          client._logger.warn('The request URL is no longer present on this XMLHttpRequest. A breadcrumb cannot be left for this request.');

          return;
        } // an XMLHttpRequest's URL can be an object as long as its 'toString'
        // returns a URL, e.g. a HTMLAnchorElement


        if (typeof url === 'string' && _$includes_13(ignoredUrls, url.replace(/\?.*$/, ''))) {
          // don't leave a network breadcrumb from bugsnag notify calls
          return;
        }

        var metadata = {
          status: status,
          request: method + " " + url
        };

        if (status >= 400) {
          // contacted server but got an error response
          client.leaveBreadcrumb('XMLHttpRequest failed', metadata, BREADCRUMB_TYPE);
        } else {
          client.leaveBreadcrumb('XMLHttpRequest succeeded', metadata, BREADCRUMB_TYPE);
        }
      }

      function handleXHRError(method, url) {
        if (url === undefined) {
          client._logger.warn('The request URL is no longer present on this XMLHttpRequest. A breadcrumb cannot be left for this request.');

          return;
        }

        if (typeof url === 'string' && _$includes_13(ignoredUrls, url.replace(/\?.*$/, ''))) {
          // don't leave a network breadcrumb from bugsnag notify calls
          return;
        } // failed to contact server


        client.leaveBreadcrumb('XMLHttpRequest error', {
          request: method + " " + url
        }, BREADCRUMB_TYPE);
      } // window.fetch monkey patch


      function monkeyPatchFetch() {
        // only patch it if it exists and if it is not a polyfill (patching a polyfilled
        // fetch() results in duplicate breadcrumbs for the same request because the
        // implementation uses XMLHttpRequest which is also patched)
        if (!('fetch' in win) || win.fetch.polyfill) return;
        var oldFetch = win.fetch;

        win.fetch = function fetch() {
          var _arguments = arguments;
          var urlOrRequest = arguments[0];
          var options = arguments[1];
          var method;
          var url = null;

          if (urlOrRequest && typeof urlOrRequest === 'object') {
            url = urlOrRequest.url;

            if (options && 'method' in options) {
              method = options.method;
            } else if (urlOrRequest && 'method' in urlOrRequest) {
              method = urlOrRequest.method;
            }
          } else {
            url = urlOrRequest;

            if (options && 'method' in options) {
              method = options.method;
            }
          }

          if (method === undefined) {
            method = 'GET';
          }

          return new Promise(function (resolve, reject) {
            // pass through to native fetch
            oldFetch.apply(void 0, _arguments).then(function (response) {
              handleFetchSuccess(response, method, url);
              resolve(response);
            })["catch"](function (error) {
              handleFetchError(method, url);
              reject(error);
            });
          });
        };

        if ("production" !== 'production') {
          restoreFunctions.push(function () {
            win.fetch = oldFetch;
          });
        }
      }

      var handleFetchSuccess = function (response, method, url) {
        var metadata = {
          status: response.status,
          request: method + " " + url
        };

        if (response.status >= 400) {
          // when the request comes back with a 4xx or 5xx status it does not reject the fetch promise,
          client.leaveBreadcrumb('fetch() failed', metadata, BREADCRUMB_TYPE);
        } else {
          client.leaveBreadcrumb('fetch() succeeded', metadata, BREADCRUMB_TYPE);
        }
      };

      var handleFetchError = function (method, url) {
        client.leaveBreadcrumb('fetch() error', {
          request: method + " " + url
        }, BREADCRUMB_TYPE);
      };
    }
  };

  if ("production" !== 'production') {
    plugin.destroy = function () {
      restoreFunctions.forEach(function (fn) {
        return fn();
      });
      restoreFunctions = [];
    };
  }

  return plugin;
};

/* removed: var _$intRange_24 = require('@bugsnag/core/lib/validators/int-range'); */;
/*
 * Throttles and dedupes events
 */


var _$throttle_52 = {
  load: function (client) {
    // track sent events for each init of the plugin
    var n = 0; // add onError hook

    client.addOnError(function (event) {
      // have max events been sent already?
      if (n >= client._config.maxEvents) {
        client._logger.warn("Cancelling event send due to maxEvents per session limit of " + client._config.maxEvents + " being reached");

        return false;
      }

      n++;
    });

    client.resetEventCount = function () {
      n = 0;
    };
  },
  configSchema: {
    maxEvents: {
      defaultValue: function () {
        return 10;
      },
      message: 'should be a positive integer ≤100',
      validate: function (val) {
        return _$intRange_24(1, 100)(val);
      }
    }
  }
};

var _$stripQueryString_53 = {};
/*
 * Remove query strings (and fragments) from stacktraces
 */
/* removed: var _$map_16 = require('@bugsnag/core/lib/es-utils/map'); */;

/* removed: var _$reduce_17 = require('@bugsnag/core/lib/es-utils/reduce'); */;

_$stripQueryString_53 = {
  load: function (client) {
    client.addOnError(function (event) {
      var allFrames = _$reduce_17(event.errors, function (accum, er) {
        return accum.concat(er.stacktrace);
      }, []);
      _$map_16(allFrames, function (frame) {
        frame.file = strip(frame.file);
      });
    });
  }
};

var strip = _$stripQueryString_53._strip = function (str) {
  return typeof str === 'string' ? str.replace(/\?.*$/, '').replace(/#.*$/, '') : str;
};

/*
 * Automatically notifies Bugsnag when window.onerror is called
 */
var _$onerror_54 = function (win, component) {
  if (win === void 0) {
    win = window;
  }

  if (component === void 0) {
    component = 'window onerror';
  }

  return {
    load: function (client) {
      if (!client._config.autoDetectErrors) return;
      if (!client._config.enabledErrorTypes.unhandledExceptions) return;

      function onerror(messageOrEvent, url, lineNo, charNo, error) {
        // Ignore errors with no info due to CORS settings
        if (lineNo === 0 && /Script error\.?/.test(messageOrEvent)) {
          client._logger.warn('Ignoring cross-domain or eval script error. See docs: https://tinyurl.com/yy3rn63z');
        } else {
          // any error sent to window.onerror is unhandled and has severity=error
          var handledState = {
            severity: 'error',
            unhandled: true,
            severityReason: {
              type: 'unhandledException'
            }
          };
          var event; // window.onerror can be called in a number of ways. This big if-else is how we
          // figure out which arguments were supplied, and what kind of values it received.

          if (error) {
            // if the last parameter (error) was supplied, this is a modern browser's
            // way of saying "this value was thrown and not caught"
            event = client.Event.create(error, true, handledState, component, 1);
            decorateStack(event.errors[0].stacktrace, url, lineNo, charNo);
          } else if ( // This complex case detects "error" events that are typically synthesised
          // by jquery's trigger method (although can be created in other ways). In
          // order to detect this:
          // - the first argument (message) must exist and be an object (most likely it's a jQuery event)
          // - the second argument (url) must either not exist or be something other than a string (if it
          //    exists and is not a string, it'll be the extraParameters argument from jQuery's trigger()
          //    function)
          // - the third, fourth and fifth arguments must not exist (lineNo, charNo and error)
          typeof messageOrEvent === 'object' && messageOrEvent !== null && (!url || typeof url !== 'string') && !lineNo && !charNo && !error) {
            // The jQuery event may have a "type" property, if so use it as part of the error message
            var name = messageOrEvent.type ? "Event: " + messageOrEvent.type : 'Error'; // attempt to find a message from one of the conventional properties, but
            // default to empty string (the event will fill it with a placeholder)

            var message = messageOrEvent.message || messageOrEvent.detail || '';
            event = client.Event.create({
              name: name,
              message: message
            }, true, handledState, component, 1); // provide the original thing onerror received – not our error-like object we passed to _notify

            event.originalError = messageOrEvent; // include the raw input as metadata – it might contain more info than we extracted

            event.addMetadata(component, {
              event: messageOrEvent,
              extraParameters: url
            });
          } else {
            // Lastly, if there was no "error" parameter this event was probably from an old
            // browser that doesn't support that. Instead we need to generate a stacktrace.
            event = client.Event.create(messageOrEvent, true, handledState, component, 1);
            decorateStack(event.errors[0].stacktrace, url, lineNo, charNo);
          }

          client._notify(event);
        }

        if (typeof prevOnError === 'function') prevOnError.apply(this, arguments);
      }

      var prevOnError = win.onerror;
      win.onerror = onerror;
    }
  };
}; // Sometimes the stacktrace has less information than was passed to window.onerror.
// This function will augment the first stackframe with any useful info that was
// received as arguments to the onerror callback.


var decorateStack = function (stack, url, lineNo, charNo) {
  if (!stack[0]) stack.push({});
  var culprit = stack[0];
  if (!culprit.file && typeof url === 'string') culprit.file = url;
  if (!culprit.lineNumber && isActualNumber(lineNo)) culprit.lineNumber = lineNo;

  if (!culprit.columnNumber) {
    if (isActualNumber(charNo)) {
      culprit.columnNumber = charNo;
    } else if (window.event && isActualNumber(window.event.errorCharacter)) {
      culprit.columnNumber = window.event.errorCharacter;
    }
  }
};

var isActualNumber = function (n) {
  return typeof n === 'number' && String.call(n) !== 'NaN';
};

/* removed: var _$map_16 = require('@bugsnag/core/lib/es-utils/map'); */;

/* removed: var _$iserror_20 = require('@bugsnag/core/lib/iserror'); */;

var _listener;
/*
 * Automatically notifies Bugsnag when window.onunhandledrejection is called
 */


var _$unhandledRejection_55 = function (win) {
  if (win === void 0) {
    win = window;
  }

  var plugin = {
    load: function (client) {
      if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledRejections) return;

      var listener = function (evt) {
        var error = evt.reason;
        var isBluebird = false; // accessing properties on evt.detail can throw errors (see #394)

        try {
          if (evt.detail && evt.detail.reason) {
            error = evt.detail.reason;
            isBluebird = true;
          }
        } catch (e) {}

        var event = client.Event.create(error, false, {
          severity: 'error',
          unhandled: true,
          severityReason: {
            type: 'unhandledPromiseRejection'
          }
        }, 'unhandledrejection handler', 1, client._logger);

        if (isBluebird) {
          _$map_16(event.errors[0].stacktrace, fixBluebirdStacktrace(error));
        }

        client._notify(event, function (event) {
          if (_$iserror_20(event.originalError) && !event.originalError.stack) {
            var _event$addMetadata;

            event.addMetadata('unhandledRejection handler', (_event$addMetadata = {}, _event$addMetadata[Object.prototype.toString.call(event.originalError)] = {
              name: event.originalError.name,
              message: event.originalError.message,
              code: event.originalError.code
            }, _event$addMetadata));
          }
        });
      };

      if ('addEventListener' in win) {
        win.addEventListener('unhandledrejection', listener);
      } else {
        win.onunhandledrejection = function (reason, promise) {
          listener({
            detail: {
              reason: reason,
              promise: promise
            }
          });
        };
      }

      _listener = listener;
    }
  };

  if ("production" !== 'production') {
    plugin.destroy = function (win) {
      if (win === void 0) {
        win = window;
      }

      if (_listener) {
        if ('addEventListener' in win) {
          win.removeEventListener('unhandledrejection', _listener);
        } else {
          win.onunhandledrejection = null;
        }
      }

      _listener = null;
    };
  }

  return plugin;
}; // The stack parser on bluebird stacks in FF get a suprious first frame:
//
// Error: derp
//   b@http://localhost:5000/bluebird.html:22:24
//   a@http://localhost:5000/bluebird.html:18:9
//   @http://localhost:5000/bluebird.html:14:9
//
// results in
//   […]
//     0: Object { file: "Error: derp", method: undefined, lineNumber: undefined, … }
//     1: Object { file: "http://localhost:5000/bluebird.html", method: "b", lineNumber: 22, … }
//     2: Object { file: "http://localhost:5000/bluebird.html", method: "a", lineNumber: 18, … }
//     3: Object { file: "http://localhost:5000/bluebird.html", lineNumber: 14, columnNumber: 9, … }
//
// so the following reduce/accumulator function removes such frames
//
// Bluebird pads method names with spaces so trim that too…
// https://github.com/petkaantonov/bluebird/blob/b7f21399816d02f979fe434585334ce901dcaf44/src/debuggability.js#L568-L571


var fixBluebirdStacktrace = function (error) {
  return function (frame) {
    if (frame.file === error.toString()) return;

    if (frame.method) {
      frame.method = frame.method.replace(/^\s+/, '');
    }
  };
};

var _$notifier_2 = {};
var name = 'Bugsnag JavaScript';
var version = '7.20.0';
var url = 'https://github.com/bugsnag/bugsnag-js';

/* removed: var _$Client_4 = require('@bugsnag/core/client'); */;

/* removed: var _$Event_6 = require('@bugsnag/core/event'); */;

/* removed: var _$Session_35 = require('@bugsnag/core/session'); */;

/* removed: var _$Breadcrumb_3 = require('@bugsnag/core/breadcrumb'); */;

/* removed: var _$map_16 = require('@bugsnag/core/lib/es-utils/map'); */;

/* removed: var _$keys_15 = require('@bugsnag/core/lib/es-utils/keys'); */;

/* removed: var _$assign_11 = require('@bugsnag/core/lib/es-utils/assign'); */; // extend the base config schema with some browser-specific options


var __schema_2 = _$assign_11({}, _$config_5.schema, _$config_1);

/* removed: var _$onerror_54 = require('@bugsnag/plugin-window-onerror'); */;

/* removed: var _$unhandledRejection_55 = require('@bugsnag/plugin-window-unhandled-rejection'); */;

/* removed: var _$app_38 = require('@bugsnag/plugin-app-duration'); */;

/* removed: var _$device_40 = require('@bugsnag/plugin-browser-device'); */;

/* removed: var _$context_39 = require('@bugsnag/plugin-browser-context'); */;

/* removed: var _$request_44 = require('@bugsnag/plugin-browser-request'); */;

/* removed: var _$throttle_52 = require('@bugsnag/plugin-simple-throttle'); */;

/* removed: var _$consoleBreadcrumbs_47 = require('@bugsnag/plugin-console-breadcrumbs'); */;

/* removed: var _$networkBreadcrumbs_51 = require('@bugsnag/plugin-network-breadcrumbs'); */;

/* removed: var _$navigationBreadcrumbs_50 = require('@bugsnag/plugin-navigation-breadcrumbs'); */;

/* removed: var _$interactionBreadcrumbs_49 = require('@bugsnag/plugin-interaction-breadcrumbs'); */;

/* removed: var _$inlineScriptContent_48 = require('@bugsnag/plugin-inline-script-content'); */;

/* removed: var _$session_45 = require('@bugsnag/plugin-browser-session'); */;

/* removed: var _$clientIp_46 = require('@bugsnag/plugin-client-ip'); */;

/* removed: var _$stripQueryString_53 = require('@bugsnag/plugin-strip-query-string'); */; // delivery mechanisms


/* removed: var _$delivery_36 = require('@bugsnag/delivery-x-domain-request'); */;

/* removed: var _$delivery_37 = require('@bugsnag/delivery-xml-http-request'); */;

var Bugsnag = {
  _client: null,
  createClient: function (opts) {
    // handle very simple use case where user supplies just the api key as a string
    if (typeof opts === 'string') opts = {
      apiKey: opts
    };
    if (!opts) opts = {};
    var internalPlugins = [// add browser-specific plugins
    _$app_38, _$device_40(), _$context_39(), _$request_44(), _$throttle_52, _$session_45, _$clientIp_46, _$stripQueryString_53, _$onerror_54(), _$unhandledRejection_55(), _$navigationBreadcrumbs_50(), _$interactionBreadcrumbs_49(), _$networkBreadcrumbs_51(), _$consoleBreadcrumbs_47, // this one added last to avoid wrapping functionality before bugsnag uses it
    _$inlineScriptContent_48()]; // configure a client with user supplied options

    var bugsnag = new _$Client_4(opts, __schema_2, internalPlugins, {
      name: name,
      version: version,
      url: url
    }); // set delivery based on browser capability (IE 8+9 have an XDomainRequest object)

    bugsnag._setDelivery(window.XDomainRequest ? _$delivery_36 : _$delivery_37);

    bugsnag._logger.debug('Loaded!');

    bugsnag.leaveBreadcrumb('Bugsnag loaded', {}, 'state');
    return bugsnag._config.autoTrackSessions ? bugsnag.startSession() : bugsnag;
  },
  start: function (opts) {
    if (Bugsnag._client) {
      Bugsnag._client._logger.warn('Bugsnag.start() was called more than once. Ignoring.');

      return Bugsnag._client;
    }

    Bugsnag._client = Bugsnag.createClient(opts);
    return Bugsnag._client;
  },
  isStarted: function () {
    return Bugsnag._client != null;
  }
};
_$map_16(['resetEventCount'].concat(_$keys_15(_$Client_4.prototype)), function (m) {
  if (/^_/.test(m)) return;

  Bugsnag[m] = function () {
    if (!Bugsnag._client) return console.log("Bugsnag." + m + "() was called before Bugsnag.start()");
    Bugsnag._client._depth += 1;

    var ret = Bugsnag._client[m].apply(Bugsnag._client, arguments);

    Bugsnag._client._depth -= 1;
    return ret;
  };
});
_$notifier_2 = Bugsnag;
_$notifier_2.Client = _$Client_4;
_$notifier_2.Event = _$Event_6;
_$notifier_2.Session = _$Session_35;
_$notifier_2.Breadcrumb = _$Breadcrumb_3; // Export a "default" property for compatibility with ESM imports

_$notifier_2["default"] = Bugsnag;

return _$notifier_2;

});
//# sourceMappingURL=bugsnag.js.map
