/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ (function(__unused_webpack_module, exports) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.lengthOf = exports.keysOf = exports.isObject = exports.isInfOrNaN = exports.isFunction = exports.isArguments = exports.hasOwn = exports.handleError = exports.convertMapToObject = exports.checkError = void 0;

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var isFunction = function isFunction(fn) {
  return typeof fn === 'function';
};

exports.isFunction = isFunction;

var isObject = function isObject(fn) {
  return _typeof(fn) === 'object';
};

exports.isObject = isObject;

var keysOf = function keysOf(obj) {
  return Object.keys(obj);
};

exports.keysOf = keysOf;

var lengthOf = function lengthOf(obj) {
  return Object.keys(obj).length;
};

exports.lengthOf = lengthOf;

var hasOwn = function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

exports.hasOwn = hasOwn;

var convertMapToObject = function convertMapToObject(map) {
  return Array.from(map).reduce(function (acc, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        key = _ref2[0],
        value = _ref2[1];

    // reassign to not create new object
    acc[key] = value;
    return acc;
  }, {});
};

exports.convertMapToObject = convertMapToObject;

var isArguments = function isArguments(obj) {
  return obj != null && hasOwn(obj, 'callee');
};

exports.isArguments = isArguments;

var isInfOrNaN = function isInfOrNaN(obj) {
  return Number.isNaN(obj) || obj === Infinity || obj === -Infinity;
};

exports.isInfOrNaN = isInfOrNaN;
var checkError = {
  maxStack: function maxStack(msgError) {
    return new RegExp('Maximum call stack size exceeded', 'g').test(msgError);
  }
};
exports.checkError = checkError;

var handleError = function handleError(fn) {
  return function () {
    try {
      return fn.apply(this, arguments);
    } catch (error) {
      var isMaxStack = checkError.maxStack(error.message);

      if (isMaxStack) {
        throw new Error('Converting circular structure to JSON');
      }

      throw error;
    }
  };
};

exports.handleError = handleError;

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Base64 = void 0;
// Base 64 encoding
var BASE_64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var BASE_64_VALS = Object.create(null);

var getChar = function getChar(val) {
  return BASE_64_CHARS.charAt(val);
};

var getVal = function getVal(ch) {
  return ch === '=' ? -1 : BASE_64_VALS[ch];
};

for (var i = 0; i < BASE_64_CHARS.length; i++) {
  BASE_64_VALS[getChar(i)] = i;
}

;

var encode = function encode(array) {
  if (typeof array === "string") {
    var str = array;
    array = newBinary(str.length);

    for (var _i = 0; _i < str.length; _i++) {
      var ch = str.charCodeAt(_i);

      if (ch > 0xFF) {
        throw new Error("Not ascii. Base64.encode can only take ascii strings.");
      }

      array[_i] = ch;
    }
  }

  var answer = [];
  var a = null;
  var b = null;
  var c = null;
  var d = null;

  for (var _i2 = 0; _i2 < array.length; _i2++) {
    switch (_i2 % 3) {
      case 0:
        a = array[_i2] >> 2 & 0x3F;
        b = (array[_i2] & 0x03) << 4;
        break;

      case 1:
        b = b | array[_i2] >> 4 & 0xF;
        c = (array[_i2] & 0xF) << 2;
        break;

      case 2:
        c = c | array[_i2] >> 6 & 0x03;
        d = array[_i2] & 0x3F;
        answer.push(getChar(a));
        answer.push(getChar(b));
        answer.push(getChar(c));
        answer.push(getChar(d));
        a = null;
        b = null;
        c = null;
        d = null;
        break;
    }
  }

  if (a != null) {
    answer.push(getChar(a));
    answer.push(getChar(b));

    if (c == null) {
      answer.push('=');
    } else {
      answer.push(getChar(c));
    }

    if (d == null) {
      answer.push('=');
    }
  }

  return answer.join("");
}; // XXX This is a weird place for this to live, but it's used both by
// this package and 'ejson', and we can't put it in 'ejson' without
// introducing a circular dependency. It should probably be in its own
// package or as a helper in a package that both 'base64' and 'ejson'
// use.


var newBinary = function newBinary(len) {
  if (typeof Uint8Array === 'undefined' || typeof ArrayBuffer === 'undefined') {
    var ret = [];

    for (var _i3 = 0; _i3 < len; _i3++) {
      ret.push(0);
    }

    ret.$Uint8ArrayPolyfill = true;
    return ret;
  }

  return new Uint8Array(new ArrayBuffer(len));
};

var decode = function decode(str) {
  var len = Math.floor(str.length * 3 / 4);

  if (str.charAt(str.length - 1) == '=') {
    len--;

    if (str.charAt(str.length - 2) == '=') {
      len--;
    }
  }

  var arr = newBinary(len);
  var one = null;
  var two = null;
  var three = null;
  var j = 0;

  for (var _i4 = 0; _i4 < str.length; _i4++) {
    var c = str.charAt(_i4);
    var v = getVal(c);

    switch (_i4 % 4) {
      case 0:
        if (v < 0) {
          throw new Error('invalid base64 string');
        }

        one = v << 2;
        break;

      case 1:
        if (v < 0) {
          throw new Error('invalid base64 string');
        }

        one = one | v >> 4;
        arr[j++] = one;
        two = (v & 0x0F) << 4;
        break;

      case 2:
        if (v >= 0) {
          two = two | v >> 2;
          arr[j++] = two;
          three = (v & 0x03) << 6;
        }

        break;

      case 3:
        if (v >= 0) {
          arr[j++] = three | v;
        }

        break;
    }
  }

  return arr;
};

var Base64 = {
  encode: encode,
  decode: decode,
  newBinary: newBinary
};
exports.Base64 = Base64;

/***/ }),
/* 3 */
/***/ (function(module) {



module.exports = {
  //
  // When fibers are not supported on you system Meteor automatically sets this
  // function to a nope function. We're going to do the same here as there are
  // small parts of the code that call this function.
  //
  _noYieldsAllowed: function _noYieldsAllowed(f) {
    return f();
  }
};

/***/ }),
/* 4 */
/***/ (function(module, exports) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

// Based on json2.js from https://github.com/douglascrockford/JSON-js
//
//    json2.js
//    2012-10-08
//
//    Public Domain.
//
//    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
function quote(string) {
  return JSON.stringify(string);
}

var str = function str(key, holder, singleIndent, outerIndent, canonical) {
  var value = holder[key]; // What happens next depends on the value's type.

  switch (_typeof(value)) {
    case 'string':
      return quote(value);

    case 'number':
      // JSON numbers must be finite. Encode non-finite numbers as null.
      return isFinite(value) ? String(value) : 'null';

    case 'boolean':
      return String(value);
    // If the type is 'object', we might be dealing with an object or an array or
    // null.

    case 'object':
      {
        // Due to a specification blunder in ECMAScript, typeof null is 'object',
        // so watch out for that case.
        if (!value) {
          return 'null';
        } // Make an array to hold the partial results of stringifying this object
        // value.


        var innerIndent = outerIndent + singleIndent;
        var partial = [];
        var v; // Is the value an array?

        if (Array.isArray(value) || {}.hasOwnProperty.call(value, 'callee')) {
          // The value is an array. Stringify every element. Use null as a
          // placeholder for non-JSON values.
          var length = value.length;

          for (var i = 0; i < length; i += 1) {
            partial[i] = str(i, value, singleIndent, innerIndent, canonical) || 'null';
          } // Join all of the elements together, separated with commas, and wrap
          // them in brackets.


          if (partial.length === 0) {
            v = '[]';
          } else if (innerIndent) {
            v = '[\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + ']';
          } else {
            v = '[' + partial.join(',') + ']';
          }

          return v;
        } // Iterate through all of the keys in the object.


        var keys = Object.keys(value);

        if (canonical) {
          keys = keys.sort();
        }

        keys.forEach(function (k) {
          v = str(k, value, singleIndent, innerIndent, canonical);

          if (v) {
            partial.push(quote(k) + (innerIndent ? ': ' : ':') + v);
          }
        }); // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        if (partial.length === 0) {
          v = '{}';
        } else if (innerIndent) {
          v = '{\n' + innerIndent + partial.join(',\n' + innerIndent) + '\n' + outerIndent + '}';
        } else {
          v = '{' + partial.join(',') + '}';
        }

        return v;
      }

    default: // Do nothing

  }
}; // If the JSON object does not yet have a stringify method, give it one.


var canonicalStringify = function canonicalStringify(value, options) {
  // Make a fake root object containing our value under the key of ''.
  // Return the result of stringifying the value.
  var allOptions = Object.assign({
    indent: '',
    canonical: false
  }, options);

  if (allOptions.indent === true) {
    allOptions.indent = '  ';
  } else if (typeof allOptions.indent === 'number') {
    var newIndent = '';

    for (var i = 0; i < allOptions.indent; i++) {
      newIndent += ' ';
    }

    allOptions.indent = newIndent;
  }

  return str('', {
    '': value
  }, allOptions.indent, '', allOptions.canonical);
};

var _default = canonicalStringify;
exports["default"] = _default;
module.exports = exports.default;

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
!function() {
var exports = __webpack_exports__;
/* provided dependency */ var Base64 = __webpack_require__(2)["Base64"];
/* provided dependency */ var Meteor = __webpack_require__(3);


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.EJSON = void 0;

var _utils = __webpack_require__(1);

/**
 * @namespace
 * @summary Namespace for EJSON functions
 */
var EJSON = {}; // Custom type interface definition

/**
 * @class CustomType
 * @instanceName customType
 * @memberOf EJSON
 * @summary The interface that a class must satisfy to be able to become an
 * EJSON custom type via EJSON.addType.
 */

/**
 * @function typeName
 * @memberOf EJSON.CustomType
 * @summary Return the tag used to identify this type.  This must match the
 *          tag used to register this type with
 *          [`EJSON.addType`](#ejson_add_type).
 * @locus Anywhere
 * @instance
 */

/**
 * @function toJSONValue
 * @memberOf EJSON.CustomType
 * @summary Serialize this instance into a JSON-compatible value.
 * @locus Anywhere
 * @instance
 */

/**
 * @function clone
 * @memberOf EJSON.CustomType
 * @summary Return a value `r` such that `this.equals(r)` is true, and
 *          modifications to `r` do not affect `this` and vice versa.
 * @locus Anywhere
 * @instance
 */

/**
 * @function equals
 * @memberOf EJSON.CustomType
 * @summary Return `true` if `other` has a value equal to `this`; `false`
 *          otherwise.
 * @locus Anywhere
 * @param {Object} other Another object to compare this to.
 * @instance
 */

exports.EJSON = EJSON;
var customTypes = new Map(); // Add a custom type, using a method of your choice to get to and
// from a basic JSON-able representation.  The factory argument
// is a function of JSON-able --> your object
// The type you add must have:
// - A toJSONValue() method, so that Meteor can serialize it
// - a typeName() method, to show how to look it up in our type table.
// It is okay if these methods are monkey-patched on.
// EJSON.clone will use toJSONValue and the given factory to produce
// a clone, but you may specify a method clone() that will be
// used instead.
// Similarly, EJSON.equals will use toJSONValue to make comparisons,
// but you may provide a method equals() instead.

/**
 * @summary Add a custom datatype to EJSON.
 * @locus Anywhere
 * @param {String} name A tag for your custom type; must be unique among
 *                      custom data types defined in your project, and must
 *                      match the result of your type's `typeName` method.
 * @param {Function} factory A function that deserializes a JSON-compatible
 *                           value into an instance of your type.  This should
 *                           match the serialization performed by your
 *                           type's `toJSONValue` method.
 */

EJSON.addType = function (name, factory) {
  if (customTypes.has(name)) {
    throw new Error("Type ".concat(name, " already present"));
  }

  customTypes.set(name, factory);
};

var builtinConverters = [{
  // Date
  matchJSONValue: function matchJSONValue(obj) {
    return (0, _utils.hasOwn)(obj, '$date') && (0, _utils.lengthOf)(obj) === 1;
  },
  matchObject: function matchObject(obj) {
    return obj instanceof Date;
  },
  toJSONValue: function toJSONValue(obj) {
    return {
      $date: obj.getTime()
    };
  },
  fromJSONValue: function fromJSONValue(obj) {
    return new Date(obj.$date);
  }
}, {
  // RegExp
  matchJSONValue: function matchJSONValue(obj) {
    return (0, _utils.hasOwn)(obj, '$regexp') && (0, _utils.hasOwn)(obj, '$flags') && (0, _utils.lengthOf)(obj) === 2;
  },
  matchObject: function matchObject(obj) {
    return obj instanceof RegExp;
  },
  toJSONValue: function toJSONValue(regexp) {
    return {
      $regexp: regexp.source,
      $flags: regexp.flags
    };
  },
  fromJSONValue: function fromJSONValue(obj) {
    // Replaces duplicate / invalid flags.
    return new RegExp(obj.$regexp, obj.$flags // Cut off flags at 50 chars to avoid abusing RegExp for DOS.
    .slice(0, 50).replace(/[^gimuy]/g, '').replace(/(.)(?=.*\1)/g, ''));
  }
}, {
  // NaN, Inf, -Inf. (These are the only objects with typeof !== 'object'
  // which we match.)
  matchJSONValue: function matchJSONValue(obj) {
    return (0, _utils.hasOwn)(obj, '$InfNaN') && (0, _utils.lengthOf)(obj) === 1;
  },
  matchObject: _utils.isInfOrNaN,
  toJSONValue: function toJSONValue(obj) {
    var sign;

    if (Number.isNaN(obj)) {
      sign = 0;
    } else if (obj === Infinity) {
      sign = 1;
    } else {
      sign = -1;
    }

    return {
      $InfNaN: sign
    };
  },
  fromJSONValue: function fromJSONValue(obj) {
    return obj.$InfNaN / 0;
  }
}, {
  // Binary
  matchJSONValue: function matchJSONValue(obj) {
    return (0, _utils.hasOwn)(obj, '$binary') && (0, _utils.lengthOf)(obj) === 1;
  },
  matchObject: function matchObject(obj) {
    return typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || obj && (0, _utils.hasOwn)(obj, '$Uint8ArrayPolyfill');
  },
  toJSONValue: function toJSONValue(obj) {
    return {
      $binary: Base64.encode(obj)
    };
  },
  fromJSONValue: function fromJSONValue(obj) {
    return Base64.decode(obj.$binary);
  }
}, {
  // Escaping one level
  matchJSONValue: function matchJSONValue(obj) {
    return (0, _utils.hasOwn)(obj, '$escape') && (0, _utils.lengthOf)(obj) === 1;
  },
  matchObject: function matchObject(obj) {
    var match = false;

    if (obj) {
      var keyCount = (0, _utils.lengthOf)(obj);

      if (keyCount === 1 || keyCount === 2) {
        match = builtinConverters.some(function (converter) {
          return converter.matchJSONValue(obj);
        });
      }
    }

    return match;
  },
  toJSONValue: function toJSONValue(obj) {
    var newObj = {};
    (0, _utils.keysOf)(obj).forEach(function (key) {
      newObj[key] = EJSON.toJSONValue(obj[key]);
    });
    return {
      $escape: newObj
    };
  },
  fromJSONValue: function fromJSONValue(obj) {
    var newObj = {};
    (0, _utils.keysOf)(obj.$escape).forEach(function (key) {
      newObj[key] = EJSON.fromJSONValue(obj.$escape[key]);
    });
    return newObj;
  }
}, {
  // Custom
  matchJSONValue: function matchJSONValue(obj) {
    return (0, _utils.hasOwn)(obj, '$type') && (0, _utils.hasOwn)(obj, '$value') && (0, _utils.lengthOf)(obj) === 2;
  },
  matchObject: function matchObject(obj) {
    return EJSON._isCustomType(obj);
  },
  toJSONValue: function toJSONValue(obj) {
    var jsonValue = Meteor._noYieldsAllowed(function () {
      return obj.toJSONValue();
    });

    return {
      $type: obj.typeName(),
      $value: jsonValue
    };
  },
  fromJSONValue: function fromJSONValue(obj) {
    var typeName = obj.$type;

    if (!customTypes.has(typeName)) {
      throw new Error("Custom EJSON type ".concat(typeName, " is not defined"));
    }

    var converter = customTypes.get(typeName);
    return Meteor._noYieldsAllowed(function () {
      return converter(obj.$value);
    });
  }
}];

EJSON._isCustomType = function (obj) {
  return obj && (0, _utils.isFunction)(obj.toJSONValue) && (0, _utils.isFunction)(obj.typeName) && customTypes.has(obj.typeName());
};

EJSON._getTypes = function () {
  var isOriginal = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  return isOriginal ? customTypes : (0, _utils.convertMapToObject)(customTypes);
};

EJSON._getConverters = function () {
  return builtinConverters;
}; // Either return the JSON-compatible version of the argument, or undefined (if
// the item isn't itself replaceable, but maybe some fields in it are)


var toJSONValueHelper = function toJSONValueHelper(item) {
  for (var i = 0; i < builtinConverters.length; i++) {
    var converter = builtinConverters[i];

    if (converter.matchObject(item)) {
      return converter.toJSONValue(item);
    }
  }

  return undefined;
}; // for both arrays and objects, in-place modification.


var adjustTypesToJSONValue = function adjustTypesToJSONValue(obj) {
  // Is it an atom that we need to adjust?
  if (obj === null) {
    return null;
  }

  var maybeChanged = toJSONValueHelper(obj);

  if (maybeChanged !== undefined) {
    return maybeChanged;
  } // Other atoms are unchanged.


  if (!(0, _utils.isObject)(obj)) {
    return obj;
  } // Iterate over array or object structure.


  (0, _utils.keysOf)(obj).forEach(function (key) {
    var value = obj[key];

    if (!(0, _utils.isObject)(value) && value !== undefined && !(0, _utils.isInfOrNaN)(value)) {
      return; // continue
    }

    var changed = toJSONValueHelper(value);

    if (changed) {
      obj[key] = changed;
      return; // on to the next key
    } // if we get here, value is an object but not adjustable
    // at this level.  recurse.


    adjustTypesToJSONValue(value);
  });
  return obj;
};

EJSON._adjustTypesToJSONValue = adjustTypesToJSONValue;
/**
 * @summary Serialize an EJSON-compatible value into its plain JSON
 *          representation.
 * @locus Anywhere
 * @param {EJSON} val A value to serialize to plain JSON.
 */

EJSON.toJSONValue = function (item) {
  var changed = toJSONValueHelper(item);

  if (changed !== undefined) {
    return changed;
  }

  var newItem = item;

  if ((0, _utils.isObject)(item)) {
    newItem = EJSON.clone(item);
    adjustTypesToJSONValue(newItem);
  }

  return newItem;
}; // Either return the argument changed to have the non-json
// rep of itself (the Object version) or the argument itself.
// DOES NOT RECURSE.  For actually getting the fully-changed value, use
// EJSON.fromJSONValue


var fromJSONValueHelper = function fromJSONValueHelper(value) {
  if ((0, _utils.isObject)(value) && value !== null) {
    var keys = (0, _utils.keysOf)(value);

    if (keys.length <= 2 && keys.every(function (k) {
      return typeof k === 'string' && k.substr(0, 1) === '$';
    })) {
      for (var i = 0; i < builtinConverters.length; i++) {
        var converter = builtinConverters[i];

        if (converter.matchJSONValue(value)) {
          return converter.fromJSONValue(value);
        }
      }
    }
  }

  return value;
}; // for both arrays and objects. Tries its best to just
// use the object you hand it, but may return something
// different if the object you hand it itself needs changing.


var adjustTypesFromJSONValue = function adjustTypesFromJSONValue(obj) {
  if (obj === null) {
    return null;
  }

  var maybeChanged = fromJSONValueHelper(obj);

  if (maybeChanged !== obj) {
    return maybeChanged;
  } // Other atoms are unchanged.


  if (!(0, _utils.isObject)(obj)) {
    return obj;
  }

  (0, _utils.keysOf)(obj).forEach(function (key) {
    var value = obj[key];

    if ((0, _utils.isObject)(value)) {
      var changed = fromJSONValueHelper(value);

      if (value !== changed) {
        obj[key] = changed;
        return;
      } // if we get here, value is an object but not adjustable
      // at this level.  recurse.


      adjustTypesFromJSONValue(value);
    }
  });
  return obj;
};

EJSON._adjustTypesFromJSONValue = adjustTypesFromJSONValue;
/**
 * @summary Deserialize an EJSON value from its plain JSON representation.
 * @locus Anywhere
 * @param {JSONCompatible} val A value to deserialize into EJSON.
 */

EJSON.fromJSONValue = function (item) {
  var changed = fromJSONValueHelper(item);

  if (changed === item && (0, _utils.isObject)(item)) {
    changed = EJSON.clone(item);
    adjustTypesFromJSONValue(changed);
  }

  return changed;
};
/**
 * @summary Serialize a value to a string. For EJSON values, the serialization
 *          fully represents the value. For non-EJSON values, serializes the
 *          same way as `JSON.stringify`.
 * @locus Anywhere
 * @param {EJSON} val A value to stringify.
 * @param {Object} [options]
 * @param {Boolean | Integer | String} options.indent Indents objects and
 * arrays for easy readability.  When `true`, indents by 2 spaces; when an
 * integer, indents by that number of spaces; and when a string, uses the
 * string as the indentation pattern.
 * @param {Boolean} options.canonical When `true`, stringifies keys in an
 *                                    object in sorted order.
 */


EJSON.stringify = (0, _utils.handleError)(function (item, options) {
  var serialized;
  var json = EJSON.toJSONValue(item);

  if (options && (options.canonical || options.indent)) {
    var canonicalStringify = __webpack_require__(4);

    serialized = canonicalStringify(json, options);
  } else {
    serialized = JSON.stringify(json);
  }

  return serialized;
});
/**
 * @summary Parse a string into an EJSON value. Throws an error if the string
 *          is not valid EJSON.
 * @locus Anywhere
 * @param {String} str A string to parse into an EJSON value.
 */

EJSON.parse = function (item) {
  if (typeof item !== 'string') {
    throw new Error('EJSON.parse argument should be a string');
  }

  return EJSON.fromJSONValue(JSON.parse(item));
};
/**
 * @summary Returns true if `x` is a buffer of binary data, as returned from
 *          [`EJSON.newBinary`](#ejson_new_binary).
 * @param {Object} x The variable to check.
 * @locus Anywhere
 */


EJSON.isBinary = function (obj) {
  return !!(typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array || obj && obj.$Uint8ArrayPolyfill);
};
/**
 * @summary Return true if `a` and `b` are equal to each other.  Return false
 *          otherwise.  Uses the `equals` method on `a` if present, otherwise
 *          performs a deep comparison.
 * @locus Anywhere
 * @param {EJSON} a
 * @param {EJSON} b
 * @param {Object} [options]
 * @param {Boolean} options.keyOrderSensitive Compare in key sensitive order,
 * if supported by the JavaScript implementation.  For example, `{a: 1, b: 2}`
 * is equal to `{b: 2, a: 1}` only when `keyOrderSensitive` is `false`.  The
 * default is `false`.
 */


EJSON.equals = function (a, b, options) {
  var i;
  var keyOrderSensitive = !!(options && options.keyOrderSensitive);

  if (a === b) {
    return true;
  } // This differs from the IEEE spec for NaN equality, b/c we don't want
  // anything ever with a NaN to be poisoned from becoming equal to anything.


  if (Number.isNaN(a) && Number.isNaN(b)) {
    return true;
  } // if either one is falsy, they'd have to be === to be equal


  if (!a || !b) {
    return false;
  }

  if (!((0, _utils.isObject)(a) && (0, _utils.isObject)(b))) {
    return false;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.valueOf() === b.valueOf();
  }

  if (EJSON.isBinary(a) && EJSON.isBinary(b)) {
    if (a.length !== b.length) {
      return false;
    }

    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  }

  if ((0, _utils.isFunction)(a.equals)) {
    return a.equals(b, options);
  }

  if ((0, _utils.isFunction)(b.equals)) {
    return b.equals(a, options);
  } // Array.isArray works across iframes while instanceof won't


  var aIsArray = Array.isArray(a);
  var bIsArray = Array.isArray(b); // if not both or none are array they are not equal

  if (aIsArray !== bIsArray) {
    return false;
  }

  if (aIsArray && bIsArray) {
    if (a.length !== b.length) {
      return false;
    }

    for (i = 0; i < a.length; i++) {
      if (!EJSON.equals(a[i], b[i], options)) {
        return false;
      }
    }

    return true;
  } // fallback for custom types that don't implement their own equals


  switch (EJSON._isCustomType(a) + EJSON._isCustomType(b)) {
    case 1:
      return false;

    case 2:
      return EJSON.equals(EJSON.toJSONValue(a), EJSON.toJSONValue(b));

    default: // Do nothing

  } // fall back to structural equality of objects


  var ret;
  var aKeys = (0, _utils.keysOf)(a);
  var bKeys = (0, _utils.keysOf)(b);

  if (keyOrderSensitive) {
    i = 0;
    ret = aKeys.every(function (key) {
      if (i >= bKeys.length) {
        return false;
      }

      if (key !== bKeys[i]) {
        return false;
      }

      if (!EJSON.equals(a[key], b[bKeys[i]], options)) {
        return false;
      }

      i++;
      return true;
    });
  } else {
    i = 0;
    ret = aKeys.every(function (key) {
      if (!(0, _utils.hasOwn)(b, key)) {
        return false;
      }

      if (!EJSON.equals(a[key], b[key], options)) {
        return false;
      }

      i++;
      return true;
    });
  }

  return ret && i === bKeys.length;
};
/**
 * @summary Return a deep copy of `val`.
 * @locus Anywhere
 * @param {EJSON} val A value to copy.
 */


EJSON.clone = function (v) {
  var ret;

  if (!(0, _utils.isObject)(v)) {
    return v;
  }

  if (v === null) {
    return null; // null has typeof "object"
  }

  if (v instanceof Date) {
    return new Date(v.getTime());
  } // RegExps are not really EJSON elements (eg we don't define a serialization
  // for them), but they're immutable anyway, so we can support them in clone.


  if (v instanceof RegExp) {
    return v;
  }

  if (EJSON.isBinary(v)) {
    ret = EJSON.newBinary(v.length);

    for (var i = 0; i < v.length; i++) {
      ret[i] = v[i];
    }

    return ret;
  }

  if (Array.isArray(v)) {
    return v.map(EJSON.clone);
  }

  if ((0, _utils.isArguments)(v)) {
    return Array.from(v).map(EJSON.clone);
  } // handle general user-defined typed Objects if they have a clone method


  if ((0, _utils.isFunction)(v.clone)) {
    return v.clone();
  } // handle other custom types


  if (EJSON._isCustomType(v)) {
    return EJSON.fromJSONValue(EJSON.clone(EJSON.toJSONValue(v)), true);
  } // handle other objects


  ret = {};
  (0, _utils.keysOf)(v).forEach(function (key) {
    ret[key] = EJSON.clone(v[key]);
  });
  return ret;
};
/**
 * @summary Allocate a new buffer of binary data that EJSON can serialize.
 * @locus Anywhere
 * @param {Number} size The number of bytes of binary data to allocate.
 */
// EJSON.newBinary is the public documented API for this functionality,
// but the implementation is in the 'base64' package to avoid
// introducing a circular dependency. (If the implementation were here,
// then 'base64' would have to use EJSON.newBinary, and 'ejson' would
// also have to use 'base64'.)


EJSON.newBinary = Base64.newBinary;
}();
module.exports = __webpack_exports__.EJSON;
/******/ })()
;