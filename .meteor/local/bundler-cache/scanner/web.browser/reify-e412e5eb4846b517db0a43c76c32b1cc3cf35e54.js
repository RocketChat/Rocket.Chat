(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["katex"] = factory();
	else
		root["katex"] = factory();
})((typeof self !== 'undefined' ? self : this), function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ./src/katex.less
var katex = __webpack_require__(0);

// CONCATENATED MODULE: ./src/SourceLocation.js
/**
 * Lexing or parsing positional information for error reporting.
 * This object is immutable.
 */
var SourceLocation =
/*#__PURE__*/
function () {
  // The + prefix indicates that these fields aren't writeable
  // Lexer holding the input string.
  // Start offset, zero-based inclusive.
  // End offset, zero-based exclusive.
  function SourceLocation(lexer, start, end) {
    this.lexer = void 0;
    this.start = void 0;
    this.end = void 0;
    this.lexer = lexer;
    this.start = start;
    this.end = end;
  }
  /**
   * Merges two `SourceLocation`s from location providers, given they are
   * provided in order of appearance.
   * - Returns the first one's location if only the first is provided.
   * - Returns a merged range of the first and the last if both are provided
   *   and their lexers match.
   * - Otherwise, returns null.
   */


  SourceLocation.range = function range(first, second) {
    if (!second) {
      return first && first.loc;
    } else if (!first || !first.loc || !second.loc || first.loc.lexer !== second.loc.lexer) {
      return null;
    } else {
      return new SourceLocation(first.loc.lexer, first.loc.start, second.loc.end);
    }
  };

  return SourceLocation;
}();


// CONCATENATED MODULE: ./src/Token.js

/**
 * Interface required to break circular dependency between Token, Lexer, and
 * ParseError.
 */

/**
 * The resulting token returned from `lex`.
 *
 * It consists of the token text plus some position information.
 * The position information is essentially a range in an input string,
 * but instead of referencing the bare input string, we refer to the lexer.
 * That way it is possible to attach extra metadata to the input string,
 * like for example a file name or similar.
 *
 * The position information is optional, so it is OK to construct synthetic
 * tokens if appropriate. Not providing available position information may
 * lead to degraded error reporting, though.
 */
var Token_Token =
/*#__PURE__*/
function () {
  function Token(text, // the text of this token
  loc) {
    this.text = void 0;
    this.loc = void 0;
    this.text = text;
    this.loc = loc;
  }
  /**
   * Given a pair of tokens (this and endToken), compute a `Token` encompassing
   * the whole input range enclosed by these two.
   */


  var _proto = Token.prototype;

  _proto.range = function range(endToken, // last token of the range, inclusive
  text) // the text of the newly constructed token
  {
    return new Token(text, SourceLocation.range(this, endToken));
  };

  return Token;
}();
// CONCATENATED MODULE: ./src/ParseError.js


/**
 * This is the ParseError class, which is the main error thrown by KaTeX
 * functions when something has gone wrong. This is used to distinguish internal
 * errors from errors in the expression that the user provided.
 *
 * If possible, a caller should provide a Token or ParseNode with information
 * about where in the source string the problem occurred.
 */
var ParseError = // Error position based on passed-in Token or ParseNode.
function ParseError(message, // The error message
token) // An object providing position information
{
  this.position = void 0;
  var error = "KaTeX parse error: " + message;
  var start;
  var loc = token && token.loc;

  if (loc && loc.start <= loc.end) {
    // If we have the input and a position, make the error a bit fancier
    // Get the input
    var input = loc.lexer.input; // Prepend some information

    start = loc.start;
    var end = loc.end;

    if (start === input.length) {
      error += " at end of input: ";
    } else {
      error += " at position " + (start + 1) + ": ";
    } // Underline token in question using combining underscores


    var underlined = input.slice(start, end).replace(/[^]/g, "$&\u0332"); // Extract some context from the input and add it to the error

    var left;

    if (start > 15) {
      left = "…" + input.slice(start - 15, start);
    } else {
      left = input.slice(0, start);
    }

    var right;

    if (end + 15 < input.length) {
      right = input.slice(end, end + 15) + "…";
    } else {
      right = input.slice(end);
    }

    error += left + underlined + right;
  } // Some hackery to make ParseError a prototype of Error
  // See http://stackoverflow.com/a/8460753


  var self = new Error(error);
  self.name = "ParseError"; // $FlowFixMe

  self.__proto__ = ParseError.prototype; // $FlowFixMe

  self.position = start;
  return self;
}; // $FlowFixMe More hackery


ParseError.prototype.__proto__ = Error.prototype;
/* harmony default export */ var src_ParseError = (ParseError);
// CONCATENATED MODULE: ./src/utils.js
/**
 * This file contains a list of utility functions which are useful in other
 * files.
 */

/**
 * Return whether an element is contained in a list
 */
var contains = function contains(list, elem) {
  return list.indexOf(elem) !== -1;
};
/**
 * Provide a default value if a setting is undefined
 * NOTE: Couldn't use `T` as the output type due to facebook/flow#5022.
 */


var deflt = function deflt(setting, defaultIfUndefined) {
  return setting === undefined ? defaultIfUndefined : setting;
}; // hyphenate and escape adapted from Facebook's React under Apache 2 license


var uppercase = /([A-Z])/g;

var hyphenate = function hyphenate(str) {
  return str.replace(uppercase, "-$1").toLowerCase();
};

var ESCAPE_LOOKUP = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  "\"": "&quot;",
  "'": "&#x27;"
};
var ESCAPE_REGEX = /[&><"']/g;
/**
 * Escapes text to prevent scripting attacks.
 */

function utils_escape(text) {
  return String(text).replace(ESCAPE_REGEX, function (match) {
    return ESCAPE_LOOKUP[match];
  });
}
/**
 * Sometimes we want to pull out the innermost element of a group. In most
 * cases, this will just be the group itself, but when ordgroups and colors have
 * a single element, we want to pull that out.
 */


var getBaseElem = function getBaseElem(group) {
  if (group.type === "ordgroup") {
    if (group.body.length === 1) {
      return getBaseElem(group.body[0]);
    } else {
      return group;
    }
  } else if (group.type === "color") {
    if (group.body.length === 1) {
      return getBaseElem(group.body[0]);
    } else {
      return group;
    }
  } else if (group.type === "font") {
    return getBaseElem(group.body);
  } else {
    return group;
  }
};
/**
 * TeXbook algorithms often reference "character boxes", which are simply groups
 * with a single character in them. To decide if something is a character box,
 * we find its innermost group, and see if it is a single character.
 */


var utils_isCharacterBox = function isCharacterBox(group) {
  var baseElem = getBaseElem(group); // These are all they types of groups which hold single characters

  return baseElem.type === "mathord" || baseElem.type === "textord" || baseElem.type === "atom";
};

var assert = function assert(value) {
  if (!value) {
    throw new Error('Expected non-null, but got ' + String(value));
  }

  return value;
};
/**
 * Return the protocol of a URL, or "_relative" if the URL does not specify a
 * protocol (and thus is relative).
 */

var protocolFromUrl = function protocolFromUrl(url) {
  var protocol = /^\s*([^\\/#]*?)(?::|&#0*58|&#x0*3a)/i.exec(url);
  return protocol != null ? protocol[1] : "_relative";
};
/* harmony default export */ var utils = ({
  contains: contains,
  deflt: deflt,
  escape: utils_escape,
  hyphenate: hyphenate,
  getBaseElem: getBaseElem,
  isCharacterBox: utils_isCharacterBox,
  protocolFromUrl: protocolFromUrl
});
// CONCATENATED MODULE: ./src/Settings.js
/* eslint no-console:0 */

/**
 * This is a module for storing settings passed into KaTeX. It correctly handles
 * default settings.
 */




/**
 * The main Settings object
 *
 * The current options stored are:
 *  - displayMode: Whether the expression should be typeset as inline math
 *                 (false, the default), meaning that the math starts in
 *                 \textstyle and is placed in an inline-block); or as display
 *                 math (true), meaning that the math starts in \displaystyle
 *                 and is placed in a block with vertical margin.
 */
var Settings_Settings =
/*#__PURE__*/
function () {
  function Settings(options) {
    this.displayMode = void 0;
    this.output = void 0;
    this.leqno = void 0;
    this.fleqn = void 0;
    this.throwOnError = void 0;
    this.errorColor = void 0;
    this.macros = void 0;
    this.minRuleThickness = void 0;
    this.colorIsTextColor = void 0;
    this.strict = void 0;
    this.trust = void 0;
    this.maxSize = void 0;
    this.maxExpand = void 0;
    // allow null options
    options = options || {};
    this.displayMode = utils.deflt(options.displayMode, false);
    this.output = utils.deflt(options.output, "htmlAndMathml");
    this.leqno = utils.deflt(options.leqno, false);
    this.fleqn = utils.deflt(options.fleqn, false);
    this.throwOnError = utils.deflt(options.throwOnError, true);
    this.errorColor = utils.deflt(options.errorColor, "#cc0000");
    this.macros = options.macros || {};
    this.minRuleThickness = Math.max(0, utils.deflt(options.minRuleThickness, 0));
    this.colorIsTextColor = utils.deflt(options.colorIsTextColor, false);
    this.strict = utils.deflt(options.strict, "warn");
    this.trust = utils.deflt(options.trust, false);
    this.maxSize = Math.max(0, utils.deflt(options.maxSize, Infinity));
    this.maxExpand = Math.max(0, utils.deflt(options.maxExpand, 1000));
  }
  /**
   * Report nonstrict (non-LaTeX-compatible) input.
   * Can safely not be called if `this.strict` is false in JavaScript.
   */


  var _proto = Settings.prototype;

  _proto.reportNonstrict = function reportNonstrict(errorCode, errorMsg, token) {
    var strict = this.strict;

    if (typeof strict === "function") {
      // Allow return value of strict function to be boolean or string
      // (or null/undefined, meaning no further processing).
      strict = strict(errorCode, errorMsg, token);
    }

    if (!strict || strict === "ignore") {
      return;
    } else if (strict === true || strict === "error") {
      throw new src_ParseError("LaTeX-incompatible input and strict mode is set to 'error': " + (errorMsg + " [" + errorCode + "]"), token);
    } else if (strict === "warn") {
      typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + (errorMsg + " [" + errorCode + "]"));
    } else {
      // won't happen in type-safe code
      typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to " + ("unrecognized '" + strict + "': " + errorMsg + " [" + errorCode + "]"));
    }
  }
  /**
   * Check whether to apply strict (LaTeX-adhering) behavior for unusual
   * input (like `\\`).  Unlike `nonstrict`, will not throw an error;
   * instead, "error" translates to a return value of `true`, while "ignore"
   * translates to a return value of `false`.  May still print a warning:
   * "warn" prints a warning and returns `false`.
   * This is for the second category of `errorCode`s listed in the README.
   */
  ;

  _proto.useStrictBehavior = function useStrictBehavior(errorCode, errorMsg, token) {
    var strict = this.strict;

    if (typeof strict === "function") {
      // Allow return value of strict function to be boolean or string
      // (or null/undefined, meaning no further processing).
      // But catch any exceptions thrown by function, treating them
      // like "error".
      try {
        strict = strict(errorCode, errorMsg, token);
      } catch (error) {
        strict = "error";
      }
    }

    if (!strict || strict === "ignore") {
      return false;
    } else if (strict === true || strict === "error") {
      return true;
    } else if (strict === "warn") {
      typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + (errorMsg + " [" + errorCode + "]"));
      return false;
    } else {
      // won't happen in type-safe code
      typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to " + ("unrecognized '" + strict + "': " + errorMsg + " [" + errorCode + "]"));
      return false;
    }
  }
  /**
   * Check whether to test potentially dangerous input, and return
   * `true` (trusted) or `false` (untrusted).  The sole argument `context`
   * should be an object with `command` field specifying the relevant LaTeX
   * command (as a string starting with `\`), and any other arguments, etc.
   * If `context` has a `url` field, a `protocol` field will automatically
   * get added by this function (changing the specified object).
   */
  ;

  _proto.isTrusted = function isTrusted(context) {
    if (context.url && !context.protocol) {
      context.protocol = utils.protocolFromUrl(context.url);
    }

    var trust = typeof this.trust === "function" ? this.trust(context) : this.trust;
    return Boolean(trust);
  };

  return Settings;
}();


// CONCATENATED MODULE: ./src/Style.js
/**
 * This file contains information and classes for the various kinds of styles
 * used in TeX. It provides a generic `Style` class, which holds information
 * about a specific style. It then provides instances of all the different kinds
 * of styles possible, and provides functions to move between them and get
 * information about them.
 */

/**
 * The main style class. Contains a unique id for the style, a size (which is
 * the same for cramped and uncramped version of a style), and a cramped flag.
 */
var Style =
/*#__PURE__*/
function () {
  function Style(id, size, cramped) {
    this.id = void 0;
    this.size = void 0;
    this.cramped = void 0;
    this.id = id;
    this.size = size;
    this.cramped = cramped;
  }
  /**
   * Get the style of a superscript given a base in the current style.
   */


  var _proto = Style.prototype;

  _proto.sup = function sup() {
    return Style_styles[_sup[this.id]];
  }
  /**
   * Get the style of a subscript given a base in the current style.
   */
  ;

  _proto.sub = function sub() {
    return Style_styles[_sub[this.id]];
  }
  /**
   * Get the style of a fraction numerator given the fraction in the current
   * style.
   */
  ;

  _proto.fracNum = function fracNum() {
    return Style_styles[_fracNum[this.id]];
  }
  /**
   * Get the style of a fraction denominator given the fraction in the current
   * style.
   */
  ;

  _proto.fracDen = function fracDen() {
    return Style_styles[_fracDen[this.id]];
  }
  /**
   * Get the cramped version of a style (in particular, cramping a cramped style
   * doesn't change the style).
   */
  ;

  _proto.cramp = function cramp() {
    return Style_styles[_cramp[this.id]];
  }
  /**
   * Get a text or display version of this style.
   */
  ;

  _proto.text = function text() {
    return Style_styles[_text[this.id]];
  }
  /**
   * Return true if this style is tightly spaced (scriptstyle/scriptscriptstyle)
   */
  ;

  _proto.isTight = function isTight() {
    return this.size >= 2;
  };

  return Style;
}(); // Export an interface for type checking, but don't expose the implementation.
// This way, no more styles can be generated.


// IDs of the different styles
var D = 0;
var Dc = 1;
var T = 2;
var Tc = 3;
var S = 4;
var Sc = 5;
var SS = 6;
var SSc = 7; // Instances of the different styles

var Style_styles = [new Style(D, 0, false), new Style(Dc, 0, true), new Style(T, 1, false), new Style(Tc, 1, true), new Style(S, 2, false), new Style(Sc, 2, true), new Style(SS, 3, false), new Style(SSc, 3, true)]; // Lookup tables for switching from one style to another

var _sup = [S, Sc, S, Sc, SS, SSc, SS, SSc];
var _sub = [Sc, Sc, Sc, Sc, SSc, SSc, SSc, SSc];
var _fracNum = [T, Tc, S, Sc, SS, SSc, SS, SSc];
var _fracDen = [Tc, Tc, Sc, Sc, SSc, SSc, SSc, SSc];
var _cramp = [Dc, Dc, Tc, Tc, Sc, Sc, SSc, SSc];
var _text = [D, Dc, T, Tc, T, Tc, T, Tc]; // We only export some of the styles.

/* harmony default export */ var src_Style = ({
  DISPLAY: Style_styles[D],
  TEXT: Style_styles[T],
  SCRIPT: Style_styles[S],
  SCRIPTSCRIPT: Style_styles[SS]
});
// CONCATENATED MODULE: ./src/unicodeScripts.js
/*
 * This file defines the Unicode scripts and script families that we
 * support. To add new scripts or families, just add a new entry to the
 * scriptData array below. Adding scripts to the scriptData array allows
 * characters from that script to appear in \text{} environments.
 */

/**
 * Each script or script family has a name and an array of blocks.
 * Each block is an array of two numbers which specify the start and
 * end points (inclusive) of a block of Unicode codepoints.
 */

/**
 * Unicode block data for the families of scripts we support in \text{}.
 * Scripts only need to appear here if they do not have font metrics.
 */
var scriptData = [{
  // Latin characters beyond the Latin-1 characters we have metrics for.
  // Needed for Czech, Hungarian and Turkish text, for example.
  name: 'latin',
  blocks: [[0x0100, 0x024f], // Latin Extended-A and Latin Extended-B
  [0x0300, 0x036f]]
}, {
  // The Cyrillic script used by Russian and related languages.
  // A Cyrillic subset used to be supported as explicitly defined
  // symbols in symbols.js
  name: 'cyrillic',
  blocks: [[0x0400, 0x04ff]]
}, {
  // The Brahmic scripts of South and Southeast Asia
  // Devanagari (0900–097F)
  // Bengali (0980–09FF)
  // Gurmukhi (0A00–0A7F)
  // Gujarati (0A80–0AFF)
  // Oriya (0B00–0B7F)
  // Tamil (0B80–0BFF)
  // Telugu (0C00–0C7F)
  // Kannada (0C80–0CFF)
  // Malayalam (0D00–0D7F)
  // Sinhala (0D80–0DFF)
  // Thai (0E00–0E7F)
  // Lao (0E80–0EFF)
  // Tibetan (0F00–0FFF)
  // Myanmar (1000–109F)
  name: 'brahmic',
  blocks: [[0x0900, 0x109F]]
}, {
  name: 'georgian',
  blocks: [[0x10A0, 0x10ff]]
}, {
  // Chinese and Japanese.
  // The "k" in cjk is for Korean, but we've separated Korean out
  name: "cjk",
  blocks: [[0x3000, 0x30FF], // CJK symbols and punctuation, Hiragana, Katakana
  [0x4E00, 0x9FAF], // CJK ideograms
  [0xFF00, 0xFF60]]
}, {
  // Korean
  name: 'hangul',
  blocks: [[0xAC00, 0xD7AF]]
}];
/**
 * Given a codepoint, return the name of the script or script family
 * it is from, or null if it is not part of a known block
 */

function scriptFromCodepoint(codepoint) {
  for (var i = 0; i < scriptData.length; i++) {
    var script = scriptData[i];

    for (var _i = 0; _i < script.blocks.length; _i++) {
      var block = script.blocks[_i];

      if (codepoint >= block[0] && codepoint <= block[1]) {
        return script.name;
      }
    }
  }

  return null;
}
/**
 * A flattened version of all the supported blocks in a single array.
 * This is an optimization to make supportedCodepoint() fast.
 */

var allBlocks = [];
scriptData.forEach(function (s) {
  return s.blocks.forEach(function (b) {
    return allBlocks.push.apply(allBlocks, b);
  });
});
/**
 * Given a codepoint, return true if it falls within one of the
 * scripts or script families defined above and false otherwise.
 *
 * Micro benchmarks shows that this is faster than
 * /[\u3000-\u30FF\u4E00-\u9FAF\uFF00-\uFF60\uAC00-\uD7AF\u0900-\u109F]/.test()
 * in Firefox, Chrome and Node.
 */

function supportedCodepoint(codepoint) {
  for (var i = 0; i < allBlocks.length; i += 2) {
    if (codepoint >= allBlocks[i] && codepoint <= allBlocks[i + 1]) {
      return true;
    }
  }

  return false;
}
// CONCATENATED MODULE: ./src/svgGeometry.js
/**
 * This file provides support to domTree.js and delimiter.js.
 * It's a storehouse of path geometry for SVG images.
 */
// In all paths below, the viewBox-to-em scale is 1000:1.
var hLinePad = 80; // padding above a sqrt viniculum. Prevents image cropping.
// The viniculum of a \sqrt can be made thicker by a KaTeX rendering option.
// Think of variable extraViniculum as two detours in the SVG path.
// The detour begins at the lower left of the area labeled extraViniculum below.
// The detour proceeds one extraViniculum distance up and slightly to the right,
// displacing the radiused corner between surd and viniculum. The radius is
// traversed as usual, then the detour resumes. It goes right, to the end of
// the very long viniculumn, then down one extraViniculum distance,
// after which it resumes regular path geometry for the radical.

/*                                                  viniculum
                                                   /
         /▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒←extraViniculum
        / █████████████████████←0.04em (40 unit) std viniculum thickness
       / /
      / /
     / /\
    / / surd
*/

var sqrtMain = function sqrtMain(extraViniculum, hLinePad) {
  // sqrtMain path geometry is from glyph U221A in the font KaTeX Main
  return "M95," + (622 + extraViniculum + hLinePad) + "\nc-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14\nc0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54\nc44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10\ns173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429\nc69,-144,104.5,-217.7,106.5,-221\nl" + extraViniculum / 2.075 + " -" + extraViniculum + "\nc5.3,-9.3,12,-14,20,-14\nH400000v" + (40 + extraViniculum) + "H845.2724\ns-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7\nc-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z\nM" + (834 + extraViniculum) + " " + hLinePad + "h400000v" + (40 + extraViniculum) + "h-400000z";
};

var sqrtSize1 = function sqrtSize1(extraViniculum, hLinePad) {
  // size1 is from glyph U221A in the font KaTeX_Size1-Regular
  return "M263," + (601 + extraViniculum + hLinePad) + "c0.7,0,18,39.7,52,119\nc34,79.3,68.167,158.7,102.5,238c34.3,79.3,51.8,119.3,52.5,120\nc340,-704.7,510.7,-1060.3,512,-1067\nl" + extraViniculum / 2.084 + " -" + extraViniculum + "\nc4.7,-7.3,11,-11,19,-11\nH40000v" + (40 + extraViniculum) + "H1012.3\ns-271.3,567,-271.3,567c-38.7,80.7,-84,175,-136,283c-52,108,-89.167,185.3,-111.5,232\nc-22.3,46.7,-33.8,70.3,-34.5,71c-4.7,4.7,-12.3,7,-23,7s-12,-1,-12,-1\ns-109,-253,-109,-253c-72.7,-168,-109.3,-252,-110,-252c-10.7,8,-22,16.7,-34,26\nc-22,17.3,-33.3,26,-34,26s-26,-26,-26,-26s76,-59,76,-59s76,-60,76,-60z\nM" + (1001 + extraViniculum) + " " + hLinePad + "h400000v" + (40 + extraViniculum) + "h-400000z";
};

var sqrtSize2 = function sqrtSize2(extraViniculum, hLinePad) {
  // size2 is from glyph U221A in the font KaTeX_Size2-Regular
  return "M983 " + (10 + extraViniculum + hLinePad) + "\nl" + extraViniculum / 3.13 + " -" + extraViniculum + "\nc4,-6.7,10,-10,18,-10 H400000v" + (40 + extraViniculum) + "\nH1013.1s-83.4,268,-264.1,840c-180.7,572,-277,876.3,-289,913c-4.7,4.7,-12.7,7,-24,7\ns-12,0,-12,0c-1.3,-3.3,-3.7,-11.7,-7,-25c-35.3,-125.3,-106.7,-373.3,-214,-744\nc-10,12,-21,25,-33,39s-32,39,-32,39c-6,-5.3,-15,-14,-27,-26s25,-30,25,-30\nc26.7,-32.7,52,-63,76,-91s52,-60,52,-60s208,722,208,722\nc56,-175.3,126.3,-397.3,211,-666c84.7,-268.7,153.8,-488.2,207.5,-658.5\nc53.7,-170.3,84.5,-266.8,92.5,-289.5z\nM" + (1001 + extraViniculum) + " " + hLinePad + "h400000v" + (40 + extraViniculum) + "h-400000z";
};

var sqrtSize3 = function sqrtSize3(extraViniculum, hLinePad) {
  // size3 is from glyph U221A in the font KaTeX_Size3-Regular
  return "M424," + (2398 + extraViniculum + hLinePad) + "\nc-1.3,-0.7,-38.5,-172,-111.5,-514c-73,-342,-109.8,-513.3,-110.5,-514\nc0,-2,-10.7,14.3,-32,49c-4.7,7.3,-9.8,15.7,-15.5,25c-5.7,9.3,-9.8,16,-12.5,20\ns-5,7,-5,7c-4,-3.3,-8.3,-7.7,-13,-13s-13,-13,-13,-13s76,-122,76,-122s77,-121,77,-121\ns209,968,209,968c0,-2,84.7,-361.7,254,-1079c169.3,-717.3,254.7,-1077.7,256,-1081\nl" + extraViniculum / 4.223 + " -" + extraViniculum + "c4,-6.7,10,-10,18,-10 H400000\nv" + (40 + extraViniculum) + "H1014.6\ns-87.3,378.7,-272.6,1166c-185.3,787.3,-279.3,1182.3,-282,1185\nc-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2z M" + (1001 + extraViniculum) + " " + hLinePad + "\nh400000v" + (40 + extraViniculum) + "h-400000z";
};

var sqrtSize4 = function sqrtSize4(extraViniculum, hLinePad) {
  // size4 is from glyph U221A in the font KaTeX_Size4-Regular
  return "M473," + (2713 + extraViniculum + hLinePad) + "\nc339.3,-1799.3,509.3,-2700,510,-2702 l" + extraViniculum / 5.298 + " -" + extraViniculum + "\nc3.3,-7.3,9.3,-11,18,-11 H400000v" + (40 + extraViniculum) + "H1017.7\ns-90.5,478,-276.2,1466c-185.7,988,-279.5,1483,-281.5,1485c-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2c0,-1.3,-5.3,-32,-16,-92c-50.7,-293.3,-119.7,-693.3,-207,-1200\nc0,-1.3,-5.3,8.7,-16,30c-10.7,21.3,-21.3,42.7,-32,64s-16,33,-16,33s-26,-26,-26,-26\ns76,-153,76,-153s77,-151,77,-151c0.7,0.7,35.7,202,105,604c67.3,400.7,102,602.7,104,\n606zM" + (1001 + extraViniculum) + " " + hLinePad + "h400000v" + (40 + extraViniculum) + "H1017.7z";
};

var sqrtTall = function sqrtTall(extraViniculum, hLinePad, viewBoxHeight) {
  // sqrtTall is from glyph U23B7 in the font KaTeX_Size4-Regular
  // One path edge has a variable length. It runs vertically from the viniculumn
  // to a point near (14 units) the bottom of the surd. The viniculum
  // is normally 40 units thick. So the length of the line in question is:
  var vertSegment = viewBoxHeight - 54 - hLinePad - extraViniculum;
  return "M702 " + (extraViniculum + hLinePad) + "H400000" + (40 + extraViniculum) + "\nH742v" + vertSegment + "l-4 4-4 4c-.667.7 -2 1.5-4 2.5s-4.167 1.833-6.5 2.5-5.5 1-9.5 1\nh-12l-28-84c-16.667-52-96.667 -294.333-240-727l-212 -643 -85 170\nc-4-3.333-8.333-7.667-13 -13l-13-13l77-155 77-156c66 199.333 139 419.667\n219 661 l218 661zM702 " + hLinePad + "H400000v" + (40 + extraViniculum) + "H742z";
};

var sqrtPath = function sqrtPath(size, extraViniculum, viewBoxHeight) {
  extraViniculum = 1000 * extraViniculum; // Convert from document ems to viewBox.

  var path = "";

  switch (size) {
    case "sqrtMain":
      path = sqrtMain(extraViniculum, hLinePad);
      break;

    case "sqrtSize1":
      path = sqrtSize1(extraViniculum, hLinePad);
      break;

    case "sqrtSize2":
      path = sqrtSize2(extraViniculum, hLinePad);
      break;

    case "sqrtSize3":
      path = sqrtSize3(extraViniculum, hLinePad);
      break;

    case "sqrtSize4":
      path = sqrtSize4(extraViniculum, hLinePad);
      break;

    case "sqrtTall":
      path = sqrtTall(extraViniculum, hLinePad, viewBoxHeight);
  }

  return path;
};
var svgGeometry_path = {
  // The doubleleftarrow geometry is from glyph U+21D0 in the font KaTeX Main
  doubleleftarrow: "M262 157\nl10-10c34-36 62.7-77 86-123 3.3-8 5-13.3 5-16 0-5.3-6.7-8-20-8-7.3\n 0-12.2.5-14.5 1.5-2.3 1-4.8 4.5-7.5 10.5-49.3 97.3-121.7 169.3-217 216-28\n 14-57.3 25-88 33-6.7 2-11 3.8-13 5.5-2 1.7-3 4.2-3 7.5s1 5.8 3 7.5\nc2 1.7 6.3 3.5 13 5.5 68 17.3 128.2 47.8 180.5 91.5 52.3 43.7 93.8 96.2 124.5\n 157.5 9.3 8 15.3 12.3 18 13h6c12-.7 18-4 18-10 0-2-1.7-7-5-15-23.3-46-52-87\n-86-123l-10-10h399738v-40H218c328 0 0 0 0 0l-10-8c-26.7-20-65.7-43-117-69 2.7\n-2 6-3.7 10-5 36.7-16 72.3-37.3 107-64l10-8h399782v-40z\nm8 0v40h399730v-40zm0 194v40h399730v-40z",
  // doublerightarrow is from glyph U+21D2 in font KaTeX Main
  doublerightarrow: "M399738 392l\n-10 10c-34 36-62.7 77-86 123-3.3 8-5 13.3-5 16 0 5.3 6.7 8 20 8 7.3 0 12.2-.5\n 14.5-1.5 2.3-1 4.8-4.5 7.5-10.5 49.3-97.3 121.7-169.3 217-216 28-14 57.3-25 88\n-33 6.7-2 11-3.8 13-5.5 2-1.7 3-4.2 3-7.5s-1-5.8-3-7.5c-2-1.7-6.3-3.5-13-5.5-68\n-17.3-128.2-47.8-180.5-91.5-52.3-43.7-93.8-96.2-124.5-157.5-9.3-8-15.3-12.3-18\n-13h-6c-12 .7-18 4-18 10 0 2 1.7 7 5 15 23.3 46 52 87 86 123l10 10H0v40h399782\nc-328 0 0 0 0 0l10 8c26.7 20 65.7 43 117 69-2.7 2-6 3.7-10 5-36.7 16-72.3 37.3\n-107 64l-10 8H0v40zM0 157v40h399730v-40zm0 194v40h399730v-40z",
  // leftarrow is from glyph U+2190 in font KaTeX Main
  leftarrow: "M400000 241H110l3-3c68.7-52.7 113.7-120\n 135-202 4-14.7 6-23 6-25 0-7.3-7-11-21-11-8 0-13.2.8-15.5 2.5-2.3 1.7-4.2 5.8\n-5.5 12.5-1.3 4.7-2.7 10.3-4 17-12 48.7-34.8 92-68.5 130S65.3 228.3 18 247\nc-10 4-16 7.7-18 11 0 8.7 6 14.3 18 17 47.3 18.7 87.8 47 121.5 85S196 441.3 208\n 490c.7 2 1.3 5 2 9s1.2 6.7 1.5 8c.3 1.3 1 3.3 2 6s2.2 4.5 3.5 5.5c1.3 1 3.3\n 1.8 6 2.5s6 1 10 1c14 0 21-3.7 21-11 0-2-2-10.3-6-25-20-79.3-65-146.7-135-202\n l-3-3h399890zM100 241v40h399900v-40z",
  // overbrace is from glyphs U+23A9/23A8/23A7 in font KaTeX_Size4-Regular
  leftbrace: "M6 548l-6-6v-35l6-11c56-104 135.3-181.3 238-232 57.3-28.7 117\n-45 179-50h399577v120H403c-43.3 7-81 15-113 26-100.7 33-179.7 91-237 174-2.7\n 5-6 9-10 13-.7 1-7.3 1-20 1H6z",
  leftbraceunder: "M0 6l6-6h17c12.688 0 19.313.3 20 1 4 4 7.313 8.3 10 13\n 35.313 51.3 80.813 93.8 136.5 127.5 55.688 33.7 117.188 55.8 184.5 66.5.688\n 0 2 .3 4 1 18.688 2.7 76 4.3 172 5h399450v120H429l-6-1c-124.688-8-235-61.7\n-331-161C60.687 138.7 32.312 99.3 7 54L0 41V6z",
  // overgroup is from the MnSymbol package (public domain)
  leftgroup: "M400000 80\nH435C64 80 168.3 229.4 21 260c-5.9 1.2-18 0-18 0-2 0-3-1-3-3v-38C76 61 257 0\n 435 0h399565z",
  leftgroupunder: "M400000 262\nH435C64 262 168.3 112.6 21 82c-5.9-1.2-18 0-18 0-2 0-3 1-3 3v38c76 158 257 219\n 435 219h399565z",
  // Harpoons are from glyph U+21BD in font KaTeX Main
  leftharpoon: "M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3\n-3.3 10.2-9.5 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5\n-18.3 3-21-1.3-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7\n-196 228-6.7 4.7-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40z",
  leftharpoonplus: "M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3-3.3 10.2-9.5\n 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5-18.3 3-21-1.3\n-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7-196 228-6.7 4.7\n-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40zM0 435v40h400000v-40z\nm0 0v40h400000v-40z",
  leftharpoondown: "M7 241c-4 4-6.333 8.667-7 14 0 5.333.667 9 2 11s5.333\n 5.333 12 10c90.667 54 156 130 196 228 3.333 10.667 6.333 16.333 9 17 2 .667 5\n 1 9 1h5c10.667 0 16.667-2 18-6 2-2.667 1-9.667-3-21-32-87.333-82.667-157.667\n-152-211l-3-3h399907v-40zM93 281 H400000 v-40L7 241z",
  leftharpoondownplus: "M7 435c-4 4-6.3 8.7-7 14 0 5.3.7 9 2 11s5.3 5.3 12\n 10c90.7 54 156 130 196 228 3.3 10.7 6.3 16.3 9 17 2 .7 5 1 9 1h5c10.7 0 16.7\n-2 18-6 2-2.7 1-9.7-3-21-32-87.3-82.7-157.7-152-211l-3-3h399907v-40H7zm93 0\nv40h399900v-40zM0 241v40h399900v-40zm0 0v40h399900v-40z",
  // hook is from glyph U+21A9 in font KaTeX Main
  lefthook: "M400000 281 H103s-33-11.2-61-33.5S0 197.3 0 164s14.2-61.2 42.5\n-83.5C70.8 58.2 104 47 142 47 c16.7 0 25 6.7 25 20 0 12-8.7 18.7-26 20-40 3.3\n-68.7 15.7-86 37-10 12-15 25.3-15 40 0 22.7 9.8 40.7 29.5 54 19.7 13.3 43.5 21\n 71.5 23h399859zM103 281v-40h399897v40z",
  leftlinesegment: "M40 281 V428 H0 V94 H40 V241 H400000 v40z\nM40 281 V428 H0 V94 H40 V241 H400000 v40z",
  leftmapsto: "M40 281 V448H0V74H40V241H400000v40z\nM40 281 V448H0V74H40V241H400000v40z",
  // tofrom is from glyph U+21C4 in font KaTeX AMS Regular
  leftToFrom: "M0 147h400000v40H0zm0 214c68 40 115.7 95.7 143 167h22c15.3 0 23\n-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69-70-101l-7-8h399905v-40H95l7-8\nc28.7-32 52-65.7 70-101 10.7-23.3 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 265.3\n 68 321 0 361zm0-174v-40h399900v40zm100 154v40h399900v-40z",
  longequal: "M0 50 h400000 v40H0z m0 194h40000v40H0z\nM0 50 h400000 v40H0z m0 194h40000v40H0z",
  midbrace: "M200428 334\nc-100.7-8.3-195.3-44-280-108-55.3-42-101.7-93-139-153l-9-14c-2.7 4-5.7 8.7-9 14\n-53.3 86.7-123.7 153-211 199-66.7 36-137.3 56.3-212 62H0V214h199568c178.3-11.7\n 311.7-78.3 403-201 6-8 9.7-12 11-12 .7-.7 6.7-1 18-1s17.3.3 18 1c1.3 0 5 4 11\n 12 44.7 59.3 101.3 106.3 170 141s145.3 54.3 229 60h199572v120z",
  midbraceunder: "M199572 214\nc100.7 8.3 195.3 44 280 108 55.3 42 101.7 93 139 153l9 14c2.7-4 5.7-8.7 9-14\n 53.3-86.7 123.7-153 211-199 66.7-36 137.3-56.3 212-62h199568v120H200432c-178.3\n 11.7-311.7 78.3-403 201-6 8-9.7 12-11 12-.7.7-6.7 1-18 1s-17.3-.3-18-1c-1.3 0\n-5-4-11-12-44.7-59.3-101.3-106.3-170-141s-145.3-54.3-229-60H0V214z",
  oiintSize1: "M512.6 71.6c272.6 0 320.3 106.8 320.3 178.2 0 70.8-47.7 177.6\n-320.3 177.6S193.1 320.6 193.1 249.8c0-71.4 46.9-178.2 319.5-178.2z\nm368.1 178.2c0-86.4-60.9-215.4-368.1-215.4-306.4 0-367.3 129-367.3 215.4 0 85.8\n60.9 214.8 367.3 214.8 307.2 0 368.1-129 368.1-214.8z",
  oiintSize2: "M757.8 100.1c384.7 0 451.1 137.6 451.1 230 0 91.3-66.4 228.8\n-451.1 228.8-386.3 0-452.7-137.5-452.7-228.8 0-92.4 66.4-230 452.7-230z\nm502.4 230c0-111.2-82.4-277.2-502.4-277.2s-504 166-504 277.2\nc0 110 84 276 504 276s502.4-166 502.4-276z",
  oiiintSize1: "M681.4 71.6c408.9 0 480.5 106.8 480.5 178.2 0 70.8-71.6 177.6\n-480.5 177.6S202.1 320.6 202.1 249.8c0-71.4 70.5-178.2 479.3-178.2z\nm525.8 178.2c0-86.4-86.8-215.4-525.7-215.4-437.9 0-524.7 129-524.7 215.4 0\n85.8 86.8 214.8 524.7 214.8 438.9 0 525.7-129 525.7-214.8z",
  oiiintSize2: "M1021.2 53c603.6 0 707.8 165.8 707.8 277.2 0 110-104.2 275.8\n-707.8 275.8-606 0-710.2-165.8-710.2-275.8C311 218.8 415.2 53 1021.2 53z\nm770.4 277.1c0-131.2-126.4-327.6-770.5-327.6S248.4 198.9 248.4 330.1\nc0 130 128.8 326.4 772.7 326.4s770.5-196.4 770.5-326.4z",
  rightarrow: "M0 241v40h399891c-47.3 35.3-84 78-110 128\n-16.7 32-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20\n 11 8 0 13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7\n 39-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85\n-40.5-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n 151.7 139 205zm0 0v40h399900v-40z",
  rightbrace: "M400000 542l\n-6 6h-17c-12.7 0-19.3-.3-20-1-4-4-7.3-8.3-10-13-35.3-51.3-80.8-93.8-136.5-127.5\ns-117.2-55.8-184.5-66.5c-.7 0-2-.3-4-1-18.7-2.7-76-4.3-172-5H0V214h399571l6 1\nc124.7 8 235 61.7 331 161 31.3 33.3 59.7 72.7 85 118l7 13v35z",
  rightbraceunder: "M399994 0l6 6v35l-6 11c-56 104-135.3 181.3-238 232-57.3\n 28.7-117 45-179 50H-300V214h399897c43.3-7 81-15 113-26 100.7-33 179.7-91 237\n-174 2.7-5 6-9 10-13 .7-1 7.3-1 20-1h17z",
  rightgroup: "M0 80h399565c371 0 266.7 149.4 414 180 5.9 1.2 18 0 18 0 2 0\n 3-1 3-3v-38c-76-158-257-219-435-219H0z",
  rightgroupunder: "M0 262h399565c371 0 266.7-149.4 414-180 5.9-1.2 18 0 18\n 0 2 0 3 1 3 3v38c-76 158-257 219-435 219H0z",
  rightharpoon: "M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3\n-3.7-15.3-11-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2\n-10.7 0-16.7 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58\n 69.2 92 94.5zm0 0v40h399900v-40z",
  rightharpoonplus: "M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3-3.7-15.3-11\n-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2-10.7 0-16.7\n 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58 69.2 92 94.5z\nm0 0v40h399900v-40z m100 194v40h399900v-40zm0 0v40h399900v-40z",
  rightharpoondown: "M399747 511c0 7.3 6.7 11 20 11 8 0 13-.8 15-2.5s4.7-6.8\n 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3 8.5-5.8 9.5\n-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3-64.7 57-92 95\n-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 241v40h399900v-40z",
  rightharpoondownplus: "M399747 705c0 7.3 6.7 11 20 11 8 0 13-.8\n 15-2.5s4.7-6.8 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3\n 8.5-5.8 9.5-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3\n-64.7 57-92 95-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 435v40h399900v-40z\nm0-194v40h400000v-40zm0 0v40h400000v-40z",
  righthook: "M399859 241c-764 0 0 0 0 0 40-3.3 68.7-15.7 86-37 10-12 15-25.3\n 15-40 0-22.7-9.8-40.7-29.5-54-19.7-13.3-43.5-21-71.5-23-17.3-1.3-26-8-26-20 0\n-13.3 8.7-20 26-20 38 0 71 11.2 99 33.5 0 0 7 5.6 21 16.7 14 11.2 21 33.5 21\n 66.8s-14 61.2-42 83.5c-28 22.3-61 33.5-99 33.5L0 241z M0 281v-40h399859v40z",
  rightlinesegment: "M399960 241 V94 h40 V428 h-40 V281 H0 v-40z\nM399960 241 V94 h40 V428 h-40 V281 H0 v-40z",
  rightToFrom: "M400000 167c-70.7-42-118-97.7-142-167h-23c-15.3 0-23 .3-23\n 1 0 1.3 5.3 13.7 16 37 18 35.3 41.3 69 70 101l7 8H0v40h399905l-7 8c-28.7 32\n-52 65.7-70 101-10.7 23.3-16 35.7-16 37 0 .7 7.7 1 23 1h23c24-69.3 71.3-125 142\n-167z M100 147v40h399900v-40zM0 341v40h399900v-40z",
  // twoheadleftarrow is from glyph U+219E in font KaTeX AMS Regular
  twoheadleftarrow: "M0 167c68 40\n 115.7 95.7 143 167h22c15.3 0 23-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69\n-70-101l-7-8h125l9 7c50.7 39.3 85 86 103 140h46c0-4.7-6.3-18.7-19-42-18-35.3\n-40-67.3-66-96l-9-9h399716v-40H284l9-9c26-28.7 48-60.7 66-96 12.7-23.333 19\n-37.333 19-42h-46c-18 54-52.3 100.7-103 140l-9 7H95l7-8c28.7-32 52-65.7 70-101\n 10.7-23.333 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 71.3 68 127 0 167z",
  twoheadrightarrow: "M400000 167\nc-68-40-115.7-95.7-143-167h-22c-15.3 0-23 .3-23 1 0 1.3 5.3 13.7 16 37 18 35.3\n 41.3 69 70 101l7 8h-125l-9-7c-50.7-39.3-85-86-103-140h-46c0 4.7 6.3 18.7 19 42\n 18 35.3 40 67.3 66 96l9 9H0v40h399716l-9 9c-26 28.7-48 60.7-66 96-12.7 23.333\n-19 37.333-19 42h46c18-54 52.3-100.7 103-140l9-7h125l-7 8c-28.7 32-52 65.7-70\n 101-10.7 23.333-16 35.7-16 37 0 .7 7.7 1 23 1h22c27.3-71.3 75-127 143-167z",
  // tilde1 is a modified version of a glyph from the MnSymbol package
  tilde1: "M200 55.538c-77 0-168 73.953-177 73.953-3 0-7\n-2.175-9-5.437L2 97c-1-2-2-4-2-6 0-4 2-7 5-9l20-12C116 12 171 0 207 0c86 0\n 114 68 191 68 78 0 168-68 177-68 4 0 7 2 9 5l12 19c1 2.175 2 4.35 2 6.525 0\n 4.35-2 7.613-5 9.788l-19 13.05c-92 63.077-116.937 75.308-183 76.128\n-68.267.847-113-73.952-191-73.952z",
  // ditto tilde2, tilde3, & tilde4
  tilde2: "M344 55.266c-142 0-300.638 81.316-311.5 86.418\n-8.01 3.762-22.5 10.91-23.5 5.562L1 120c-1-2-1-3-1-4 0-5 3-9 8-10l18.4-9C160.9\n 31.9 283 0 358 0c148 0 188 122 331 122s314-97 326-97c4 0 8 2 10 7l7 21.114\nc1 2.14 1 3.21 1 4.28 0 5.347-3 9.626-7 10.696l-22.3 12.622C852.6 158.372 751\n 181.476 676 181.476c-149 0-189-126.21-332-126.21z",
  tilde3: "M786 59C457 59 32 175.242 13 175.242c-6 0-10-3.457\n-11-10.37L.15 138c-1-7 3-12 10-13l19.2-6.4C378.4 40.7 634.3 0 804.3 0c337 0\n 411.8 157 746.8 157 328 0 754-112 773-112 5 0 10 3 11 9l1 14.075c1 8.066-.697\n 16.595-6.697 17.492l-21.052 7.31c-367.9 98.146-609.15 122.696-778.15 122.696\n -338 0-409-156.573-744-156.573z",
  tilde4: "M786 58C457 58 32 177.487 13 177.487c-6 0-10-3.345\n-11-10.035L.15 143c-1-7 3-12 10-13l22-6.7C381.2 35 637.15 0 807.15 0c337 0 409\n 177 744 177 328 0 754-127 773-127 5 0 10 3 11 9l1 14.794c1 7.805-3 13.38-9\n 14.495l-20.7 5.574c-366.85 99.79-607.3 139.372-776.3 139.372-338 0-409\n -175.236-744-175.236z",
  // vec is from glyph U+20D7 in font KaTeX Main
  vec: "M377 20c0-5.333 1.833-10 5.5-14S391 0 397 0c4.667 0 8.667 1.667 12 5\n3.333 2.667 6.667 9 10 19 6.667 24.667 20.333 43.667 41 57 7.333 4.667 11\n10.667 11 18 0 6-1 10-3 12s-6.667 5-14 9c-28.667 14.667-53.667 35.667-75 63\n-1.333 1.333-3.167 3.5-5.5 6.5s-4 4.833-5 5.5c-1 .667-2.5 1.333-4.5 2s-4.333 1\n-7 1c-4.667 0-9.167-1.833-13.5-5.5S337 184 337 178c0-12.667 15.667-32.333 47-59\nH213l-171-1c-8.667-6-13-12.333-13-19 0-4.667 4.333-11.333 13-20h359\nc-16-25.333-24-45-24-59z",
  // widehat1 is a modified version of a glyph from the MnSymbol package
  widehat1: "M529 0h5l519 115c5 1 9 5 9 10 0 1-1 2-1 3l-4 22\nc-1 5-5 9-11 9h-2L532 67 19 159h-2c-5 0-9-4-11-9l-5-22c-1-6 2-12 8-13z",
  // ditto widehat2, widehat3, & widehat4
  widehat2: "M1181 0h2l1171 176c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 220h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
  widehat3: "M1181 0h2l1171 236c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 280h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
  widehat4: "M1181 0h2l1171 296c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 340h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
  // widecheck paths are all inverted versions of widehat
  widecheck1: "M529,159h5l519,-115c5,-1,9,-5,9,-10c0,-1,-1,-2,-1,-3l-4,-22c-1,\n-5,-5,-9,-11,-9h-2l-512,92l-513,-92h-2c-5,0,-9,4,-11,9l-5,22c-1,6,2,12,8,13z",
  widecheck2: "M1181,220h2l1171,-176c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,153l-1167,-153h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
  widecheck3: "M1181,280h2l1171,-236c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,213l-1167,-213h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
  widecheck4: "M1181,340h2l1171,-296c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,273l-1167,-273h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
  // The next ten paths support reaction arrows from the mhchem package.
  // Arrows for \ce{<-->} are offset from xAxis by 0.22ex, per mhchem in LaTeX
  // baraboveleftarrow is mostly from from glyph U+2190 in font KaTeX Main
  baraboveleftarrow: "M400000 620h-399890l3 -3c68.7 -52.7 113.7 -120 135 -202\nc4 -14.7 6 -23 6 -25c0 -7.3 -7 -11 -21 -11c-8 0 -13.2 0.8 -15.5 2.5\nc-2.3 1.7 -4.2 5.8 -5.5 12.5c-1.3 4.7 -2.7 10.3 -4 17c-12 48.7 -34.8 92 -68.5 130\ns-74.2 66.3 -121.5 85c-10 4 -16 7.7 -18 11c0 8.7 6 14.3 18 17c47.3 18.7 87.8 47\n121.5 85s56.5 81.3 68.5 130c0.7 2 1.3 5 2 9s1.2 6.7 1.5 8c0.3 1.3 1 3.3 2 6\ns2.2 4.5 3.5 5.5c1.3 1 3.3 1.8 6 2.5s6 1 10 1c14 0 21 -3.7 21 -11\nc0 -2 -2 -10.3 -6 -25c-20 -79.3 -65 -146.7 -135 -202l-3 -3h399890z\nM100 620v40h399900v-40z M0 241v40h399900v-40zM0 241v40h399900v-40z",
  // rightarrowabovebar is mostly from glyph U+2192, KaTeX Main
  rightarrowabovebar: "M0 241v40h399891c-47.3 35.3-84 78-110 128-16.7 32\n-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20 11 8 0\n13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7 39\n-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85-40.5\n-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n151.7 139 205zm96 379h399894v40H0zm0 0h399904v40H0z",
  // The short left harpoon has 0.5em (i.e. 500 units) kern on the left end.
  // Ref from mhchem.sty: \rlap{\raisebox{-.22ex}{$\kern0.5em
  baraboveshortleftharpoon: "M507,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17\nc2,0.7,5,1,9,1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21\nc-32,-87.3,-82.7,-157.7,-152,-211c0,0,-3,-3,-3,-3l399351,0l0,-40\nc-398570,0,-399437,0,-399437,0z M593 435 v40 H399500 v-40z\nM0 281 v-40 H399908 v40z M0 281 v-40 H399908 v40z",
  rightharpoonaboveshortbar: "M0,241 l0,40c399126,0,399993,0,399993,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM0 241 v40 H399908 v-40z M0 475 v-40 H399500 v40z M0 475 v-40 H399500 v40z",
  shortbaraboveleftharpoon: "M7,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17c2,0.7,5,1,9,\n1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21c-32,-87.3,-82.7,-157.7,\n-152,-211c0,0,-3,-3,-3,-3l399907,0l0,-40c-399126,0,-399993,0,-399993,0z\nM93 435 v40 H400000 v-40z M500 241 v40 H400000 v-40z M500 241 v40 H400000 v-40z",
  shortrightharpoonabovebar: "M53,241l0,40c398570,0,399437,0,399437,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM500 241 v40 H399408 v-40z M500 435 v40 H400000 v-40z"
};
// CONCATENATED MODULE: ./src/tree.js


/**
 * This node represents a document fragment, which contains elements, but when
 * placed into the DOM doesn't have any representation itself. It only contains
 * children and doesn't have any DOM node properties.
 */
var tree_DocumentFragment =
/*#__PURE__*/
function () {
  // HtmlDomNode
  // Never used; needed for satisfying interface.
  function DocumentFragment(children) {
    this.children = void 0;
    this.classes = void 0;
    this.height = void 0;
    this.depth = void 0;
    this.maxFontSize = void 0;
    this.style = void 0;
    this.children = children;
    this.classes = [];
    this.height = 0;
    this.depth = 0;
    this.maxFontSize = 0;
    this.style = {};
  }

  var _proto = DocumentFragment.prototype;

  _proto.hasClass = function hasClass(className) {
    return utils.contains(this.classes, className);
  }
  /** Convert the fragment into a node. */
  ;

  _proto.toNode = function toNode() {
    var frag = document.createDocumentFragment();

    for (var i = 0; i < this.children.length; i++) {
      frag.appendChild(this.children[i].toNode());
    }

    return frag;
  }
  /** Convert the fragment into HTML markup. */
  ;

  _proto.toMarkup = function toMarkup() {
    var markup = ""; // Simply concatenate the markup for the children together.

    for (var i = 0; i < this.children.length; i++) {
      markup += this.children[i].toMarkup();
    }

    return markup;
  }
  /**
   * Converts the math node into a string, similar to innerText. Applies to
   * MathDomNode's only.
   */
  ;

  _proto.toText = function toText() {
    // To avoid this, we would subclass documentFragment separately for
    // MathML, but polyfills for subclassing is expensive per PR 1469.
    // $FlowFixMe: Only works for ChildType = MathDomNode.
    var toText = function toText(child) {
      return child.toText();
    };

    return this.children.map(toText).join("");
  };

  return DocumentFragment;
}();
// CONCATENATED MODULE: ./src/domTree.js
/**
 * These objects store the data about the DOM nodes we create, as well as some
 * extra data. They can then be transformed into real DOM nodes with the
 * `toNode` function or HTML markup using `toMarkup`. They are useful for both
 * storing extra properties on the nodes, as well as providing a way to easily
 * work with the DOM.
 *
 * Similar functions for working with MathML nodes exist in mathMLTree.js.
 *
 * TODO: refactor `span` and `anchor` into common superclass when
 * target environments support class inheritance
 */





/**
 * Create an HTML className based on a list of classes. In addition to joining
 * with spaces, we also remove empty classes.
 */
var createClass = function createClass(classes) {
  return classes.filter(function (cls) {
    return cls;
  }).join(" ");
};

var initNode = function initNode(classes, options, style) {
  this.classes = classes || [];
  this.attributes = {};
  this.height = 0;
  this.depth = 0;
  this.maxFontSize = 0;
  this.style = style || {};

  if (options) {
    if (options.style.isTight()) {
      this.classes.push("mtight");
    }

    var color = options.getColor();

    if (color) {
      this.style.color = color;
    }
  }
};
/**
 * Convert into an HTML node
 */


var _toNode = function toNode(tagName) {
  var node = document.createElement(tagName); // Apply the class

  node.className = createClass(this.classes); // Apply inline styles

  for (var style in this.style) {
    if (this.style.hasOwnProperty(style)) {
      // $FlowFixMe Flow doesn't seem to understand span.style's type.
      node.style[style] = this.style[style];
    }
  } // Apply attributes


  for (var attr in this.attributes) {
    if (this.attributes.hasOwnProperty(attr)) {
      node.setAttribute(attr, this.attributes[attr]);
    }
  } // Append the children, also as HTML nodes


  for (var i = 0; i < this.children.length; i++) {
    node.appendChild(this.children[i].toNode());
  }

  return node;
};
/**
 * Convert into an HTML markup string
 */


var _toMarkup = function toMarkup(tagName) {
  var markup = "<" + tagName; // Add the class

  if (this.classes.length) {
    markup += " class=\"" + utils.escape(createClass(this.classes)) + "\"";
  }

  var styles = ""; // Add the styles, after hyphenation

  for (var style in this.style) {
    if (this.style.hasOwnProperty(style)) {
      styles += utils.hyphenate(style) + ":" + this.style[style] + ";";
    }
  }

  if (styles) {
    markup += " style=\"" + utils.escape(styles) + "\"";
  } // Add the attributes


  for (var attr in this.attributes) {
    if (this.attributes.hasOwnProperty(attr)) {
      markup += " " + attr + "=\"" + utils.escape(this.attributes[attr]) + "\"";
    }
  }

  markup += ">"; // Add the markup of the children, also as markup

  for (var i = 0; i < this.children.length; i++) {
    markup += this.children[i].toMarkup();
  }

  markup += "</" + tagName + ">";
  return markup;
}; // Making the type below exact with all optional fields doesn't work due to
// - https://github.com/facebook/flow/issues/4582
// - https://github.com/facebook/flow/issues/5688
// However, since *all* fields are optional, $Shape<> works as suggested in 5688
// above.
// This type does not include all CSS properties. Additional properties should
// be added as needed.


/**
 * This node represents a span node, with a className, a list of children, and
 * an inline style. It also contains information about its height, depth, and
 * maxFontSize.
 *
 * Represents two types with different uses: SvgSpan to wrap an SVG and DomSpan
 * otherwise. This typesafety is important when HTML builders access a span's
 * children.
 */
var domTree_Span =
/*#__PURE__*/
function () {
  function Span(classes, children, options, style) {
    this.children = void 0;
    this.attributes = void 0;
    this.classes = void 0;
    this.height = void 0;
    this.depth = void 0;
    this.width = void 0;
    this.maxFontSize = void 0;
    this.style = void 0;
    initNode.call(this, classes, options, style);
    this.children = children || [];
  }
  /**
   * Sets an arbitrary attribute on the span. Warning: use this wisely. Not
   * all browsers support attributes the same, and having too many custom
   * attributes is probably bad.
   */


  var _proto = Span.prototype;

  _proto.setAttribute = function setAttribute(attribute, value) {
    this.attributes[attribute] = value;
  };

  _proto.hasClass = function hasClass(className) {
    return utils.contains(this.classes, className);
  };

  _proto.toNode = function toNode() {
    return _toNode.call(this, "span");
  };

  _proto.toMarkup = function toMarkup() {
    return _toMarkup.call(this, "span");
  };

  return Span;
}();
/**
 * This node represents an anchor (<a>) element with a hyperlink.  See `span`
 * for further details.
 */

var domTree_Anchor =
/*#__PURE__*/
function () {
  function Anchor(href, classes, children, options) {
    this.children = void 0;
    this.attributes = void 0;
    this.classes = void 0;
    this.height = void 0;
    this.depth = void 0;
    this.maxFontSize = void 0;
    this.style = void 0;
    initNode.call(this, classes, options);
    this.children = children || [];
    this.setAttribute('href', href);
  }

  var _proto2 = Anchor.prototype;

  _proto2.setAttribute = function setAttribute(attribute, value) {
    this.attributes[attribute] = value;
  };

  _proto2.hasClass = function hasClass(className) {
    return utils.contains(this.classes, className);
  };

  _proto2.toNode = function toNode() {
    return _toNode.call(this, "a");
  };

  _proto2.toMarkup = function toMarkup() {
    return _toMarkup.call(this, "a");
  };

  return Anchor;
}();
/**
 * This node represents an image embed (<img>) element.
 */

var domTree_Img =
/*#__PURE__*/
function () {
  function Img(src, alt, style) {
    this.src = void 0;
    this.alt = void 0;
    this.classes = void 0;
    this.height = void 0;
    this.depth = void 0;
    this.maxFontSize = void 0;
    this.style = void 0;
    this.alt = alt;
    this.src = src;
    this.classes = ["mord"];
    this.style = style;
  }

  var _proto3 = Img.prototype;

  _proto3.hasClass = function hasClass(className) {
    return utils.contains(this.classes, className);
  };

  _proto3.toNode = function toNode() {
    var node = document.createElement("img");
    node.src = this.src;
    node.alt = this.alt;
    node.className = "mord"; // Apply inline styles

    for (var style in this.style) {
      if (this.style.hasOwnProperty(style)) {
        // $FlowFixMe
        node.style[style] = this.style[style];
      }
    }

    return node;
  };

  _proto3.toMarkup = function toMarkup() {
    var markup = "<img  src='" + this.src + " 'alt='" + this.alt + "' "; // Add the styles, after hyphenation

    var styles = "";

    for (var style in this.style) {
      if (this.style.hasOwnProperty(style)) {
        styles += utils.hyphenate(style) + ":" + this.style[style] + ";";
      }
    }

    if (styles) {
      markup += " style=\"" + utils.escape(styles) + "\"";
    }

    markup += "'/>";
    return markup;
  };

  return Img;
}();
var iCombinations = {
  'î': "\u0131\u0302",
  'ï': "\u0131\u0308",
  'í': "\u0131\u0301",
  // 'ī': '\u0131\u0304', // enable when we add Extended Latin
  'ì': "\u0131\u0300"
};
/**
 * A symbol node contains information about a single symbol. It either renders
 * to a single text node, or a span with a single text node in it, depending on
 * whether it has CSS classes, styles, or needs italic correction.
 */

var domTree_SymbolNode =
/*#__PURE__*/
function () {
  function SymbolNode(text, height, depth, italic, skew, width, classes, style) {
    this.text = void 0;
    this.height = void 0;
    this.depth = void 0;
    this.italic = void 0;
    this.skew = void 0;
    this.width = void 0;
    this.maxFontSize = void 0;
    this.classes = void 0;
    this.style = void 0;
    this.text = text;
    this.height = height || 0;
    this.depth = depth || 0;
    this.italic = italic || 0;
    this.skew = skew || 0;
    this.width = width || 0;
    this.classes = classes || [];
    this.style = style || {};
    this.maxFontSize = 0; // Mark text from non-Latin scripts with specific classes so that we
    // can specify which fonts to use.  This allows us to render these
    // characters with a serif font in situations where the browser would
    // either default to a sans serif or render a placeholder character.
    // We use CSS class names like cjk_fallback, hangul_fallback and
    // brahmic_fallback. See ./unicodeScripts.js for the set of possible
    // script names

    var script = scriptFromCodepoint(this.text.charCodeAt(0));

    if (script) {
      this.classes.push(script + "_fallback");
    }

    if (/[îïíì]/.test(this.text)) {
      // add ī when we add Extended Latin
      this.text = iCombinations[this.text];
    }
  }

  var _proto4 = SymbolNode.prototype;

  _proto4.hasClass = function hasClass(className) {
    return utils.contains(this.classes, className);
  }
  /**
   * Creates a text node or span from a symbol node. Note that a span is only
   * created if it is needed.
   */
  ;

  _proto4.toNode = function toNode() {
    var node = document.createTextNode(this.text);
    var span = null;

    if (this.italic > 0) {
      span = document.createElement("span");
      span.style.marginRight = this.italic + "em";
    }

    if (this.classes.length > 0) {
      span = span || document.createElement("span");
      span.className = createClass(this.classes);
    }

    for (var style in this.style) {
      if (this.style.hasOwnProperty(style)) {
        span = span || document.createElement("span"); // $FlowFixMe Flow doesn't seem to understand span.style's type.

        span.style[style] = this.style[style];
      }
    }

    if (span) {
      span.appendChild(node);
      return span;
    } else {
      return node;
    }
  }
  /**
   * Creates markup for a symbol node.
   */
  ;

  _proto4.toMarkup = function toMarkup() {
    // TODO(alpert): More duplication than I'd like from
    // span.prototype.toMarkup and symbolNode.prototype.toNode...
    var needsSpan = false;
    var markup = "<span";

    if (this.classes.length) {
      needsSpan = true;
      markup += " class=\"";
      markup += utils.escape(createClass(this.classes));
      markup += "\"";
    }

    var styles = "";

    if (this.italic > 0) {
      styles += "margin-right:" + this.italic + "em;";
    }

    for (var style in this.style) {
      if (this.style.hasOwnProperty(style)) {
        styles += utils.hyphenate(style) + ":" + this.style[style] + ";";
      }
    }

    if (styles) {
      needsSpan = true;
      markup += " style=\"" + utils.escape(styles) + "\"";
    }

    var escaped = utils.escape(this.text);

    if (needsSpan) {
      markup += ">";
      markup += escaped;
      markup += "</span>";
      return markup;
    } else {
      return escaped;
    }
  };

  return SymbolNode;
}();
/**
 * SVG nodes are used to render stretchy wide elements.
 */

var SvgNode =
/*#__PURE__*/
function () {
  function SvgNode(children, attributes) {
    this.children = void 0;
    this.attributes = void 0;
    this.children = children || [];
    this.attributes = attributes || {};
  }

  var _proto5 = SvgNode.prototype;

  _proto5.toNode = function toNode() {
    var svgNS = "http://www.w3.org/2000/svg";
    var node = document.createElementNS(svgNS, "svg"); // Apply attributes

    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        node.setAttribute(attr, this.attributes[attr]);
      }
    }

    for (var i = 0; i < this.children.length; i++) {
      node.appendChild(this.children[i].toNode());
    }

    return node;
  };

  _proto5.toMarkup = function toMarkup() {
    var markup = "<svg"; // Apply attributes

    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        markup += " " + attr + "='" + this.attributes[attr] + "'";
      }
    }

    markup += ">";

    for (var i = 0; i < this.children.length; i++) {
      markup += this.children[i].toMarkup();
    }

    markup += "</svg>";
    return markup;
  };

  return SvgNode;
}();
var domTree_PathNode =
/*#__PURE__*/
function () {
  function PathNode(pathName, alternate) {
    this.pathName = void 0;
    this.alternate = void 0;
    this.pathName = pathName;
    this.alternate = alternate; // Used only for \sqrt
  }

  var _proto6 = PathNode.prototype;

  _proto6.toNode = function toNode() {
    var svgNS = "http://www.w3.org/2000/svg";
    var node = document.createElementNS(svgNS, "path");

    if (this.alternate) {
      node.setAttribute("d", this.alternate);
    } else {
      node.setAttribute("d", svgGeometry_path[this.pathName]);
    }

    return node;
  };

  _proto6.toMarkup = function toMarkup() {
    if (this.alternate) {
      return "<path d='" + this.alternate + "'/>";
    } else {
      return "<path d='" + svgGeometry_path[this.pathName] + "'/>";
    }
  };

  return PathNode;
}();
var LineNode =
/*#__PURE__*/
function () {
  function LineNode(attributes) {
    this.attributes = void 0;
    this.attributes = attributes || {};
  }

  var _proto7 = LineNode.prototype;

  _proto7.toNode = function toNode() {
    var svgNS = "http://www.w3.org/2000/svg";
    var node = document.createElementNS(svgNS, "line"); // Apply attributes

    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        node.setAttribute(attr, this.attributes[attr]);
      }
    }

    return node;
  };

  _proto7.toMarkup = function toMarkup() {
    var markup = "<line";

    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        markup += " " + attr + "='" + this.attributes[attr] + "'";
      }
    }

    markup += "/>";
    return markup;
  };

  return LineNode;
}();
function assertSymbolDomNode(group) {
  if (group instanceof domTree_SymbolNode) {
    return group;
  } else {
    throw new Error("Expected symbolNode but got " + String(group) + ".");
  }
}
function assertSpan(group) {
  if (group instanceof domTree_Span) {
    return group;
  } else {
    throw new Error("Expected span<HtmlDomNode> but got " + String(group) + ".");
  }
}
// CONCATENATED MODULE: ./submodules/katex-fonts/fontMetricsData.js
// This file is GENERATED by buildMetrics.sh. DO NOT MODIFY.
/* harmony default export */ var fontMetricsData = ({
  "AMS-Regular": {
    "65": [0, 0.68889, 0, 0, 0.72222],
    "66": [0, 0.68889, 0, 0, 0.66667],
    "67": [0, 0.68889, 0, 0, 0.72222],
    "68": [0, 0.68889, 0, 0, 0.72222],
    "69": [0, 0.68889, 0, 0, 0.66667],
    "70": [0, 0.68889, 0, 0, 0.61111],
    "71": [0, 0.68889, 0, 0, 0.77778],
    "72": [0, 0.68889, 0, 0, 0.77778],
    "73": [0, 0.68889, 0, 0, 0.38889],
    "74": [0.16667, 0.68889, 0, 0, 0.5],
    "75": [0, 0.68889, 0, 0, 0.77778],
    "76": [0, 0.68889, 0, 0, 0.66667],
    "77": [0, 0.68889, 0, 0, 0.94445],
    "78": [0, 0.68889, 0, 0, 0.72222],
    "79": [0.16667, 0.68889, 0, 0, 0.77778],
    "80": [0, 0.68889, 0, 0, 0.61111],
    "81": [0.16667, 0.68889, 0, 0, 0.77778],
    "82": [0, 0.68889, 0, 0, 0.72222],
    "83": [0, 0.68889, 0, 0, 0.55556],
    "84": [0, 0.68889, 0, 0, 0.66667],
    "85": [0, 0.68889, 0, 0, 0.72222],
    "86": [0, 0.68889, 0, 0, 0.72222],
    "87": [0, 0.68889, 0, 0, 1.0],
    "88": [0, 0.68889, 0, 0, 0.72222],
    "89": [0, 0.68889, 0, 0, 0.72222],
    "90": [0, 0.68889, 0, 0, 0.66667],
    "107": [0, 0.68889, 0, 0, 0.55556],
    "165": [0, 0.675, 0.025, 0, 0.75],
    "174": [0.15559, 0.69224, 0, 0, 0.94666],
    "240": [0, 0.68889, 0, 0, 0.55556],
    "295": [0, 0.68889, 0, 0, 0.54028],
    "710": [0, 0.825, 0, 0, 2.33334],
    "732": [0, 0.9, 0, 0, 2.33334],
    "770": [0, 0.825, 0, 0, 2.33334],
    "771": [0, 0.9, 0, 0, 2.33334],
    "989": [0.08167, 0.58167, 0, 0, 0.77778],
    "1008": [0, 0.43056, 0.04028, 0, 0.66667],
    "8245": [0, 0.54986, 0, 0, 0.275],
    "8463": [0, 0.68889, 0, 0, 0.54028],
    "8487": [0, 0.68889, 0, 0, 0.72222],
    "8498": [0, 0.68889, 0, 0, 0.55556],
    "8502": [0, 0.68889, 0, 0, 0.66667],
    "8503": [0, 0.68889, 0, 0, 0.44445],
    "8504": [0, 0.68889, 0, 0, 0.66667],
    "8513": [0, 0.68889, 0, 0, 0.63889],
    "8592": [-0.03598, 0.46402, 0, 0, 0.5],
    "8594": [-0.03598, 0.46402, 0, 0, 0.5],
    "8602": [-0.13313, 0.36687, 0, 0, 1.0],
    "8603": [-0.13313, 0.36687, 0, 0, 1.0],
    "8606": [0.01354, 0.52239, 0, 0, 1.0],
    "8608": [0.01354, 0.52239, 0, 0, 1.0],
    "8610": [0.01354, 0.52239, 0, 0, 1.11111],
    "8611": [0.01354, 0.52239, 0, 0, 1.11111],
    "8619": [0, 0.54986, 0, 0, 1.0],
    "8620": [0, 0.54986, 0, 0, 1.0],
    "8621": [-0.13313, 0.37788, 0, 0, 1.38889],
    "8622": [-0.13313, 0.36687, 0, 0, 1.0],
    "8624": [0, 0.69224, 0, 0, 0.5],
    "8625": [0, 0.69224, 0, 0, 0.5],
    "8630": [0, 0.43056, 0, 0, 1.0],
    "8631": [0, 0.43056, 0, 0, 1.0],
    "8634": [0.08198, 0.58198, 0, 0, 0.77778],
    "8635": [0.08198, 0.58198, 0, 0, 0.77778],
    "8638": [0.19444, 0.69224, 0, 0, 0.41667],
    "8639": [0.19444, 0.69224, 0, 0, 0.41667],
    "8642": [0.19444, 0.69224, 0, 0, 0.41667],
    "8643": [0.19444, 0.69224, 0, 0, 0.41667],
    "8644": [0.1808, 0.675, 0, 0, 1.0],
    "8646": [0.1808, 0.675, 0, 0, 1.0],
    "8647": [0.1808, 0.675, 0, 0, 1.0],
    "8648": [0.19444, 0.69224, 0, 0, 0.83334],
    "8649": [0.1808, 0.675, 0, 0, 1.0],
    "8650": [0.19444, 0.69224, 0, 0, 0.83334],
    "8651": [0.01354, 0.52239, 0, 0, 1.0],
    "8652": [0.01354, 0.52239, 0, 0, 1.0],
    "8653": [-0.13313, 0.36687, 0, 0, 1.0],
    "8654": [-0.13313, 0.36687, 0, 0, 1.0],
    "8655": [-0.13313, 0.36687, 0, 0, 1.0],
    "8666": [0.13667, 0.63667, 0, 0, 1.0],
    "8667": [0.13667, 0.63667, 0, 0, 1.0],
    "8669": [-0.13313, 0.37788, 0, 0, 1.0],
    "8672": [-0.064, 0.437, 0, 0, 1.334],
    "8674": [-0.064, 0.437, 0, 0, 1.334],
    "8705": [0, 0.825, 0, 0, 0.5],
    "8708": [0, 0.68889, 0, 0, 0.55556],
    "8709": [0.08167, 0.58167, 0, 0, 0.77778],
    "8717": [0, 0.43056, 0, 0, 0.42917],
    "8722": [-0.03598, 0.46402, 0, 0, 0.5],
    "8724": [0.08198, 0.69224, 0, 0, 0.77778],
    "8726": [0.08167, 0.58167, 0, 0, 0.77778],
    "8733": [0, 0.69224, 0, 0, 0.77778],
    "8736": [0, 0.69224, 0, 0, 0.72222],
    "8737": [0, 0.69224, 0, 0, 0.72222],
    "8738": [0.03517, 0.52239, 0, 0, 0.72222],
    "8739": [0.08167, 0.58167, 0, 0, 0.22222],
    "8740": [0.25142, 0.74111, 0, 0, 0.27778],
    "8741": [0.08167, 0.58167, 0, 0, 0.38889],
    "8742": [0.25142, 0.74111, 0, 0, 0.5],
    "8756": [0, 0.69224, 0, 0, 0.66667],
    "8757": [0, 0.69224, 0, 0, 0.66667],
    "8764": [-0.13313, 0.36687, 0, 0, 0.77778],
    "8765": [-0.13313, 0.37788, 0, 0, 0.77778],
    "8769": [-0.13313, 0.36687, 0, 0, 0.77778],
    "8770": [-0.03625, 0.46375, 0, 0, 0.77778],
    "8774": [0.30274, 0.79383, 0, 0, 0.77778],
    "8776": [-0.01688, 0.48312, 0, 0, 0.77778],
    "8778": [0.08167, 0.58167, 0, 0, 0.77778],
    "8782": [0.06062, 0.54986, 0, 0, 0.77778],
    "8783": [0.06062, 0.54986, 0, 0, 0.77778],
    "8785": [0.08198, 0.58198, 0, 0, 0.77778],
    "8786": [0.08198, 0.58198, 0, 0, 0.77778],
    "8787": [0.08198, 0.58198, 0, 0, 0.77778],
    "8790": [0, 0.69224, 0, 0, 0.77778],
    "8791": [0.22958, 0.72958, 0, 0, 0.77778],
    "8796": [0.08198, 0.91667, 0, 0, 0.77778],
    "8806": [0.25583, 0.75583, 0, 0, 0.77778],
    "8807": [0.25583, 0.75583, 0, 0, 0.77778],
    "8808": [0.25142, 0.75726, 0, 0, 0.77778],
    "8809": [0.25142, 0.75726, 0, 0, 0.77778],
    "8812": [0.25583, 0.75583, 0, 0, 0.5],
    "8814": [0.20576, 0.70576, 0, 0, 0.77778],
    "8815": [0.20576, 0.70576, 0, 0, 0.77778],
    "8816": [0.30274, 0.79383, 0, 0, 0.77778],
    "8817": [0.30274, 0.79383, 0, 0, 0.77778],
    "8818": [0.22958, 0.72958, 0, 0, 0.77778],
    "8819": [0.22958, 0.72958, 0, 0, 0.77778],
    "8822": [0.1808, 0.675, 0, 0, 0.77778],
    "8823": [0.1808, 0.675, 0, 0, 0.77778],
    "8828": [0.13667, 0.63667, 0, 0, 0.77778],
    "8829": [0.13667, 0.63667, 0, 0, 0.77778],
    "8830": [0.22958, 0.72958, 0, 0, 0.77778],
    "8831": [0.22958, 0.72958, 0, 0, 0.77778],
    "8832": [0.20576, 0.70576, 0, 0, 0.77778],
    "8833": [0.20576, 0.70576, 0, 0, 0.77778],
    "8840": [0.30274, 0.79383, 0, 0, 0.77778],
    "8841": [0.30274, 0.79383, 0, 0, 0.77778],
    "8842": [0.13597, 0.63597, 0, 0, 0.77778],
    "8843": [0.13597, 0.63597, 0, 0, 0.77778],
    "8847": [0.03517, 0.54986, 0, 0, 0.77778],
    "8848": [0.03517, 0.54986, 0, 0, 0.77778],
    "8858": [0.08198, 0.58198, 0, 0, 0.77778],
    "8859": [0.08198, 0.58198, 0, 0, 0.77778],
    "8861": [0.08198, 0.58198, 0, 0, 0.77778],
    "8862": [0, 0.675, 0, 0, 0.77778],
    "8863": [0, 0.675, 0, 0, 0.77778],
    "8864": [0, 0.675, 0, 0, 0.77778],
    "8865": [0, 0.675, 0, 0, 0.77778],
    "8872": [0, 0.69224, 0, 0, 0.61111],
    "8873": [0, 0.69224, 0, 0, 0.72222],
    "8874": [0, 0.69224, 0, 0, 0.88889],
    "8876": [0, 0.68889, 0, 0, 0.61111],
    "8877": [0, 0.68889, 0, 0, 0.61111],
    "8878": [0, 0.68889, 0, 0, 0.72222],
    "8879": [0, 0.68889, 0, 0, 0.72222],
    "8882": [0.03517, 0.54986, 0, 0, 0.77778],
    "8883": [0.03517, 0.54986, 0, 0, 0.77778],
    "8884": [0.13667, 0.63667, 0, 0, 0.77778],
    "8885": [0.13667, 0.63667, 0, 0, 0.77778],
    "8888": [0, 0.54986, 0, 0, 1.11111],
    "8890": [0.19444, 0.43056, 0, 0, 0.55556],
    "8891": [0.19444, 0.69224, 0, 0, 0.61111],
    "8892": [0.19444, 0.69224, 0, 0, 0.61111],
    "8901": [0, 0.54986, 0, 0, 0.27778],
    "8903": [0.08167, 0.58167, 0, 0, 0.77778],
    "8905": [0.08167, 0.58167, 0, 0, 0.77778],
    "8906": [0.08167, 0.58167, 0, 0, 0.77778],
    "8907": [0, 0.69224, 0, 0, 0.77778],
    "8908": [0, 0.69224, 0, 0, 0.77778],
    "8909": [-0.03598, 0.46402, 0, 0, 0.77778],
    "8910": [0, 0.54986, 0, 0, 0.76042],
    "8911": [0, 0.54986, 0, 0, 0.76042],
    "8912": [0.03517, 0.54986, 0, 0, 0.77778],
    "8913": [0.03517, 0.54986, 0, 0, 0.77778],
    "8914": [0, 0.54986, 0, 0, 0.66667],
    "8915": [0, 0.54986, 0, 0, 0.66667],
    "8916": [0, 0.69224, 0, 0, 0.66667],
    "8918": [0.0391, 0.5391, 0, 0, 0.77778],
    "8919": [0.0391, 0.5391, 0, 0, 0.77778],
    "8920": [0.03517, 0.54986, 0, 0, 1.33334],
    "8921": [0.03517, 0.54986, 0, 0, 1.33334],
    "8922": [0.38569, 0.88569, 0, 0, 0.77778],
    "8923": [0.38569, 0.88569, 0, 0, 0.77778],
    "8926": [0.13667, 0.63667, 0, 0, 0.77778],
    "8927": [0.13667, 0.63667, 0, 0, 0.77778],
    "8928": [0.30274, 0.79383, 0, 0, 0.77778],
    "8929": [0.30274, 0.79383, 0, 0, 0.77778],
    "8934": [0.23222, 0.74111, 0, 0, 0.77778],
    "8935": [0.23222, 0.74111, 0, 0, 0.77778],
    "8936": [0.23222, 0.74111, 0, 0, 0.77778],
    "8937": [0.23222, 0.74111, 0, 0, 0.77778],
    "8938": [0.20576, 0.70576, 0, 0, 0.77778],
    "8939": [0.20576, 0.70576, 0, 0, 0.77778],
    "8940": [0.30274, 0.79383, 0, 0, 0.77778],
    "8941": [0.30274, 0.79383, 0, 0, 0.77778],
    "8994": [0.19444, 0.69224, 0, 0, 0.77778],
    "8995": [0.19444, 0.69224, 0, 0, 0.77778],
    "9416": [0.15559, 0.69224, 0, 0, 0.90222],
    "9484": [0, 0.69224, 0, 0, 0.5],
    "9488": [0, 0.69224, 0, 0, 0.5],
    "9492": [0, 0.37788, 0, 0, 0.5],
    "9496": [0, 0.37788, 0, 0, 0.5],
    "9585": [0.19444, 0.68889, 0, 0, 0.88889],
    "9586": [0.19444, 0.74111, 0, 0, 0.88889],
    "9632": [0, 0.675, 0, 0, 0.77778],
    "9633": [0, 0.675, 0, 0, 0.77778],
    "9650": [0, 0.54986, 0, 0, 0.72222],
    "9651": [0, 0.54986, 0, 0, 0.72222],
    "9654": [0.03517, 0.54986, 0, 0, 0.77778],
    "9660": [0, 0.54986, 0, 0, 0.72222],
    "9661": [0, 0.54986, 0, 0, 0.72222],
    "9664": [0.03517, 0.54986, 0, 0, 0.77778],
    "9674": [0.11111, 0.69224, 0, 0, 0.66667],
    "9733": [0.19444, 0.69224, 0, 0, 0.94445],
    "10003": [0, 0.69224, 0, 0, 0.83334],
    "10016": [0, 0.69224, 0, 0, 0.83334],
    "10731": [0.11111, 0.69224, 0, 0, 0.66667],
    "10846": [0.19444, 0.75583, 0, 0, 0.61111],
    "10877": [0.13667, 0.63667, 0, 0, 0.77778],
    "10878": [0.13667, 0.63667, 0, 0, 0.77778],
    "10885": [0.25583, 0.75583, 0, 0, 0.77778],
    "10886": [0.25583, 0.75583, 0, 0, 0.77778],
    "10887": [0.13597, 0.63597, 0, 0, 0.77778],
    "10888": [0.13597, 0.63597, 0, 0, 0.77778],
    "10889": [0.26167, 0.75726, 0, 0, 0.77778],
    "10890": [0.26167, 0.75726, 0, 0, 0.77778],
    "10891": [0.48256, 0.98256, 0, 0, 0.77778],
    "10892": [0.48256, 0.98256, 0, 0, 0.77778],
    "10901": [0.13667, 0.63667, 0, 0, 0.77778],
    "10902": [0.13667, 0.63667, 0, 0, 0.77778],
    "10933": [0.25142, 0.75726, 0, 0, 0.77778],
    "10934": [0.25142, 0.75726, 0, 0, 0.77778],
    "10935": [0.26167, 0.75726, 0, 0, 0.77778],
    "10936": [0.26167, 0.75726, 0, 0, 0.77778],
    "10937": [0.26167, 0.75726, 0, 0, 0.77778],
    "10938": [0.26167, 0.75726, 0, 0, 0.77778],
    "10949": [0.25583, 0.75583, 0, 0, 0.77778],
    "10950": [0.25583, 0.75583, 0, 0, 0.77778],
    "10955": [0.28481, 0.79383, 0, 0, 0.77778],
    "10956": [0.28481, 0.79383, 0, 0, 0.77778],
    "57350": [0.08167, 0.58167, 0, 0, 0.22222],
    "57351": [0.08167, 0.58167, 0, 0, 0.38889],
    "57352": [0.08167, 0.58167, 0, 0, 0.77778],
    "57353": [0, 0.43056, 0.04028, 0, 0.66667],
    "57356": [0.25142, 0.75726, 0, 0, 0.77778],
    "57357": [0.25142, 0.75726, 0, 0, 0.77778],
    "57358": [0.41951, 0.91951, 0, 0, 0.77778],
    "57359": [0.30274, 0.79383, 0, 0, 0.77778],
    "57360": [0.30274, 0.79383, 0, 0, 0.77778],
    "57361": [0.41951, 0.91951, 0, 0, 0.77778],
    "57366": [0.25142, 0.75726, 0, 0, 0.77778],
    "57367": [0.25142, 0.75726, 0, 0, 0.77778],
    "57368": [0.25142, 0.75726, 0, 0, 0.77778],
    "57369": [0.25142, 0.75726, 0, 0, 0.77778],
    "57370": [0.13597, 0.63597, 0, 0, 0.77778],
    "57371": [0.13597, 0.63597, 0, 0, 0.77778]
  },
  "Caligraphic-Regular": {
    "48": [0, 0.43056, 0, 0, 0.5],
    "49": [0, 0.43056, 0, 0, 0.5],
    "50": [0, 0.43056, 0, 0, 0.5],
    "51": [0.19444, 0.43056, 0, 0, 0.5],
    "52": [0.19444, 0.43056, 0, 0, 0.5],
    "53": [0.19444, 0.43056, 0, 0, 0.5],
    "54": [0, 0.64444, 0, 0, 0.5],
    "55": [0.19444, 0.43056, 0, 0, 0.5],
    "56": [0, 0.64444, 0, 0, 0.5],
    "57": [0.19444, 0.43056, 0, 0, 0.5],
    "65": [0, 0.68333, 0, 0.19445, 0.79847],
    "66": [0, 0.68333, 0.03041, 0.13889, 0.65681],
    "67": [0, 0.68333, 0.05834, 0.13889, 0.52653],
    "68": [0, 0.68333, 0.02778, 0.08334, 0.77139],
    "69": [0, 0.68333, 0.08944, 0.11111, 0.52778],
    "70": [0, 0.68333, 0.09931, 0.11111, 0.71875],
    "71": [0.09722, 0.68333, 0.0593, 0.11111, 0.59487],
    "72": [0, 0.68333, 0.00965, 0.11111, 0.84452],
    "73": [0, 0.68333, 0.07382, 0, 0.54452],
    "74": [0.09722, 0.68333, 0.18472, 0.16667, 0.67778],
    "75": [0, 0.68333, 0.01445, 0.05556, 0.76195],
    "76": [0, 0.68333, 0, 0.13889, 0.68972],
    "77": [0, 0.68333, 0, 0.13889, 1.2009],
    "78": [0, 0.68333, 0.14736, 0.08334, 0.82049],
    "79": [0, 0.68333, 0.02778, 0.11111, 0.79611],
    "80": [0, 0.68333, 0.08222, 0.08334, 0.69556],
    "81": [0.09722, 0.68333, 0, 0.11111, 0.81667],
    "82": [0, 0.68333, 0, 0.08334, 0.8475],
    "83": [0, 0.68333, 0.075, 0.13889, 0.60556],
    "84": [0, 0.68333, 0.25417, 0, 0.54464],
    "85": [0, 0.68333, 0.09931, 0.08334, 0.62583],
    "86": [0, 0.68333, 0.08222, 0, 0.61278],
    "87": [0, 0.68333, 0.08222, 0.08334, 0.98778],
    "88": [0, 0.68333, 0.14643, 0.13889, 0.7133],
    "89": [0.09722, 0.68333, 0.08222, 0.08334, 0.66834],
    "90": [0, 0.68333, 0.07944, 0.13889, 0.72473]
  },
  "Fraktur-Regular": {
    "33": [0, 0.69141, 0, 0, 0.29574],
    "34": [0, 0.69141, 0, 0, 0.21471],
    "38": [0, 0.69141, 0, 0, 0.73786],
    "39": [0, 0.69141, 0, 0, 0.21201],
    "40": [0.24982, 0.74947, 0, 0, 0.38865],
    "41": [0.24982, 0.74947, 0, 0, 0.38865],
    "42": [0, 0.62119, 0, 0, 0.27764],
    "43": [0.08319, 0.58283, 0, 0, 0.75623],
    "44": [0, 0.10803, 0, 0, 0.27764],
    "45": [0.08319, 0.58283, 0, 0, 0.75623],
    "46": [0, 0.10803, 0, 0, 0.27764],
    "47": [0.24982, 0.74947, 0, 0, 0.50181],
    "48": [0, 0.47534, 0, 0, 0.50181],
    "49": [0, 0.47534, 0, 0, 0.50181],
    "50": [0, 0.47534, 0, 0, 0.50181],
    "51": [0.18906, 0.47534, 0, 0, 0.50181],
    "52": [0.18906, 0.47534, 0, 0, 0.50181],
    "53": [0.18906, 0.47534, 0, 0, 0.50181],
    "54": [0, 0.69141, 0, 0, 0.50181],
    "55": [0.18906, 0.47534, 0, 0, 0.50181],
    "56": [0, 0.69141, 0, 0, 0.50181],
    "57": [0.18906, 0.47534, 0, 0, 0.50181],
    "58": [0, 0.47534, 0, 0, 0.21606],
    "59": [0.12604, 0.47534, 0, 0, 0.21606],
    "61": [-0.13099, 0.36866, 0, 0, 0.75623],
    "63": [0, 0.69141, 0, 0, 0.36245],
    "65": [0, 0.69141, 0, 0, 0.7176],
    "66": [0, 0.69141, 0, 0, 0.88397],
    "67": [0, 0.69141, 0, 0, 0.61254],
    "68": [0, 0.69141, 0, 0, 0.83158],
    "69": [0, 0.69141, 0, 0, 0.66278],
    "70": [0.12604, 0.69141, 0, 0, 0.61119],
    "71": [0, 0.69141, 0, 0, 0.78539],
    "72": [0.06302, 0.69141, 0, 0, 0.7203],
    "73": [0, 0.69141, 0, 0, 0.55448],
    "74": [0.12604, 0.69141, 0, 0, 0.55231],
    "75": [0, 0.69141, 0, 0, 0.66845],
    "76": [0, 0.69141, 0, 0, 0.66602],
    "77": [0, 0.69141, 0, 0, 1.04953],
    "78": [0, 0.69141, 0, 0, 0.83212],
    "79": [0, 0.69141, 0, 0, 0.82699],
    "80": [0.18906, 0.69141, 0, 0, 0.82753],
    "81": [0.03781, 0.69141, 0, 0, 0.82699],
    "82": [0, 0.69141, 0, 0, 0.82807],
    "83": [0, 0.69141, 0, 0, 0.82861],
    "84": [0, 0.69141, 0, 0, 0.66899],
    "85": [0, 0.69141, 0, 0, 0.64576],
    "86": [0, 0.69141, 0, 0, 0.83131],
    "87": [0, 0.69141, 0, 0, 1.04602],
    "88": [0, 0.69141, 0, 0, 0.71922],
    "89": [0.18906, 0.69141, 0, 0, 0.83293],
    "90": [0.12604, 0.69141, 0, 0, 0.60201],
    "91": [0.24982, 0.74947, 0, 0, 0.27764],
    "93": [0.24982, 0.74947, 0, 0, 0.27764],
    "94": [0, 0.69141, 0, 0, 0.49965],
    "97": [0, 0.47534, 0, 0, 0.50046],
    "98": [0, 0.69141, 0, 0, 0.51315],
    "99": [0, 0.47534, 0, 0, 0.38946],
    "100": [0, 0.62119, 0, 0, 0.49857],
    "101": [0, 0.47534, 0, 0, 0.40053],
    "102": [0.18906, 0.69141, 0, 0, 0.32626],
    "103": [0.18906, 0.47534, 0, 0, 0.5037],
    "104": [0.18906, 0.69141, 0, 0, 0.52126],
    "105": [0, 0.69141, 0, 0, 0.27899],
    "106": [0, 0.69141, 0, 0, 0.28088],
    "107": [0, 0.69141, 0, 0, 0.38946],
    "108": [0, 0.69141, 0, 0, 0.27953],
    "109": [0, 0.47534, 0, 0, 0.76676],
    "110": [0, 0.47534, 0, 0, 0.52666],
    "111": [0, 0.47534, 0, 0, 0.48885],
    "112": [0.18906, 0.52396, 0, 0, 0.50046],
    "113": [0.18906, 0.47534, 0, 0, 0.48912],
    "114": [0, 0.47534, 0, 0, 0.38919],
    "115": [0, 0.47534, 0, 0, 0.44266],
    "116": [0, 0.62119, 0, 0, 0.33301],
    "117": [0, 0.47534, 0, 0, 0.5172],
    "118": [0, 0.52396, 0, 0, 0.5118],
    "119": [0, 0.52396, 0, 0, 0.77351],
    "120": [0.18906, 0.47534, 0, 0, 0.38865],
    "121": [0.18906, 0.47534, 0, 0, 0.49884],
    "122": [0.18906, 0.47534, 0, 0, 0.39054],
    "8216": [0, 0.69141, 0, 0, 0.21471],
    "8217": [0, 0.69141, 0, 0, 0.21471],
    "58112": [0, 0.62119, 0, 0, 0.49749],
    "58113": [0, 0.62119, 0, 0, 0.4983],
    "58114": [0.18906, 0.69141, 0, 0, 0.33328],
    "58115": [0.18906, 0.69141, 0, 0, 0.32923],
    "58116": [0.18906, 0.47534, 0, 0, 0.50343],
    "58117": [0, 0.69141, 0, 0, 0.33301],
    "58118": [0, 0.62119, 0, 0, 0.33409],
    "58119": [0, 0.47534, 0, 0, 0.50073]
  },
  "Main-Bold": {
    "33": [0, 0.69444, 0, 0, 0.35],
    "34": [0, 0.69444, 0, 0, 0.60278],
    "35": [0.19444, 0.69444, 0, 0, 0.95833],
    "36": [0.05556, 0.75, 0, 0, 0.575],
    "37": [0.05556, 0.75, 0, 0, 0.95833],
    "38": [0, 0.69444, 0, 0, 0.89444],
    "39": [0, 0.69444, 0, 0, 0.31944],
    "40": [0.25, 0.75, 0, 0, 0.44722],
    "41": [0.25, 0.75, 0, 0, 0.44722],
    "42": [0, 0.75, 0, 0, 0.575],
    "43": [0.13333, 0.63333, 0, 0, 0.89444],
    "44": [0.19444, 0.15556, 0, 0, 0.31944],
    "45": [0, 0.44444, 0, 0, 0.38333],
    "46": [0, 0.15556, 0, 0, 0.31944],
    "47": [0.25, 0.75, 0, 0, 0.575],
    "48": [0, 0.64444, 0, 0, 0.575],
    "49": [0, 0.64444, 0, 0, 0.575],
    "50": [0, 0.64444, 0, 0, 0.575],
    "51": [0, 0.64444, 0, 0, 0.575],
    "52": [0, 0.64444, 0, 0, 0.575],
    "53": [0, 0.64444, 0, 0, 0.575],
    "54": [0, 0.64444, 0, 0, 0.575],
    "55": [0, 0.64444, 0, 0, 0.575],
    "56": [0, 0.64444, 0, 0, 0.575],
    "57": [0, 0.64444, 0, 0, 0.575],
    "58": [0, 0.44444, 0, 0, 0.31944],
    "59": [0.19444, 0.44444, 0, 0, 0.31944],
    "60": [0.08556, 0.58556, 0, 0, 0.89444],
    "61": [-0.10889, 0.39111, 0, 0, 0.89444],
    "62": [0.08556, 0.58556, 0, 0, 0.89444],
    "63": [0, 0.69444, 0, 0, 0.54305],
    "64": [0, 0.69444, 0, 0, 0.89444],
    "65": [0, 0.68611, 0, 0, 0.86944],
    "66": [0, 0.68611, 0, 0, 0.81805],
    "67": [0, 0.68611, 0, 0, 0.83055],
    "68": [0, 0.68611, 0, 0, 0.88194],
    "69": [0, 0.68611, 0, 0, 0.75555],
    "70": [0, 0.68611, 0, 0, 0.72361],
    "71": [0, 0.68611, 0, 0, 0.90416],
    "72": [0, 0.68611, 0, 0, 0.9],
    "73": [0, 0.68611, 0, 0, 0.43611],
    "74": [0, 0.68611, 0, 0, 0.59444],
    "75": [0, 0.68611, 0, 0, 0.90138],
    "76": [0, 0.68611, 0, 0, 0.69166],
    "77": [0, 0.68611, 0, 0, 1.09166],
    "78": [0, 0.68611, 0, 0, 0.9],
    "79": [0, 0.68611, 0, 0, 0.86388],
    "80": [0, 0.68611, 0, 0, 0.78611],
    "81": [0.19444, 0.68611, 0, 0, 0.86388],
    "82": [0, 0.68611, 0, 0, 0.8625],
    "83": [0, 0.68611, 0, 0, 0.63889],
    "84": [0, 0.68611, 0, 0, 0.8],
    "85": [0, 0.68611, 0, 0, 0.88472],
    "86": [0, 0.68611, 0.01597, 0, 0.86944],
    "87": [0, 0.68611, 0.01597, 0, 1.18888],
    "88": [0, 0.68611, 0, 0, 0.86944],
    "89": [0, 0.68611, 0.02875, 0, 0.86944],
    "90": [0, 0.68611, 0, 0, 0.70277],
    "91": [0.25, 0.75, 0, 0, 0.31944],
    "92": [0.25, 0.75, 0, 0, 0.575],
    "93": [0.25, 0.75, 0, 0, 0.31944],
    "94": [0, 0.69444, 0, 0, 0.575],
    "95": [0.31, 0.13444, 0.03194, 0, 0.575],
    "97": [0, 0.44444, 0, 0, 0.55902],
    "98": [0, 0.69444, 0, 0, 0.63889],
    "99": [0, 0.44444, 0, 0, 0.51111],
    "100": [0, 0.69444, 0, 0, 0.63889],
    "101": [0, 0.44444, 0, 0, 0.52708],
    "102": [0, 0.69444, 0.10903, 0, 0.35139],
    "103": [0.19444, 0.44444, 0.01597, 0, 0.575],
    "104": [0, 0.69444, 0, 0, 0.63889],
    "105": [0, 0.69444, 0, 0, 0.31944],
    "106": [0.19444, 0.69444, 0, 0, 0.35139],
    "107": [0, 0.69444, 0, 0, 0.60694],
    "108": [0, 0.69444, 0, 0, 0.31944],
    "109": [0, 0.44444, 0, 0, 0.95833],
    "110": [0, 0.44444, 0, 0, 0.63889],
    "111": [0, 0.44444, 0, 0, 0.575],
    "112": [0.19444, 0.44444, 0, 0, 0.63889],
    "113": [0.19444, 0.44444, 0, 0, 0.60694],
    "114": [0, 0.44444, 0, 0, 0.47361],
    "115": [0, 0.44444, 0, 0, 0.45361],
    "116": [0, 0.63492, 0, 0, 0.44722],
    "117": [0, 0.44444, 0, 0, 0.63889],
    "118": [0, 0.44444, 0.01597, 0, 0.60694],
    "119": [0, 0.44444, 0.01597, 0, 0.83055],
    "120": [0, 0.44444, 0, 0, 0.60694],
    "121": [0.19444, 0.44444, 0.01597, 0, 0.60694],
    "122": [0, 0.44444, 0, 0, 0.51111],
    "123": [0.25, 0.75, 0, 0, 0.575],
    "124": [0.25, 0.75, 0, 0, 0.31944],
    "125": [0.25, 0.75, 0, 0, 0.575],
    "126": [0.35, 0.34444, 0, 0, 0.575],
    "168": [0, 0.69444, 0, 0, 0.575],
    "172": [0, 0.44444, 0, 0, 0.76666],
    "176": [0, 0.69444, 0, 0, 0.86944],
    "177": [0.13333, 0.63333, 0, 0, 0.89444],
    "184": [0.17014, 0, 0, 0, 0.51111],
    "198": [0, 0.68611, 0, 0, 1.04166],
    "215": [0.13333, 0.63333, 0, 0, 0.89444],
    "216": [0.04861, 0.73472, 0, 0, 0.89444],
    "223": [0, 0.69444, 0, 0, 0.59722],
    "230": [0, 0.44444, 0, 0, 0.83055],
    "247": [0.13333, 0.63333, 0, 0, 0.89444],
    "248": [0.09722, 0.54167, 0, 0, 0.575],
    "305": [0, 0.44444, 0, 0, 0.31944],
    "338": [0, 0.68611, 0, 0, 1.16944],
    "339": [0, 0.44444, 0, 0, 0.89444],
    "567": [0.19444, 0.44444, 0, 0, 0.35139],
    "710": [0, 0.69444, 0, 0, 0.575],
    "711": [0, 0.63194, 0, 0, 0.575],
    "713": [0, 0.59611, 0, 0, 0.575],
    "714": [0, 0.69444, 0, 0, 0.575],
    "715": [0, 0.69444, 0, 0, 0.575],
    "728": [0, 0.69444, 0, 0, 0.575],
    "729": [0, 0.69444, 0, 0, 0.31944],
    "730": [0, 0.69444, 0, 0, 0.86944],
    "732": [0, 0.69444, 0, 0, 0.575],
    "733": [0, 0.69444, 0, 0, 0.575],
    "915": [0, 0.68611, 0, 0, 0.69166],
    "916": [0, 0.68611, 0, 0, 0.95833],
    "920": [0, 0.68611, 0, 0, 0.89444],
    "923": [0, 0.68611, 0, 0, 0.80555],
    "926": [0, 0.68611, 0, 0, 0.76666],
    "928": [0, 0.68611, 0, 0, 0.9],
    "931": [0, 0.68611, 0, 0, 0.83055],
    "933": [0, 0.68611, 0, 0, 0.89444],
    "934": [0, 0.68611, 0, 0, 0.83055],
    "936": [0, 0.68611, 0, 0, 0.89444],
    "937": [0, 0.68611, 0, 0, 0.83055],
    "8211": [0, 0.44444, 0.03194, 0, 0.575],
    "8212": [0, 0.44444, 0.03194, 0, 1.14999],
    "8216": [0, 0.69444, 0, 0, 0.31944],
    "8217": [0, 0.69444, 0, 0, 0.31944],
    "8220": [0, 0.69444, 0, 0, 0.60278],
    "8221": [0, 0.69444, 0, 0, 0.60278],
    "8224": [0.19444, 0.69444, 0, 0, 0.51111],
    "8225": [0.19444, 0.69444, 0, 0, 0.51111],
    "8242": [0, 0.55556, 0, 0, 0.34444],
    "8407": [0, 0.72444, 0.15486, 0, 0.575],
    "8463": [0, 0.69444, 0, 0, 0.66759],
    "8465": [0, 0.69444, 0, 0, 0.83055],
    "8467": [0, 0.69444, 0, 0, 0.47361],
    "8472": [0.19444, 0.44444, 0, 0, 0.74027],
    "8476": [0, 0.69444, 0, 0, 0.83055],
    "8501": [0, 0.69444, 0, 0, 0.70277],
    "8592": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8593": [0.19444, 0.69444, 0, 0, 0.575],
    "8594": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8595": [0.19444, 0.69444, 0, 0, 0.575],
    "8596": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8597": [0.25, 0.75, 0, 0, 0.575],
    "8598": [0.19444, 0.69444, 0, 0, 1.14999],
    "8599": [0.19444, 0.69444, 0, 0, 1.14999],
    "8600": [0.19444, 0.69444, 0, 0, 1.14999],
    "8601": [0.19444, 0.69444, 0, 0, 1.14999],
    "8636": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8637": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8640": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8641": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8656": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8657": [0.19444, 0.69444, 0, 0, 0.70277],
    "8658": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8659": [0.19444, 0.69444, 0, 0, 0.70277],
    "8660": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8661": [0.25, 0.75, 0, 0, 0.70277],
    "8704": [0, 0.69444, 0, 0, 0.63889],
    "8706": [0, 0.69444, 0.06389, 0, 0.62847],
    "8707": [0, 0.69444, 0, 0, 0.63889],
    "8709": [0.05556, 0.75, 0, 0, 0.575],
    "8711": [0, 0.68611, 0, 0, 0.95833],
    "8712": [0.08556, 0.58556, 0, 0, 0.76666],
    "8715": [0.08556, 0.58556, 0, 0, 0.76666],
    "8722": [0.13333, 0.63333, 0, 0, 0.89444],
    "8723": [0.13333, 0.63333, 0, 0, 0.89444],
    "8725": [0.25, 0.75, 0, 0, 0.575],
    "8726": [0.25, 0.75, 0, 0, 0.575],
    "8727": [-0.02778, 0.47222, 0, 0, 0.575],
    "8728": [-0.02639, 0.47361, 0, 0, 0.575],
    "8729": [-0.02639, 0.47361, 0, 0, 0.575],
    "8730": [0.18, 0.82, 0, 0, 0.95833],
    "8733": [0, 0.44444, 0, 0, 0.89444],
    "8734": [0, 0.44444, 0, 0, 1.14999],
    "8736": [0, 0.69224, 0, 0, 0.72222],
    "8739": [0.25, 0.75, 0, 0, 0.31944],
    "8741": [0.25, 0.75, 0, 0, 0.575],
    "8743": [0, 0.55556, 0, 0, 0.76666],
    "8744": [0, 0.55556, 0, 0, 0.76666],
    "8745": [0, 0.55556, 0, 0, 0.76666],
    "8746": [0, 0.55556, 0, 0, 0.76666],
    "8747": [0.19444, 0.69444, 0.12778, 0, 0.56875],
    "8764": [-0.10889, 0.39111, 0, 0, 0.89444],
    "8768": [0.19444, 0.69444, 0, 0, 0.31944],
    "8771": [0.00222, 0.50222, 0, 0, 0.89444],
    "8776": [0.02444, 0.52444, 0, 0, 0.89444],
    "8781": [0.00222, 0.50222, 0, 0, 0.89444],
    "8801": [0.00222, 0.50222, 0, 0, 0.89444],
    "8804": [0.19667, 0.69667, 0, 0, 0.89444],
    "8805": [0.19667, 0.69667, 0, 0, 0.89444],
    "8810": [0.08556, 0.58556, 0, 0, 1.14999],
    "8811": [0.08556, 0.58556, 0, 0, 1.14999],
    "8826": [0.08556, 0.58556, 0, 0, 0.89444],
    "8827": [0.08556, 0.58556, 0, 0, 0.89444],
    "8834": [0.08556, 0.58556, 0, 0, 0.89444],
    "8835": [0.08556, 0.58556, 0, 0, 0.89444],
    "8838": [0.19667, 0.69667, 0, 0, 0.89444],
    "8839": [0.19667, 0.69667, 0, 0, 0.89444],
    "8846": [0, 0.55556, 0, 0, 0.76666],
    "8849": [0.19667, 0.69667, 0, 0, 0.89444],
    "8850": [0.19667, 0.69667, 0, 0, 0.89444],
    "8851": [0, 0.55556, 0, 0, 0.76666],
    "8852": [0, 0.55556, 0, 0, 0.76666],
    "8853": [0.13333, 0.63333, 0, 0, 0.89444],
    "8854": [0.13333, 0.63333, 0, 0, 0.89444],
    "8855": [0.13333, 0.63333, 0, 0, 0.89444],
    "8856": [0.13333, 0.63333, 0, 0, 0.89444],
    "8857": [0.13333, 0.63333, 0, 0, 0.89444],
    "8866": [0, 0.69444, 0, 0, 0.70277],
    "8867": [0, 0.69444, 0, 0, 0.70277],
    "8868": [0, 0.69444, 0, 0, 0.89444],
    "8869": [0, 0.69444, 0, 0, 0.89444],
    "8900": [-0.02639, 0.47361, 0, 0, 0.575],
    "8901": [-0.02639, 0.47361, 0, 0, 0.31944],
    "8902": [-0.02778, 0.47222, 0, 0, 0.575],
    "8968": [0.25, 0.75, 0, 0, 0.51111],
    "8969": [0.25, 0.75, 0, 0, 0.51111],
    "8970": [0.25, 0.75, 0, 0, 0.51111],
    "8971": [0.25, 0.75, 0, 0, 0.51111],
    "8994": [-0.13889, 0.36111, 0, 0, 1.14999],
    "8995": [-0.13889, 0.36111, 0, 0, 1.14999],
    "9651": [0.19444, 0.69444, 0, 0, 1.02222],
    "9657": [-0.02778, 0.47222, 0, 0, 0.575],
    "9661": [0.19444, 0.69444, 0, 0, 1.02222],
    "9667": [-0.02778, 0.47222, 0, 0, 0.575],
    "9711": [0.19444, 0.69444, 0, 0, 1.14999],
    "9824": [0.12963, 0.69444, 0, 0, 0.89444],
    "9825": [0.12963, 0.69444, 0, 0, 0.89444],
    "9826": [0.12963, 0.69444, 0, 0, 0.89444],
    "9827": [0.12963, 0.69444, 0, 0, 0.89444],
    "9837": [0, 0.75, 0, 0, 0.44722],
    "9838": [0.19444, 0.69444, 0, 0, 0.44722],
    "9839": [0.19444, 0.69444, 0, 0, 0.44722],
    "10216": [0.25, 0.75, 0, 0, 0.44722],
    "10217": [0.25, 0.75, 0, 0, 0.44722],
    "10815": [0, 0.68611, 0, 0, 0.9],
    "10927": [0.19667, 0.69667, 0, 0, 0.89444],
    "10928": [0.19667, 0.69667, 0, 0, 0.89444],
    "57376": [0.19444, 0.69444, 0, 0, 0]
  },
  "Main-BoldItalic": {
    "33": [0, 0.69444, 0.11417, 0, 0.38611],
    "34": [0, 0.69444, 0.07939, 0, 0.62055],
    "35": [0.19444, 0.69444, 0.06833, 0, 0.94444],
    "37": [0.05556, 0.75, 0.12861, 0, 0.94444],
    "38": [0, 0.69444, 0.08528, 0, 0.88555],
    "39": [0, 0.69444, 0.12945, 0, 0.35555],
    "40": [0.25, 0.75, 0.15806, 0, 0.47333],
    "41": [0.25, 0.75, 0.03306, 0, 0.47333],
    "42": [0, 0.75, 0.14333, 0, 0.59111],
    "43": [0.10333, 0.60333, 0.03306, 0, 0.88555],
    "44": [0.19444, 0.14722, 0, 0, 0.35555],
    "45": [0, 0.44444, 0.02611, 0, 0.41444],
    "46": [0, 0.14722, 0, 0, 0.35555],
    "47": [0.25, 0.75, 0.15806, 0, 0.59111],
    "48": [0, 0.64444, 0.13167, 0, 0.59111],
    "49": [0, 0.64444, 0.13167, 0, 0.59111],
    "50": [0, 0.64444, 0.13167, 0, 0.59111],
    "51": [0, 0.64444, 0.13167, 0, 0.59111],
    "52": [0.19444, 0.64444, 0.13167, 0, 0.59111],
    "53": [0, 0.64444, 0.13167, 0, 0.59111],
    "54": [0, 0.64444, 0.13167, 0, 0.59111],
    "55": [0.19444, 0.64444, 0.13167, 0, 0.59111],
    "56": [0, 0.64444, 0.13167, 0, 0.59111],
    "57": [0, 0.64444, 0.13167, 0, 0.59111],
    "58": [0, 0.44444, 0.06695, 0, 0.35555],
    "59": [0.19444, 0.44444, 0.06695, 0, 0.35555],
    "61": [-0.10889, 0.39111, 0.06833, 0, 0.88555],
    "63": [0, 0.69444, 0.11472, 0, 0.59111],
    "64": [0, 0.69444, 0.09208, 0, 0.88555],
    "65": [0, 0.68611, 0, 0, 0.86555],
    "66": [0, 0.68611, 0.0992, 0, 0.81666],
    "67": [0, 0.68611, 0.14208, 0, 0.82666],
    "68": [0, 0.68611, 0.09062, 0, 0.87555],
    "69": [0, 0.68611, 0.11431, 0, 0.75666],
    "70": [0, 0.68611, 0.12903, 0, 0.72722],
    "71": [0, 0.68611, 0.07347, 0, 0.89527],
    "72": [0, 0.68611, 0.17208, 0, 0.8961],
    "73": [0, 0.68611, 0.15681, 0, 0.47166],
    "74": [0, 0.68611, 0.145, 0, 0.61055],
    "75": [0, 0.68611, 0.14208, 0, 0.89499],
    "76": [0, 0.68611, 0, 0, 0.69777],
    "77": [0, 0.68611, 0.17208, 0, 1.07277],
    "78": [0, 0.68611, 0.17208, 0, 0.8961],
    "79": [0, 0.68611, 0.09062, 0, 0.85499],
    "80": [0, 0.68611, 0.0992, 0, 0.78721],
    "81": [0.19444, 0.68611, 0.09062, 0, 0.85499],
    "82": [0, 0.68611, 0.02559, 0, 0.85944],
    "83": [0, 0.68611, 0.11264, 0, 0.64999],
    "84": [0, 0.68611, 0.12903, 0, 0.7961],
    "85": [0, 0.68611, 0.17208, 0, 0.88083],
    "86": [0, 0.68611, 0.18625, 0, 0.86555],
    "87": [0, 0.68611, 0.18625, 0, 1.15999],
    "88": [0, 0.68611, 0.15681, 0, 0.86555],
    "89": [0, 0.68611, 0.19803, 0, 0.86555],
    "90": [0, 0.68611, 0.14208, 0, 0.70888],
    "91": [0.25, 0.75, 0.1875, 0, 0.35611],
    "93": [0.25, 0.75, 0.09972, 0, 0.35611],
    "94": [0, 0.69444, 0.06709, 0, 0.59111],
    "95": [0.31, 0.13444, 0.09811, 0, 0.59111],
    "97": [0, 0.44444, 0.09426, 0, 0.59111],
    "98": [0, 0.69444, 0.07861, 0, 0.53222],
    "99": [0, 0.44444, 0.05222, 0, 0.53222],
    "100": [0, 0.69444, 0.10861, 0, 0.59111],
    "101": [0, 0.44444, 0.085, 0, 0.53222],
    "102": [0.19444, 0.69444, 0.21778, 0, 0.4],
    "103": [0.19444, 0.44444, 0.105, 0, 0.53222],
    "104": [0, 0.69444, 0.09426, 0, 0.59111],
    "105": [0, 0.69326, 0.11387, 0, 0.35555],
    "106": [0.19444, 0.69326, 0.1672, 0, 0.35555],
    "107": [0, 0.69444, 0.11111, 0, 0.53222],
    "108": [0, 0.69444, 0.10861, 0, 0.29666],
    "109": [0, 0.44444, 0.09426, 0, 0.94444],
    "110": [0, 0.44444, 0.09426, 0, 0.64999],
    "111": [0, 0.44444, 0.07861, 0, 0.59111],
    "112": [0.19444, 0.44444, 0.07861, 0, 0.59111],
    "113": [0.19444, 0.44444, 0.105, 0, 0.53222],
    "114": [0, 0.44444, 0.11111, 0, 0.50167],
    "115": [0, 0.44444, 0.08167, 0, 0.48694],
    "116": [0, 0.63492, 0.09639, 0, 0.385],
    "117": [0, 0.44444, 0.09426, 0, 0.62055],
    "118": [0, 0.44444, 0.11111, 0, 0.53222],
    "119": [0, 0.44444, 0.11111, 0, 0.76777],
    "120": [0, 0.44444, 0.12583, 0, 0.56055],
    "121": [0.19444, 0.44444, 0.105, 0, 0.56166],
    "122": [0, 0.44444, 0.13889, 0, 0.49055],
    "126": [0.35, 0.34444, 0.11472, 0, 0.59111],
    "163": [0, 0.69444, 0, 0, 0.86853],
    "168": [0, 0.69444, 0.11473, 0, 0.59111],
    "176": [0, 0.69444, 0, 0, 0.94888],
    "184": [0.17014, 0, 0, 0, 0.53222],
    "198": [0, 0.68611, 0.11431, 0, 1.02277],
    "216": [0.04861, 0.73472, 0.09062, 0, 0.88555],
    "223": [0.19444, 0.69444, 0.09736, 0, 0.665],
    "230": [0, 0.44444, 0.085, 0, 0.82666],
    "248": [0.09722, 0.54167, 0.09458, 0, 0.59111],
    "305": [0, 0.44444, 0.09426, 0, 0.35555],
    "338": [0, 0.68611, 0.11431, 0, 1.14054],
    "339": [0, 0.44444, 0.085, 0, 0.82666],
    "567": [0.19444, 0.44444, 0.04611, 0, 0.385],
    "710": [0, 0.69444, 0.06709, 0, 0.59111],
    "711": [0, 0.63194, 0.08271, 0, 0.59111],
    "713": [0, 0.59444, 0.10444, 0, 0.59111],
    "714": [0, 0.69444, 0.08528, 0, 0.59111],
    "715": [0, 0.69444, 0, 0, 0.59111],
    "728": [0, 0.69444, 0.10333, 0, 0.59111],
    "729": [0, 0.69444, 0.12945, 0, 0.35555],
    "730": [0, 0.69444, 0, 0, 0.94888],
    "732": [0, 0.69444, 0.11472, 0, 0.59111],
    "733": [0, 0.69444, 0.11472, 0, 0.59111],
    "915": [0, 0.68611, 0.12903, 0, 0.69777],
    "916": [0, 0.68611, 0, 0, 0.94444],
    "920": [0, 0.68611, 0.09062, 0, 0.88555],
    "923": [0, 0.68611, 0, 0, 0.80666],
    "926": [0, 0.68611, 0.15092, 0, 0.76777],
    "928": [0, 0.68611, 0.17208, 0, 0.8961],
    "931": [0, 0.68611, 0.11431, 0, 0.82666],
    "933": [0, 0.68611, 0.10778, 0, 0.88555],
    "934": [0, 0.68611, 0.05632, 0, 0.82666],
    "936": [0, 0.68611, 0.10778, 0, 0.88555],
    "937": [0, 0.68611, 0.0992, 0, 0.82666],
    "8211": [0, 0.44444, 0.09811, 0, 0.59111],
    "8212": [0, 0.44444, 0.09811, 0, 1.18221],
    "8216": [0, 0.69444, 0.12945, 0, 0.35555],
    "8217": [0, 0.69444, 0.12945, 0, 0.35555],
    "8220": [0, 0.69444, 0.16772, 0, 0.62055],
    "8221": [0, 0.69444, 0.07939, 0, 0.62055]
  },
  "Main-Italic": {
    "33": [0, 0.69444, 0.12417, 0, 0.30667],
    "34": [0, 0.69444, 0.06961, 0, 0.51444],
    "35": [0.19444, 0.69444, 0.06616, 0, 0.81777],
    "37": [0.05556, 0.75, 0.13639, 0, 0.81777],
    "38": [0, 0.69444, 0.09694, 0, 0.76666],
    "39": [0, 0.69444, 0.12417, 0, 0.30667],
    "40": [0.25, 0.75, 0.16194, 0, 0.40889],
    "41": [0.25, 0.75, 0.03694, 0, 0.40889],
    "42": [0, 0.75, 0.14917, 0, 0.51111],
    "43": [0.05667, 0.56167, 0.03694, 0, 0.76666],
    "44": [0.19444, 0.10556, 0, 0, 0.30667],
    "45": [0, 0.43056, 0.02826, 0, 0.35778],
    "46": [0, 0.10556, 0, 0, 0.30667],
    "47": [0.25, 0.75, 0.16194, 0, 0.51111],
    "48": [0, 0.64444, 0.13556, 0, 0.51111],
    "49": [0, 0.64444, 0.13556, 0, 0.51111],
    "50": [0, 0.64444, 0.13556, 0, 0.51111],
    "51": [0, 0.64444, 0.13556, 0, 0.51111],
    "52": [0.19444, 0.64444, 0.13556, 0, 0.51111],
    "53": [0, 0.64444, 0.13556, 0, 0.51111],
    "54": [0, 0.64444, 0.13556, 0, 0.51111],
    "55": [0.19444, 0.64444, 0.13556, 0, 0.51111],
    "56": [0, 0.64444, 0.13556, 0, 0.51111],
    "57": [0, 0.64444, 0.13556, 0, 0.51111],
    "58": [0, 0.43056, 0.0582, 0, 0.30667],
    "59": [0.19444, 0.43056, 0.0582, 0, 0.30667],
    "61": [-0.13313, 0.36687, 0.06616, 0, 0.76666],
    "63": [0, 0.69444, 0.1225, 0, 0.51111],
    "64": [0, 0.69444, 0.09597, 0, 0.76666],
    "65": [0, 0.68333, 0, 0, 0.74333],
    "66": [0, 0.68333, 0.10257, 0, 0.70389],
    "67": [0, 0.68333, 0.14528, 0, 0.71555],
    "68": [0, 0.68333, 0.09403, 0, 0.755],
    "69": [0, 0.68333, 0.12028, 0, 0.67833],
    "70": [0, 0.68333, 0.13305, 0, 0.65277],
    "71": [0, 0.68333, 0.08722, 0, 0.77361],
    "72": [0, 0.68333, 0.16389, 0, 0.74333],
    "73": [0, 0.68333, 0.15806, 0, 0.38555],
    "74": [0, 0.68333, 0.14028, 0, 0.525],
    "75": [0, 0.68333, 0.14528, 0, 0.76888],
    "76": [0, 0.68333, 0, 0, 0.62722],
    "77": [0, 0.68333, 0.16389, 0, 0.89666],
    "78": [0, 0.68333, 0.16389, 0, 0.74333],
    "79": [0, 0.68333, 0.09403, 0, 0.76666],
    "80": [0, 0.68333, 0.10257, 0, 0.67833],
    "81": [0.19444, 0.68333, 0.09403, 0, 0.76666],
    "82": [0, 0.68333, 0.03868, 0, 0.72944],
    "83": [0, 0.68333, 0.11972, 0, 0.56222],
    "84": [0, 0.68333, 0.13305, 0, 0.71555],
    "85": [0, 0.68333, 0.16389, 0, 0.74333],
    "86": [0, 0.68333, 0.18361, 0, 0.74333],
    "87": [0, 0.68333, 0.18361, 0, 0.99888],
    "88": [0, 0.68333, 0.15806, 0, 0.74333],
    "89": [0, 0.68333, 0.19383, 0, 0.74333],
    "90": [0, 0.68333, 0.14528, 0, 0.61333],
    "91": [0.25, 0.75, 0.1875, 0, 0.30667],
    "93": [0.25, 0.75, 0.10528, 0, 0.30667],
    "94": [0, 0.69444, 0.06646, 0, 0.51111],
    "95": [0.31, 0.12056, 0.09208, 0, 0.51111],
    "97": [0, 0.43056, 0.07671, 0, 0.51111],
    "98": [0, 0.69444, 0.06312, 0, 0.46],
    "99": [0, 0.43056, 0.05653, 0, 0.46],
    "100": [0, 0.69444, 0.10333, 0, 0.51111],
    "101": [0, 0.43056, 0.07514, 0, 0.46],
    "102": [0.19444, 0.69444, 0.21194, 0, 0.30667],
    "103": [0.19444, 0.43056, 0.08847, 0, 0.46],
    "104": [0, 0.69444, 0.07671, 0, 0.51111],
    "105": [0, 0.65536, 0.1019, 0, 0.30667],
    "106": [0.19444, 0.65536, 0.14467, 0, 0.30667],
    "107": [0, 0.69444, 0.10764, 0, 0.46],
    "108": [0, 0.69444, 0.10333, 0, 0.25555],
    "109": [0, 0.43056, 0.07671, 0, 0.81777],
    "110": [0, 0.43056, 0.07671, 0, 0.56222],
    "111": [0, 0.43056, 0.06312, 0, 0.51111],
    "112": [0.19444, 0.43056, 0.06312, 0, 0.51111],
    "113": [0.19444, 0.43056, 0.08847, 0, 0.46],
    "114": [0, 0.43056, 0.10764, 0, 0.42166],
    "115": [0, 0.43056, 0.08208, 0, 0.40889],
    "116": [0, 0.61508, 0.09486, 0, 0.33222],
    "117": [0, 0.43056, 0.07671, 0, 0.53666],
    "118": [0, 0.43056, 0.10764, 0, 0.46],
    "119": [0, 0.43056, 0.10764, 0, 0.66444],
    "120": [0, 0.43056, 0.12042, 0, 0.46389],
    "121": [0.19444, 0.43056, 0.08847, 0, 0.48555],
    "122": [0, 0.43056, 0.12292, 0, 0.40889],
    "126": [0.35, 0.31786, 0.11585, 0, 0.51111],
    "163": [0, 0.69444, 0, 0, 0.76909],
    "168": [0, 0.66786, 0.10474, 0, 0.51111],
    "176": [0, 0.69444, 0, 0, 0.83129],
    "184": [0.17014, 0, 0, 0, 0.46],
    "198": [0, 0.68333, 0.12028, 0, 0.88277],
    "216": [0.04861, 0.73194, 0.09403, 0, 0.76666],
    "223": [0.19444, 0.69444, 0.10514, 0, 0.53666],
    "230": [0, 0.43056, 0.07514, 0, 0.71555],
    "248": [0.09722, 0.52778, 0.09194, 0, 0.51111],
    "305": [0, 0.43056, 0, 0.02778, 0.32246],
    "338": [0, 0.68333, 0.12028, 0, 0.98499],
    "339": [0, 0.43056, 0.07514, 0, 0.71555],
    "567": [0.19444, 0.43056, 0, 0.08334, 0.38403],
    "710": [0, 0.69444, 0.06646, 0, 0.51111],
    "711": [0, 0.62847, 0.08295, 0, 0.51111],
    "713": [0, 0.56167, 0.10333, 0, 0.51111],
    "714": [0, 0.69444, 0.09694, 0, 0.51111],
    "715": [0, 0.69444, 0, 0, 0.51111],
    "728": [0, 0.69444, 0.10806, 0, 0.51111],
    "729": [0, 0.66786, 0.11752, 0, 0.30667],
    "730": [0, 0.69444, 0, 0, 0.83129],
    "732": [0, 0.66786, 0.11585, 0, 0.51111],
    "733": [0, 0.69444, 0.1225, 0, 0.51111],
    "915": [0, 0.68333, 0.13305, 0, 0.62722],
    "916": [0, 0.68333, 0, 0, 0.81777],
    "920": [0, 0.68333, 0.09403, 0, 0.76666],
    "923": [0, 0.68333, 0, 0, 0.69222],
    "926": [0, 0.68333, 0.15294, 0, 0.66444],
    "928": [0, 0.68333, 0.16389, 0, 0.74333],
    "931": [0, 0.68333, 0.12028, 0, 0.71555],
    "933": [0, 0.68333, 0.11111, 0, 0.76666],
    "934": [0, 0.68333, 0.05986, 0, 0.71555],
    "936": [0, 0.68333, 0.11111, 0, 0.76666],
    "937": [0, 0.68333, 0.10257, 0, 0.71555],
    "8211": [0, 0.43056, 0.09208, 0, 0.51111],
    "8212": [0, 0.43056, 0.09208, 0, 1.02222],
    "8216": [0, 0.69444, 0.12417, 0, 0.30667],
    "8217": [0, 0.69444, 0.12417, 0, 0.30667],
    "8220": [0, 0.69444, 0.1685, 0, 0.51444],
    "8221": [0, 0.69444, 0.06961, 0, 0.51444],
    "8463": [0, 0.68889, 0, 0, 0.54028]
  },
  "Main-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "33": [0, 0.69444, 0, 0, 0.27778],
    "34": [0, 0.69444, 0, 0, 0.5],
    "35": [0.19444, 0.69444, 0, 0, 0.83334],
    "36": [0.05556, 0.75, 0, 0, 0.5],
    "37": [0.05556, 0.75, 0, 0, 0.83334],
    "38": [0, 0.69444, 0, 0, 0.77778],
    "39": [0, 0.69444, 0, 0, 0.27778],
    "40": [0.25, 0.75, 0, 0, 0.38889],
    "41": [0.25, 0.75, 0, 0, 0.38889],
    "42": [0, 0.75, 0, 0, 0.5],
    "43": [0.08333, 0.58333, 0, 0, 0.77778],
    "44": [0.19444, 0.10556, 0, 0, 0.27778],
    "45": [0, 0.43056, 0, 0, 0.33333],
    "46": [0, 0.10556, 0, 0, 0.27778],
    "47": [0.25, 0.75, 0, 0, 0.5],
    "48": [0, 0.64444, 0, 0, 0.5],
    "49": [0, 0.64444, 0, 0, 0.5],
    "50": [0, 0.64444, 0, 0, 0.5],
    "51": [0, 0.64444, 0, 0, 0.5],
    "52": [0, 0.64444, 0, 0, 0.5],
    "53": [0, 0.64444, 0, 0, 0.5],
    "54": [0, 0.64444, 0, 0, 0.5],
    "55": [0, 0.64444, 0, 0, 0.5],
    "56": [0, 0.64444, 0, 0, 0.5],
    "57": [0, 0.64444, 0, 0, 0.5],
    "58": [0, 0.43056, 0, 0, 0.27778],
    "59": [0.19444, 0.43056, 0, 0, 0.27778],
    "60": [0.0391, 0.5391, 0, 0, 0.77778],
    "61": [-0.13313, 0.36687, 0, 0, 0.77778],
    "62": [0.0391, 0.5391, 0, 0, 0.77778],
    "63": [0, 0.69444, 0, 0, 0.47222],
    "64": [0, 0.69444, 0, 0, 0.77778],
    "65": [0, 0.68333, 0, 0, 0.75],
    "66": [0, 0.68333, 0, 0, 0.70834],
    "67": [0, 0.68333, 0, 0, 0.72222],
    "68": [0, 0.68333, 0, 0, 0.76389],
    "69": [0, 0.68333, 0, 0, 0.68056],
    "70": [0, 0.68333, 0, 0, 0.65278],
    "71": [0, 0.68333, 0, 0, 0.78472],
    "72": [0, 0.68333, 0, 0, 0.75],
    "73": [0, 0.68333, 0, 0, 0.36111],
    "74": [0, 0.68333, 0, 0, 0.51389],
    "75": [0, 0.68333, 0, 0, 0.77778],
    "76": [0, 0.68333, 0, 0, 0.625],
    "77": [0, 0.68333, 0, 0, 0.91667],
    "78": [0, 0.68333, 0, 0, 0.75],
    "79": [0, 0.68333, 0, 0, 0.77778],
    "80": [0, 0.68333, 0, 0, 0.68056],
    "81": [0.19444, 0.68333, 0, 0, 0.77778],
    "82": [0, 0.68333, 0, 0, 0.73611],
    "83": [0, 0.68333, 0, 0, 0.55556],
    "84": [0, 0.68333, 0, 0, 0.72222],
    "85": [0, 0.68333, 0, 0, 0.75],
    "86": [0, 0.68333, 0.01389, 0, 0.75],
    "87": [0, 0.68333, 0.01389, 0, 1.02778],
    "88": [0, 0.68333, 0, 0, 0.75],
    "89": [0, 0.68333, 0.025, 0, 0.75],
    "90": [0, 0.68333, 0, 0, 0.61111],
    "91": [0.25, 0.75, 0, 0, 0.27778],
    "92": [0.25, 0.75, 0, 0, 0.5],
    "93": [0.25, 0.75, 0, 0, 0.27778],
    "94": [0, 0.69444, 0, 0, 0.5],
    "95": [0.31, 0.12056, 0.02778, 0, 0.5],
    "97": [0, 0.43056, 0, 0, 0.5],
    "98": [0, 0.69444, 0, 0, 0.55556],
    "99": [0, 0.43056, 0, 0, 0.44445],
    "100": [0, 0.69444, 0, 0, 0.55556],
    "101": [0, 0.43056, 0, 0, 0.44445],
    "102": [0, 0.69444, 0.07778, 0, 0.30556],
    "103": [0.19444, 0.43056, 0.01389, 0, 0.5],
    "104": [0, 0.69444, 0, 0, 0.55556],
    "105": [0, 0.66786, 0, 0, 0.27778],
    "106": [0.19444, 0.66786, 0, 0, 0.30556],
    "107": [0, 0.69444, 0, 0, 0.52778],
    "108": [0, 0.69444, 0, 0, 0.27778],
    "109": [0, 0.43056, 0, 0, 0.83334],
    "110": [0, 0.43056, 0, 0, 0.55556],
    "111": [0, 0.43056, 0, 0, 0.5],
    "112": [0.19444, 0.43056, 0, 0, 0.55556],
    "113": [0.19444, 0.43056, 0, 0, 0.52778],
    "114": [0, 0.43056, 0, 0, 0.39167],
    "115": [0, 0.43056, 0, 0, 0.39445],
    "116": [0, 0.61508, 0, 0, 0.38889],
    "117": [0, 0.43056, 0, 0, 0.55556],
    "118": [0, 0.43056, 0.01389, 0, 0.52778],
    "119": [0, 0.43056, 0.01389, 0, 0.72222],
    "120": [0, 0.43056, 0, 0, 0.52778],
    "121": [0.19444, 0.43056, 0.01389, 0, 0.52778],
    "122": [0, 0.43056, 0, 0, 0.44445],
    "123": [0.25, 0.75, 0, 0, 0.5],
    "124": [0.25, 0.75, 0, 0, 0.27778],
    "125": [0.25, 0.75, 0, 0, 0.5],
    "126": [0.35, 0.31786, 0, 0, 0.5],
    "160": [0, 0, 0, 0, 0.25],
    "167": [0.19444, 0.69444, 0, 0, 0.44445],
    "168": [0, 0.66786, 0, 0, 0.5],
    "172": [0, 0.43056, 0, 0, 0.66667],
    "176": [0, 0.69444, 0, 0, 0.75],
    "177": [0.08333, 0.58333, 0, 0, 0.77778],
    "182": [0.19444, 0.69444, 0, 0, 0.61111],
    "184": [0.17014, 0, 0, 0, 0.44445],
    "198": [0, 0.68333, 0, 0, 0.90278],
    "215": [0.08333, 0.58333, 0, 0, 0.77778],
    "216": [0.04861, 0.73194, 0, 0, 0.77778],
    "223": [0, 0.69444, 0, 0, 0.5],
    "230": [0, 0.43056, 0, 0, 0.72222],
    "247": [0.08333, 0.58333, 0, 0, 0.77778],
    "248": [0.09722, 0.52778, 0, 0, 0.5],
    "305": [0, 0.43056, 0, 0, 0.27778],
    "338": [0, 0.68333, 0, 0, 1.01389],
    "339": [0, 0.43056, 0, 0, 0.77778],
    "567": [0.19444, 0.43056, 0, 0, 0.30556],
    "710": [0, 0.69444, 0, 0, 0.5],
    "711": [0, 0.62847, 0, 0, 0.5],
    "713": [0, 0.56778, 0, 0, 0.5],
    "714": [0, 0.69444, 0, 0, 0.5],
    "715": [0, 0.69444, 0, 0, 0.5],
    "728": [0, 0.69444, 0, 0, 0.5],
    "729": [0, 0.66786, 0, 0, 0.27778],
    "730": [0, 0.69444, 0, 0, 0.75],
    "732": [0, 0.66786, 0, 0, 0.5],
    "733": [0, 0.69444, 0, 0, 0.5],
    "915": [0, 0.68333, 0, 0, 0.625],
    "916": [0, 0.68333, 0, 0, 0.83334],
    "920": [0, 0.68333, 0, 0, 0.77778],
    "923": [0, 0.68333, 0, 0, 0.69445],
    "926": [0, 0.68333, 0, 0, 0.66667],
    "928": [0, 0.68333, 0, 0, 0.75],
    "931": [0, 0.68333, 0, 0, 0.72222],
    "933": [0, 0.68333, 0, 0, 0.77778],
    "934": [0, 0.68333, 0, 0, 0.72222],
    "936": [0, 0.68333, 0, 0, 0.77778],
    "937": [0, 0.68333, 0, 0, 0.72222],
    "8211": [0, 0.43056, 0.02778, 0, 0.5],
    "8212": [0, 0.43056, 0.02778, 0, 1.0],
    "8216": [0, 0.69444, 0, 0, 0.27778],
    "8217": [0, 0.69444, 0, 0, 0.27778],
    "8220": [0, 0.69444, 0, 0, 0.5],
    "8221": [0, 0.69444, 0, 0, 0.5],
    "8224": [0.19444, 0.69444, 0, 0, 0.44445],
    "8225": [0.19444, 0.69444, 0, 0, 0.44445],
    "8230": [0, 0.12, 0, 0, 1.172],
    "8242": [0, 0.55556, 0, 0, 0.275],
    "8407": [0, 0.71444, 0.15382, 0, 0.5],
    "8463": [0, 0.68889, 0, 0, 0.54028],
    "8465": [0, 0.69444, 0, 0, 0.72222],
    "8467": [0, 0.69444, 0, 0.11111, 0.41667],
    "8472": [0.19444, 0.43056, 0, 0.11111, 0.63646],
    "8476": [0, 0.69444, 0, 0, 0.72222],
    "8501": [0, 0.69444, 0, 0, 0.61111],
    "8592": [-0.13313, 0.36687, 0, 0, 1.0],
    "8593": [0.19444, 0.69444, 0, 0, 0.5],
    "8594": [-0.13313, 0.36687, 0, 0, 1.0],
    "8595": [0.19444, 0.69444, 0, 0, 0.5],
    "8596": [-0.13313, 0.36687, 0, 0, 1.0],
    "8597": [0.25, 0.75, 0, 0, 0.5],
    "8598": [0.19444, 0.69444, 0, 0, 1.0],
    "8599": [0.19444, 0.69444, 0, 0, 1.0],
    "8600": [0.19444, 0.69444, 0, 0, 1.0],
    "8601": [0.19444, 0.69444, 0, 0, 1.0],
    "8614": [0.011, 0.511, 0, 0, 1.0],
    "8617": [0.011, 0.511, 0, 0, 1.126],
    "8618": [0.011, 0.511, 0, 0, 1.126],
    "8636": [-0.13313, 0.36687, 0, 0, 1.0],
    "8637": [-0.13313, 0.36687, 0, 0, 1.0],
    "8640": [-0.13313, 0.36687, 0, 0, 1.0],
    "8641": [-0.13313, 0.36687, 0, 0, 1.0],
    "8652": [0.011, 0.671, 0, 0, 1.0],
    "8656": [-0.13313, 0.36687, 0, 0, 1.0],
    "8657": [0.19444, 0.69444, 0, 0, 0.61111],
    "8658": [-0.13313, 0.36687, 0, 0, 1.0],
    "8659": [0.19444, 0.69444, 0, 0, 0.61111],
    "8660": [-0.13313, 0.36687, 0, 0, 1.0],
    "8661": [0.25, 0.75, 0, 0, 0.61111],
    "8704": [0, 0.69444, 0, 0, 0.55556],
    "8706": [0, 0.69444, 0.05556, 0.08334, 0.5309],
    "8707": [0, 0.69444, 0, 0, 0.55556],
    "8709": [0.05556, 0.75, 0, 0, 0.5],
    "8711": [0, 0.68333, 0, 0, 0.83334],
    "8712": [0.0391, 0.5391, 0, 0, 0.66667],
    "8715": [0.0391, 0.5391, 0, 0, 0.66667],
    "8722": [0.08333, 0.58333, 0, 0, 0.77778],
    "8723": [0.08333, 0.58333, 0, 0, 0.77778],
    "8725": [0.25, 0.75, 0, 0, 0.5],
    "8726": [0.25, 0.75, 0, 0, 0.5],
    "8727": [-0.03472, 0.46528, 0, 0, 0.5],
    "8728": [-0.05555, 0.44445, 0, 0, 0.5],
    "8729": [-0.05555, 0.44445, 0, 0, 0.5],
    "8730": [0.2, 0.8, 0, 0, 0.83334],
    "8733": [0, 0.43056, 0, 0, 0.77778],
    "8734": [0, 0.43056, 0, 0, 1.0],
    "8736": [0, 0.69224, 0, 0, 0.72222],
    "8739": [0.25, 0.75, 0, 0, 0.27778],
    "8741": [0.25, 0.75, 0, 0, 0.5],
    "8743": [0, 0.55556, 0, 0, 0.66667],
    "8744": [0, 0.55556, 0, 0, 0.66667],
    "8745": [0, 0.55556, 0, 0, 0.66667],
    "8746": [0, 0.55556, 0, 0, 0.66667],
    "8747": [0.19444, 0.69444, 0.11111, 0, 0.41667],
    "8764": [-0.13313, 0.36687, 0, 0, 0.77778],
    "8768": [0.19444, 0.69444, 0, 0, 0.27778],
    "8771": [-0.03625, 0.46375, 0, 0, 0.77778],
    "8773": [-0.022, 0.589, 0, 0, 1.0],
    "8776": [-0.01688, 0.48312, 0, 0, 0.77778],
    "8781": [-0.03625, 0.46375, 0, 0, 0.77778],
    "8784": [-0.133, 0.67, 0, 0, 0.778],
    "8801": [-0.03625, 0.46375, 0, 0, 0.77778],
    "8804": [0.13597, 0.63597, 0, 0, 0.77778],
    "8805": [0.13597, 0.63597, 0, 0, 0.77778],
    "8810": [0.0391, 0.5391, 0, 0, 1.0],
    "8811": [0.0391, 0.5391, 0, 0, 1.0],
    "8826": [0.0391, 0.5391, 0, 0, 0.77778],
    "8827": [0.0391, 0.5391, 0, 0, 0.77778],
    "8834": [0.0391, 0.5391, 0, 0, 0.77778],
    "8835": [0.0391, 0.5391, 0, 0, 0.77778],
    "8838": [0.13597, 0.63597, 0, 0, 0.77778],
    "8839": [0.13597, 0.63597, 0, 0, 0.77778],
    "8846": [0, 0.55556, 0, 0, 0.66667],
    "8849": [0.13597, 0.63597, 0, 0, 0.77778],
    "8850": [0.13597, 0.63597, 0, 0, 0.77778],
    "8851": [0, 0.55556, 0, 0, 0.66667],
    "8852": [0, 0.55556, 0, 0, 0.66667],
    "8853": [0.08333, 0.58333, 0, 0, 0.77778],
    "8854": [0.08333, 0.58333, 0, 0, 0.77778],
    "8855": [0.08333, 0.58333, 0, 0, 0.77778],
    "8856": [0.08333, 0.58333, 0, 0, 0.77778],
    "8857": [0.08333, 0.58333, 0, 0, 0.77778],
    "8866": [0, 0.69444, 0, 0, 0.61111],
    "8867": [0, 0.69444, 0, 0, 0.61111],
    "8868": [0, 0.69444, 0, 0, 0.77778],
    "8869": [0, 0.69444, 0, 0, 0.77778],
    "8872": [0.249, 0.75, 0, 0, 0.867],
    "8900": [-0.05555, 0.44445, 0, 0, 0.5],
    "8901": [-0.05555, 0.44445, 0, 0, 0.27778],
    "8902": [-0.03472, 0.46528, 0, 0, 0.5],
    "8904": [0.005, 0.505, 0, 0, 0.9],
    "8942": [0.03, 0.9, 0, 0, 0.278],
    "8943": [-0.19, 0.31, 0, 0, 1.172],
    "8945": [-0.1, 0.82, 0, 0, 1.282],
    "8968": [0.25, 0.75, 0, 0, 0.44445],
    "8969": [0.25, 0.75, 0, 0, 0.44445],
    "8970": [0.25, 0.75, 0, 0, 0.44445],
    "8971": [0.25, 0.75, 0, 0, 0.44445],
    "8994": [-0.14236, 0.35764, 0, 0, 1.0],
    "8995": [-0.14236, 0.35764, 0, 0, 1.0],
    "9136": [0.244, 0.744, 0, 0, 0.412],
    "9137": [0.244, 0.744, 0, 0, 0.412],
    "9651": [0.19444, 0.69444, 0, 0, 0.88889],
    "9657": [-0.03472, 0.46528, 0, 0, 0.5],
    "9661": [0.19444, 0.69444, 0, 0, 0.88889],
    "9667": [-0.03472, 0.46528, 0, 0, 0.5],
    "9711": [0.19444, 0.69444, 0, 0, 1.0],
    "9824": [0.12963, 0.69444, 0, 0, 0.77778],
    "9825": [0.12963, 0.69444, 0, 0, 0.77778],
    "9826": [0.12963, 0.69444, 0, 0, 0.77778],
    "9827": [0.12963, 0.69444, 0, 0, 0.77778],
    "9837": [0, 0.75, 0, 0, 0.38889],
    "9838": [0.19444, 0.69444, 0, 0, 0.38889],
    "9839": [0.19444, 0.69444, 0, 0, 0.38889],
    "10216": [0.25, 0.75, 0, 0, 0.38889],
    "10217": [0.25, 0.75, 0, 0, 0.38889],
    "10222": [0.244, 0.744, 0, 0, 0.412],
    "10223": [0.244, 0.744, 0, 0, 0.412],
    "10229": [0.011, 0.511, 0, 0, 1.609],
    "10230": [0.011, 0.511, 0, 0, 1.638],
    "10231": [0.011, 0.511, 0, 0, 1.859],
    "10232": [0.024, 0.525, 0, 0, 1.609],
    "10233": [0.024, 0.525, 0, 0, 1.638],
    "10234": [0.024, 0.525, 0, 0, 1.858],
    "10236": [0.011, 0.511, 0, 0, 1.638],
    "10815": [0, 0.68333, 0, 0, 0.75],
    "10927": [0.13597, 0.63597, 0, 0, 0.77778],
    "10928": [0.13597, 0.63597, 0, 0, 0.77778],
    "57376": [0.19444, 0.69444, 0, 0, 0]
  },
  "Math-BoldItalic": {
    "65": [0, 0.68611, 0, 0, 0.86944],
    "66": [0, 0.68611, 0.04835, 0, 0.8664],
    "67": [0, 0.68611, 0.06979, 0, 0.81694],
    "68": [0, 0.68611, 0.03194, 0, 0.93812],
    "69": [0, 0.68611, 0.05451, 0, 0.81007],
    "70": [0, 0.68611, 0.15972, 0, 0.68889],
    "71": [0, 0.68611, 0, 0, 0.88673],
    "72": [0, 0.68611, 0.08229, 0, 0.98229],
    "73": [0, 0.68611, 0.07778, 0, 0.51111],
    "74": [0, 0.68611, 0.10069, 0, 0.63125],
    "75": [0, 0.68611, 0.06979, 0, 0.97118],
    "76": [0, 0.68611, 0, 0, 0.75555],
    "77": [0, 0.68611, 0.11424, 0, 1.14201],
    "78": [0, 0.68611, 0.11424, 0, 0.95034],
    "79": [0, 0.68611, 0.03194, 0, 0.83666],
    "80": [0, 0.68611, 0.15972, 0, 0.72309],
    "81": [0.19444, 0.68611, 0, 0, 0.86861],
    "82": [0, 0.68611, 0.00421, 0, 0.87235],
    "83": [0, 0.68611, 0.05382, 0, 0.69271],
    "84": [0, 0.68611, 0.15972, 0, 0.63663],
    "85": [0, 0.68611, 0.11424, 0, 0.80027],
    "86": [0, 0.68611, 0.25555, 0, 0.67778],
    "87": [0, 0.68611, 0.15972, 0, 1.09305],
    "88": [0, 0.68611, 0.07778, 0, 0.94722],
    "89": [0, 0.68611, 0.25555, 0, 0.67458],
    "90": [0, 0.68611, 0.06979, 0, 0.77257],
    "97": [0, 0.44444, 0, 0, 0.63287],
    "98": [0, 0.69444, 0, 0, 0.52083],
    "99": [0, 0.44444, 0, 0, 0.51342],
    "100": [0, 0.69444, 0, 0, 0.60972],
    "101": [0, 0.44444, 0, 0, 0.55361],
    "102": [0.19444, 0.69444, 0.11042, 0, 0.56806],
    "103": [0.19444, 0.44444, 0.03704, 0, 0.5449],
    "104": [0, 0.69444, 0, 0, 0.66759],
    "105": [0, 0.69326, 0, 0, 0.4048],
    "106": [0.19444, 0.69326, 0.0622, 0, 0.47083],
    "107": [0, 0.69444, 0.01852, 0, 0.6037],
    "108": [0, 0.69444, 0.0088, 0, 0.34815],
    "109": [0, 0.44444, 0, 0, 1.0324],
    "110": [0, 0.44444, 0, 0, 0.71296],
    "111": [0, 0.44444, 0, 0, 0.58472],
    "112": [0.19444, 0.44444, 0, 0, 0.60092],
    "113": [0.19444, 0.44444, 0.03704, 0, 0.54213],
    "114": [0, 0.44444, 0.03194, 0, 0.5287],
    "115": [0, 0.44444, 0, 0, 0.53125],
    "116": [0, 0.63492, 0, 0, 0.41528],
    "117": [0, 0.44444, 0, 0, 0.68102],
    "118": [0, 0.44444, 0.03704, 0, 0.56666],
    "119": [0, 0.44444, 0.02778, 0, 0.83148],
    "120": [0, 0.44444, 0, 0, 0.65903],
    "121": [0.19444, 0.44444, 0.03704, 0, 0.59028],
    "122": [0, 0.44444, 0.04213, 0, 0.55509],
    "915": [0, 0.68611, 0.15972, 0, 0.65694],
    "916": [0, 0.68611, 0, 0, 0.95833],
    "920": [0, 0.68611, 0.03194, 0, 0.86722],
    "923": [0, 0.68611, 0, 0, 0.80555],
    "926": [0, 0.68611, 0.07458, 0, 0.84125],
    "928": [0, 0.68611, 0.08229, 0, 0.98229],
    "931": [0, 0.68611, 0.05451, 0, 0.88507],
    "933": [0, 0.68611, 0.15972, 0, 0.67083],
    "934": [0, 0.68611, 0, 0, 0.76666],
    "936": [0, 0.68611, 0.11653, 0, 0.71402],
    "937": [0, 0.68611, 0.04835, 0, 0.8789],
    "945": [0, 0.44444, 0, 0, 0.76064],
    "946": [0.19444, 0.69444, 0.03403, 0, 0.65972],
    "947": [0.19444, 0.44444, 0.06389, 0, 0.59003],
    "948": [0, 0.69444, 0.03819, 0, 0.52222],
    "949": [0, 0.44444, 0, 0, 0.52882],
    "950": [0.19444, 0.69444, 0.06215, 0, 0.50833],
    "951": [0.19444, 0.44444, 0.03704, 0, 0.6],
    "952": [0, 0.69444, 0.03194, 0, 0.5618],
    "953": [0, 0.44444, 0, 0, 0.41204],
    "954": [0, 0.44444, 0, 0, 0.66759],
    "955": [0, 0.69444, 0, 0, 0.67083],
    "956": [0.19444, 0.44444, 0, 0, 0.70787],
    "957": [0, 0.44444, 0.06898, 0, 0.57685],
    "958": [0.19444, 0.69444, 0.03021, 0, 0.50833],
    "959": [0, 0.44444, 0, 0, 0.58472],
    "960": [0, 0.44444, 0.03704, 0, 0.68241],
    "961": [0.19444, 0.44444, 0, 0, 0.6118],
    "962": [0.09722, 0.44444, 0.07917, 0, 0.42361],
    "963": [0, 0.44444, 0.03704, 0, 0.68588],
    "964": [0, 0.44444, 0.13472, 0, 0.52083],
    "965": [0, 0.44444, 0.03704, 0, 0.63055],
    "966": [0.19444, 0.44444, 0, 0, 0.74722],
    "967": [0.19444, 0.44444, 0, 0, 0.71805],
    "968": [0.19444, 0.69444, 0.03704, 0, 0.75833],
    "969": [0, 0.44444, 0.03704, 0, 0.71782],
    "977": [0, 0.69444, 0, 0, 0.69155],
    "981": [0.19444, 0.69444, 0, 0, 0.7125],
    "982": [0, 0.44444, 0.03194, 0, 0.975],
    "1009": [0.19444, 0.44444, 0, 0, 0.6118],
    "1013": [0, 0.44444, 0, 0, 0.48333]
  },
  "Math-Italic": {
    "65": [0, 0.68333, 0, 0.13889, 0.75],
    "66": [0, 0.68333, 0.05017, 0.08334, 0.75851],
    "67": [0, 0.68333, 0.07153, 0.08334, 0.71472],
    "68": [0, 0.68333, 0.02778, 0.05556, 0.82792],
    "69": [0, 0.68333, 0.05764, 0.08334, 0.7382],
    "70": [0, 0.68333, 0.13889, 0.08334, 0.64306],
    "71": [0, 0.68333, 0, 0.08334, 0.78625],
    "72": [0, 0.68333, 0.08125, 0.05556, 0.83125],
    "73": [0, 0.68333, 0.07847, 0.11111, 0.43958],
    "74": [0, 0.68333, 0.09618, 0.16667, 0.55451],
    "75": [0, 0.68333, 0.07153, 0.05556, 0.84931],
    "76": [0, 0.68333, 0, 0.02778, 0.68056],
    "77": [0, 0.68333, 0.10903, 0.08334, 0.97014],
    "78": [0, 0.68333, 0.10903, 0.08334, 0.80347],
    "79": [0, 0.68333, 0.02778, 0.08334, 0.76278],
    "80": [0, 0.68333, 0.13889, 0.08334, 0.64201],
    "81": [0.19444, 0.68333, 0, 0.08334, 0.79056],
    "82": [0, 0.68333, 0.00773, 0.08334, 0.75929],
    "83": [0, 0.68333, 0.05764, 0.08334, 0.6132],
    "84": [0, 0.68333, 0.13889, 0.08334, 0.58438],
    "85": [0, 0.68333, 0.10903, 0.02778, 0.68278],
    "86": [0, 0.68333, 0.22222, 0, 0.58333],
    "87": [0, 0.68333, 0.13889, 0, 0.94445],
    "88": [0, 0.68333, 0.07847, 0.08334, 0.82847],
    "89": [0, 0.68333, 0.22222, 0, 0.58056],
    "90": [0, 0.68333, 0.07153, 0.08334, 0.68264],
    "97": [0, 0.43056, 0, 0, 0.52859],
    "98": [0, 0.69444, 0, 0, 0.42917],
    "99": [0, 0.43056, 0, 0.05556, 0.43276],
    "100": [0, 0.69444, 0, 0.16667, 0.52049],
    "101": [0, 0.43056, 0, 0.05556, 0.46563],
    "102": [0.19444, 0.69444, 0.10764, 0.16667, 0.48959],
    "103": [0.19444, 0.43056, 0.03588, 0.02778, 0.47697],
    "104": [0, 0.69444, 0, 0, 0.57616],
    "105": [0, 0.65952, 0, 0, 0.34451],
    "106": [0.19444, 0.65952, 0.05724, 0, 0.41181],
    "107": [0, 0.69444, 0.03148, 0, 0.5206],
    "108": [0, 0.69444, 0.01968, 0.08334, 0.29838],
    "109": [0, 0.43056, 0, 0, 0.87801],
    "110": [0, 0.43056, 0, 0, 0.60023],
    "111": [0, 0.43056, 0, 0.05556, 0.48472],
    "112": [0.19444, 0.43056, 0, 0.08334, 0.50313],
    "113": [0.19444, 0.43056, 0.03588, 0.08334, 0.44641],
    "114": [0, 0.43056, 0.02778, 0.05556, 0.45116],
    "115": [0, 0.43056, 0, 0.05556, 0.46875],
    "116": [0, 0.61508, 0, 0.08334, 0.36111],
    "117": [0, 0.43056, 0, 0.02778, 0.57246],
    "118": [0, 0.43056, 0.03588, 0.02778, 0.48472],
    "119": [0, 0.43056, 0.02691, 0.08334, 0.71592],
    "120": [0, 0.43056, 0, 0.02778, 0.57153],
    "121": [0.19444, 0.43056, 0.03588, 0.05556, 0.49028],
    "122": [0, 0.43056, 0.04398, 0.05556, 0.46505],
    "915": [0, 0.68333, 0.13889, 0.08334, 0.61528],
    "916": [0, 0.68333, 0, 0.16667, 0.83334],
    "920": [0, 0.68333, 0.02778, 0.08334, 0.76278],
    "923": [0, 0.68333, 0, 0.16667, 0.69445],
    "926": [0, 0.68333, 0.07569, 0.08334, 0.74236],
    "928": [0, 0.68333, 0.08125, 0.05556, 0.83125],
    "931": [0, 0.68333, 0.05764, 0.08334, 0.77986],
    "933": [0, 0.68333, 0.13889, 0.05556, 0.58333],
    "934": [0, 0.68333, 0, 0.08334, 0.66667],
    "936": [0, 0.68333, 0.11, 0.05556, 0.61222],
    "937": [0, 0.68333, 0.05017, 0.08334, 0.7724],
    "945": [0, 0.43056, 0.0037, 0.02778, 0.6397],
    "946": [0.19444, 0.69444, 0.05278, 0.08334, 0.56563],
    "947": [0.19444, 0.43056, 0.05556, 0, 0.51773],
    "948": [0, 0.69444, 0.03785, 0.05556, 0.44444],
    "949": [0, 0.43056, 0, 0.08334, 0.46632],
    "950": [0.19444, 0.69444, 0.07378, 0.08334, 0.4375],
    "951": [0.19444, 0.43056, 0.03588, 0.05556, 0.49653],
    "952": [0, 0.69444, 0.02778, 0.08334, 0.46944],
    "953": [0, 0.43056, 0, 0.05556, 0.35394],
    "954": [0, 0.43056, 0, 0, 0.57616],
    "955": [0, 0.69444, 0, 0, 0.58334],
    "956": [0.19444, 0.43056, 0, 0.02778, 0.60255],
    "957": [0, 0.43056, 0.06366, 0.02778, 0.49398],
    "958": [0.19444, 0.69444, 0.04601, 0.11111, 0.4375],
    "959": [0, 0.43056, 0, 0.05556, 0.48472],
    "960": [0, 0.43056, 0.03588, 0, 0.57003],
    "961": [0.19444, 0.43056, 0, 0.08334, 0.51702],
    "962": [0.09722, 0.43056, 0.07986, 0.08334, 0.36285],
    "963": [0, 0.43056, 0.03588, 0, 0.57141],
    "964": [0, 0.43056, 0.1132, 0.02778, 0.43715],
    "965": [0, 0.43056, 0.03588, 0.02778, 0.54028],
    "966": [0.19444, 0.43056, 0, 0.08334, 0.65417],
    "967": [0.19444, 0.43056, 0, 0.05556, 0.62569],
    "968": [0.19444, 0.69444, 0.03588, 0.11111, 0.65139],
    "969": [0, 0.43056, 0.03588, 0, 0.62245],
    "977": [0, 0.69444, 0, 0.08334, 0.59144],
    "981": [0.19444, 0.69444, 0, 0.08334, 0.59583],
    "982": [0, 0.43056, 0.02778, 0, 0.82813],
    "1009": [0.19444, 0.43056, 0, 0.08334, 0.51702],
    "1013": [0, 0.43056, 0, 0.05556, 0.4059]
  },
  "Math-Regular": {
    "65": [0, 0.68333, 0, 0.13889, 0.75],
    "66": [0, 0.68333, 0.05017, 0.08334, 0.75851],
    "67": [0, 0.68333, 0.07153, 0.08334, 0.71472],
    "68": [0, 0.68333, 0.02778, 0.05556, 0.82792],
    "69": [0, 0.68333, 0.05764, 0.08334, 0.7382],
    "70": [0, 0.68333, 0.13889, 0.08334, 0.64306],
    "71": [0, 0.68333, 0, 0.08334, 0.78625],
    "72": [0, 0.68333, 0.08125, 0.05556, 0.83125],
    "73": [0, 0.68333, 0.07847, 0.11111, 0.43958],
    "74": [0, 0.68333, 0.09618, 0.16667, 0.55451],
    "75": [0, 0.68333, 0.07153, 0.05556, 0.84931],
    "76": [0, 0.68333, 0, 0.02778, 0.68056],
    "77": [0, 0.68333, 0.10903, 0.08334, 0.97014],
    "78": [0, 0.68333, 0.10903, 0.08334, 0.80347],
    "79": [0, 0.68333, 0.02778, 0.08334, 0.76278],
    "80": [0, 0.68333, 0.13889, 0.08334, 0.64201],
    "81": [0.19444, 0.68333, 0, 0.08334, 0.79056],
    "82": [0, 0.68333, 0.00773, 0.08334, 0.75929],
    "83": [0, 0.68333, 0.05764, 0.08334, 0.6132],
    "84": [0, 0.68333, 0.13889, 0.08334, 0.58438],
    "85": [0, 0.68333, 0.10903, 0.02778, 0.68278],
    "86": [0, 0.68333, 0.22222, 0, 0.58333],
    "87": [0, 0.68333, 0.13889, 0, 0.94445],
    "88": [0, 0.68333, 0.07847, 0.08334, 0.82847],
    "89": [0, 0.68333, 0.22222, 0, 0.58056],
    "90": [0, 0.68333, 0.07153, 0.08334, 0.68264],
    "97": [0, 0.43056, 0, 0, 0.52859],
    "98": [0, 0.69444, 0, 0, 0.42917],
    "99": [0, 0.43056, 0, 0.05556, 0.43276],
    "100": [0, 0.69444, 0, 0.16667, 0.52049],
    "101": [0, 0.43056, 0, 0.05556, 0.46563],
    "102": [0.19444, 0.69444, 0.10764, 0.16667, 0.48959],
    "103": [0.19444, 0.43056, 0.03588, 0.02778, 0.47697],
    "104": [0, 0.69444, 0, 0, 0.57616],
    "105": [0, 0.65952, 0, 0, 0.34451],
    "106": [0.19444, 0.65952, 0.05724, 0, 0.41181],
    "107": [0, 0.69444, 0.03148, 0, 0.5206],
    "108": [0, 0.69444, 0.01968, 0.08334, 0.29838],
    "109": [0, 0.43056, 0, 0, 0.87801],
    "110": [0, 0.43056, 0, 0, 0.60023],
    "111": [0, 0.43056, 0, 0.05556, 0.48472],
    "112": [0.19444, 0.43056, 0, 0.08334, 0.50313],
    "113": [0.19444, 0.43056, 0.03588, 0.08334, 0.44641],
    "114": [0, 0.43056, 0.02778, 0.05556, 0.45116],
    "115": [0, 0.43056, 0, 0.05556, 0.46875],
    "116": [0, 0.61508, 0, 0.08334, 0.36111],
    "117": [0, 0.43056, 0, 0.02778, 0.57246],
    "118": [0, 0.43056, 0.03588, 0.02778, 0.48472],
    "119": [0, 0.43056, 0.02691, 0.08334, 0.71592],
    "120": [0, 0.43056, 0, 0.02778, 0.57153],
    "121": [0.19444, 0.43056, 0.03588, 0.05556, 0.49028],
    "122": [0, 0.43056, 0.04398, 0.05556, 0.46505],
    "915": [0, 0.68333, 0.13889, 0.08334, 0.61528],
    "916": [0, 0.68333, 0, 0.16667, 0.83334],
    "920": [0, 0.68333, 0.02778, 0.08334, 0.76278],
    "923": [0, 0.68333, 0, 0.16667, 0.69445],
    "926": [0, 0.68333, 0.07569, 0.08334, 0.74236],
    "928": [0, 0.68333, 0.08125, 0.05556, 0.83125],
    "931": [0, 0.68333, 0.05764, 0.08334, 0.77986],
    "933": [0, 0.68333, 0.13889, 0.05556, 0.58333],
    "934": [0, 0.68333, 0, 0.08334, 0.66667],
    "936": [0, 0.68333, 0.11, 0.05556, 0.61222],
    "937": [0, 0.68333, 0.05017, 0.08334, 0.7724],
    "945": [0, 0.43056, 0.0037, 0.02778, 0.6397],
    "946": [0.19444, 0.69444, 0.05278, 0.08334, 0.56563],
    "947": [0.19444, 0.43056, 0.05556, 0, 0.51773],
    "948": [0, 0.69444, 0.03785, 0.05556, 0.44444],
    "949": [0, 0.43056, 0, 0.08334, 0.46632],
    "950": [0.19444, 0.69444, 0.07378, 0.08334, 0.4375],
    "951": [0.19444, 0.43056, 0.03588, 0.05556, 0.49653],
    "952": [0, 0.69444, 0.02778, 0.08334, 0.46944],
    "953": [0, 0.43056, 0, 0.05556, 0.35394],
    "954": [0, 0.43056, 0, 0, 0.57616],
    "955": [0, 0.69444, 0, 0, 0.58334],
    "956": [0.19444, 0.43056, 0, 0.02778, 0.60255],
    "957": [0, 0.43056, 0.06366, 0.02778, 0.49398],
    "958": [0.19444, 0.69444, 0.04601, 0.11111, 0.4375],
    "959": [0, 0.43056, 0, 0.05556, 0.48472],
    "960": [0, 0.43056, 0.03588, 0, 0.57003],
    "961": [0.19444, 0.43056, 0, 0.08334, 0.51702],
    "962": [0.09722, 0.43056, 0.07986, 0.08334, 0.36285],
    "963": [0, 0.43056, 0.03588, 0, 0.57141],
    "964": [0, 0.43056, 0.1132, 0.02778, 0.43715],
    "965": [0, 0.43056, 0.03588, 0.02778, 0.54028],
    "966": [0.19444, 0.43056, 0, 0.08334, 0.65417],
    "967": [0.19444, 0.43056, 0, 0.05556, 0.62569],
    "968": [0.19444, 0.69444, 0.03588, 0.11111, 0.65139],
    "969": [0, 0.43056, 0.03588, 0, 0.62245],
    "977": [0, 0.69444, 0, 0.08334, 0.59144],
    "981": [0.19444, 0.69444, 0, 0.08334, 0.59583],
    "982": [0, 0.43056, 0.02778, 0, 0.82813],
    "1009": [0.19444, 0.43056, 0, 0.08334, 0.51702],
    "1013": [0, 0.43056, 0, 0.05556, 0.4059]
  },
  "SansSerif-Bold": {
    "33": [0, 0.69444, 0, 0, 0.36667],
    "34": [0, 0.69444, 0, 0, 0.55834],
    "35": [0.19444, 0.69444, 0, 0, 0.91667],
    "36": [0.05556, 0.75, 0, 0, 0.55],
    "37": [0.05556, 0.75, 0, 0, 1.02912],
    "38": [0, 0.69444, 0, 0, 0.83056],
    "39": [0, 0.69444, 0, 0, 0.30556],
    "40": [0.25, 0.75, 0, 0, 0.42778],
    "41": [0.25, 0.75, 0, 0, 0.42778],
    "42": [0, 0.75, 0, 0, 0.55],
    "43": [0.11667, 0.61667, 0, 0, 0.85556],
    "44": [0.10556, 0.13056, 0, 0, 0.30556],
    "45": [0, 0.45833, 0, 0, 0.36667],
    "46": [0, 0.13056, 0, 0, 0.30556],
    "47": [0.25, 0.75, 0, 0, 0.55],
    "48": [0, 0.69444, 0, 0, 0.55],
    "49": [0, 0.69444, 0, 0, 0.55],
    "50": [0, 0.69444, 0, 0, 0.55],
    "51": [0, 0.69444, 0, 0, 0.55],
    "52": [0, 0.69444, 0, 0, 0.55],
    "53": [0, 0.69444, 0, 0, 0.55],
    "54": [0, 0.69444, 0, 0, 0.55],
    "55": [0, 0.69444, 0, 0, 0.55],
    "56": [0, 0.69444, 0, 0, 0.55],
    "57": [0, 0.69444, 0, 0, 0.55],
    "58": [0, 0.45833, 0, 0, 0.30556],
    "59": [0.10556, 0.45833, 0, 0, 0.30556],
    "61": [-0.09375, 0.40625, 0, 0, 0.85556],
    "63": [0, 0.69444, 0, 0, 0.51945],
    "64": [0, 0.69444, 0, 0, 0.73334],
    "65": [0, 0.69444, 0, 0, 0.73334],
    "66": [0, 0.69444, 0, 0, 0.73334],
    "67": [0, 0.69444, 0, 0, 0.70278],
    "68": [0, 0.69444, 0, 0, 0.79445],
    "69": [0, 0.69444, 0, 0, 0.64167],
    "70": [0, 0.69444, 0, 0, 0.61111],
    "71": [0, 0.69444, 0, 0, 0.73334],
    "72": [0, 0.69444, 0, 0, 0.79445],
    "73": [0, 0.69444, 0, 0, 0.33056],
    "74": [0, 0.69444, 0, 0, 0.51945],
    "75": [0, 0.69444, 0, 0, 0.76389],
    "76": [0, 0.69444, 0, 0, 0.58056],
    "77": [0, 0.69444, 0, 0, 0.97778],
    "78": [0, 0.69444, 0, 0, 0.79445],
    "79": [0, 0.69444, 0, 0, 0.79445],
    "80": [0, 0.69444, 0, 0, 0.70278],
    "81": [0.10556, 0.69444, 0, 0, 0.79445],
    "82": [0, 0.69444, 0, 0, 0.70278],
    "83": [0, 0.69444, 0, 0, 0.61111],
    "84": [0, 0.69444, 0, 0, 0.73334],
    "85": [0, 0.69444, 0, 0, 0.76389],
    "86": [0, 0.69444, 0.01528, 0, 0.73334],
    "87": [0, 0.69444, 0.01528, 0, 1.03889],
    "88": [0, 0.69444, 0, 0, 0.73334],
    "89": [0, 0.69444, 0.0275, 0, 0.73334],
    "90": [0, 0.69444, 0, 0, 0.67223],
    "91": [0.25, 0.75, 0, 0, 0.34306],
    "93": [0.25, 0.75, 0, 0, 0.34306],
    "94": [0, 0.69444, 0, 0, 0.55],
    "95": [0.35, 0.10833, 0.03056, 0, 0.55],
    "97": [0, 0.45833, 0, 0, 0.525],
    "98": [0, 0.69444, 0, 0, 0.56111],
    "99": [0, 0.45833, 0, 0, 0.48889],
    "100": [0, 0.69444, 0, 0, 0.56111],
    "101": [0, 0.45833, 0, 0, 0.51111],
    "102": [0, 0.69444, 0.07639, 0, 0.33611],
    "103": [0.19444, 0.45833, 0.01528, 0, 0.55],
    "104": [0, 0.69444, 0, 0, 0.56111],
    "105": [0, 0.69444, 0, 0, 0.25556],
    "106": [0.19444, 0.69444, 0, 0, 0.28611],
    "107": [0, 0.69444, 0, 0, 0.53056],
    "108": [0, 0.69444, 0, 0, 0.25556],
    "109": [0, 0.45833, 0, 0, 0.86667],
    "110": [0, 0.45833, 0, 0, 0.56111],
    "111": [0, 0.45833, 0, 0, 0.55],
    "112": [0.19444, 0.45833, 0, 0, 0.56111],
    "113": [0.19444, 0.45833, 0, 0, 0.56111],
    "114": [0, 0.45833, 0.01528, 0, 0.37222],
    "115": [0, 0.45833, 0, 0, 0.42167],
    "116": [0, 0.58929, 0, 0, 0.40417],
    "117": [0, 0.45833, 0, 0, 0.56111],
    "118": [0, 0.45833, 0.01528, 0, 0.5],
    "119": [0, 0.45833, 0.01528, 0, 0.74445],
    "120": [0, 0.45833, 0, 0, 0.5],
    "121": [0.19444, 0.45833, 0.01528, 0, 0.5],
    "122": [0, 0.45833, 0, 0, 0.47639],
    "126": [0.35, 0.34444, 0, 0, 0.55],
    "168": [0, 0.69444, 0, 0, 0.55],
    "176": [0, 0.69444, 0, 0, 0.73334],
    "180": [0, 0.69444, 0, 0, 0.55],
    "184": [0.17014, 0, 0, 0, 0.48889],
    "305": [0, 0.45833, 0, 0, 0.25556],
    "567": [0.19444, 0.45833, 0, 0, 0.28611],
    "710": [0, 0.69444, 0, 0, 0.55],
    "711": [0, 0.63542, 0, 0, 0.55],
    "713": [0, 0.63778, 0, 0, 0.55],
    "728": [0, 0.69444, 0, 0, 0.55],
    "729": [0, 0.69444, 0, 0, 0.30556],
    "730": [0, 0.69444, 0, 0, 0.73334],
    "732": [0, 0.69444, 0, 0, 0.55],
    "733": [0, 0.69444, 0, 0, 0.55],
    "915": [0, 0.69444, 0, 0, 0.58056],
    "916": [0, 0.69444, 0, 0, 0.91667],
    "920": [0, 0.69444, 0, 0, 0.85556],
    "923": [0, 0.69444, 0, 0, 0.67223],
    "926": [0, 0.69444, 0, 0, 0.73334],
    "928": [0, 0.69444, 0, 0, 0.79445],
    "931": [0, 0.69444, 0, 0, 0.79445],
    "933": [0, 0.69444, 0, 0, 0.85556],
    "934": [0, 0.69444, 0, 0, 0.79445],
    "936": [0, 0.69444, 0, 0, 0.85556],
    "937": [0, 0.69444, 0, 0, 0.79445],
    "8211": [0, 0.45833, 0.03056, 0, 0.55],
    "8212": [0, 0.45833, 0.03056, 0, 1.10001],
    "8216": [0, 0.69444, 0, 0, 0.30556],
    "8217": [0, 0.69444, 0, 0, 0.30556],
    "8220": [0, 0.69444, 0, 0, 0.55834],
    "8221": [0, 0.69444, 0, 0, 0.55834]
  },
  "SansSerif-Italic": {
    "33": [0, 0.69444, 0.05733, 0, 0.31945],
    "34": [0, 0.69444, 0.00316, 0, 0.5],
    "35": [0.19444, 0.69444, 0.05087, 0, 0.83334],
    "36": [0.05556, 0.75, 0.11156, 0, 0.5],
    "37": [0.05556, 0.75, 0.03126, 0, 0.83334],
    "38": [0, 0.69444, 0.03058, 0, 0.75834],
    "39": [0, 0.69444, 0.07816, 0, 0.27778],
    "40": [0.25, 0.75, 0.13164, 0, 0.38889],
    "41": [0.25, 0.75, 0.02536, 0, 0.38889],
    "42": [0, 0.75, 0.11775, 0, 0.5],
    "43": [0.08333, 0.58333, 0.02536, 0, 0.77778],
    "44": [0.125, 0.08333, 0, 0, 0.27778],
    "45": [0, 0.44444, 0.01946, 0, 0.33333],
    "46": [0, 0.08333, 0, 0, 0.27778],
    "47": [0.25, 0.75, 0.13164, 0, 0.5],
    "48": [0, 0.65556, 0.11156, 0, 0.5],
    "49": [0, 0.65556, 0.11156, 0, 0.5],
    "50": [0, 0.65556, 0.11156, 0, 0.5],
    "51": [0, 0.65556, 0.11156, 0, 0.5],
    "52": [0, 0.65556, 0.11156, 0, 0.5],
    "53": [0, 0.65556, 0.11156, 0, 0.5],
    "54": [0, 0.65556, 0.11156, 0, 0.5],
    "55": [0, 0.65556, 0.11156, 0, 0.5],
    "56": [0, 0.65556, 0.11156, 0, 0.5],
    "57": [0, 0.65556, 0.11156, 0, 0.5],
    "58": [0, 0.44444, 0.02502, 0, 0.27778],
    "59": [0.125, 0.44444, 0.02502, 0, 0.27778],
    "61": [-0.13, 0.37, 0.05087, 0, 0.77778],
    "63": [0, 0.69444, 0.11809, 0, 0.47222],
    "64": [0, 0.69444, 0.07555, 0, 0.66667],
    "65": [0, 0.69444, 0, 0, 0.66667],
    "66": [0, 0.69444, 0.08293, 0, 0.66667],
    "67": [0, 0.69444, 0.11983, 0, 0.63889],
    "68": [0, 0.69444, 0.07555, 0, 0.72223],
    "69": [0, 0.69444, 0.11983, 0, 0.59722],
    "70": [0, 0.69444, 0.13372, 0, 0.56945],
    "71": [0, 0.69444, 0.11983, 0, 0.66667],
    "72": [0, 0.69444, 0.08094, 0, 0.70834],
    "73": [0, 0.69444, 0.13372, 0, 0.27778],
    "74": [0, 0.69444, 0.08094, 0, 0.47222],
    "75": [0, 0.69444, 0.11983, 0, 0.69445],
    "76": [0, 0.69444, 0, 0, 0.54167],
    "77": [0, 0.69444, 0.08094, 0, 0.875],
    "78": [0, 0.69444, 0.08094, 0, 0.70834],
    "79": [0, 0.69444, 0.07555, 0, 0.73611],
    "80": [0, 0.69444, 0.08293, 0, 0.63889],
    "81": [0.125, 0.69444, 0.07555, 0, 0.73611],
    "82": [0, 0.69444, 0.08293, 0, 0.64584],
    "83": [0, 0.69444, 0.09205, 0, 0.55556],
    "84": [0, 0.69444, 0.13372, 0, 0.68056],
    "85": [0, 0.69444, 0.08094, 0, 0.6875],
    "86": [0, 0.69444, 0.1615, 0, 0.66667],
    "87": [0, 0.69444, 0.1615, 0, 0.94445],
    "88": [0, 0.69444, 0.13372, 0, 0.66667],
    "89": [0, 0.69444, 0.17261, 0, 0.66667],
    "90": [0, 0.69444, 0.11983, 0, 0.61111],
    "91": [0.25, 0.75, 0.15942, 0, 0.28889],
    "93": [0.25, 0.75, 0.08719, 0, 0.28889],
    "94": [0, 0.69444, 0.0799, 0, 0.5],
    "95": [0.35, 0.09444, 0.08616, 0, 0.5],
    "97": [0, 0.44444, 0.00981, 0, 0.48056],
    "98": [0, 0.69444, 0.03057, 0, 0.51667],
    "99": [0, 0.44444, 0.08336, 0, 0.44445],
    "100": [0, 0.69444, 0.09483, 0, 0.51667],
    "101": [0, 0.44444, 0.06778, 0, 0.44445],
    "102": [0, 0.69444, 0.21705, 0, 0.30556],
    "103": [0.19444, 0.44444, 0.10836, 0, 0.5],
    "104": [0, 0.69444, 0.01778, 0, 0.51667],
    "105": [0, 0.67937, 0.09718, 0, 0.23889],
    "106": [0.19444, 0.67937, 0.09162, 0, 0.26667],
    "107": [0, 0.69444, 0.08336, 0, 0.48889],
    "108": [0, 0.69444, 0.09483, 0, 0.23889],
    "109": [0, 0.44444, 0.01778, 0, 0.79445],
    "110": [0, 0.44444, 0.01778, 0, 0.51667],
    "111": [0, 0.44444, 0.06613, 0, 0.5],
    "112": [0.19444, 0.44444, 0.0389, 0, 0.51667],
    "113": [0.19444, 0.44444, 0.04169, 0, 0.51667],
    "114": [0, 0.44444, 0.10836, 0, 0.34167],
    "115": [0, 0.44444, 0.0778, 0, 0.38333],
    "116": [0, 0.57143, 0.07225, 0, 0.36111],
    "117": [0, 0.44444, 0.04169, 0, 0.51667],
    "118": [0, 0.44444, 0.10836, 0, 0.46111],
    "119": [0, 0.44444, 0.10836, 0, 0.68334],
    "120": [0, 0.44444, 0.09169, 0, 0.46111],
    "121": [0.19444, 0.44444, 0.10836, 0, 0.46111],
    "122": [0, 0.44444, 0.08752, 0, 0.43472],
    "126": [0.35, 0.32659, 0.08826, 0, 0.5],
    "168": [0, 0.67937, 0.06385, 0, 0.5],
    "176": [0, 0.69444, 0, 0, 0.73752],
    "184": [0.17014, 0, 0, 0, 0.44445],
    "305": [0, 0.44444, 0.04169, 0, 0.23889],
    "567": [0.19444, 0.44444, 0.04169, 0, 0.26667],
    "710": [0, 0.69444, 0.0799, 0, 0.5],
    "711": [0, 0.63194, 0.08432, 0, 0.5],
    "713": [0, 0.60889, 0.08776, 0, 0.5],
    "714": [0, 0.69444, 0.09205, 0, 0.5],
    "715": [0, 0.69444, 0, 0, 0.5],
    "728": [0, 0.69444, 0.09483, 0, 0.5],
    "729": [0, 0.67937, 0.07774, 0, 0.27778],
    "730": [0, 0.69444, 0, 0, 0.73752],
    "732": [0, 0.67659, 0.08826, 0, 0.5],
    "733": [0, 0.69444, 0.09205, 0, 0.5],
    "915": [0, 0.69444, 0.13372, 0, 0.54167],
    "916": [0, 0.69444, 0, 0, 0.83334],
    "920": [0, 0.69444, 0.07555, 0, 0.77778],
    "923": [0, 0.69444, 0, 0, 0.61111],
    "926": [0, 0.69444, 0.12816, 0, 0.66667],
    "928": [0, 0.69444, 0.08094, 0, 0.70834],
    "931": [0, 0.69444, 0.11983, 0, 0.72222],
    "933": [0, 0.69444, 0.09031, 0, 0.77778],
    "934": [0, 0.69444, 0.04603, 0, 0.72222],
    "936": [0, 0.69444, 0.09031, 0, 0.77778],
    "937": [0, 0.69444, 0.08293, 0, 0.72222],
    "8211": [0, 0.44444, 0.08616, 0, 0.5],
    "8212": [0, 0.44444, 0.08616, 0, 1.0],
    "8216": [0, 0.69444, 0.07816, 0, 0.27778],
    "8217": [0, 0.69444, 0.07816, 0, 0.27778],
    "8220": [0, 0.69444, 0.14205, 0, 0.5],
    "8221": [0, 0.69444, 0.00316, 0, 0.5]
  },
  "SansSerif-Regular": {
    "33": [0, 0.69444, 0, 0, 0.31945],
    "34": [0, 0.69444, 0, 0, 0.5],
    "35": [0.19444, 0.69444, 0, 0, 0.83334],
    "36": [0.05556, 0.75, 0, 0, 0.5],
    "37": [0.05556, 0.75, 0, 0, 0.83334],
    "38": [0, 0.69444, 0, 0, 0.75834],
    "39": [0, 0.69444, 0, 0, 0.27778],
    "40": [0.25, 0.75, 0, 0, 0.38889],
    "41": [0.25, 0.75, 0, 0, 0.38889],
    "42": [0, 0.75, 0, 0, 0.5],
    "43": [0.08333, 0.58333, 0, 0, 0.77778],
    "44": [0.125, 0.08333, 0, 0, 0.27778],
    "45": [0, 0.44444, 0, 0, 0.33333],
    "46": [0, 0.08333, 0, 0, 0.27778],
    "47": [0.25, 0.75, 0, 0, 0.5],
    "48": [0, 0.65556, 0, 0, 0.5],
    "49": [0, 0.65556, 0, 0, 0.5],
    "50": [0, 0.65556, 0, 0, 0.5],
    "51": [0, 0.65556, 0, 0, 0.5],
    "52": [0, 0.65556, 0, 0, 0.5],
    "53": [0, 0.65556, 0, 0, 0.5],
    "54": [0, 0.65556, 0, 0, 0.5],
    "55": [0, 0.65556, 0, 0, 0.5],
    "56": [0, 0.65556, 0, 0, 0.5],
    "57": [0, 0.65556, 0, 0, 0.5],
    "58": [0, 0.44444, 0, 0, 0.27778],
    "59": [0.125, 0.44444, 0, 0, 0.27778],
    "61": [-0.13, 0.37, 0, 0, 0.77778],
    "63": [0, 0.69444, 0, 0, 0.47222],
    "64": [0, 0.69444, 0, 0, 0.66667],
    "65": [0, 0.69444, 0, 0, 0.66667],
    "66": [0, 0.69444, 0, 0, 0.66667],
    "67": [0, 0.69444, 0, 0, 0.63889],
    "68": [0, 0.69444, 0, 0, 0.72223],
    "69": [0, 0.69444, 0, 0, 0.59722],
    "70": [0, 0.69444, 0, 0, 0.56945],
    "71": [0, 0.69444, 0, 0, 0.66667],
    "72": [0, 0.69444, 0, 0, 0.70834],
    "73": [0, 0.69444, 0, 0, 0.27778],
    "74": [0, 0.69444, 0, 0, 0.47222],
    "75": [0, 0.69444, 0, 0, 0.69445],
    "76": [0, 0.69444, 0, 0, 0.54167],
    "77": [0, 0.69444, 0, 0, 0.875],
    "78": [0, 0.69444, 0, 0, 0.70834],
    "79": [0, 0.69444, 0, 0, 0.73611],
    "80": [0, 0.69444, 0, 0, 0.63889],
    "81": [0.125, 0.69444, 0, 0, 0.73611],
    "82": [0, 0.69444, 0, 0, 0.64584],
    "83": [0, 0.69444, 0, 0, 0.55556],
    "84": [0, 0.69444, 0, 0, 0.68056],
    "85": [0, 0.69444, 0, 0, 0.6875],
    "86": [0, 0.69444, 0.01389, 0, 0.66667],
    "87": [0, 0.69444, 0.01389, 0, 0.94445],
    "88": [0, 0.69444, 0, 0, 0.66667],
    "89": [0, 0.69444, 0.025, 0, 0.66667],
    "90": [0, 0.69444, 0, 0, 0.61111],
    "91": [0.25, 0.75, 0, 0, 0.28889],
    "93": [0.25, 0.75, 0, 0, 0.28889],
    "94": [0, 0.69444, 0, 0, 0.5],
    "95": [0.35, 0.09444, 0.02778, 0, 0.5],
    "97": [0, 0.44444, 0, 0, 0.48056],
    "98": [0, 0.69444, 0, 0, 0.51667],
    "99": [0, 0.44444, 0, 0, 0.44445],
    "100": [0, 0.69444, 0, 0, 0.51667],
    "101": [0, 0.44444, 0, 0, 0.44445],
    "102": [0, 0.69444, 0.06944, 0, 0.30556],
    "103": [0.19444, 0.44444, 0.01389, 0, 0.5],
    "104": [0, 0.69444, 0, 0, 0.51667],
    "105": [0, 0.67937, 0, 0, 0.23889],
    "106": [0.19444, 0.67937, 0, 0, 0.26667],
    "107": [0, 0.69444, 0, 0, 0.48889],
    "108": [0, 0.69444, 0, 0, 0.23889],
    "109": [0, 0.44444, 0, 0, 0.79445],
    "110": [0, 0.44444, 0, 0, 0.51667],
    "111": [0, 0.44444, 0, 0, 0.5],
    "112": [0.19444, 0.44444, 0, 0, 0.51667],
    "113": [0.19444, 0.44444, 0, 0, 0.51667],
    "114": [0, 0.44444, 0.01389, 0, 0.34167],
    "115": [0, 0.44444, 0, 0, 0.38333],
    "116": [0, 0.57143, 0, 0, 0.36111],
    "117": [0, 0.44444, 0, 0, 0.51667],
    "118": [0, 0.44444, 0.01389, 0, 0.46111],
    "119": [0, 0.44444, 0.01389, 0, 0.68334],
    "120": [0, 0.44444, 0, 0, 0.46111],
    "121": [0.19444, 0.44444, 0.01389, 0, 0.46111],
    "122": [0, 0.44444, 0, 0, 0.43472],
    "126": [0.35, 0.32659, 0, 0, 0.5],
    "168": [0, 0.67937, 0, 0, 0.5],
    "176": [0, 0.69444, 0, 0, 0.66667],
    "184": [0.17014, 0, 0, 0, 0.44445],
    "305": [0, 0.44444, 0, 0, 0.23889],
    "567": [0.19444, 0.44444, 0, 0, 0.26667],
    "710": [0, 0.69444, 0, 0, 0.5],
    "711": [0, 0.63194, 0, 0, 0.5],
    "713": [0, 0.60889, 0, 0, 0.5],
    "714": [0, 0.69444, 0, 0, 0.5],
    "715": [0, 0.69444, 0, 0, 0.5],
    "728": [0, 0.69444, 0, 0, 0.5],
    "729": [0, 0.67937, 0, 0, 0.27778],
    "730": [0, 0.69444, 0, 0, 0.66667],
    "732": [0, 0.67659, 0, 0, 0.5],
    "733": [0, 0.69444, 0, 0, 0.5],
    "915": [0, 0.69444, 0, 0, 0.54167],
    "916": [0, 0.69444, 0, 0, 0.83334],
    "920": [0, 0.69444, 0, 0, 0.77778],
    "923": [0, 0.69444, 0, 0, 0.61111],
    "926": [0, 0.69444, 0, 0, 0.66667],
    "928": [0, 0.69444, 0, 0, 0.70834],
    "931": [0, 0.69444, 0, 0, 0.72222],
    "933": [0, 0.69444, 0, 0, 0.77778],
    "934": [0, 0.69444, 0, 0, 0.72222],
    "936": [0, 0.69444, 0, 0, 0.77778],
    "937": [0, 0.69444, 0, 0, 0.72222],
    "8211": [0, 0.44444, 0.02778, 0, 0.5],
    "8212": [0, 0.44444, 0.02778, 0, 1.0],
    "8216": [0, 0.69444, 0, 0, 0.27778],
    "8217": [0, 0.69444, 0, 0, 0.27778],
    "8220": [0, 0.69444, 0, 0, 0.5],
    "8221": [0, 0.69444, 0, 0, 0.5]
  },
  "Script-Regular": {
    "65": [0, 0.7, 0.22925, 0, 0.80253],
    "66": [0, 0.7, 0.04087, 0, 0.90757],
    "67": [0, 0.7, 0.1689, 0, 0.66619],
    "68": [0, 0.7, 0.09371, 0, 0.77443],
    "69": [0, 0.7, 0.18583, 0, 0.56162],
    "70": [0, 0.7, 0.13634, 0, 0.89544],
    "71": [0, 0.7, 0.17322, 0, 0.60961],
    "72": [0, 0.7, 0.29694, 0, 0.96919],
    "73": [0, 0.7, 0.19189, 0, 0.80907],
    "74": [0.27778, 0.7, 0.19189, 0, 1.05159],
    "75": [0, 0.7, 0.31259, 0, 0.91364],
    "76": [0, 0.7, 0.19189, 0, 0.87373],
    "77": [0, 0.7, 0.15981, 0, 1.08031],
    "78": [0, 0.7, 0.3525, 0, 0.9015],
    "79": [0, 0.7, 0.08078, 0, 0.73787],
    "80": [0, 0.7, 0.08078, 0, 1.01262],
    "81": [0, 0.7, 0.03305, 0, 0.88282],
    "82": [0, 0.7, 0.06259, 0, 0.85],
    "83": [0, 0.7, 0.19189, 0, 0.86767],
    "84": [0, 0.7, 0.29087, 0, 0.74697],
    "85": [0, 0.7, 0.25815, 0, 0.79996],
    "86": [0, 0.7, 0.27523, 0, 0.62204],
    "87": [0, 0.7, 0.27523, 0, 0.80532],
    "88": [0, 0.7, 0.26006, 0, 0.94445],
    "89": [0, 0.7, 0.2939, 0, 0.70961],
    "90": [0, 0.7, 0.24037, 0, 0.8212]
  },
  "Size1-Regular": {
    "40": [0.35001, 0.85, 0, 0, 0.45834],
    "41": [0.35001, 0.85, 0, 0, 0.45834],
    "47": [0.35001, 0.85, 0, 0, 0.57778],
    "91": [0.35001, 0.85, 0, 0, 0.41667],
    "92": [0.35001, 0.85, 0, 0, 0.57778],
    "93": [0.35001, 0.85, 0, 0, 0.41667],
    "123": [0.35001, 0.85, 0, 0, 0.58334],
    "125": [0.35001, 0.85, 0, 0, 0.58334],
    "710": [0, 0.72222, 0, 0, 0.55556],
    "732": [0, 0.72222, 0, 0, 0.55556],
    "770": [0, 0.72222, 0, 0, 0.55556],
    "771": [0, 0.72222, 0, 0, 0.55556],
    "8214": [-0.00099, 0.601, 0, 0, 0.77778],
    "8593": [1e-05, 0.6, 0, 0, 0.66667],
    "8595": [1e-05, 0.6, 0, 0, 0.66667],
    "8657": [1e-05, 0.6, 0, 0, 0.77778],
    "8659": [1e-05, 0.6, 0, 0, 0.77778],
    "8719": [0.25001, 0.75, 0, 0, 0.94445],
    "8720": [0.25001, 0.75, 0, 0, 0.94445],
    "8721": [0.25001, 0.75, 0, 0, 1.05556],
    "8730": [0.35001, 0.85, 0, 0, 1.0],
    "8739": [-0.00599, 0.606, 0, 0, 0.33333],
    "8741": [-0.00599, 0.606, 0, 0, 0.55556],
    "8747": [0.30612, 0.805, 0.19445, 0, 0.47222],
    "8748": [0.306, 0.805, 0.19445, 0, 0.47222],
    "8749": [0.306, 0.805, 0.19445, 0, 0.47222],
    "8750": [0.30612, 0.805, 0.19445, 0, 0.47222],
    "8896": [0.25001, 0.75, 0, 0, 0.83334],
    "8897": [0.25001, 0.75, 0, 0, 0.83334],
    "8898": [0.25001, 0.75, 0, 0, 0.83334],
    "8899": [0.25001, 0.75, 0, 0, 0.83334],
    "8968": [0.35001, 0.85, 0, 0, 0.47222],
    "8969": [0.35001, 0.85, 0, 0, 0.47222],
    "8970": [0.35001, 0.85, 0, 0, 0.47222],
    "8971": [0.35001, 0.85, 0, 0, 0.47222],
    "9168": [-0.00099, 0.601, 0, 0, 0.66667],
    "10216": [0.35001, 0.85, 0, 0, 0.47222],
    "10217": [0.35001, 0.85, 0, 0, 0.47222],
    "10752": [0.25001, 0.75, 0, 0, 1.11111],
    "10753": [0.25001, 0.75, 0, 0, 1.11111],
    "10754": [0.25001, 0.75, 0, 0, 1.11111],
    "10756": [0.25001, 0.75, 0, 0, 0.83334],
    "10758": [0.25001, 0.75, 0, 0, 0.83334]
  },
  "Size2-Regular": {
    "40": [0.65002, 1.15, 0, 0, 0.59722],
    "41": [0.65002, 1.15, 0, 0, 0.59722],
    "47": [0.65002, 1.15, 0, 0, 0.81111],
    "91": [0.65002, 1.15, 0, 0, 0.47222],
    "92": [0.65002, 1.15, 0, 0, 0.81111],
    "93": [0.65002, 1.15, 0, 0, 0.47222],
    "123": [0.65002, 1.15, 0, 0, 0.66667],
    "125": [0.65002, 1.15, 0, 0, 0.66667],
    "710": [0, 0.75, 0, 0, 1.0],
    "732": [0, 0.75, 0, 0, 1.0],
    "770": [0, 0.75, 0, 0, 1.0],
    "771": [0, 0.75, 0, 0, 1.0],
    "8719": [0.55001, 1.05, 0, 0, 1.27778],
    "8720": [0.55001, 1.05, 0, 0, 1.27778],
    "8721": [0.55001, 1.05, 0, 0, 1.44445],
    "8730": [0.65002, 1.15, 0, 0, 1.0],
    "8747": [0.86225, 1.36, 0.44445, 0, 0.55556],
    "8748": [0.862, 1.36, 0.44445, 0, 0.55556],
    "8749": [0.862, 1.36, 0.44445, 0, 0.55556],
    "8750": [0.86225, 1.36, 0.44445, 0, 0.55556],
    "8896": [0.55001, 1.05, 0, 0, 1.11111],
    "8897": [0.55001, 1.05, 0, 0, 1.11111],
    "8898": [0.55001, 1.05, 0, 0, 1.11111],
    "8899": [0.55001, 1.05, 0, 0, 1.11111],
    "8968": [0.65002, 1.15, 0, 0, 0.52778],
    "8969": [0.65002, 1.15, 0, 0, 0.52778],
    "8970": [0.65002, 1.15, 0, 0, 0.52778],
    "8971": [0.65002, 1.15, 0, 0, 0.52778],
    "10216": [0.65002, 1.15, 0, 0, 0.61111],
    "10217": [0.65002, 1.15, 0, 0, 0.61111],
    "10752": [0.55001, 1.05, 0, 0, 1.51112],
    "10753": [0.55001, 1.05, 0, 0, 1.51112],
    "10754": [0.55001, 1.05, 0, 0, 1.51112],
    "10756": [0.55001, 1.05, 0, 0, 1.11111],
    "10758": [0.55001, 1.05, 0, 0, 1.11111]
  },
  "Size3-Regular": {
    "40": [0.95003, 1.45, 0, 0, 0.73611],
    "41": [0.95003, 1.45, 0, 0, 0.73611],
    "47": [0.95003, 1.45, 0, 0, 1.04445],
    "91": [0.95003, 1.45, 0, 0, 0.52778],
    "92": [0.95003, 1.45, 0, 0, 1.04445],
    "93": [0.95003, 1.45, 0, 0, 0.52778],
    "123": [0.95003, 1.45, 0, 0, 0.75],
    "125": [0.95003, 1.45, 0, 0, 0.75],
    "710": [0, 0.75, 0, 0, 1.44445],
    "732": [0, 0.75, 0, 0, 1.44445],
    "770": [0, 0.75, 0, 0, 1.44445],
    "771": [0, 0.75, 0, 0, 1.44445],
    "8730": [0.95003, 1.45, 0, 0, 1.0],
    "8968": [0.95003, 1.45, 0, 0, 0.58334],
    "8969": [0.95003, 1.45, 0, 0, 0.58334],
    "8970": [0.95003, 1.45, 0, 0, 0.58334],
    "8971": [0.95003, 1.45, 0, 0, 0.58334],
    "10216": [0.95003, 1.45, 0, 0, 0.75],
    "10217": [0.95003, 1.45, 0, 0, 0.75]
  },
  "Size4-Regular": {
    "40": [1.25003, 1.75, 0, 0, 0.79167],
    "41": [1.25003, 1.75, 0, 0, 0.79167],
    "47": [1.25003, 1.75, 0, 0, 1.27778],
    "91": [1.25003, 1.75, 0, 0, 0.58334],
    "92": [1.25003, 1.75, 0, 0, 1.27778],
    "93": [1.25003, 1.75, 0, 0, 0.58334],
    "123": [1.25003, 1.75, 0, 0, 0.80556],
    "125": [1.25003, 1.75, 0, 0, 0.80556],
    "710": [0, 0.825, 0, 0, 1.8889],
    "732": [0, 0.825, 0, 0, 1.8889],
    "770": [0, 0.825, 0, 0, 1.8889],
    "771": [0, 0.825, 0, 0, 1.8889],
    "8730": [1.25003, 1.75, 0, 0, 1.0],
    "8968": [1.25003, 1.75, 0, 0, 0.63889],
    "8969": [1.25003, 1.75, 0, 0, 0.63889],
    "8970": [1.25003, 1.75, 0, 0, 0.63889],
    "8971": [1.25003, 1.75, 0, 0, 0.63889],
    "9115": [0.64502, 1.155, 0, 0, 0.875],
    "9116": [1e-05, 0.6, 0, 0, 0.875],
    "9117": [0.64502, 1.155, 0, 0, 0.875],
    "9118": [0.64502, 1.155, 0, 0, 0.875],
    "9119": [1e-05, 0.6, 0, 0, 0.875],
    "9120": [0.64502, 1.155, 0, 0, 0.875],
    "9121": [0.64502, 1.155, 0, 0, 0.66667],
    "9122": [-0.00099, 0.601, 0, 0, 0.66667],
    "9123": [0.64502, 1.155, 0, 0, 0.66667],
    "9124": [0.64502, 1.155, 0, 0, 0.66667],
    "9125": [-0.00099, 0.601, 0, 0, 0.66667],
    "9126": [0.64502, 1.155, 0, 0, 0.66667],
    "9127": [1e-05, 0.9, 0, 0, 0.88889],
    "9128": [0.65002, 1.15, 0, 0, 0.88889],
    "9129": [0.90001, 0, 0, 0, 0.88889],
    "9130": [0, 0.3, 0, 0, 0.88889],
    "9131": [1e-05, 0.9, 0, 0, 0.88889],
    "9132": [0.65002, 1.15, 0, 0, 0.88889],
    "9133": [0.90001, 0, 0, 0, 0.88889],
    "9143": [0.88502, 0.915, 0, 0, 1.05556],
    "10216": [1.25003, 1.75, 0, 0, 0.80556],
    "10217": [1.25003, 1.75, 0, 0, 0.80556],
    "57344": [-0.00499, 0.605, 0, 0, 1.05556],
    "57345": [-0.00499, 0.605, 0, 0, 1.05556],
    "57680": [0, 0.12, 0, 0, 0.45],
    "57681": [0, 0.12, 0, 0, 0.45],
    "57682": [0, 0.12, 0, 0, 0.45],
    "57683": [0, 0.12, 0, 0, 0.45]
  },
  "Typewriter-Regular": {
    "32": [0, 0, 0, 0, 0.525],
    "33": [0, 0.61111, 0, 0, 0.525],
    "34": [0, 0.61111, 0, 0, 0.525],
    "35": [0, 0.61111, 0, 0, 0.525],
    "36": [0.08333, 0.69444, 0, 0, 0.525],
    "37": [0.08333, 0.69444, 0, 0, 0.525],
    "38": [0, 0.61111, 0, 0, 0.525],
    "39": [0, 0.61111, 0, 0, 0.525],
    "40": [0.08333, 0.69444, 0, 0, 0.525],
    "41": [0.08333, 0.69444, 0, 0, 0.525],
    "42": [0, 0.52083, 0, 0, 0.525],
    "43": [-0.08056, 0.53055, 0, 0, 0.525],
    "44": [0.13889, 0.125, 0, 0, 0.525],
    "45": [-0.08056, 0.53055, 0, 0, 0.525],
    "46": [0, 0.125, 0, 0, 0.525],
    "47": [0.08333, 0.69444, 0, 0, 0.525],
    "48": [0, 0.61111, 0, 0, 0.525],
    "49": [0, 0.61111, 0, 0, 0.525],
    "50": [0, 0.61111, 0, 0, 0.525],
    "51": [0, 0.61111, 0, 0, 0.525],
    "52": [0, 0.61111, 0, 0, 0.525],
    "53": [0, 0.61111, 0, 0, 0.525],
    "54": [0, 0.61111, 0, 0, 0.525],
    "55": [0, 0.61111, 0, 0, 0.525],
    "56": [0, 0.61111, 0, 0, 0.525],
    "57": [0, 0.61111, 0, 0, 0.525],
    "58": [0, 0.43056, 0, 0, 0.525],
    "59": [0.13889, 0.43056, 0, 0, 0.525],
    "60": [-0.05556, 0.55556, 0, 0, 0.525],
    "61": [-0.19549, 0.41562, 0, 0, 0.525],
    "62": [-0.05556, 0.55556, 0, 0, 0.525],
    "63": [0, 0.61111, 0, 0, 0.525],
    "64": [0, 0.61111, 0, 0, 0.525],
    "65": [0, 0.61111, 0, 0, 0.525],
    "66": [0, 0.61111, 0, 0, 0.525],
    "67": [0, 0.61111, 0, 0, 0.525],
    "68": [0, 0.61111, 0, 0, 0.525],
    "69": [0, 0.61111, 0, 0, 0.525],
    "70": [0, 0.61111, 0, 0, 0.525],
    "71": [0, 0.61111, 0, 0, 0.525],
    "72": [0, 0.61111, 0, 0, 0.525],
    "73": [0, 0.61111, 0, 0, 0.525],
    "74": [0, 0.61111, 0, 0, 0.525],
    "75": [0, 0.61111, 0, 0, 0.525],
    "76": [0, 0.61111, 0, 0, 0.525],
    "77": [0, 0.61111, 0, 0, 0.525],
    "78": [0, 0.61111, 0, 0, 0.525],
    "79": [0, 0.61111, 0, 0, 0.525],
    "80": [0, 0.61111, 0, 0, 0.525],
    "81": [0.13889, 0.61111, 0, 0, 0.525],
    "82": [0, 0.61111, 0, 0, 0.525],
    "83": [0, 0.61111, 0, 0, 0.525],
    "84": [0, 0.61111, 0, 0, 0.525],
    "85": [0, 0.61111, 0, 0, 0.525],
    "86": [0, 0.61111, 0, 0, 0.525],
    "87": [0, 0.61111, 0, 0, 0.525],
    "88": [0, 0.61111, 0, 0, 0.525],
    "89": [0, 0.61111, 0, 0, 0.525],
    "90": [0, 0.61111, 0, 0, 0.525],
    "91": [0.08333, 0.69444, 0, 0, 0.525],
    "92": [0.08333, 0.69444, 0, 0, 0.525],
    "93": [0.08333, 0.69444, 0, 0, 0.525],
    "94": [0, 0.61111, 0, 0, 0.525],
    "95": [0.09514, 0, 0, 0, 0.525],
    "96": [0, 0.61111, 0, 0, 0.525],
    "97": [0, 0.43056, 0, 0, 0.525],
    "98": [0, 0.61111, 0, 0, 0.525],
    "99": [0, 0.43056, 0, 0, 0.525],
    "100": [0, 0.61111, 0, 0, 0.525],
    "101": [0, 0.43056, 0, 0, 0.525],
    "102": [0, 0.61111, 0, 0, 0.525],
    "103": [0.22222, 0.43056, 0, 0, 0.525],
    "104": [0, 0.61111, 0, 0, 0.525],
    "105": [0, 0.61111, 0, 0, 0.525],
    "106": [0.22222, 0.61111, 0, 0, 0.525],
    "107": [0, 0.61111, 0, 0, 0.525],
    "108": [0, 0.61111, 0, 0, 0.525],
    "109": [0, 0.43056, 0, 0, 0.525],
    "110": [0, 0.43056, 0, 0, 0.525],
    "111": [0, 0.43056, 0, 0, 0.525],
    "112": [0.22222, 0.43056, 0, 0, 0.525],
    "113": [0.22222, 0.43056, 0, 0, 0.525],
    "114": [0, 0.43056, 0, 0, 0.525],
    "115": [0, 0.43056, 0, 0, 0.525],
    "116": [0, 0.55358, 0, 0, 0.525],
    "117": [0, 0.43056, 0, 0, 0.525],
    "118": [0, 0.43056, 0, 0, 0.525],
    "119": [0, 0.43056, 0, 0, 0.525],
    "120": [0, 0.43056, 0, 0, 0.525],
    "121": [0.22222, 0.43056, 0, 0, 0.525],
    "122": [0, 0.43056, 0, 0, 0.525],
    "123": [0.08333, 0.69444, 0, 0, 0.525],
    "124": [0.08333, 0.69444, 0, 0, 0.525],
    "125": [0.08333, 0.69444, 0, 0, 0.525],
    "126": [0, 0.61111, 0, 0, 0.525],
    "127": [0, 0.61111, 0, 0, 0.525],
    "160": [0, 0, 0, 0, 0.525],
    "176": [0, 0.61111, 0, 0, 0.525],
    "184": [0.19445, 0, 0, 0, 0.525],
    "305": [0, 0.43056, 0, 0, 0.525],
    "567": [0.22222, 0.43056, 0, 0, 0.525],
    "711": [0, 0.56597, 0, 0, 0.525],
    "713": [0, 0.56555, 0, 0, 0.525],
    "714": [0, 0.61111, 0, 0, 0.525],
    "715": [0, 0.61111, 0, 0, 0.525],
    "728": [0, 0.61111, 0, 0, 0.525],
    "730": [0, 0.61111, 0, 0, 0.525],
    "770": [0, 0.61111, 0, 0, 0.525],
    "771": [0, 0.61111, 0, 0, 0.525],
    "776": [0, 0.61111, 0, 0, 0.525],
    "915": [0, 0.61111, 0, 0, 0.525],
    "916": [0, 0.61111, 0, 0, 0.525],
    "920": [0, 0.61111, 0, 0, 0.525],
    "923": [0, 0.61111, 0, 0, 0.525],
    "926": [0, 0.61111, 0, 0, 0.525],
    "928": [0, 0.61111, 0, 0, 0.525],
    "931": [0, 0.61111, 0, 0, 0.525],
    "933": [0, 0.61111, 0, 0, 0.525],
    "934": [0, 0.61111, 0, 0, 0.525],
    "936": [0, 0.61111, 0, 0, 0.525],
    "937": [0, 0.61111, 0, 0, 0.525],
    "8216": [0, 0.61111, 0, 0, 0.525],
    "8217": [0, 0.61111, 0, 0, 0.525],
    "8242": [0, 0.61111, 0, 0, 0.525],
    "9251": [0.11111, 0.21944, 0, 0, 0.525]
  }
});
// CONCATENATED MODULE: ./src/fontMetrics.js


/**
 * This file contains metrics regarding fonts and individual symbols. The sigma
 * and xi variables, as well as the metricMap map contain data extracted from
 * TeX, TeX font metrics, and the TTF files. These data are then exposed via the
 * `metrics` variable and the getCharacterMetrics function.
 */
// In TeX, there are actually three sets of dimensions, one for each of
// textstyle (size index 5 and higher: >=9pt), scriptstyle (size index 3 and 4:
// 7-8pt), and scriptscriptstyle (size index 1 and 2: 5-6pt).  These are
// provided in the the arrays below, in that order.
//
// The font metrics are stored in fonts cmsy10, cmsy7, and cmsy5 respsectively.
// This was determined by running the following script:
//
//     latex -interaction=nonstopmode \
//     '\documentclass{article}\usepackage{amsmath}\begin{document}' \
//     '$a$ \expandafter\show\the\textfont2' \
//     '\expandafter\show\the\scriptfont2' \
//     '\expandafter\show\the\scriptscriptfont2' \
//     '\stop'
//
// The metrics themselves were retreived using the following commands:
//
//     tftopl cmsy10
//     tftopl cmsy7
//     tftopl cmsy5
//
// The output of each of these commands is quite lengthy.  The only part we
// care about is the FONTDIMEN section. Each value is measured in EMs.
var sigmasAndXis = {
  slant: [0.250, 0.250, 0.250],
  // sigma1
  space: [0.000, 0.000, 0.000],
  // sigma2
  stretch: [0.000, 0.000, 0.000],
  // sigma3
  shrink: [0.000, 0.000, 0.000],
  // sigma4
  xHeight: [0.431, 0.431, 0.431],
  // sigma5
  quad: [1.000, 1.171, 1.472],
  // sigma6
  extraSpace: [0.000, 0.000, 0.000],
  // sigma7
  num1: [0.677, 0.732, 0.925],
  // sigma8
  num2: [0.394, 0.384, 0.387],
  // sigma9
  num3: [0.444, 0.471, 0.504],
  // sigma10
  denom1: [0.686, 0.752, 1.025],
  // sigma11
  denom2: [0.345, 0.344, 0.532],
  // sigma12
  sup1: [0.413, 0.503, 0.504],
  // sigma13
  sup2: [0.363, 0.431, 0.404],
  // sigma14
  sup3: [0.289, 0.286, 0.294],
  // sigma15
  sub1: [0.150, 0.143, 0.200],
  // sigma16
  sub2: [0.247, 0.286, 0.400],
  // sigma17
  supDrop: [0.386, 0.353, 0.494],
  // sigma18
  subDrop: [0.050, 0.071, 0.100],
  // sigma19
  delim1: [2.390, 1.700, 1.980],
  // sigma20
  delim2: [1.010, 1.157, 1.420],
  // sigma21
  axisHeight: [0.250, 0.250, 0.250],
  // sigma22
  // These font metrics are extracted from TeX by using tftopl on cmex10.tfm;
  // they correspond to the font parameters of the extension fonts (family 3).
  // See the TeXbook, page 441. In AMSTeX, the extension fonts scale; to
  // match cmex7, we'd use cmex7.tfm values for script and scriptscript
  // values.
  defaultRuleThickness: [0.04, 0.049, 0.049],
  // xi8; cmex7: 0.049
  bigOpSpacing1: [0.111, 0.111, 0.111],
  // xi9
  bigOpSpacing2: [0.166, 0.166, 0.166],
  // xi10
  bigOpSpacing3: [0.2, 0.2, 0.2],
  // xi11
  bigOpSpacing4: [0.6, 0.611, 0.611],
  // xi12; cmex7: 0.611
  bigOpSpacing5: [0.1, 0.143, 0.143],
  // xi13; cmex7: 0.143
  // The \sqrt rule width is taken from the height of the surd character.
  // Since we use the same font at all sizes, this thickness doesn't scale.
  sqrtRuleThickness: [0.04, 0.04, 0.04],
  // This value determines how large a pt is, for metrics which are defined
  // in terms of pts.
  // This value is also used in katex.less; if you change it make sure the
  // values match.
  ptPerEm: [10.0, 10.0, 10.0],
  // The space between adjacent `|` columns in an array definition. From
  // `\showthe\doublerulesep` in LaTeX. Equals 2.0 / ptPerEm.
  doubleRuleSep: [0.2, 0.2, 0.2],
  // The width of separator lines in {array} environments. From
  // `\showthe\arrayrulewidth` in LaTeX. Equals 0.4 / ptPerEm.
  arrayRuleWidth: [0.04, 0.04, 0.04],
  // Two values from LaTeX source2e:
  fboxsep: [0.3, 0.3, 0.3],
  //        3 pt / ptPerEm
  fboxrule: [0.04, 0.04, 0.04] // 0.4 pt / ptPerEm

}; // This map contains a mapping from font name and character code to character
// metrics, including height, depth, italic correction, and skew (kern from the
// character to the corresponding \skewchar)
// This map is generated via `make metrics`. It should not be changed manually.

 // These are very rough approximations.  We default to Times New Roman which
// should have Latin-1 and Cyrillic characters, but may not depending on the
// operating system.  The metrics do not account for extra height from the
// accents.  In the case of Cyrillic characters which have both ascenders and
// descenders we prefer approximations with ascenders, primarily to prevent
// the fraction bar or root line from intersecting the glyph.
// TODO(kevinb) allow union of multiple glyph metrics for better accuracy.

var extraCharacterMap = {
  // Latin-1
  'Å': 'A',
  'Ç': 'C',
  'Ð': 'D',
  'Þ': 'o',
  'å': 'a',
  'ç': 'c',
  'ð': 'd',
  'þ': 'o',
  // Cyrillic
  'А': 'A',
  'Б': 'B',
  'В': 'B',
  'Г': 'F',
  'Д': 'A',
  'Е': 'E',
  'Ж': 'K',
  'З': '3',
  'И': 'N',
  'Й': 'N',
  'К': 'K',
  'Л': 'N',
  'М': 'M',
  'Н': 'H',
  'О': 'O',
  'П': 'N',
  'Р': 'P',
  'С': 'C',
  'Т': 'T',
  'У': 'y',
  'Ф': 'O',
  'Х': 'X',
  'Ц': 'U',
  'Ч': 'h',
  'Ш': 'W',
  'Щ': 'W',
  'Ъ': 'B',
  'Ы': 'X',
  'Ь': 'B',
  'Э': '3',
  'Ю': 'X',
  'Я': 'R',
  'а': 'a',
  'б': 'b',
  'в': 'a',
  'г': 'r',
  'д': 'y',
  'е': 'e',
  'ж': 'm',
  'з': 'e',
  'и': 'n',
  'й': 'n',
  'к': 'n',
  'л': 'n',
  'м': 'm',
  'н': 'n',
  'о': 'o',
  'п': 'n',
  'р': 'p',
  'с': 'c',
  'т': 'o',
  'у': 'y',
  'ф': 'b',
  'х': 'x',
  'ц': 'n',
  'ч': 'n',
  'ш': 'w',
  'щ': 'w',
  'ъ': 'a',
  'ы': 'm',
  'ь': 'a',
  'э': 'e',
  'ю': 'm',
  'я': 'r'
};

/**
 * This function adds new font metrics to default metricMap
 * It can also override existing metrics
 */
function setFontMetrics(fontName, metrics) {
  fontMetricsData[fontName] = metrics;
}
/**
 * This function is a convenience function for looking up information in the
 * metricMap table. It takes a character as a string, and a font.
 *
 * Note: the `width` property may be undefined if fontMetricsData.js wasn't
 * built using `Make extended_metrics`.
 */

function getCharacterMetrics(character, font, mode) {
  if (!fontMetricsData[font]) {
    throw new Error("Font metrics not found for font: " + font + ".");
  }

  var ch = character.charCodeAt(0);
  var metrics = fontMetricsData[font][ch];

  if (!metrics && character[0] in extraCharacterMap) {
    ch = extraCharacterMap[character[0]].charCodeAt(0);
    metrics = fontMetricsData[font][ch];
  }

  if (!metrics && mode === 'text') {
    // We don't typically have font metrics for Asian scripts.
    // But since we support them in text mode, we need to return
    // some sort of metrics.
    // So if the character is in a script we support but we
    // don't have metrics for it, just use the metrics for
    // the Latin capital letter M. This is close enough because
    // we (currently) only care about the height of the glpyh
    // not its width.
    if (supportedCodepoint(ch)) {
      metrics = fontMetricsData[font][77]; // 77 is the charcode for 'M'
    }
  }

  if (metrics) {
    return {
      depth: metrics[0],
      height: metrics[1],
      italic: metrics[2],
      skew: metrics[3],
      width: metrics[4]
    };
  }
}
var fontMetricsBySizeIndex = {};
/**
 * Get the font metrics for a given size.
 */

function getGlobalMetrics(size) {
  var sizeIndex;

  if (size >= 5) {
    sizeIndex = 0;
  } else if (size >= 3) {
    sizeIndex = 1;
  } else {
    sizeIndex = 2;
  }

  if (!fontMetricsBySizeIndex[sizeIndex]) {
    var metrics = fontMetricsBySizeIndex[sizeIndex] = {
      cssEmPerMu: sigmasAndXis.quad[sizeIndex] / 18
    };

    for (var key in sigmasAndXis) {
      if (sigmasAndXis.hasOwnProperty(key)) {
        metrics[key] = sigmasAndXis[key][sizeIndex];
      }
    }
  }

  return fontMetricsBySizeIndex[sizeIndex];
}
// CONCATENATED MODULE: ./src/symbols.js
/**
 * This file holds a list of all no-argument functions and single-character
 * symbols (like 'a' or ';').
 *
 * For each of the symbols, there are three properties they can have:
 * - font (required): the font to be used for this symbol. Either "main" (the
     normal font), or "ams" (the ams fonts).
 * - group (required): the ParseNode group type the symbol should have (i.e.
     "textord", "mathord", etc).
     See https://github.com/KaTeX/KaTeX/wiki/Examining-TeX#group-types
 * - replace: the character that this symbol or function should be
 *   replaced with (i.e. "\phi" has a replace value of "\u03d5", the phi
 *   character in the main font).
 *
 * The outermost map in the table indicates what mode the symbols should be
 * accepted in (e.g. "math" or "text").
 */
// Some of these have a "-token" suffix since these are also used as `ParseNode`
// types for raw text tokens, and we want to avoid conflicts with higher-level
// `ParseNode` types. These `ParseNode`s are constructed within `Parser` by
// looking up the `symbols` map.
var ATOMS = {
  "bin": 1,
  "close": 1,
  "inner": 1,
  "open": 1,
  "punct": 1,
  "rel": 1
};
var NON_ATOMS = {
  "accent-token": 1,
  "mathord": 1,
  "op-token": 1,
  "spacing": 1,
  "textord": 1
};
var symbols = {
  "math": {},
  "text": {}
};
/* harmony default export */ var src_symbols = (symbols);
/** `acceptUnicodeChar = true` is only applicable if `replace` is set. */

function defineSymbol(mode, font, group, replace, name, acceptUnicodeChar) {
  symbols[mode][name] = {
    font: font,
    group: group,
    replace: replace
  };

  if (acceptUnicodeChar && replace) {
    symbols[mode][replace] = symbols[mode][name];
  }
} // Some abbreviations for commonly used strings.
// This helps minify the code, and also spotting typos using jshint.
// modes:

var symbols_math = "math";
var symbols_text = "text"; // fonts:

var main = "main";
var ams = "ams"; // groups:

var symbols_accent = "accent-token";
var bin = "bin";
var symbols_close = "close";
var symbols_inner = "inner";
var mathord = "mathord";
var op = "op-token";
var symbols_open = "open";
var punct = "punct";
var rel = "rel";
var symbols_spacing = "spacing";
var symbols_textord = "textord"; // Now comes the symbol table
// Relation Symbols

defineSymbol(symbols_math, main, rel, "\u2261", "\\equiv", true);
defineSymbol(symbols_math, main, rel, "\u227A", "\\prec", true);
defineSymbol(symbols_math, main, rel, "\u227B", "\\succ", true);
defineSymbol(symbols_math, main, rel, "\u223C", "\\sim", true);
defineSymbol(symbols_math, main, rel, "\u22A5", "\\perp");
defineSymbol(symbols_math, main, rel, "\u2AAF", "\\preceq", true);
defineSymbol(symbols_math, main, rel, "\u2AB0", "\\succeq", true);
defineSymbol(symbols_math, main, rel, "\u2243", "\\simeq", true);
defineSymbol(symbols_math, main, rel, "\u2223", "\\mid", true);
defineSymbol(symbols_math, main, rel, "\u226A", "\\ll", true);
defineSymbol(symbols_math, main, rel, "\u226B", "\\gg", true);
defineSymbol(symbols_math, main, rel, "\u224D", "\\asymp", true);
defineSymbol(symbols_math, main, rel, "\u2225", "\\parallel");
defineSymbol(symbols_math, main, rel, "\u22C8", "\\bowtie", true);
defineSymbol(symbols_math, main, rel, "\u2323", "\\smile", true);
defineSymbol(symbols_math, main, rel, "\u2291", "\\sqsubseteq", true);
defineSymbol(symbols_math, main, rel, "\u2292", "\\sqsupseteq", true);
defineSymbol(symbols_math, main, rel, "\u2250", "\\doteq", true);
defineSymbol(symbols_math, main, rel, "\u2322", "\\frown", true);
defineSymbol(symbols_math, main, rel, "\u220B", "\\ni", true);
defineSymbol(symbols_math, main, rel, "\u221D", "\\propto", true);
defineSymbol(symbols_math, main, rel, "\u22A2", "\\vdash", true);
defineSymbol(symbols_math, main, rel, "\u22A3", "\\dashv", true);
defineSymbol(symbols_math, main, rel, "\u220B", "\\owns"); // Punctuation

defineSymbol(symbols_math, main, punct, ".", "\\ldotp");
defineSymbol(symbols_math, main, punct, "\u22C5", "\\cdotp"); // Misc Symbols

defineSymbol(symbols_math, main, symbols_textord, "#", "\\#");
defineSymbol(symbols_text, main, symbols_textord, "#", "\\#");
defineSymbol(symbols_math, main, symbols_textord, "&", "\\&");
defineSymbol(symbols_text, main, symbols_textord, "&", "\\&");
defineSymbol(symbols_math, main, symbols_textord, "\u2135", "\\aleph", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2200", "\\forall", true);
defineSymbol(symbols_math, main, symbols_textord, "\u210F", "\\hbar", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2203", "\\exists", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2207", "\\nabla", true);
defineSymbol(symbols_math, main, symbols_textord, "\u266D", "\\flat", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2113", "\\ell", true);
defineSymbol(symbols_math, main, symbols_textord, "\u266E", "\\natural", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2663", "\\clubsuit", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2118", "\\wp", true);
defineSymbol(symbols_math, main, symbols_textord, "\u266F", "\\sharp", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2662", "\\diamondsuit", true);
defineSymbol(symbols_math, main, symbols_textord, "\u211C", "\\Re", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2661", "\\heartsuit", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2111", "\\Im", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2660", "\\spadesuit", true);
defineSymbol(symbols_text, main, symbols_textord, "\xA7", "\\S", true);
defineSymbol(symbols_text, main, symbols_textord, "\xB6", "\\P", true); // Math and Text

defineSymbol(symbols_math, main, symbols_textord, "\u2020", "\\dag");
defineSymbol(symbols_text, main, symbols_textord, "\u2020", "\\dag");
defineSymbol(symbols_text, main, symbols_textord, "\u2020", "\\textdagger");
defineSymbol(symbols_math, main, symbols_textord, "\u2021", "\\ddag");
defineSymbol(symbols_text, main, symbols_textord, "\u2021", "\\ddag");
defineSymbol(symbols_text, main, symbols_textord, "\u2021", "\\textdaggerdbl"); // Large Delimiters

defineSymbol(symbols_math, main, symbols_close, "\u23B1", "\\rmoustache", true);
defineSymbol(symbols_math, main, symbols_open, "\u23B0", "\\lmoustache", true);
defineSymbol(symbols_math, main, symbols_close, "\u27EF", "\\rgroup", true);
defineSymbol(symbols_math, main, symbols_open, "\u27EE", "\\lgroup", true); // Binary Operators

defineSymbol(symbols_math, main, bin, "\u2213", "\\mp", true);
defineSymbol(symbols_math, main, bin, "\u2296", "\\ominus", true);
defineSymbol(symbols_math, main, bin, "\u228E", "\\uplus", true);
defineSymbol(symbols_math, main, bin, "\u2293", "\\sqcap", true);
defineSymbol(symbols_math, main, bin, "\u2217", "\\ast");
defineSymbol(symbols_math, main, bin, "\u2294", "\\sqcup", true);
defineSymbol(symbols_math, main, bin, "\u25EF", "\\bigcirc");
defineSymbol(symbols_math, main, bin, "\u2219", "\\bullet");
defineSymbol(symbols_math, main, bin, "\u2021", "\\ddagger");
defineSymbol(symbols_math, main, bin, "\u2240", "\\wr", true);
defineSymbol(symbols_math, main, bin, "\u2A3F", "\\amalg");
defineSymbol(symbols_math, main, bin, "&", "\\And"); // from amsmath
// Arrow Symbols

defineSymbol(symbols_math, main, rel, "\u27F5", "\\longleftarrow", true);
defineSymbol(symbols_math, main, rel, "\u21D0", "\\Leftarrow", true);
defineSymbol(symbols_math, main, rel, "\u27F8", "\\Longleftarrow", true);
defineSymbol(symbols_math, main, rel, "\u27F6", "\\longrightarrow", true);
defineSymbol(symbols_math, main, rel, "\u21D2", "\\Rightarrow", true);
defineSymbol(symbols_math, main, rel, "\u27F9", "\\Longrightarrow", true);
defineSymbol(symbols_math, main, rel, "\u2194", "\\leftrightarrow", true);
defineSymbol(symbols_math, main, rel, "\u27F7", "\\longleftrightarrow", true);
defineSymbol(symbols_math, main, rel, "\u21D4", "\\Leftrightarrow", true);
defineSymbol(symbols_math, main, rel, "\u27FA", "\\Longleftrightarrow", true);
defineSymbol(symbols_math, main, rel, "\u21A6", "\\mapsto", true);
defineSymbol(symbols_math, main, rel, "\u27FC", "\\longmapsto", true);
defineSymbol(symbols_math, main, rel, "\u2197", "\\nearrow", true);
defineSymbol(symbols_math, main, rel, "\u21A9", "\\hookleftarrow", true);
defineSymbol(symbols_math, main, rel, "\u21AA", "\\hookrightarrow", true);
defineSymbol(symbols_math, main, rel, "\u2198", "\\searrow", true);
defineSymbol(symbols_math, main, rel, "\u21BC", "\\leftharpoonup", true);
defineSymbol(symbols_math, main, rel, "\u21C0", "\\rightharpoonup", true);
defineSymbol(symbols_math, main, rel, "\u2199", "\\swarrow", true);
defineSymbol(symbols_math, main, rel, "\u21BD", "\\leftharpoondown", true);
defineSymbol(symbols_math, main, rel, "\u21C1", "\\rightharpoondown", true);
defineSymbol(symbols_math, main, rel, "\u2196", "\\nwarrow", true);
defineSymbol(symbols_math, main, rel, "\u21CC", "\\rightleftharpoons", true); // AMS Negated Binary Relations

defineSymbol(symbols_math, ams, rel, "\u226E", "\\nless", true); // Symbol names preceeded by "@" each have a corresponding macro.

defineSymbol(symbols_math, ams, rel, "\uE010", "\\@nleqslant");
defineSymbol(symbols_math, ams, rel, "\uE011", "\\@nleqq");
defineSymbol(symbols_math, ams, rel, "\u2A87", "\\lneq", true);
defineSymbol(symbols_math, ams, rel, "\u2268", "\\lneqq", true);
defineSymbol(symbols_math, ams, rel, "\uE00C", "\\@lvertneqq");
defineSymbol(symbols_math, ams, rel, "\u22E6", "\\lnsim", true);
defineSymbol(symbols_math, ams, rel, "\u2A89", "\\lnapprox", true);
defineSymbol(symbols_math, ams, rel, "\u2280", "\\nprec", true); // unicode-math maps \u22e0 to \npreccurlyeq. We'll use the AMS synonym.

defineSymbol(symbols_math, ams, rel, "\u22E0", "\\npreceq", true);
defineSymbol(symbols_math, ams, rel, "\u22E8", "\\precnsim", true);
defineSymbol(symbols_math, ams, rel, "\u2AB9", "\\precnapprox", true);
defineSymbol(symbols_math, ams, rel, "\u2241", "\\nsim", true);
defineSymbol(symbols_math, ams, rel, "\uE006", "\\@nshortmid");
defineSymbol(symbols_math, ams, rel, "\u2224", "\\nmid", true);
defineSymbol(symbols_math, ams, rel, "\u22AC", "\\nvdash", true);
defineSymbol(symbols_math, ams, rel, "\u22AD", "\\nvDash", true);
defineSymbol(symbols_math, ams, rel, "\u22EA", "\\ntriangleleft");
defineSymbol(symbols_math, ams, rel, "\u22EC", "\\ntrianglelefteq", true);
defineSymbol(symbols_math, ams, rel, "\u228A", "\\subsetneq", true);
defineSymbol(symbols_math, ams, rel, "\uE01A", "\\@varsubsetneq");
defineSymbol(symbols_math, ams, rel, "\u2ACB", "\\subsetneqq", true);
defineSymbol(symbols_math, ams, rel, "\uE017", "\\@varsubsetneqq");
defineSymbol(symbols_math, ams, rel, "\u226F", "\\ngtr", true);
defineSymbol(symbols_math, ams, rel, "\uE00F", "\\@ngeqslant");
defineSymbol(symbols_math, ams, rel, "\uE00E", "\\@ngeqq");
defineSymbol(symbols_math, ams, rel, "\u2A88", "\\gneq", true);
defineSymbol(symbols_math, ams, rel, "\u2269", "\\gneqq", true);
defineSymbol(symbols_math, ams, rel, "\uE00D", "\\@gvertneqq");
defineSymbol(symbols_math, ams, rel, "\u22E7", "\\gnsim", true);
defineSymbol(symbols_math, ams, rel, "\u2A8A", "\\gnapprox", true);
defineSymbol(symbols_math, ams, rel, "\u2281", "\\nsucc", true); // unicode-math maps \u22e1 to \nsucccurlyeq. We'll use the AMS synonym.

defineSymbol(symbols_math, ams, rel, "\u22E1", "\\nsucceq", true);
defineSymbol(symbols_math, ams, rel, "\u22E9", "\\succnsim", true);
defineSymbol(symbols_math, ams, rel, "\u2ABA", "\\succnapprox", true); // unicode-math maps \u2246 to \simneqq. We'll use the AMS synonym.

defineSymbol(symbols_math, ams, rel, "\u2246", "\\ncong", true);
defineSymbol(symbols_math, ams, rel, "\uE007", "\\@nshortparallel");
defineSymbol(symbols_math, ams, rel, "\u2226", "\\nparallel", true);
defineSymbol(symbols_math, ams, rel, "\u22AF", "\\nVDash", true);
defineSymbol(symbols_math, ams, rel, "\u22EB", "\\ntriangleright");
defineSymbol(symbols_math, ams, rel, "\u22ED", "\\ntrianglerighteq", true);
defineSymbol(symbols_math, ams, rel, "\uE018", "\\@nsupseteqq");
defineSymbol(symbols_math, ams, rel, "\u228B", "\\supsetneq", true);
defineSymbol(symbols_math, ams, rel, "\uE01B", "\\@varsupsetneq");
defineSymbol(symbols_math, ams, rel, "\u2ACC", "\\supsetneqq", true);
defineSymbol(symbols_math, ams, rel, "\uE019", "\\@varsupsetneqq");
defineSymbol(symbols_math, ams, rel, "\u22AE", "\\nVdash", true);
defineSymbol(symbols_math, ams, rel, "\u2AB5", "\\precneqq", true);
defineSymbol(symbols_math, ams, rel, "\u2AB6", "\\succneqq", true);
defineSymbol(symbols_math, ams, rel, "\uE016", "\\@nsubseteqq");
defineSymbol(symbols_math, ams, bin, "\u22B4", "\\unlhd");
defineSymbol(symbols_math, ams, bin, "\u22B5", "\\unrhd"); // AMS Negated Arrows

defineSymbol(symbols_math, ams, rel, "\u219A", "\\nleftarrow", true);
defineSymbol(symbols_math, ams, rel, "\u219B", "\\nrightarrow", true);
defineSymbol(symbols_math, ams, rel, "\u21CD", "\\nLeftarrow", true);
defineSymbol(symbols_math, ams, rel, "\u21CF", "\\nRightarrow", true);
defineSymbol(symbols_math, ams, rel, "\u21AE", "\\nleftrightarrow", true);
defineSymbol(symbols_math, ams, rel, "\u21CE", "\\nLeftrightarrow", true); // AMS Misc

defineSymbol(symbols_math, ams, rel, "\u25B3", "\\vartriangle");
defineSymbol(symbols_math, ams, symbols_textord, "\u210F", "\\hslash");
defineSymbol(symbols_math, ams, symbols_textord, "\u25BD", "\\triangledown");
defineSymbol(symbols_math, ams, symbols_textord, "\u25CA", "\\lozenge");
defineSymbol(symbols_math, ams, symbols_textord, "\u24C8", "\\circledS");
defineSymbol(symbols_math, ams, symbols_textord, "\xAE", "\\circledR");
defineSymbol(symbols_text, ams, symbols_textord, "\xAE", "\\circledR");
defineSymbol(symbols_math, ams, symbols_textord, "\u2221", "\\measuredangle", true);
defineSymbol(symbols_math, ams, symbols_textord, "\u2204", "\\nexists");
defineSymbol(symbols_math, ams, symbols_textord, "\u2127", "\\mho");
defineSymbol(symbols_math, ams, symbols_textord, "\u2132", "\\Finv", true);
defineSymbol(symbols_math, ams, symbols_textord, "\u2141", "\\Game", true);
defineSymbol(symbols_math, ams, symbols_textord, "\u2035", "\\backprime");
defineSymbol(symbols_math, ams, symbols_textord, "\u25B2", "\\blacktriangle");
defineSymbol(symbols_math, ams, symbols_textord, "\u25BC", "\\blacktriangledown");
defineSymbol(symbols_math, ams, symbols_textord, "\u25A0", "\\blacksquare");
defineSymbol(symbols_math, ams, symbols_textord, "\u29EB", "\\blacklozenge");
defineSymbol(symbols_math, ams, symbols_textord, "\u2605", "\\bigstar");
defineSymbol(symbols_math, ams, symbols_textord, "\u2222", "\\sphericalangle", true);
defineSymbol(symbols_math, ams, symbols_textord, "\u2201", "\\complement", true); // unicode-math maps U+F0 (ð) to \matheth. We map to AMS function \eth

defineSymbol(symbols_math, ams, symbols_textord, "\xF0", "\\eth", true);
defineSymbol(symbols_math, ams, symbols_textord, "\u2571", "\\diagup");
defineSymbol(symbols_math, ams, symbols_textord, "\u2572", "\\diagdown");
defineSymbol(symbols_math, ams, symbols_textord, "\u25A1", "\\square");
defineSymbol(symbols_math, ams, symbols_textord, "\u25A1", "\\Box");
defineSymbol(symbols_math, ams, symbols_textord, "\u25CA", "\\Diamond"); // unicode-math maps U+A5 to \mathyen. We map to AMS function \yen

defineSymbol(symbols_math, ams, symbols_textord, "\xA5", "\\yen", true);
defineSymbol(symbols_text, ams, symbols_textord, "\xA5", "\\yen", true);
defineSymbol(symbols_math, ams, symbols_textord, "\u2713", "\\checkmark", true);
defineSymbol(symbols_text, ams, symbols_textord, "\u2713", "\\checkmark"); // AMS Hebrew

defineSymbol(symbols_math, ams, symbols_textord, "\u2136", "\\beth", true);
defineSymbol(symbols_math, ams, symbols_textord, "\u2138", "\\daleth", true);
defineSymbol(symbols_math, ams, symbols_textord, "\u2137", "\\gimel", true); // AMS Greek

defineSymbol(symbols_math, ams, symbols_textord, "\u03DD", "\\digamma", true);
defineSymbol(symbols_math, ams, symbols_textord, "\u03F0", "\\varkappa"); // AMS Delimiters

defineSymbol(symbols_math, ams, symbols_open, "\u250C", "\\ulcorner", true);
defineSymbol(symbols_math, ams, symbols_close, "\u2510", "\\urcorner", true);
defineSymbol(symbols_math, ams, symbols_open, "\u2514", "\\llcorner", true);
defineSymbol(symbols_math, ams, symbols_close, "\u2518", "\\lrcorner", true); // AMS Binary Relations

defineSymbol(symbols_math, ams, rel, "\u2266", "\\leqq", true);
defineSymbol(symbols_math, ams, rel, "\u2A7D", "\\leqslant", true);
defineSymbol(symbols_math, ams, rel, "\u2A95", "\\eqslantless", true);
defineSymbol(symbols_math, ams, rel, "\u2272", "\\lesssim", true);
defineSymbol(symbols_math, ams, rel, "\u2A85", "\\lessapprox", true);
defineSymbol(symbols_math, ams, rel, "\u224A", "\\approxeq", true);
defineSymbol(symbols_math, ams, bin, "\u22D6", "\\lessdot");
defineSymbol(symbols_math, ams, rel, "\u22D8", "\\lll", true);
defineSymbol(symbols_math, ams, rel, "\u2276", "\\lessgtr", true);
defineSymbol(symbols_math, ams, rel, "\u22DA", "\\lesseqgtr", true);
defineSymbol(symbols_math, ams, rel, "\u2A8B", "\\lesseqqgtr", true);
defineSymbol(symbols_math, ams, rel, "\u2251", "\\doteqdot");
defineSymbol(symbols_math, ams, rel, "\u2253", "\\risingdotseq", true);
defineSymbol(symbols_math, ams, rel, "\u2252", "\\fallingdotseq", true);
defineSymbol(symbols_math, ams, rel, "\u223D", "\\backsim", true);
defineSymbol(symbols_math, ams, rel, "\u22CD", "\\backsimeq", true);
defineSymbol(symbols_math, ams, rel, "\u2AC5", "\\subseteqq", true);
defineSymbol(symbols_math, ams, rel, "\u22D0", "\\Subset", true);
defineSymbol(symbols_math, ams, rel, "\u228F", "\\sqsubset", true);
defineSymbol(symbols_math, ams, rel, "\u227C", "\\preccurlyeq", true);
defineSymbol(symbols_math, ams, rel, "\u22DE", "\\curlyeqprec", true);
defineSymbol(symbols_math, ams, rel, "\u227E", "\\precsim", true);
defineSymbol(symbols_math, ams, rel, "\u2AB7", "\\precapprox", true);
defineSymbol(symbols_math, ams, rel, "\u22B2", "\\vartriangleleft");
defineSymbol(symbols_math, ams, rel, "\u22B4", "\\trianglelefteq");
defineSymbol(symbols_math, ams, rel, "\u22A8", "\\vDash", true);
defineSymbol(symbols_math, ams, rel, "\u22AA", "\\Vvdash", true);
defineSymbol(symbols_math, ams, rel, "\u2323", "\\smallsmile");
defineSymbol(symbols_math, ams, rel, "\u2322", "\\smallfrown");
defineSymbol(symbols_math, ams, rel, "\u224F", "\\bumpeq", true);
defineSymbol(symbols_math, ams, rel, "\u224E", "\\Bumpeq", true);
defineSymbol(symbols_math, ams, rel, "\u2267", "\\geqq", true);
defineSymbol(symbols_math, ams, rel, "\u2A7E", "\\geqslant", true);
defineSymbol(symbols_math, ams, rel, "\u2A96", "\\eqslantgtr", true);
defineSymbol(symbols_math, ams, rel, "\u2273", "\\gtrsim", true);
defineSymbol(symbols_math, ams, rel, "\u2A86", "\\gtrapprox", true);
defineSymbol(symbols_math, ams, bin, "\u22D7", "\\gtrdot");
defineSymbol(symbols_math, ams, rel, "\u22D9", "\\ggg", true);
defineSymbol(symbols_math, ams, rel, "\u2277", "\\gtrless", true);
defineSymbol(symbols_math, ams, rel, "\u22DB", "\\gtreqless", true);
defineSymbol(symbols_math, ams, rel, "\u2A8C", "\\gtreqqless", true);
defineSymbol(symbols_math, ams, rel, "\u2256", "\\eqcirc", true);
defineSymbol(symbols_math, ams, rel, "\u2257", "\\circeq", true);
defineSymbol(symbols_math, ams, rel, "\u225C", "\\triangleq", true);
defineSymbol(symbols_math, ams, rel, "\u223C", "\\thicksim");
defineSymbol(symbols_math, ams, rel, "\u2248", "\\thickapprox");
defineSymbol(symbols_math, ams, rel, "\u2AC6", "\\supseteqq", true);
defineSymbol(symbols_math, ams, rel, "\u22D1", "\\Supset", true);
defineSymbol(symbols_math, ams, rel, "\u2290", "\\sqsupset", true);
defineSymbol(symbols_math, ams, rel, "\u227D", "\\succcurlyeq", true);
defineSymbol(symbols_math, ams, rel, "\u22DF", "\\curlyeqsucc", true);
defineSymbol(symbols_math, ams, rel, "\u227F", "\\succsim", true);
defineSymbol(symbols_math, ams, rel, "\u2AB8", "\\succapprox", true);
defineSymbol(symbols_math, ams, rel, "\u22B3", "\\vartriangleright");
defineSymbol(symbols_math, ams, rel, "\u22B5", "\\trianglerighteq");
defineSymbol(symbols_math, ams, rel, "\u22A9", "\\Vdash", true);
defineSymbol(symbols_math, ams, rel, "\u2223", "\\shortmid");
defineSymbol(symbols_math, ams, rel, "\u2225", "\\shortparallel");
defineSymbol(symbols_math, ams, rel, "\u226C", "\\between", true);
defineSymbol(symbols_math, ams, rel, "\u22D4", "\\pitchfork", true);
defineSymbol(symbols_math, ams, rel, "\u221D", "\\varpropto");
defineSymbol(symbols_math, ams, rel, "\u25C0", "\\blacktriangleleft"); // unicode-math says that \therefore is a mathord atom.
// We kept the amssymb atom type, which is rel.

defineSymbol(symbols_math, ams, rel, "\u2234", "\\therefore", true);
defineSymbol(symbols_math, ams, rel, "\u220D", "\\backepsilon");
defineSymbol(symbols_math, ams, rel, "\u25B6", "\\blacktriangleright"); // unicode-math says that \because is a mathord atom.
// We kept the amssymb atom type, which is rel.

defineSymbol(symbols_math, ams, rel, "\u2235", "\\because", true);
defineSymbol(symbols_math, ams, rel, "\u22D8", "\\llless");
defineSymbol(symbols_math, ams, rel, "\u22D9", "\\gggtr");
defineSymbol(symbols_math, ams, bin, "\u22B2", "\\lhd");
defineSymbol(symbols_math, ams, bin, "\u22B3", "\\rhd");
defineSymbol(symbols_math, ams, rel, "\u2242", "\\eqsim", true);
defineSymbol(symbols_math, main, rel, "\u22C8", "\\Join");
defineSymbol(symbols_math, ams, rel, "\u2251", "\\Doteq", true); // AMS Binary Operators

defineSymbol(symbols_math, ams, bin, "\u2214", "\\dotplus", true);
defineSymbol(symbols_math, ams, bin, "\u2216", "\\smallsetminus");
defineSymbol(symbols_math, ams, bin, "\u22D2", "\\Cap", true);
defineSymbol(symbols_math, ams, bin, "\u22D3", "\\Cup", true);
defineSymbol(symbols_math, ams, bin, "\u2A5E", "\\doublebarwedge", true);
defineSymbol(symbols_math, ams, bin, "\u229F", "\\boxminus", true);
defineSymbol(symbols_math, ams, bin, "\u229E", "\\boxplus", true);
defineSymbol(symbols_math, ams, bin, "\u22C7", "\\divideontimes", true);
defineSymbol(symbols_math, ams, bin, "\u22C9", "\\ltimes", true);
defineSymbol(symbols_math, ams, bin, "\u22CA", "\\rtimes", true);
defineSymbol(symbols_math, ams, bin, "\u22CB", "\\leftthreetimes", true);
defineSymbol(symbols_math, ams, bin, "\u22CC", "\\rightthreetimes", true);
defineSymbol(symbols_math, ams, bin, "\u22CF", "\\curlywedge", true);
defineSymbol(symbols_math, ams, bin, "\u22CE", "\\curlyvee", true);
defineSymbol(symbols_math, ams, bin, "\u229D", "\\circleddash", true);
defineSymbol(symbols_math, ams, bin, "\u229B", "\\circledast", true);
defineSymbol(symbols_math, ams, bin, "\u22C5", "\\centerdot");
defineSymbol(symbols_math, ams, bin, "\u22BA", "\\intercal", true);
defineSymbol(symbols_math, ams, bin, "\u22D2", "\\doublecap");
defineSymbol(symbols_math, ams, bin, "\u22D3", "\\doublecup");
defineSymbol(symbols_math, ams, bin, "\u22A0", "\\boxtimes", true); // AMS Arrows
// Note: unicode-math maps \u21e2 to their own function \rightdasharrow.
// We'll map it to AMS function \dashrightarrow. It produces the same atom.

defineSymbol(symbols_math, ams, rel, "\u21E2", "\\dashrightarrow", true); // unicode-math maps \u21e0 to \leftdasharrow. We'll use the AMS synonym.

defineSymbol(symbols_math, ams, rel, "\u21E0", "\\dashleftarrow", true);
defineSymbol(symbols_math, ams, rel, "\u21C7", "\\leftleftarrows", true);
defineSymbol(symbols_math, ams, rel, "\u21C6", "\\leftrightarrows", true);
defineSymbol(symbols_math, ams, rel, "\u21DA", "\\Lleftarrow", true);
defineSymbol(symbols_math, ams, rel, "\u219E", "\\twoheadleftarrow", true);
defineSymbol(symbols_math, ams, rel, "\u21A2", "\\leftarrowtail", true);
defineSymbol(symbols_math, ams, rel, "\u21AB", "\\looparrowleft", true);
defineSymbol(symbols_math, ams, rel, "\u21CB", "\\leftrightharpoons", true);
defineSymbol(symbols_math, ams, rel, "\u21B6", "\\curvearrowleft", true); // unicode-math maps \u21ba to \acwopencirclearrow. We'll use the AMS synonym.

defineSymbol(symbols_math, ams, rel, "\u21BA", "\\circlearrowleft", true);
defineSymbol(symbols_math, ams, rel, "\u21B0", "\\Lsh", true);
defineSymbol(symbols_math, ams, rel, "\u21C8", "\\upuparrows", true);
defineSymbol(symbols_math, ams, rel, "\u21BF", "\\upharpoonleft", true);
defineSymbol(symbols_math, ams, rel, "\u21C3", "\\downharpoonleft", true);
defineSymbol(symbols_math, ams, rel, "\u22B8", "\\multimap", true);
defineSymbol(symbols_math, ams, rel, "\u21AD", "\\leftrightsquigarrow", true);
defineSymbol(symbols_math, ams, rel, "\u21C9", "\\rightrightarrows", true);
defineSymbol(symbols_math, ams, rel, "\u21C4", "\\rightleftarrows", true);
defineSymbol(symbols_math, ams, rel, "\u21A0", "\\twoheadrightarrow", true);
defineSymbol(symbols_math, ams, rel, "\u21A3", "\\rightarrowtail", true);
defineSymbol(symbols_math, ams, rel, "\u21AC", "\\looparrowright", true);
defineSymbol(symbols_math, ams, rel, "\u21B7", "\\curvearrowright", true); // unicode-math maps \u21bb to \cwopencirclearrow. We'll use the AMS synonym.

defineSymbol(symbols_math, ams, rel, "\u21BB", "\\circlearrowright", true);
defineSymbol(symbols_math, ams, rel, "\u21B1", "\\Rsh", true);
defineSymbol(symbols_math, ams, rel, "\u21CA", "\\downdownarrows", true);
defineSymbol(symbols_math, ams, rel, "\u21BE", "\\upharpoonright", true);
defineSymbol(symbols_math, ams, rel, "\u21C2", "\\downharpoonright", true);
defineSymbol(symbols_math, ams, rel, "\u21DD", "\\rightsquigarrow", true);
defineSymbol(symbols_math, ams, rel, "\u21DD", "\\leadsto");
defineSymbol(symbols_math, ams, rel, "\u21DB", "\\Rrightarrow", true);
defineSymbol(symbols_math, ams, rel, "\u21BE", "\\restriction");
defineSymbol(symbols_math, main, symbols_textord, "\u2018", "`");
defineSymbol(symbols_math, main, symbols_textord, "$", "\\$");
defineSymbol(symbols_text, main, symbols_textord, "$", "\\$");
defineSymbol(symbols_text, main, symbols_textord, "$", "\\textdollar");
defineSymbol(symbols_math, main, symbols_textord, "%", "\\%");
defineSymbol(symbols_text, main, symbols_textord, "%", "\\%");
defineSymbol(symbols_math, main, symbols_textord, "_", "\\_");
defineSymbol(symbols_text, main, symbols_textord, "_", "\\_");
defineSymbol(symbols_text, main, symbols_textord, "_", "\\textunderscore");
defineSymbol(symbols_math, main, symbols_textord, "\u2220", "\\angle", true);
defineSymbol(symbols_math, main, symbols_textord, "\u221E", "\\infty", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2032", "\\prime");
defineSymbol(symbols_math, main, symbols_textord, "\u25B3", "\\triangle");
defineSymbol(symbols_math, main, symbols_textord, "\u0393", "\\Gamma", true);
defineSymbol(symbols_math, main, symbols_textord, "\u0394", "\\Delta", true);
defineSymbol(symbols_math, main, symbols_textord, "\u0398", "\\Theta", true);
defineSymbol(symbols_math, main, symbols_textord, "\u039B", "\\Lambda", true);
defineSymbol(symbols_math, main, symbols_textord, "\u039E", "\\Xi", true);
defineSymbol(symbols_math, main, symbols_textord, "\u03A0", "\\Pi", true);
defineSymbol(symbols_math, main, symbols_textord, "\u03A3", "\\Sigma", true);
defineSymbol(symbols_math, main, symbols_textord, "\u03A5", "\\Upsilon", true);
defineSymbol(symbols_math, main, symbols_textord, "\u03A6", "\\Phi", true);
defineSymbol(symbols_math, main, symbols_textord, "\u03A8", "\\Psi", true);
defineSymbol(symbols_math, main, symbols_textord, "\u03A9", "\\Omega", true);
defineSymbol(symbols_math, main, symbols_textord, "A", "\u0391");
defineSymbol(symbols_math, main, symbols_textord, "B", "\u0392");
defineSymbol(symbols_math, main, symbols_textord, "E", "\u0395");
defineSymbol(symbols_math, main, symbols_textord, "Z", "\u0396");
defineSymbol(symbols_math, main, symbols_textord, "H", "\u0397");
defineSymbol(symbols_math, main, symbols_textord, "I", "\u0399");
defineSymbol(symbols_math, main, symbols_textord, "K", "\u039A");
defineSymbol(symbols_math, main, symbols_textord, "M", "\u039C");
defineSymbol(symbols_math, main, symbols_textord, "N", "\u039D");
defineSymbol(symbols_math, main, symbols_textord, "O", "\u039F");
defineSymbol(symbols_math, main, symbols_textord, "P", "\u03A1");
defineSymbol(symbols_math, main, symbols_textord, "T", "\u03A4");
defineSymbol(symbols_math, main, symbols_textord, "X", "\u03A7");
defineSymbol(symbols_math, main, symbols_textord, "\xAC", "\\neg", true);
defineSymbol(symbols_math, main, symbols_textord, "\xAC", "\\lnot");
defineSymbol(symbols_math, main, symbols_textord, "\u22A4", "\\top");
defineSymbol(symbols_math, main, symbols_textord, "\u22A5", "\\bot");
defineSymbol(symbols_math, main, symbols_textord, "\u2205", "\\emptyset");
defineSymbol(symbols_math, ams, symbols_textord, "\u2205", "\\varnothing");
defineSymbol(symbols_math, main, mathord, "\u03B1", "\\alpha", true);
defineSymbol(symbols_math, main, mathord, "\u03B2", "\\beta", true);
defineSymbol(symbols_math, main, mathord, "\u03B3", "\\gamma", true);
defineSymbol(symbols_math, main, mathord, "\u03B4", "\\delta", true);
defineSymbol(symbols_math, main, mathord, "\u03F5", "\\epsilon", true);
defineSymbol(symbols_math, main, mathord, "\u03B6", "\\zeta", true);
defineSymbol(symbols_math, main, mathord, "\u03B7", "\\eta", true);
defineSymbol(symbols_math, main, mathord, "\u03B8", "\\theta", true);
defineSymbol(symbols_math, main, mathord, "\u03B9", "\\iota", true);
defineSymbol(symbols_math, main, mathord, "\u03BA", "\\kappa", true);
defineSymbol(symbols_math, main, mathord, "\u03BB", "\\lambda", true);
defineSymbol(symbols_math, main, mathord, "\u03BC", "\\mu", true);
defineSymbol(symbols_math, main, mathord, "\u03BD", "\\nu", true);
defineSymbol(symbols_math, main, mathord, "\u03BE", "\\xi", true);
defineSymbol(symbols_math, main, mathord, "\u03BF", "\\omicron", true);
defineSymbol(symbols_math, main, mathord, "\u03C0", "\\pi", true);
defineSymbol(symbols_math, main, mathord, "\u03C1", "\\rho", true);
defineSymbol(symbols_math, main, mathord, "\u03C3", "\\sigma", true);
defineSymbol(symbols_math, main, mathord, "\u03C4", "\\tau", true);
defineSymbol(symbols_math, main, mathord, "\u03C5", "\\upsilon", true);
defineSymbol(symbols_math, main, mathord, "\u03D5", "\\phi", true);
defineSymbol(symbols_math, main, mathord, "\u03C7", "\\chi", true);
defineSymbol(symbols_math, main, mathord, "\u03C8", "\\psi", true);
defineSymbol(symbols_math, main, mathord, "\u03C9", "\\omega", true);
defineSymbol(symbols_math, main, mathord, "\u03B5", "\\varepsilon", true);
defineSymbol(symbols_math, main, mathord, "\u03D1", "\\vartheta", true);
defineSymbol(symbols_math, main, mathord, "\u03D6", "\\varpi", true);
defineSymbol(symbols_math, main, mathord, "\u03F1", "\\varrho", true);
defineSymbol(symbols_math, main, mathord, "\u03C2", "\\varsigma", true);
defineSymbol(symbols_math, main, mathord, "\u03C6", "\\varphi", true);
defineSymbol(symbols_math, main, bin, "\u2217", "*");
defineSymbol(symbols_math, main, bin, "+", "+");
defineSymbol(symbols_math, main, bin, "\u2212", "-");
defineSymbol(symbols_math, main, bin, "\u22C5", "\\cdot", true);
defineSymbol(symbols_math, main, bin, "\u2218", "\\circ");
defineSymbol(symbols_math, main, bin, "\xF7", "\\div", true);
defineSymbol(symbols_math, main, bin, "\xB1", "\\pm", true);
defineSymbol(symbols_math, main, bin, "\xD7", "\\times", true);
defineSymbol(symbols_math, main, bin, "\u2229", "\\cap", true);
defineSymbol(symbols_math, main, bin, "\u222A", "\\cup", true);
defineSymbol(symbols_math, main, bin, "\u2216", "\\setminus");
defineSymbol(symbols_math, main, bin, "\u2227", "\\land");
defineSymbol(symbols_math, main, bin, "\u2228", "\\lor");
defineSymbol(symbols_math, main, bin, "\u2227", "\\wedge", true);
defineSymbol(symbols_math, main, bin, "\u2228", "\\vee", true);
defineSymbol(symbols_math, main, symbols_textord, "\u221A", "\\surd");
defineSymbol(symbols_math, main, symbols_open, "(", "(");
defineSymbol(symbols_math, main, symbols_open, "[", "[");
defineSymbol(symbols_math, main, symbols_open, "\u27E8", "\\langle", true);
defineSymbol(symbols_math, main, symbols_open, "\u2223", "\\lvert");
defineSymbol(symbols_math, main, symbols_open, "\u2225", "\\lVert");
defineSymbol(symbols_math, main, symbols_close, ")", ")");
defineSymbol(symbols_math, main, symbols_close, "]", "]");
defineSymbol(symbols_math, main, symbols_close, "?", "?");
defineSymbol(symbols_math, main, symbols_close, "!", "!");
defineSymbol(symbols_math, main, symbols_close, "\u27E9", "\\rangle", true);
defineSymbol(symbols_math, main, symbols_close, "\u2223", "\\rvert");
defineSymbol(symbols_math, main, symbols_close, "\u2225", "\\rVert");
defineSymbol(symbols_math, main, rel, "=", "=");
defineSymbol(symbols_math, main, rel, "<", "<");
defineSymbol(symbols_math, main, rel, ">", ">");
defineSymbol(symbols_math, main, rel, ":", ":");
defineSymbol(symbols_math, main, rel, "\u2248", "\\approx", true);
defineSymbol(symbols_math, main, rel, "\u2245", "\\cong", true);
defineSymbol(symbols_math, main, rel, "\u2265", "\\ge");
defineSymbol(symbols_math, main, rel, "\u2265", "\\geq", true);
defineSymbol(symbols_math, main, rel, "\u2190", "\\gets");
defineSymbol(symbols_math, main, rel, ">", "\\gt");
defineSymbol(symbols_math, main, rel, "\u2208", "\\in", true);
defineSymbol(symbols_math, main, rel, "\uE020", "\\@not");
defineSymbol(symbols_math, main, rel, "\u2282", "\\subset", true);
defineSymbol(symbols_math, main, rel, "\u2283", "\\supset", true);
defineSymbol(symbols_math, main, rel, "\u2286", "\\subseteq", true);
defineSymbol(symbols_math, main, rel, "\u2287", "\\supseteq", true);
defineSymbol(symbols_math, ams, rel, "\u2288", "\\nsubseteq", true);
defineSymbol(symbols_math, ams, rel, "\u2289", "\\nsupseteq", true);
defineSymbol(symbols_math, main, rel, "\u22A8", "\\models");
defineSymbol(symbols_math, main, rel, "\u2190", "\\leftarrow", true);
defineSymbol(symbols_math, main, rel, "\u2264", "\\le");
defineSymbol(symbols_math, main, rel, "\u2264", "\\leq", true);
defineSymbol(symbols_math, main, rel, "<", "\\lt");
defineSymbol(symbols_math, main, rel, "\u2192", "\\rightarrow", true);
defineSymbol(symbols_math, main, rel, "\u2192", "\\to");
defineSymbol(symbols_math, ams, rel, "\u2271", "\\ngeq", true);
defineSymbol(symbols_math, ams, rel, "\u2270", "\\nleq", true);
defineSymbol(symbols_math, main, symbols_spacing, "\xA0", "\\ ");
defineSymbol(symbols_math, main, symbols_spacing, "\xA0", "~");
defineSymbol(symbols_math, main, symbols_spacing, "\xA0", "\\space"); // Ref: LaTeX Source 2e: \DeclareRobustCommand{\nobreakspace}{%

defineSymbol(symbols_math, main, symbols_spacing, "\xA0", "\\nobreakspace");
defineSymbol(symbols_text, main, symbols_spacing, "\xA0", "\\ ");
defineSymbol(symbols_text, main, symbols_spacing, "\xA0", "~");
defineSymbol(symbols_text, main, symbols_spacing, "\xA0", "\\space");
defineSymbol(symbols_text, main, symbols_spacing, "\xA0", "\\nobreakspace");
defineSymbol(symbols_math, main, symbols_spacing, null, "\\nobreak");
defineSymbol(symbols_math, main, symbols_spacing, null, "\\allowbreak");
defineSymbol(symbols_math, main, punct, ",", ",");
defineSymbol(symbols_math, main, punct, ";", ";");
defineSymbol(symbols_math, ams, bin, "\u22BC", "\\barwedge", true);
defineSymbol(symbols_math, ams, bin, "\u22BB", "\\veebar", true);
defineSymbol(symbols_math, main, bin, "\u2299", "\\odot", true);
defineSymbol(symbols_math, main, bin, "\u2295", "\\oplus", true);
defineSymbol(symbols_math, main, bin, "\u2297", "\\otimes", true);
defineSymbol(symbols_math, main, symbols_textord, "\u2202", "\\partial", true);
defineSymbol(symbols_math, main, bin, "\u2298", "\\oslash", true);
defineSymbol(symbols_math, ams, bin, "\u229A", "\\circledcirc", true);
defineSymbol(symbols_math, ams, bin, "\u22A1", "\\boxdot", true);
defineSymbol(symbols_math, main, bin, "\u25B3", "\\bigtriangleup");
defineSymbol(symbols_math, main, bin, "\u25BD", "\\bigtriangledown");
defineSymbol(symbols_math, main, bin, "\u2020", "\\dagger");
defineSymbol(symbols_math, main, bin, "\u22C4", "\\diamond");
defineSymbol(symbols_math, main, bin, "\u22C6", "\\star");
defineSymbol(symbols_math, main, bin, "\u25C3", "\\triangleleft");
defineSymbol(symbols_math, main, bin, "\u25B9", "\\triangleright");
defineSymbol(symbols_math, main, symbols_open, "{", "\\{");
defineSymbol(symbols_text, main, symbols_textord, "{", "\\{");
defineSymbol(symbols_text, main, symbols_textord, "{", "\\textbraceleft");
defineSymbol(symbols_math, main, symbols_close, "}", "\\}");
defineSymbol(symbols_text, main, symbols_textord, "}", "\\}");
defineSymbol(symbols_text, main, symbols_textord, "}", "\\textbraceright");
defineSymbol(symbols_math, main, symbols_open, "{", "\\lbrace");
defineSymbol(symbols_math, main, symbols_close, "}", "\\rbrace");
defineSymbol(symbols_math, main, symbols_open, "[", "\\lbrack");
defineSymbol(symbols_text, main, symbols_textord, "[", "\\lbrack");
defineSymbol(symbols_math, main, symbols_close, "]", "\\rbrack");
defineSymbol(symbols_text, main, symbols_textord, "]", "\\rbrack");
defineSymbol(symbols_math, main, symbols_open, "(", "\\lparen");
defineSymbol(symbols_math, main, symbols_close, ")", "\\rparen");
defineSymbol(symbols_text, main, symbols_textord, "<", "\\textless"); // in T1 fontenc

defineSymbol(symbols_text, main, symbols_textord, ">", "\\textgreater"); // in T1 fontenc

defineSymbol(symbols_math, main, symbols_open, "\u230A", "\\lfloor", true);
defineSymbol(symbols_math, main, symbols_close, "\u230B", "\\rfloor", true);
defineSymbol(symbols_math, main, symbols_open, "\u2308", "\\lceil", true);
defineSymbol(symbols_math, main, symbols_close, "\u2309", "\\rceil", true);
defineSymbol(symbols_math, main, symbols_textord, "\\", "\\backslash");
defineSymbol(symbols_math, main, symbols_textord, "\u2223", "|");
defineSymbol(symbols_math, main, symbols_textord, "\u2223", "\\vert");
defineSymbol(symbols_text, main, symbols_textord, "|", "\\textbar"); // in T1 fontenc

defineSymbol(symbols_math, main, symbols_textord, "\u2225", "\\|");
defineSymbol(symbols_math, main, symbols_textord, "\u2225", "\\Vert");
defineSymbol(symbols_text, main, symbols_textord, "\u2225", "\\textbardbl");
defineSymbol(symbols_text, main, symbols_textord, "~", "\\textasciitilde");
defineSymbol(symbols_text, main, symbols_textord, "\\", "\\textbackslash");
defineSymbol(symbols_text, main, symbols_textord, "^", "\\textasciicircum");
defineSymbol(symbols_math, main, rel, "\u2191", "\\uparrow", true);
defineSymbol(symbols_math, main, rel, "\u21D1", "\\Uparrow", true);
defineSymbol(symbols_math, main, rel, "\u2193", "\\downarrow", true);
defineSymbol(symbols_math, main, rel, "\u21D3", "\\Downarrow", true);
defineSymbol(symbols_math, main, rel, "\u2195", "\\updownarrow", true);
defineSymbol(symbols_math, main, rel, "\u21D5", "\\Updownarrow", true);
defineSymbol(symbols_math, main, op, "\u2210", "\\coprod");
defineSymbol(symbols_math, main, op, "\u22C1", "\\bigvee");
defineSymbol(symbols_math, main, op, "\u22C0", "\\bigwedge");
defineSymbol(symbols_math, main, op, "\u2A04", "\\biguplus");
defineSymbol(symbols_math, main, op, "\u22C2", "\\bigcap");
defineSymbol(symbols_math, main, op, "\u22C3", "\\bigcup");
defineSymbol(symbols_math, main, op, "\u222B", "\\int");
defineSymbol(symbols_math, main, op, "\u222B", "\\intop");
defineSymbol(symbols_math, main, op, "\u222C", "\\iint");
defineSymbol(symbols_math, main, op, "\u222D", "\\iiint");
defineSymbol(symbols_math, main, op, "\u220F", "\\prod");
defineSymbol(symbols_math, main, op, "\u2211", "\\sum");
defineSymbol(symbols_math, main, op, "\u2A02", "\\bigotimes");
defineSymbol(symbols_math, main, op, "\u2A01", "\\bigoplus");
defineSymbol(symbols_math, main, op, "\u2A00", "\\bigodot");
defineSymbol(symbols_math, main, op, "\u222E", "\\oint");
defineSymbol(symbols_math, main, op, "\u222F", "\\oiint");
defineSymbol(symbols_math, main, op, "\u2230", "\\oiiint");
defineSymbol(symbols_math, main, op, "\u2A06", "\\bigsqcup");
defineSymbol(symbols_math, main, op, "\u222B", "\\smallint");
defineSymbol(symbols_text, main, symbols_inner, "\u2026", "\\textellipsis");
defineSymbol(symbols_math, main, symbols_inner, "\u2026", "\\mathellipsis");
defineSymbol(symbols_text, main, symbols_inner, "\u2026", "\\ldots", true);
defineSymbol(symbols_math, main, symbols_inner, "\u2026", "\\ldots", true);
defineSymbol(symbols_math, main, symbols_inner, "\u22EF", "\\@cdots", true);
defineSymbol(symbols_math, main, symbols_inner, "\u22F1", "\\ddots", true);
defineSymbol(symbols_math, main, symbols_textord, "\u22EE", "\\varvdots"); // \vdots is a macro

defineSymbol(symbols_math, main, symbols_accent, "\u02CA", "\\acute");
defineSymbol(symbols_math, main, symbols_accent, "\u02CB", "\\grave");
defineSymbol(symbols_math, main, symbols_accent, "\xA8", "\\ddot");
defineSymbol(symbols_math, main, symbols_accent, "~", "\\tilde");
defineSymbol(symbols_math, main, symbols_accent, "\u02C9", "\\bar");
defineSymbol(symbols_math, main, symbols_accent, "\u02D8", "\\breve");
defineSymbol(symbols_math, main, symbols_accent, "\u02C7", "\\check");
defineSymbol(symbols_math, main, symbols_accent, "^", "\\hat");
defineSymbol(symbols_math, main, symbols_accent, "\u20D7", "\\vec");
defineSymbol(symbols_math, main, symbols_accent, "\u02D9", "\\dot");
defineSymbol(symbols_math, main, symbols_accent, "\u02DA", "\\mathring");
defineSymbol(symbols_math, main, mathord, "\u0131", "\\imath", true);
defineSymbol(symbols_math, main, mathord, "\u0237", "\\jmath", true);
defineSymbol(symbols_text, main, symbols_textord, "\u0131", "\\i", true);
defineSymbol(symbols_text, main, symbols_textord, "\u0237", "\\j", true);
defineSymbol(symbols_text, main, symbols_textord, "\xDF", "\\ss", true);
defineSymbol(symbols_text, main, symbols_textord, "\xE6", "\\ae", true);
defineSymbol(symbols_text, main, symbols_textord, "\xE6", "\\ae", true);
defineSymbol(symbols_text, main, symbols_textord, "\u0153", "\\oe", true);
defineSymbol(symbols_text, main, symbols_textord, "\xF8", "\\o", true);
defineSymbol(symbols_text, main, symbols_textord, "\xC6", "\\AE", true);
defineSymbol(symbols_text, main, symbols_textord, "\u0152", "\\OE", true);
defineSymbol(symbols_text, main, symbols_textord, "\xD8", "\\O", true);
defineSymbol(symbols_text, main, symbols_accent, "\u02CA", "\\'"); // acute

defineSymbol(symbols_text, main, symbols_accent, "\u02CB", "\\`"); // grave

defineSymbol(symbols_text, main, symbols_accent, "\u02C6", "\\^"); // circumflex

defineSymbol(symbols_text, main, symbols_accent, "\u02DC", "\\~"); // tilde

defineSymbol(symbols_text, main, symbols_accent, "\u02C9", "\\="); // macron

defineSymbol(symbols_text, main, symbols_accent, "\u02D8", "\\u"); // breve

defineSymbol(symbols_text, main, symbols_accent, "\u02D9", "\\."); // dot above

defineSymbol(symbols_text, main, symbols_accent, "\u02DA", "\\r"); // ring above

defineSymbol(symbols_text, main, symbols_accent, "\u02C7", "\\v"); // caron

defineSymbol(symbols_text, main, symbols_accent, "\xA8", '\\"'); // diaresis

defineSymbol(symbols_text, main, symbols_accent, "\u02DD", "\\H"); // double acute

defineSymbol(symbols_text, main, symbols_accent, "\u25EF", "\\textcircled"); // \bigcirc glyph
// These ligatures are detected and created in Parser.js's `formLigatures`.

var ligatures = {
  "--": true,
  "---": true,
  "``": true,
  "''": true
};
defineSymbol(symbols_text, main, symbols_textord, "\u2013", "--");
defineSymbol(symbols_text, main, symbols_textord, "\u2013", "\\textendash");
defineSymbol(symbols_text, main, symbols_textord, "\u2014", "---");
defineSymbol(symbols_text, main, symbols_textord, "\u2014", "\\textemdash");
defineSymbol(symbols_text, main, symbols_textord, "\u2018", "`");
defineSymbol(symbols_text, main, symbols_textord, "\u2018", "\\textquoteleft");
defineSymbol(symbols_text, main, symbols_textord, "\u2019", "'");
defineSymbol(symbols_text, main, symbols_textord, "\u2019", "\\textquoteright");
defineSymbol(symbols_text, main, symbols_textord, "\u201C", "``");
defineSymbol(symbols_text, main, symbols_textord, "\u201C", "\\textquotedblleft");
defineSymbol(symbols_text, main, symbols_textord, "\u201D", "''");
defineSymbol(symbols_text, main, symbols_textord, "\u201D", "\\textquotedblright"); //  \degree from gensymb package

defineSymbol(symbols_math, main, symbols_textord, "\xB0", "\\degree", true);
defineSymbol(symbols_text, main, symbols_textord, "\xB0", "\\degree"); // \textdegree from inputenc package

defineSymbol(symbols_text, main, symbols_textord, "\xB0", "\\textdegree", true); // TODO: In LaTeX, \pounds can generate a different character in text and math
// mode, but among our fonts, only Main-Italic defines this character "163".

defineSymbol(symbols_math, main, mathord, "\xA3", "\\pounds");
defineSymbol(symbols_math, main, mathord, "\xA3", "\\mathsterling", true);
defineSymbol(symbols_text, main, mathord, "\xA3", "\\pounds");
defineSymbol(symbols_text, main, mathord, "\xA3", "\\textsterling", true);
defineSymbol(symbols_math, ams, symbols_textord, "\u2720", "\\maltese");
defineSymbol(symbols_text, ams, symbols_textord, "\u2720", "\\maltese");
defineSymbol(symbols_text, main, symbols_spacing, "\xA0", "\\ ");
defineSymbol(symbols_text, main, symbols_spacing, "\xA0", " ");
defineSymbol(symbols_text, main, symbols_spacing, "\xA0", "~"); // There are lots of symbols which are the same, so we add them in afterwards.
// All of these are textords in math mode

var mathTextSymbols = "0123456789/@.\"";

for (var symbols_i = 0; symbols_i < mathTextSymbols.length; symbols_i++) {
  var symbols_ch = mathTextSymbols.charAt(symbols_i);
  defineSymbol(symbols_math, main, symbols_textord, symbols_ch, symbols_ch);
} // All of these are textords in text mode


var textSymbols = "0123456789!@*()-=+[]<>|\";:?/.,";

for (var src_symbols_i = 0; src_symbols_i < textSymbols.length; src_symbols_i++) {
  var _ch = textSymbols.charAt(src_symbols_i);

  defineSymbol(symbols_text, main, symbols_textord, _ch, _ch);
} // All of these are textords in text mode, and mathords in math mode


var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

for (var symbols_i2 = 0; symbols_i2 < letters.length; symbols_i2++) {
  var _ch2 = letters.charAt(symbols_i2);

  defineSymbol(symbols_math, main, mathord, _ch2, _ch2);
  defineSymbol(symbols_text, main, symbols_textord, _ch2, _ch2);
} // Blackboard bold and script letters in Unicode range


defineSymbol(symbols_math, ams, symbols_textord, "C", "\u2102"); // blackboard bold

defineSymbol(symbols_text, ams, symbols_textord, "C", "\u2102");
defineSymbol(symbols_math, ams, symbols_textord, "H", "\u210D");
defineSymbol(symbols_text, ams, symbols_textord, "H", "\u210D");
defineSymbol(symbols_math, ams, symbols_textord, "N", "\u2115");
defineSymbol(symbols_text, ams, symbols_textord, "N", "\u2115");
defineSymbol(symbols_math, ams, symbols_textord, "P", "\u2119");
defineSymbol(symbols_text, ams, symbols_textord, "P", "\u2119");
defineSymbol(symbols_math, ams, symbols_textord, "Q", "\u211A");
defineSymbol(symbols_text, ams, symbols_textord, "Q", "\u211A");
defineSymbol(symbols_math, ams, symbols_textord, "R", "\u211D");
defineSymbol(symbols_text, ams, symbols_textord, "R", "\u211D");
defineSymbol(symbols_math, ams, symbols_textord, "Z", "\u2124");
defineSymbol(symbols_text, ams, symbols_textord, "Z", "\u2124");
defineSymbol(symbols_math, main, mathord, "h", "\u210E"); // italic h, Planck constant

defineSymbol(symbols_text, main, mathord, "h", "\u210E"); // The next loop loads wide (surrogate pair) characters.
// We support some letters in the Unicode range U+1D400 to U+1D7FF,
// Mathematical Alphanumeric Symbols.
// Some editors do not deal well with wide characters. So don't write the
// string into this file. Instead, create the string from the surrogate pair.

var symbols_wideChar = "";

for (var symbols_i3 = 0; symbols_i3 < letters.length; symbols_i3++) {
  var _ch3 = letters.charAt(symbols_i3); // The hex numbers in the next line are a surrogate pair.
  // 0xD835 is the high surrogate for all letters in the range we support.
  // 0xDC00 is the low surrogate for bold A.


  symbols_wideChar = String.fromCharCode(0xD835, 0xDC00 + symbols_i3); // A-Z a-z bold

  defineSymbol(symbols_math, main, mathord, _ch3, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch3, symbols_wideChar);
  symbols_wideChar = String.fromCharCode(0xD835, 0xDC34 + symbols_i3); // A-Z a-z italic

  defineSymbol(symbols_math, main, mathord, _ch3, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch3, symbols_wideChar);
  symbols_wideChar = String.fromCharCode(0xD835, 0xDC68 + symbols_i3); // A-Z a-z bold italic

  defineSymbol(symbols_math, main, mathord, _ch3, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch3, symbols_wideChar);
  symbols_wideChar = String.fromCharCode(0xD835, 0xDD04 + symbols_i3); // A-Z a-z Fractur

  defineSymbol(symbols_math, main, mathord, _ch3, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch3, symbols_wideChar);
  symbols_wideChar = String.fromCharCode(0xD835, 0xDDA0 + symbols_i3); // A-Z a-z sans-serif

  defineSymbol(symbols_math, main, mathord, _ch3, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch3, symbols_wideChar);
  symbols_wideChar = String.fromCharCode(0xD835, 0xDDD4 + symbols_i3); // A-Z a-z sans bold

  defineSymbol(symbols_math, main, mathord, _ch3, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch3, symbols_wideChar);
  symbols_wideChar = String.fromCharCode(0xD835, 0xDE08 + symbols_i3); // A-Z a-z sans italic

  defineSymbol(symbols_math, main, mathord, _ch3, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch3, symbols_wideChar);
  symbols_wideChar = String.fromCharCode(0xD835, 0xDE70 + symbols_i3); // A-Z a-z monospace

  defineSymbol(symbols_math, main, mathord, _ch3, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch3, symbols_wideChar);

  if (symbols_i3 < 26) {
    // KaTeX fonts have only capital letters for blackboard bold and script.
    // See exception for k below.
    symbols_wideChar = String.fromCharCode(0xD835, 0xDD38 + symbols_i3); // A-Z double struck

    defineSymbol(symbols_math, main, mathord, _ch3, symbols_wideChar);
    defineSymbol(symbols_text, main, symbols_textord, _ch3, symbols_wideChar);
    symbols_wideChar = String.fromCharCode(0xD835, 0xDC9C + symbols_i3); // A-Z script

    defineSymbol(symbols_math, main, mathord, _ch3, symbols_wideChar);
    defineSymbol(symbols_text, main, symbols_textord, _ch3, symbols_wideChar);
  } // TODO: Add bold script when it is supported by a KaTeX font.

} // "k" is the only double struck lower case letter in the KaTeX fonts.


symbols_wideChar = String.fromCharCode(0xD835, 0xDD5C); // k double struck

defineSymbol(symbols_math, main, mathord, "k", symbols_wideChar);
defineSymbol(symbols_text, main, symbols_textord, "k", symbols_wideChar); // Next, some wide character numerals

for (var symbols_i4 = 0; symbols_i4 < 10; symbols_i4++) {
  var _ch4 = symbols_i4.toString();

  symbols_wideChar = String.fromCharCode(0xD835, 0xDFCE + symbols_i4); // 0-9 bold

  defineSymbol(symbols_math, main, mathord, _ch4, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch4, symbols_wideChar);
  symbols_wideChar = String.fromCharCode(0xD835, 0xDFE2 + symbols_i4); // 0-9 sans serif

  defineSymbol(symbols_math, main, mathord, _ch4, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch4, symbols_wideChar);
  symbols_wideChar = String.fromCharCode(0xD835, 0xDFEC + symbols_i4); // 0-9 bold sans

  defineSymbol(symbols_math, main, mathord, _ch4, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch4, symbols_wideChar);
  symbols_wideChar = String.fromCharCode(0xD835, 0xDFF6 + symbols_i4); // 0-9 monospace

  defineSymbol(symbols_math, main, mathord, _ch4, symbols_wideChar);
  defineSymbol(symbols_text, main, symbols_textord, _ch4, symbols_wideChar);
} // We add these Latin-1 letters as symbols for backwards-compatibility,
// but they are not actually in the font, nor are they supported by the
// Unicode accent mechanism, so they fall back to Times font and look ugly.
// TODO(edemaine): Fix this.


var extraLatin = "ÇÐÞçþ";

for (var _i5 = 0; _i5 < extraLatin.length; _i5++) {
  var _ch5 = extraLatin.charAt(_i5);

  defineSymbol(symbols_math, main, mathord, _ch5, _ch5);
  defineSymbol(symbols_text, main, symbols_textord, _ch5, _ch5);
}

defineSymbol(symbols_text, main, symbols_textord, "ð", "ð"); // Unicode versions of existing characters

defineSymbol(symbols_text, main, symbols_textord, "\u2013", "–");
defineSymbol(symbols_text, main, symbols_textord, "\u2014", "—");
defineSymbol(symbols_text, main, symbols_textord, "\u2018", "‘");
defineSymbol(symbols_text, main, symbols_textord, "\u2019", "’");
defineSymbol(symbols_text, main, symbols_textord, "\u201C", "“");
defineSymbol(symbols_text, main, symbols_textord, "\u201D", "”");
// CONCATENATED MODULE: ./src/wide-character.js
/**
 * This file provides support for Unicode range U+1D400 to U+1D7FF,
 * Mathematical Alphanumeric Symbols.
 *
 * Function wideCharacterFont takes a wide character as input and returns
 * the font information necessary to render it properly.
 */

/**
 * Data below is from https://www.unicode.org/charts/PDF/U1D400.pdf
 * That document sorts characters into groups by font type, say bold or italic.
 *
 * In the arrays below, each subarray consists three elements:
 *      * The CSS class of that group when in math mode.
 *      * The CSS class of that group when in text mode.
 *      * The font name, so that KaTeX can get font metrics.
 */

var wideLatinLetterData = [["mathbf", "textbf", "Main-Bold"], // A-Z bold upright
["mathbf", "textbf", "Main-Bold"], // a-z bold upright
["mathdefault", "textit", "Math-Italic"], // A-Z italic
["mathdefault", "textit", "Math-Italic"], // a-z italic
["boldsymbol", "boldsymbol", "Main-BoldItalic"], // A-Z bold italic
["boldsymbol", "boldsymbol", "Main-BoldItalic"], // a-z bold italic
// Map fancy A-Z letters to script, not calligraphic.
// This aligns with unicode-math and math fonts (except Cambria Math).
["mathscr", "textscr", "Script-Regular"], // A-Z script
["", "", ""], // a-z script.  No font
["", "", ""], // A-Z bold script. No font
["", "", ""], // a-z bold script. No font
["mathfrak", "textfrak", "Fraktur-Regular"], // A-Z Fraktur
["mathfrak", "textfrak", "Fraktur-Regular"], // a-z Fraktur
["mathbb", "textbb", "AMS-Regular"], // A-Z double-struck
["mathbb", "textbb", "AMS-Regular"], // k double-struck
["", "", ""], // A-Z bold Fraktur No font metrics
["", "", ""], // a-z bold Fraktur.   No font.
["mathsf", "textsf", "SansSerif-Regular"], // A-Z sans-serif
["mathsf", "textsf", "SansSerif-Regular"], // a-z sans-serif
["mathboldsf", "textboldsf", "SansSerif-Bold"], // A-Z bold sans-serif
["mathboldsf", "textboldsf", "SansSerif-Bold"], // a-z bold sans-serif
["mathitsf", "textitsf", "SansSerif-Italic"], // A-Z italic sans-serif
["mathitsf", "textitsf", "SansSerif-Italic"], // a-z italic sans-serif
["", "", ""], // A-Z bold italic sans. No font
["", "", ""], // a-z bold italic sans. No font
["mathtt", "texttt", "Typewriter-Regular"], // A-Z monospace
["mathtt", "texttt", "Typewriter-Regular"]];
var wideNumeralData = [["mathbf", "textbf", "Main-Bold"], // 0-9 bold
["", "", ""], // 0-9 double-struck. No KaTeX font.
["mathsf", "textsf", "SansSerif-Regular"], // 0-9 sans-serif
["mathboldsf", "textboldsf", "SansSerif-Bold"], // 0-9 bold sans-serif
["mathtt", "texttt", "Typewriter-Regular"]];
var wide_character_wideCharacterFont = function wideCharacterFont(wideChar, mode) {
  // IE doesn't support codePointAt(). So work with the surrogate pair.
  var H = wideChar.charCodeAt(0); // high surrogate

  var L = wideChar.charCodeAt(1); // low surrogate

  var codePoint = (H - 0xD800) * 0x400 + (L - 0xDC00) + 0x10000;
  var j = mode === "math" ? 0 : 1; // column index for CSS class.

  if (0x1D400 <= codePoint && codePoint < 0x1D6A4) {
    // wideLatinLetterData contains exactly 26 chars on each row.
    // So we can calculate the relevant row. No traverse necessary.
    var i = Math.floor((codePoint - 0x1D400) / 26);
    return [wideLatinLetterData[i][2], wideLatinLetterData[i][j]];
  } else if (0x1D7CE <= codePoint && codePoint <= 0x1D7FF) {
    // Numerals, ten per row.
    var _i = Math.floor((codePoint - 0x1D7CE) / 10);

    return [wideNumeralData[_i][2], wideNumeralData[_i][j]];
  } else if (codePoint === 0x1D6A5 || codePoint === 0x1D6A6) {
    // dotless i or j
    return [wideLatinLetterData[0][2], wideLatinLetterData[0][j]];
  } else if (0x1D6A6 < codePoint && codePoint < 0x1D7CE) {
    // Greek letters. Not supported, yet.
    return ["", ""];
  } else {
    // We don't support any wide characters outside 1D400–1D7FF.
    throw new src_ParseError("Unsupported character: " + wideChar);
  }
};
// CONCATENATED MODULE: ./src/Options.js
/**
 * This file contains information about the options that the Parser carries
 * around with it while parsing. Data is held in an `Options` object, and when
 * recursing, a new `Options` object can be created with the `.with*` and
 * `.reset` functions.
 */

var sizeStyleMap = [// Each element contains [textsize, scriptsize, scriptscriptsize].
// The size mappings are taken from TeX with \normalsize=10pt.
[1, 1, 1], // size1: [5, 5, 5]              \tiny
[2, 1, 1], // size2: [6, 5, 5]
[3, 1, 1], // size3: [7, 5, 5]              \scriptsize
[4, 2, 1], // size4: [8, 6, 5]              \footnotesize
[5, 2, 1], // size5: [9, 6, 5]              \small
[6, 3, 1], // size6: [10, 7, 5]             \normalsize
[7, 4, 2], // size7: [12, 8, 6]             \large
[8, 6, 3], // size8: [14.4, 10, 7]          \Large
[9, 7, 6], // size9: [17.28, 12, 10]        \LARGE
[10, 8, 7], // size10: [20.74, 14.4, 12]     \huge
[11, 10, 9]];
var sizeMultipliers = [// fontMetrics.js:getGlobalMetrics also uses size indexes, so if
// you change size indexes, change that function.
0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.44, 1.728, 2.074, 2.488];

var sizeAtStyle = function sizeAtStyle(size, style) {
  return style.size < 2 ? size : sizeStyleMap[size - 1][style.size - 1];
}; // In these types, "" (empty string) means "no change".


/**
 * This is the main options class. It contains the current style, size, color,
 * and font.
 *
 * Options objects should not be modified. To create a new Options with
 * different properties, call a `.having*` method.
 */
var Options_Options =
/*#__PURE__*/
function () {
  // A font family applies to a group of fonts (i.e. SansSerif), while a font
  // represents a specific font (i.e. SansSerif Bold).
  // See: https://tex.stackexchange.com/questions/22350/difference-between-textrm-and-mathrm

  /**
   * The base size index.
   */
  function Options(data) {
    this.style = void 0;
    this.color = void 0;
    this.size = void 0;
    this.textSize = void 0;
    this.phantom = void 0;
    this.font = void 0;
    this.fontFamily = void 0;
    this.fontWeight = void 0;
    this.fontShape = void 0;
    this.sizeMultiplier = void 0;
    this.maxSize = void 0;
    this.minRuleThickness = void 0;
    this._fontMetrics = void 0;
    this.style = data.style;
    this.color = data.color;
    this.size = data.size || Options.BASESIZE;
    this.textSize = data.textSize || this.size;
    this.phantom = !!data.phantom;
    this.font = data.font || "";
    this.fontFamily = data.fontFamily || "";
    this.fontWeight = data.fontWeight || '';
    this.fontShape = data.fontShape || '';
    this.sizeMultiplier = sizeMultipliers[this.size - 1];
    this.maxSize = data.maxSize;
    this.minRuleThickness = data.minRuleThickness;
    this._fontMetrics = undefined;
  }
  /**
   * Returns a new options object with the same properties as "this".  Properties
   * from "extension" will be copied to the new options object.
   */


  var _proto = Options.prototype;

  _proto.extend = function extend(extension) {
    var data = {
      style: this.style,
      size: this.size,
      textSize: this.textSize,
      color: this.color,
      phantom: this.phantom,
      font: this.font,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      fontShape: this.fontShape,
      maxSize: this.maxSize,
      minRuleThickness: this.minRuleThickness
    };

    for (var key in extension) {
      if (extension.hasOwnProperty(key)) {
        data[key] = extension[key];
      }
    }

    return new Options(data);
  }
  /**
   * Return an options object with the given style. If `this.style === style`,
   * returns `this`.
   */
  ;

  _proto.havingStyle = function havingStyle(style) {
    if (this.style === style) {
      return this;
    } else {
      return this.extend({
        style: style,
        size: sizeAtStyle(this.textSize, style)
      });
    }
  }
  /**
   * Return an options object with a cramped version of the current style. If
   * the current style is cramped, returns `this`.
   */
  ;

  _proto.havingCrampedStyle = function havingCrampedStyle() {
    return this.havingStyle(this.style.cramp());
  }
  /**
   * Return an options object with the given size and in at least `\textstyle`.
   * Returns `this` if appropriate.
   */
  ;

  _proto.havingSize = function havingSize(size) {
    if (this.size === size && this.textSize === size) {
      return this;
    } else {
      return this.extend({
        style: this.style.text(),
        size: size,
        textSize: size,
        sizeMultiplier: sizeMultipliers[size - 1]
      });
    }
  }
  /**
   * Like `this.havingSize(BASESIZE).havingStyle(style)`. If `style` is omitted,
   * changes to at least `\textstyle`.
   */
  ;

  _proto.havingBaseStyle = function havingBaseStyle(style) {
    style = style || this.style.text();
    var wantSize = sizeAtStyle(Options.BASESIZE, style);

    if (this.size === wantSize && this.textSize === Options.BASESIZE && this.style === style) {
      return this;
    } else {
      return this.extend({
        style: style,
        size: wantSize
      });
    }
  }
  /**
   * Remove the effect of sizing changes such as \Huge.
   * Keep the effect of the current style, such as \scriptstyle.
   */
  ;

  _proto.havingBaseSizing = function havingBaseSizing() {
    var size;

    switch (this.style.id) {
      case 4:
      case 5:
        size = 3; // normalsize in scriptstyle

        break;

      case 6:
      case 7:
        size = 1; // normalsize in scriptscriptstyle

        break;

      default:
        size = 6;
      // normalsize in textstyle or displaystyle
    }

    return this.extend({
      style: this.style.text(),
      size: size
    });
  }
  /**
   * Create a new options object with the given color.
   */
  ;

  _proto.withColor = function withColor(color) {
    return this.extend({
      color: color
    });
  }
  /**
   * Create a new options object with "phantom" set to true.
   */
  ;

  _proto.withPhantom = function withPhantom() {
    return this.extend({
      phantom: true
    });
  }
  /**
   * Creates a new options object with the given math font or old text font.
   * @type {[type]}
   */
  ;

  _proto.withFont = function withFont(font) {
    return this.extend({
      font: font
    });
  }
  /**
   * Create a new options objects with the given fontFamily.
   */
  ;

  _proto.withTextFontFamily = function withTextFontFamily(fontFamily) {
    return this.extend({
      fontFamily: fontFamily,
      font: ""
    });
  }
  /**
   * Creates a new options object with the given font weight
   */
  ;

  _proto.withTextFontWeight = function withTextFontWeight(fontWeight) {
    return this.extend({
      fontWeight: fontWeight,
      font: ""
    });
  }
  /**
   * Creates a new options object with the given font weight
   */
  ;

  _proto.withTextFontShape = function withTextFontShape(fontShape) {
    return this.extend({
      fontShape: fontShape,
      font: ""
    });
  }
  /**
   * Return the CSS sizing classes required to switch from enclosing options
   * `oldOptions` to `this`. Returns an array of classes.
   */
  ;

  _proto.sizingClasses = function sizingClasses(oldOptions) {
    if (oldOptions.size !== this.size) {
      return ["sizing", "reset-size" + oldOptions.size, "size" + this.size];
    } else {
      return [];
    }
  }
  /**
   * Return the CSS sizing classes required to switch to the base size. Like
   * `this.havingSize(BASESIZE).sizingClasses(this)`.
   */
  ;

  _proto.baseSizingClasses = function baseSizingClasses() {
    if (this.size !== Options.BASESIZE) {
      return ["sizing", "reset-size" + this.size, "size" + Options.BASESIZE];
    } else {
      return [];
    }
  }
  /**
   * Return the font metrics for this size.
   */
  ;

  _proto.fontMetrics = function fontMetrics() {
    if (!this._fontMetrics) {
      this._fontMetrics = getGlobalMetrics(this.size);
    }

    return this._fontMetrics;
  }
  /**
   * Gets the CSS color of the current options object
   */
  ;

  _proto.getColor = function getColor() {
    if (this.phantom) {
      return "transparent";
    } else {
      return this.color;
    }
  };

  return Options;
}();

Options_Options.BASESIZE = 6;
/* harmony default export */ var src_Options = (Options_Options);
// CONCATENATED MODULE: ./src/units.js
/**
 * This file does conversion between units.  In particular, it provides
 * calculateSize to convert other units into ems.
 */

 // This table gives the number of TeX pts in one of each *absolute* TeX unit.
// Thus, multiplying a length by this number converts the length from units
// into pts.  Dividing the result by ptPerEm gives the number of ems
// *assuming* a font size of ptPerEm (normal size, normal style).

var ptPerUnit = {
  // https://en.wikibooks.org/wiki/LaTeX/Lengths and
  // https://tex.stackexchange.com/a/8263
  "pt": 1,
  // TeX point
  "mm": 7227 / 2540,
  // millimeter
  "cm": 7227 / 254,
  // centimeter
  "in": 72.27,
  // inch
  "bp": 803 / 800,
  // big (PostScript) points
  "pc": 12,
  // pica
  "dd": 1238 / 1157,
  // didot
  "cc": 14856 / 1157,
  // cicero (12 didot)
  "nd": 685 / 642,
  // new didot
  "nc": 1370 / 107,
  // new cicero (12 new didot)
  "sp": 1 / 65536,
  // scaled point (TeX's internal smallest unit)
  // https://tex.stackexchange.com/a/41371
  "px": 803 / 800 // \pdfpxdimen defaults to 1 bp in pdfTeX and LuaTeX

}; // Dictionary of relative units, for fast validity testing.

var relativeUnit = {
  "ex": true,
  "em": true,
  "mu": true
};

/**
 * Determine whether the specified unit (either a string defining the unit
 * or a "size" parse node containing a unit field) is valid.
 */
var validUnit = function validUnit(unit) {
  if (typeof unit !== "string") {
    unit = unit.unit;
  }

  return unit in ptPerUnit || unit in relativeUnit || unit === "ex";
};
/*
 * Convert a "size" parse node (with numeric "number" and string "unit" fields,
 * as parsed by functions.js argType "size") into a CSS em value for the
 * current style/scale.  `options` gives the current options.
 */

var units_calculateSize = function calculateSize(sizeValue, options) {
  var scale;

  if (sizeValue.unit in ptPerUnit) {
    // Absolute units
    scale = ptPerUnit[sizeValue.unit] // Convert unit to pt
    / options.fontMetrics().ptPerEm // Convert pt to CSS em
    / options.sizeMultiplier; // Unscale to make absolute units
  } else if (sizeValue.unit === "mu") {
    // `mu` units scale with scriptstyle/scriptscriptstyle.
    scale = options.fontMetrics().cssEmPerMu;
  } else {
    // Other relative units always refer to the *textstyle* font
    // in the current size.
    var unitOptions;

    if (options.style.isTight()) {
      // isTight() means current style is script/scriptscript.
      unitOptions = options.havingStyle(options.style.text());
    } else {
      unitOptions = options;
    } // TODO: In TeX these units are relative to the quad of the current
    // *text* font, e.g. cmr10. KaTeX instead uses values from the
    // comparably-sized *Computer Modern symbol* font. At 10pt, these
    // match. At 7pt and 5pt, they differ: cmr7=1.138894, cmsy7=1.170641;
    // cmr5=1.361133, cmsy5=1.472241. Consider $\scriptsize a\kern1emb$.
    // TeX \showlists shows a kern of 1.13889 * fontsize;
    // KaTeX shows a kern of 1.171 * fontsize.


    if (sizeValue.unit === "ex") {
      scale = unitOptions.fontMetrics().xHeight;
    } else if (sizeValue.unit === "em") {
      scale = unitOptions.fontMetrics().quad;
    } else {
      throw new src_ParseError("Invalid unit: '" + sizeValue.unit + "'");
    }

    if (unitOptions !== options) {
      scale *= unitOptions.sizeMultiplier / options.sizeMultiplier;
    }
  }

  return Math.min(sizeValue.number * scale, options.maxSize);
};
// CONCATENATED MODULE: ./src/buildCommon.js
/* eslint no-console:0 */

/**
 * This module contains general functions that can be used for building
 * different kinds of domTree nodes in a consistent manner.
 */







// The following have to be loaded from Main-Italic font, using class mathit
var mathitLetters = ["\\imath", "ı", // dotless i
"\\jmath", "ȷ", // dotless j
"\\pounds", "\\mathsterling", "\\textsterling", "£"];
/**
 * Looks up the given symbol in fontMetrics, after applying any symbol
 * replacements defined in symbol.js
 */

var buildCommon_lookupSymbol = function lookupSymbol(value, // TODO(#963): Use a union type for this.
fontName, mode) {
  // Replace the value with its replaced value from symbol.js
  if (src_symbols[mode][value] && src_symbols[mode][value].replace) {
    value = src_symbols[mode][value].replace;
  }

  return {
    value: value,
    metrics: getCharacterMetrics(value, fontName, mode)
  };
};
/**
 * Makes a symbolNode after translation via the list of symbols in symbols.js.
 * Correctly pulls out metrics for the character, and optionally takes a list of
 * classes to be attached to the node.
 *
 * TODO: make argument order closer to makeSpan
 * TODO: add a separate argument for math class (e.g. `mop`, `mbin`), which
 * should if present come first in `classes`.
 * TODO(#953): Make `options` mandatory and always pass it in.
 */


var buildCommon_makeSymbol = function makeSymbol(value, fontName, mode, options, classes) {
  var lookup = buildCommon_lookupSymbol(value, fontName, mode);
  var metrics = lookup.metrics;
  value = lookup.value;
  var symbolNode;

  if (metrics) {
    var italic = metrics.italic;

    if (mode === "text" || options && options.font === "mathit") {
      italic = 0;
    }

    symbolNode = new domTree_SymbolNode(value, metrics.height, metrics.depth, italic, metrics.skew, metrics.width, classes);
  } else {
    // TODO(emily): Figure out a good way to only print this in development
    typeof console !== "undefined" && console.warn("No character metrics " + ("for '" + value + "' in style '" + fontName + "' and mode '" + mode + "'"));
    symbolNode = new domTree_SymbolNode(value, 0, 0, 0, 0, 0, classes);
  }

  if (options) {
    symbolNode.maxFontSize = options.sizeMultiplier;

    if (options.style.isTight()) {
      symbolNode.classes.push("mtight");
    }

    var color = options.getColor();

    if (color) {
      symbolNode.style.color = color;
    }
  }

  return symbolNode;
};
/**
 * Makes a symbol in Main-Regular or AMS-Regular.
 * Used for rel, bin, open, close, inner, and punct.
 */


var buildCommon_mathsym = function mathsym(value, mode, options, classes) {
  if (classes === void 0) {
    classes = [];
  }

  // Decide what font to render the symbol in by its entry in the symbols
  // table.
  // Have a special case for when the value = \ because the \ is used as a
  // textord in unsupported command errors but cannot be parsed as a regular
  // text ordinal and is therefore not present as a symbol in the symbols
  // table for text, as well as a special case for boldsymbol because it
  // can be used for bold + and -
  if (options.font === "boldsymbol" && buildCommon_lookupSymbol(value, "Main-Bold", mode).metrics) {
    return buildCommon_makeSymbol(value, "Main-Bold", mode, options, classes.concat(["mathbf"]));
  } else if (value === "\\" || src_symbols[mode][value].font === "main") {
    return buildCommon_makeSymbol(value, "Main-Regular", mode, options, classes);
  } else {
    return buildCommon_makeSymbol(value, "AMS-Regular", mode, options, classes.concat(["amsrm"]));
  }
};
/**
 * Determines which of the two font names (Main-Italic and Math-Italic) and
 * corresponding style tags (maindefault or mathit) to use for default math font,
 * depending on the symbol.
 */


var buildCommon_mathdefault = function mathdefault(value, mode, options, classes) {
  if (/[0-9]/.test(value.charAt(0)) || // glyphs for \imath and \jmath do not exist in Math-Italic so we
  // need to use Main-Italic instead
  utils.contains(mathitLetters, value)) {
    return {
      fontName: "Main-Italic",
      fontClass: "mathit"
    };
  } else {
    return {
      fontName: "Math-Italic",
      fontClass: "mathdefault"
    };
  }
};
/**
 * Determines which of the font names (Main-Italic, Math-Italic, and Caligraphic)
 * and corresponding style tags (mathit, mathdefault, or mathcal) to use for font
 * "mathnormal", depending on the symbol.  Use this function instead of fontMap for
 * font "mathnormal".
 */


var buildCommon_mathnormal = function mathnormal(value, mode, options, classes) {
  if (utils.contains(mathitLetters, value)) {
    return {
      fontName: "Main-Italic",
      fontClass: "mathit"
    };
  } else if (/[0-9]/.test(value.charAt(0))) {
    return {
      fontName: "Caligraphic-Regular",
      fontClass: "mathcal"
    };
  } else {
    return {
      fontName: "Math-Italic",
      fontClass: "mathdefault"
    };
  }
};
/**
 * Determines which of the two font names (Main-Bold and Math-BoldItalic) and
 * corresponding style tags (mathbf or boldsymbol) to use for font "boldsymbol",
 * depending on the symbol.  Use this function instead of fontMap for font
 * "boldsymbol".
 */


var boldsymbol = function boldsymbol(value, mode, options, classes) {
  if (buildCommon_lookupSymbol(value, "Math-BoldItalic", mode).metrics) {
    return {
      fontName: "Math-BoldItalic",
      fontClass: "boldsymbol"
    };
  } else {
    // Some glyphs do not exist in Math-BoldItalic so we need to use
    // Main-Bold instead.
    return {
      fontName: "Main-Bold",
      fontClass: "mathbf"
    };
  }
};
/**
 * Makes either a mathord or textord in the correct font and color.
 */


var buildCommon_makeOrd = function makeOrd(group, options, type) {
  var mode = group.mode;
  var text = group.text;
  var classes = ["mord"]; // Math mode or Old font (i.e. \rm)

  var isFont = mode === "math" || mode === "text" && options.font;
  var fontOrFamily = isFont ? options.font : options.fontFamily;

  if (text.charCodeAt(0) === 0xD835) {
    // surrogate pairs get special treatment
    var _wideCharacterFont = wide_character_wideCharacterFont(text, mode),
        wideFontName = _wideCharacterFont[0],
        wideFontClass = _wideCharacterFont[1];

    return buildCommon_makeSymbol(text, wideFontName, mode, options, classes.concat(wideFontClass));
  } else if (fontOrFamily) {
    var fontName;
    var fontClasses;

    if (fontOrFamily === "boldsymbol" || fontOrFamily === "mathnormal") {
      var fontData = fontOrFamily === "boldsymbol" ? boldsymbol(text, mode, options, classes) : buildCommon_mathnormal(text, mode, options, classes);
      fontName = fontData.fontName;
      fontClasses = [fontData.fontClass];
    } else if (utils.contains(mathitLetters, text)) {
      fontName = "Main-Italic";
      fontClasses = ["mathit"];
    } else if (isFont) {
      fontName = fontMap[fontOrFamily].fontName;
      fontClasses = [fontOrFamily];
    } else {
      fontName = retrieveTextFontName(fontOrFamily, options.fontWeight, options.fontShape);
      fontClasses = [fontOrFamily, options.fontWeight, options.fontShape];
    }

    if (buildCommon_lookupSymbol(text, fontName, mode).metrics) {
      return buildCommon_makeSymbol(text, fontName, mode, options, classes.concat(fontClasses));
    } else if (ligatures.hasOwnProperty(text) && fontName.substr(0, 10) === "Typewriter") {
      // Deconstruct ligatures in monospace fonts (\texttt, \tt).
      var parts = [];

      for (var i = 0; i < text.length; i++) {
        parts.push(buildCommon_makeSymbol(text[i], fontName, mode, options, classes.concat(fontClasses)));
      }

      return buildCommon_makeFragment(parts);
    }
  } // Makes a symbol in the default font for mathords and textords.


  if (type === "mathord") {
    var fontLookup = buildCommon_mathdefault(text, mode, options, classes);
    return buildCommon_makeSymbol(text, fontLookup.fontName, mode, options, classes.concat([fontLookup.fontClass]));
  } else if (type === "textord") {
    var font = src_symbols[mode][text] && src_symbols[mode][text].font;

    if (font === "ams") {
      var _fontName = retrieveTextFontName("amsrm", options.fontWeight, options.fontShape);

      return buildCommon_makeSymbol(text, _fontName, mode, options, classes.concat("amsrm", options.fontWeight, options.fontShape));
    } else if (font === "main" || !font) {
      var _fontName2 = retrieveTextFontName("textrm", options.fontWeight, options.fontShape);

      return buildCommon_makeSymbol(text, _fontName2, mode, options, classes.concat(options.fontWeight, options.fontShape));
    } else {
      // fonts added by plugins
      var _fontName3 = retrieveTextFontName(font, options.fontWeight, options.fontShape); // We add font name as a css class


      return buildCommon_makeSymbol(text, _fontName3, mode, options, classes.concat(_fontName3, options.fontWeight, options.fontShape));
    }
  } else {
    throw new Error("unexpected type: " + type + " in makeOrd");
  }
};
/**
 * Returns true if subsequent symbolNodes have the same classes, skew, maxFont,
 * and styles.
 */


var buildCommon_canCombine = function canCombine(prev, next) {
  if (createClass(prev.classes) !== createClass(next.classes) || prev.skew !== next.skew || prev.maxFontSize !== next.maxFontSize) {
    return false;
  }

  for (var style in prev.style) {
    if (prev.style.hasOwnProperty(style) && prev.style[style] !== next.style[style]) {
      return false;
    }
  }

  for (var _style in next.style) {
    if (next.style.hasOwnProperty(_style) && prev.style[_style] !== next.style[_style]) {
      return false;
    }
  }

  return true;
};
/**
 * Combine consequetive domTree.symbolNodes into a single symbolNode.
 * Note: this function mutates the argument.
 */


var buildCommon_tryCombineChars = function tryCombineChars(chars) {
  for (var i = 0; i < chars.length - 1; i++) {
    var prev = chars[i];
    var next = chars[i + 1];

    if (prev instanceof domTree_SymbolNode && next instanceof domTree_SymbolNode && buildCommon_canCombine(prev, next)) {
      prev.text += next.text;
      prev.height = Math.max(prev.height, next.height);
      prev.depth = Math.max(prev.depth, next.depth); // Use the last character's italic correction since we use
      // it to add padding to the right of the span created from
      // the combined characters.

      prev.italic = next.italic;
      chars.splice(i + 1, 1);
      i--;
    }
  }

  return chars;
};
/**
 * Calculate the height, depth, and maxFontSize of an element based on its
 * children.
 */


var sizeElementFromChildren = function sizeElementFromChildren(elem) {
  var height = 0;
  var depth = 0;
  var maxFontSize = 0;

  for (var i = 0; i < elem.children.length; i++) {
    var child = elem.children[i];

    if (child.height > height) {
      height = child.height;
    }

    if (child.depth > depth) {
      depth = child.depth;
    }

    if (child.maxFontSize > maxFontSize) {
      maxFontSize = child.maxFontSize;
    }
  }

  elem.height = height;
  elem.depth = depth;
  elem.maxFontSize = maxFontSize;
};
/**
 * Makes a span with the given list of classes, list of children, and options.
 *
 * TODO(#953): Ensure that `options` is always provided (currently some call
 * sites don't pass it) and make the type below mandatory.
 * TODO: add a separate argument for math class (e.g. `mop`, `mbin`), which
 * should if present come first in `classes`.
 */


var buildCommon_makeSpan = function makeSpan(classes, children, options, style) {
  var span = new domTree_Span(classes, children, options, style);
  sizeElementFromChildren(span);
  return span;
}; // SVG one is simpler -- doesn't require height, depth, max-font setting.
// This is also a separate method for typesafety.


var buildCommon_makeSvgSpan = function makeSvgSpan(classes, children, options, style) {
  return new domTree_Span(classes, children, options, style);
};

var makeLineSpan = function makeLineSpan(className, options, thickness) {
  var line = buildCommon_makeSpan([className], [], options);
  line.height = Math.max(thickness || options.fontMetrics().defaultRuleThickness, options.minRuleThickness);
  line.style.borderBottomWidth = line.height + "em";
  line.maxFontSize = 1.0;
  return line;
};
/**
 * Makes an anchor with the given href, list of classes, list of children,
 * and options.
 */


var buildCommon_makeAnchor = function makeAnchor(href, classes, children, options) {
  var anchor = new domTree_Anchor(href, classes, children, options);
  sizeElementFromChildren(anchor);
  return anchor;
};
/**
 * Makes a document fragment with the given list of children.
 */


var buildCommon_makeFragment = function makeFragment(children) {
  var fragment = new tree_DocumentFragment(children);
  sizeElementFromChildren(fragment);
  return fragment;
};
/**
 * Wraps group in a span if it's a document fragment, allowing to apply classes
 * and styles
 */


var buildCommon_wrapFragment = function wrapFragment(group, options) {
  if (group instanceof tree_DocumentFragment) {
    return buildCommon_makeSpan([], [group], options);
  }

  return group;
}; // These are exact object types to catch typos in the names of the optional fields.


// Computes the updated `children` list and the overall depth.
//
// This helper function for makeVList makes it easier to enforce type safety by
// allowing early exits (returns) in the logic.
var getVListChildrenAndDepth = function getVListChildrenAndDepth(params) {
  if (params.positionType === "individualShift") {
    var oldChildren = params.children;
    var children = [oldChildren[0]]; // Add in kerns to the list of params.children to get each element to be
    // shifted to the correct specified shift

    var _depth = -oldChildren[0].shift - oldChildren[0].elem.depth;

    var currPos = _depth;

    for (var i = 1; i < oldChildren.length; i++) {
      var diff = -oldChildren[i].shift - currPos - oldChildren[i].elem.depth;
      var size = diff - (oldChildren[i - 1].elem.height + oldChildren[i - 1].elem.depth);
      currPos = currPos + diff;
      children.push({
        type: "kern",
        size: size
      });
      children.push(oldChildren[i]);
    }

    return {
      children: children,
      depth: _depth
    };
  }

  var depth;

  if (params.positionType === "top") {
    // We always start at the bottom, so calculate the bottom by adding up
    // all the sizes
    var bottom = params.positionData;

    for (var _i = 0; _i < params.children.length; _i++) {
      var child = params.children[_i];
      bottom -= child.type === "kern" ? child.size : child.elem.height + child.elem.depth;
    }

    depth = bottom;
  } else if (params.positionType === "bottom") {
    depth = -params.positionData;
  } else {
    var firstChild = params.children[0];

    if (firstChild.type !== "elem") {
      throw new Error('First child must have type "elem".');
    }

    if (params.positionType === "shift") {
      depth = -firstChild.elem.depth - params.positionData;
    } else if (params.positionType === "firstBaseline") {
      depth = -firstChild.elem.depth;
    } else {
      throw new Error("Invalid positionType " + params.positionType + ".");
    }
  }

  return {
    children: params.children,
    depth: depth
  };
};
/**
 * Makes a vertical list by stacking elements and kerns on top of each other.
 * Allows for many different ways of specifying the positioning method.
 *
 * See VListParam documentation above.
 */


var buildCommon_makeVList = function makeVList(params, options) {
  var _getVListChildrenAndD = getVListChildrenAndDepth(params),
      children = _getVListChildrenAndD.children,
      depth = _getVListChildrenAndD.depth; // Create a strut that is taller than any list item. The strut is added to
  // each item, where it will determine the item's baseline. Since it has
  // `overflow:hidden`, the strut's top edge will sit on the item's line box's
  // top edge and the strut's bottom edge will sit on the item's baseline,
  // with no additional line-height spacing. This allows the item baseline to
  // be positioned precisely without worrying about font ascent and
  // line-height.


  var pstrutSize = 0;

  for (var i = 0; i < children.length; i++) {
    var child = children[i];

    if (child.type === "elem") {
      var elem = child.elem;
      pstrutSize = Math.max(pstrutSize, elem.maxFontSize, elem.height);
    }
  }

  pstrutSize += 2;
  var pstrut = buildCommon_makeSpan(["pstrut"], []);
  pstrut.style.height = pstrutSize + "em"; // Create a new list of actual children at the correct offsets

  var realChildren = [];
  var minPos = depth;
  var maxPos = depth;
  var currPos = depth;

  for (var _i2 = 0; _i2 < children.length; _i2++) {
    var _child = children[_i2];

    if (_child.type === "kern") {
      currPos += _child.size;
    } else {
      var _elem = _child.elem;
      var classes = _child.wrapperClasses || [];
      var style = _child.wrapperStyle || {};
      var childWrap = buildCommon_makeSpan(classes, [pstrut, _elem], undefined, style);
      childWrap.style.top = -pstrutSize - currPos - _elem.depth + "em";

      if (_child.marginLeft) {
        childWrap.style.marginLeft = _child.marginLeft;
      }

      if (_child.marginRight) {
        childWrap.style.marginRight = _child.marginRight;
      }

      realChildren.push(childWrap);
      currPos += _elem.height + _elem.depth;
    }

    minPos = Math.min(minPos, currPos);
    maxPos = Math.max(maxPos, currPos);
  } // The vlist contents go in a table-cell with `vertical-align:bottom`.
  // This cell's bottom edge will determine the containing table's baseline
  // without overly expanding the containing line-box.


  var vlist = buildCommon_makeSpan(["vlist"], realChildren);
  vlist.style.height = maxPos + "em"; // A second row is used if necessary to represent the vlist's depth.

  var rows;

  if (minPos < 0) {
    // We will define depth in an empty span with display: table-cell.
    // It should render with the height that we define. But Chrome, in
    // contenteditable mode only, treats that span as if it contains some
    // text content. And that min-height over-rides our desired height.
    // So we put another empty span inside the depth strut span.
    var emptySpan = buildCommon_makeSpan([], []);
    var depthStrut = buildCommon_makeSpan(["vlist"], [emptySpan]);
    depthStrut.style.height = -minPos + "em"; // Safari wants the first row to have inline content; otherwise it
    // puts the bottom of the *second* row on the baseline.

    var topStrut = buildCommon_makeSpan(["vlist-s"], [new domTree_SymbolNode("\u200B")]);
    rows = [buildCommon_makeSpan(["vlist-r"], [vlist, topStrut]), buildCommon_makeSpan(["vlist-r"], [depthStrut])];
  } else {
    rows = [buildCommon_makeSpan(["vlist-r"], [vlist])];
  }

  var vtable = buildCommon_makeSpan(["vlist-t"], rows);

  if (rows.length === 2) {
    vtable.classes.push("vlist-t2");
  }

  vtable.height = maxPos;
  vtable.depth = -minPos;
  return vtable;
}; // Glue is a concept from TeX which is a flexible space between elements in
// either a vertical or horizontal list. In KaTeX, at least for now, it's
// static space between elements in a horizontal layout.


var buildCommon_makeGlue = function makeGlue(measurement, options) {
  // Make an empty span for the space
  var rule = buildCommon_makeSpan(["mspace"], [], options);
  var size = units_calculateSize(measurement, options);
  rule.style.marginRight = size + "em";
  return rule;
}; // Takes font options, and returns the appropriate fontLookup name


var retrieveTextFontName = function retrieveTextFontName(fontFamily, fontWeight, fontShape) {
  var baseFontName = "";

  switch (fontFamily) {
    case "amsrm":
      baseFontName = "AMS";
      break;

    case "textrm":
      baseFontName = "Main";
      break;

    case "textsf":
      baseFontName = "SansSerif";
      break;

    case "texttt":
      baseFontName = "Typewriter";
      break;

    default:
      baseFontName = fontFamily;
    // use fonts added by a plugin
  }

  var fontStylesName;

  if (fontWeight === "textbf" && fontShape === "textit") {
    fontStylesName = "BoldItalic";
  } else if (fontWeight === "textbf") {
    fontStylesName = "Bold";
  } else if (fontWeight === "textit") {
    fontStylesName = "Italic";
  } else {
    fontStylesName = "Regular";
  }

  return baseFontName + "-" + fontStylesName;
};
/**
 * Maps TeX font commands to objects containing:
 * - variant: string used for "mathvariant" attribute in buildMathML.js
 * - fontName: the "style" parameter to fontMetrics.getCharacterMetrics
 */
// A map between tex font commands an MathML mathvariant attribute values


var fontMap = {
  // styles
  "mathbf": {
    variant: "bold",
    fontName: "Main-Bold"
  },
  "mathrm": {
    variant: "normal",
    fontName: "Main-Regular"
  },
  "textit": {
    variant: "italic",
    fontName: "Main-Italic"
  },
  "mathit": {
    variant: "italic",
    fontName: "Main-Italic"
  },
  // Default math font, "mathnormal" and "boldsymbol" are missing because they
  // require the use of several fonts: Main-Italic and Math-Italic for default
  // math font, Main-Italic, Math-Italic, Caligraphic for "mathnormal", and
  // Math-BoldItalic and Main-Bold for "boldsymbol".  This is handled by a
  // special case in makeOrd which ends up calling mathdefault, mathnormal,
  // and boldsymbol.
  // families
  "mathbb": {
    variant: "double-struck",
    fontName: "AMS-Regular"
  },
  "mathcal": {
    variant: "script",
    fontName: "Caligraphic-Regular"
  },
  "mathfrak": {
    variant: "fraktur",
    fontName: "Fraktur-Regular"
  },
  "mathscr": {
    variant: "script",
    fontName: "Script-Regular"
  },
  "mathsf": {
    variant: "sans-serif",
    fontName: "SansSerif-Regular"
  },
  "mathtt": {
    variant: "monospace",
    fontName: "Typewriter-Regular"
  }
};
var svgData = {
  //   path, width, height
  vec: ["vec", 0.471, 0.714],
  // values from the font glyph
  oiintSize1: ["oiintSize1", 0.957, 0.499],
  // oval to overlay the integrand
  oiintSize2: ["oiintSize2", 1.472, 0.659],
  oiiintSize1: ["oiiintSize1", 1.304, 0.499],
  oiiintSize2: ["oiiintSize2", 1.98, 0.659]
};

var buildCommon_staticSvg = function staticSvg(value, options) {
  // Create a span with inline SVG for the element.
  var _svgData$value = svgData[value],
      pathName = _svgData$value[0],
      width = _svgData$value[1],
      height = _svgData$value[2];
  var path = new domTree_PathNode(pathName);
  var svgNode = new SvgNode([path], {
    "width": width + "em",
    "height": height + "em",
    // Override CSS rule `.katex svg { width: 100% }`
    "style": "width:" + width + "em",
    "viewBox": "0 0 " + 1000 * width + " " + 1000 * height,
    "preserveAspectRatio": "xMinYMin"
  });
  var span = buildCommon_makeSvgSpan(["overlay"], [svgNode], options);
  span.height = height;
  span.style.height = height + "em";
  span.style.width = width + "em";
  return span;
};

/* harmony default export */ var buildCommon = ({
  fontMap: fontMap,
  makeSymbol: buildCommon_makeSymbol,
  mathsym: buildCommon_mathsym,
  makeSpan: buildCommon_makeSpan,
  makeSvgSpan: buildCommon_makeSvgSpan,
  makeLineSpan: makeLineSpan,
  makeAnchor: buildCommon_makeAnchor,
  makeFragment: buildCommon_makeFragment,
  wrapFragment: buildCommon_wrapFragment,
  makeVList: buildCommon_makeVList,
  makeOrd: buildCommon_makeOrd,
  makeGlue: buildCommon_makeGlue,
  staticSvg: buildCommon_staticSvg,
  svgData: svgData,
  tryCombineChars: buildCommon_tryCombineChars
});
// CONCATENATED MODULE: ./src/parseNode.js


/**
 * Asserts that the node is of the given type and returns it with stricter
 * typing. Throws if the node's type does not match.
 */
function assertNodeType(node, type) {
  var typedNode = checkNodeType(node, type);

  if (!typedNode) {
    throw new Error("Expected node of type " + type + ", but got " + (node ? "node of type " + node.type : String(node)));
  } // $FlowFixMe: Unsure why.


  return typedNode;
}
/**
 * Returns the node more strictly typed iff it is of the given type. Otherwise,
 * returns null.
 */

function checkNodeType(node, type) {
  if (node && node.type === type) {
    // The definition of ParseNode<TYPE> doesn't communicate to flow that
    // `type: TYPE` (as that's not explicitly mentioned anywhere), though that
    // happens to be true for all our value types.
    // $FlowFixMe
    return node;
  }

  return null;
}
/**
 * Asserts that the node is of the given type and returns it with stricter
 * typing. Throws if the node's type does not match.
 */

function assertAtomFamily(node, family) {
  var typedNode = checkAtomFamily(node, family);

  if (!typedNode) {
    throw new Error("Expected node of type \"atom\" and family \"" + family + "\", but got " + (node ? node.type === "atom" ? "atom of family " + node.family : "node of type " + node.type : String(node)));
  }

  return typedNode;
}
/**
 * Returns the node more strictly typed iff it is of the given type. Otherwise,
 * returns null.
 */

function checkAtomFamily(node, family) {
  return node && node.type === "atom" && node.family === family ? node : null;
}
/**
 * Returns the node more strictly typed iff it is of the given type. Otherwise,
 * returns null.
 */

function assertSymbolNodeType(node) {
  var typedNode = checkSymbolNodeType(node);

  if (!typedNode) {
    throw new Error("Expected node of symbol group type, but got " + (node ? "node of type " + node.type : String(node)));
  }

  return typedNode;
}
/**
 * Returns the node more strictly typed iff it is of the given type. Otherwise,
 * returns null.
 */

function checkSymbolNodeType(node) {
  if (node && (node.type === "atom" || NON_ATOMS.hasOwnProperty(node.type))) {
    // $FlowFixMe
    return node;
  }

  return null;
}
// CONCATENATED MODULE: ./src/spacingData.js
/**
 * Describes spaces between different classes of atoms.
 */
var thinspace = {
  number: 3,
  unit: "mu"
};
var mediumspace = {
  number: 4,
  unit: "mu"
};
var thickspace = {
  number: 5,
  unit: "mu"
}; // Making the type below exact with all optional fields doesn't work due to
// - https://github.com/facebook/flow/issues/4582
// - https://github.com/facebook/flow/issues/5688
// However, since *all* fields are optional, $Shape<> works as suggested in 5688
// above.

// Spacing relationships for display and text styles
var spacings = {
  mord: {
    mop: thinspace,
    mbin: mediumspace,
    mrel: thickspace,
    minner: thinspace
  },
  mop: {
    mord: thinspace,
    mop: thinspace,
    mrel: thickspace,
    minner: thinspace
  },
  mbin: {
    mord: mediumspace,
    mop: mediumspace,
    mopen: mediumspace,
    minner: mediumspace
  },
  mrel: {
    mord: thickspace,
    mop: thickspace,
    mopen: thickspace,
    minner: thickspace
  },
  mopen: {},
  mclose: {
    mop: thinspace,
    mbin: mediumspace,
    mrel: thickspace,
    minner: thinspace
  },
  mpunct: {
    mord: thinspace,
    mop: thinspace,
    mrel: thickspace,
    mopen: thinspace,
    mclose: thinspace,
    mpunct: thinspace,
    minner: thinspace
  },
  minner: {
    mord: thinspace,
    mop: thinspace,
    mbin: mediumspace,
    mrel: thickspace,
    mopen: thinspace,
    mpunct: thinspace,
    minner: thinspace
  }
}; // Spacing relationships for script and scriptscript styles

var tightSpacings = {
  mord: {
    mop: thinspace
  },
  mop: {
    mord: thinspace,
    mop: thinspace
  },
  mbin: {},
  mrel: {},
  mopen: {},
  mclose: {
    mop: thinspace
  },
  mpunct: {},
  minner: {
    mop: thinspace
  }
};
// CONCATENATED MODULE: ./src/defineFunction.js


/**
 * All registered functions.
 * `functions.js` just exports this same dictionary again and makes it public.
 * `Parser.js` requires this dictionary.
 */
var _functions = {};
/**
 * All HTML builders. Should be only used in the `define*` and the `build*ML`
 * functions.
 */

var _htmlGroupBuilders = {};
/**
 * All MathML builders. Should be only used in the `define*` and the `build*ML`
 * functions.
 */

var _mathmlGroupBuilders = {};
function defineFunction(_ref) {
  var type = _ref.type,
      names = _ref.names,
      props = _ref.props,
      handler = _ref.handler,
      htmlBuilder = _ref.htmlBuilder,
      mathmlBuilder = _ref.mathmlBuilder;
  // Set default values of functions
  var data = {
    type: type,
    numArgs: props.numArgs,
    argTypes: props.argTypes,
    greediness: props.greediness === undefined ? 1 : props.greediness,
    allowedInText: !!props.allowedInText,
    allowedInMath: props.allowedInMath === undefined ? true : props.allowedInMath,
    numOptionalArgs: props.numOptionalArgs || 0,
    infix: !!props.infix,
    handler: handler
  };

  for (var i = 0; i < names.length; ++i) {
    _functions[names[i]] = data;
  }

  if (type) {
    if (htmlBuilder) {
      _htmlGroupBuilders[type] = htmlBuilder;
    }

    if (mathmlBuilder) {
      _mathmlGroupBuilders[type] = mathmlBuilder;
    }
  }
}
/**
 * Use this to register only the HTML and MathML builders for a function (e.g.
 * if the function's ParseNode is generated in Parser.js rather than via a
 * stand-alone handler provided to `defineFunction`).
 */

function defineFunctionBuilders(_ref2) {
  var type = _ref2.type,
      htmlBuilder = _ref2.htmlBuilder,
      mathmlBuilder = _ref2.mathmlBuilder;
  defineFunction({
    type: type,
    names: [],
    props: {
      numArgs: 0
    },
    handler: function handler() {
      throw new Error('Should never be called.');
    },
    htmlBuilder: htmlBuilder,
    mathmlBuilder: mathmlBuilder
  });
} // Since the corresponding buildHTML/buildMathML function expects a
// list of elements, we normalize for different kinds of arguments

var defineFunction_ordargument = function ordargument(arg) {
  var node = checkNodeType(arg, "ordgroup");
  return node ? node.body : [arg];
};
// CONCATENATED MODULE: ./src/buildHTML.js
/**
 * This file does the main work of building a domTree structure from a parse
 * tree. The entry point is the `buildHTML` function, which takes a parse tree.
 * Then, the buildExpression, buildGroup, and various groupBuilders functions
 * are called, to produce a final HTML tree.
 */









var buildHTML_makeSpan = buildCommon.makeSpan; // Binary atoms (first class `mbin`) change into ordinary atoms (`mord`)
// depending on their surroundings. See TeXbook pg. 442-446, Rules 5 and 6,
// and the text before Rule 19.

var binLeftCanceller = ["leftmost", "mbin", "mopen", "mrel", "mop", "mpunct"];
var binRightCanceller = ["rightmost", "mrel", "mclose", "mpunct"];
var styleMap = {
  "display": src_Style.DISPLAY,
  "text": src_Style.TEXT,
  "script": src_Style.SCRIPT,
  "scriptscript": src_Style.SCRIPTSCRIPT
};
var DomEnum = {
  mord: "mord",
  mop: "mop",
  mbin: "mbin",
  mrel: "mrel",
  mopen: "mopen",
  mclose: "mclose",
  mpunct: "mpunct",
  minner: "minner"
};

/**
 * Take a list of nodes, build them in order, and return a list of the built
 * nodes. documentFragments are flattened into their contents, so the
 * returned list contains no fragments. `isRealGroup` is true if `expression`
 * is a real group (no atoms will be added on either side), as opposed to
 * a partial group (e.g. one created by \color). `surrounding` is an array
 * consisting type of nodes that will be added to the left and right.
 */
var buildHTML_buildExpression = function buildExpression(expression, options, isRealGroup, surrounding) {
  if (surrounding === void 0) {
    surrounding = [null, null];
  }

  // Parse expressions into `groups`.
  var groups = [];

  for (var i = 0; i < expression.length; i++) {
    var output = buildHTML_buildGroup(expression[i], options);

    if (output instanceof tree_DocumentFragment) {
      var children = output.children;
      groups.push.apply(groups, children);
    } else {
      groups.push(output);
    }
  } // If `expression` is a partial group, let the parent handle spacings
  // to avoid processing groups multiple times.


  if (!isRealGroup) {
    return groups;
  }

  var glueOptions = options;

  if (expression.length === 1) {
    var node = checkNodeType(expression[0], "sizing") || checkNodeType(expression[0], "styling");

    if (!node) {// No match.
    } else if (node.type === "sizing") {
      glueOptions = options.havingSize(node.size);
    } else if (node.type === "styling") {
      glueOptions = options.havingStyle(styleMap[node.style]);
    }
  } // Dummy spans for determining spacings between surrounding atoms.
  // If `expression` has no atoms on the left or right, class "leftmost"
  // or "rightmost", respectively, is used to indicate it.


  var dummyPrev = buildHTML_makeSpan([surrounding[0] || "leftmost"], [], options);
  var dummyNext = buildHTML_makeSpan([surrounding[1] || "rightmost"], [], options); // TODO: These code assumes that a node's math class is the first element
  // of its `classes` array. A later cleanup should ensure this, for
  // instance by changing the signature of `makeSpan`.
  // Before determining what spaces to insert, perform bin cancellation.
  // Binary operators change to ordinary symbols in some contexts.

  traverseNonSpaceNodes(groups, function (node, prev) {
    var prevType = prev.classes[0];
    var type = node.classes[0];

    if (prevType === "mbin" && utils.contains(binRightCanceller, type)) {
      prev.classes[0] = "mord";
    } else if (type === "mbin" && utils.contains(binLeftCanceller, prevType)) {
      node.classes[0] = "mord";
    }
  }, {
    node: dummyPrev
  }, dummyNext);
  traverseNonSpaceNodes(groups, function (node, prev) {
    var prevType = getTypeOfDomTree(prev);
    var type = getTypeOfDomTree(node); // 'mtight' indicates that the node is script or scriptscript style.

    var space = prevType && type ? node.hasClass("mtight") ? tightSpacings[prevType][type] : spacings[prevType][type] : null;

    if (space) {
      // Insert glue (spacing) after the `prev`.
      return buildCommon.makeGlue(space, glueOptions);
    }
  }, {
    node: dummyPrev
  }, dummyNext);
  return groups;
}; // Depth-first traverse non-space `nodes`, calling `callback` with the current and
// previous node as arguments, optionally returning a node to insert after the
// previous node. `prev` is an object with the previous node and `insertAfter`
// function to insert after it. `next` is a node that will be added to the right.
// Used for bin cancellation and inserting spacings.

var traverseNonSpaceNodes = function traverseNonSpaceNodes(nodes, callback, prev, next) {
  if (next) {
    // temporarily append the right node, if exists
    nodes.push(next);
  }

  var i = 0;

  for (; i < nodes.length; i++) {
    var node = nodes[i];
    var partialGroup = buildHTML_checkPartialGroup(node);

    if (partialGroup) {
      // Recursive DFS
      // $FlowFixMe: make nodes a $ReadOnlyArray by returning a new array
      traverseNonSpaceNodes(partialGroup.children, callback, prev);
      continue;
    } // Ignore explicit spaces (e.g., \;, \,) when determining what implicit
    // spacing should go between atoms of different classes


    if (node.classes[0] === "mspace") {
      continue;
    }

    var result = callback(node, prev.node);

    if (result) {
      if (prev.insertAfter) {
        prev.insertAfter(result);
      } else {
        // insert at front
        nodes.unshift(result);
        i++;
      }
    }

    prev.node = node;

    prev.insertAfter = function (index) {
      return function (n) {
        nodes.splice(index + 1, 0, n);
        i++;
      };
    }(i);
  }

  if (next) {
    nodes.pop();
  }
}; // Check if given node is a partial group, i.e., does not affect spacing around.


var buildHTML_checkPartialGroup = function checkPartialGroup(node) {
  if (node instanceof tree_DocumentFragment || node instanceof domTree_Anchor) {
    return node;
  }

  return null;
}; // Return the outermost node of a domTree.


var getOutermostNode = function getOutermostNode(node, side) {
  var partialGroup = buildHTML_checkPartialGroup(node);

  if (partialGroup) {
    var children = partialGroup.children;

    if (children.length) {
      if (side === "right") {
        return getOutermostNode(children[children.length - 1], "right");
      } else if (side === "left") {
        return getOutermostNode(children[0], "left");
      }
    }
  }

  return node;
}; // Return math atom class (mclass) of a domTree.
// If `side` is given, it will get the type of the outermost node at given side.


var getTypeOfDomTree = function getTypeOfDomTree(node, side) {
  if (!node) {
    return null;
  }

  if (side) {
    node = getOutermostNode(node, side);
  } // This makes a lot of assumptions as to where the type of atom
  // appears.  We should do a better job of enforcing this.


  return DomEnum[node.classes[0]] || null;
};
var makeNullDelimiter = function makeNullDelimiter(options, classes) {
  var moreClasses = ["nulldelimiter"].concat(options.baseSizingClasses());
  return buildHTML_makeSpan(classes.concat(moreClasses));
};
/**
 * buildGroup is the function that takes a group and calls the correct groupType
 * function for it. It also handles the interaction of size and style changes
 * between parents and children.
 */

var buildHTML_buildGroup = function buildGroup(group, options, baseOptions) {
  if (!group) {
    return buildHTML_makeSpan();
  }

  if (_htmlGroupBuilders[group.type]) {
    // Call the groupBuilders function
    var groupNode = _htmlGroupBuilders[group.type](group, options); // If the size changed between the parent and the current group, account
    // for that size difference.

    if (baseOptions && options.size !== baseOptions.size) {
      groupNode = buildHTML_makeSpan(options.sizingClasses(baseOptions), [groupNode], options);
      var multiplier = options.sizeMultiplier / baseOptions.sizeMultiplier;
      groupNode.height *= multiplier;
      groupNode.depth *= multiplier;
    }

    return groupNode;
  } else {
    throw new src_ParseError("Got group of unknown type: '" + group.type + "'");
  }
};
/**
 * Combine an array of HTML DOM nodes (e.g., the output of `buildExpression`)
 * into an unbreakable HTML node of class .base, with proper struts to
 * guarantee correct vertical extent.  `buildHTML` calls this repeatedly to
 * make up the entire expression as a sequence of unbreakable units.
 */

function buildHTMLUnbreakable(children, options) {
  // Compute height and depth of this chunk.
  var body = buildHTML_makeSpan(["base"], children, options); // Add strut, which ensures that the top of the HTML element falls at
  // the height of the expression, and the bottom of the HTML element
  // falls at the depth of the expression.
  // We used to have separate top and bottom struts, where the bottom strut
  // would like to use `vertical-align: top`, but in IE 9 this lowers the
  // baseline of the box to the bottom of this strut (instead of staying in
  // the normal place) so we use an absolute value for vertical-align instead.

  var strut = buildHTML_makeSpan(["strut"]);
  strut.style.height = body.height + body.depth + "em";
  strut.style.verticalAlign = -body.depth + "em";
  body.children.unshift(strut);
  return body;
}
/**
 * Take an entire parse tree, and build it into an appropriate set of HTML
 * nodes.
 */


function buildHTML(tree, options) {
  // Strip off outer tag wrapper for processing below.
  var tag = null;

  if (tree.length === 1 && tree[0].type === "tag") {
    tag = tree[0].tag;
    tree = tree[0].body;
  } // Build the expression contained in the tree


  var expression = buildHTML_buildExpression(tree, options, true);
  var children = []; // Create one base node for each chunk between potential line breaks.
  // The TeXBook [p.173] says "A formula will be broken only after a
  // relation symbol like $=$ or $<$ or $\rightarrow$, or after a binary
  // operation symbol like $+$ or $-$ or $\times$, where the relation or
  // binary operation is on the ``outer level'' of the formula (i.e., not
  // enclosed in {...} and not part of an \over construction)."

  var parts = [];

  for (var i = 0; i < expression.length; i++) {
    parts.push(expression[i]);

    if (expression[i].hasClass("mbin") || expression[i].hasClass("mrel") || expression[i].hasClass("allowbreak")) {
      // Put any post-operator glue on same line as operator.
      // Watch for \nobreak along the way, and stop at \newline.
      var nobreak = false;

      while (i < expression.length - 1 && expression[i + 1].hasClass("mspace") && !expression[i + 1].hasClass("newline")) {
        i++;
        parts.push(expression[i]);

        if (expression[i].hasClass("nobreak")) {
          nobreak = true;
        }
      } // Don't allow break if \nobreak among the post-operator glue.


      if (!nobreak) {
        children.push(buildHTMLUnbreakable(parts, options));
        parts = [];
      }
    } else if (expression[i].hasClass("newline")) {
      // Write the line except the newline
      parts.pop();

      if (parts.length > 0) {
        children.push(buildHTMLUnbreakable(parts, options));
        parts = [];
      } // Put the newline at the top level


      children.push(expression[i]);
    }
  }

  if (parts.length > 0) {
    children.push(buildHTMLUnbreakable(parts, options));
  } // Now, if there was a tag, build it too and append it as a final child.


  var tagChild;

  if (tag) {
    tagChild = buildHTMLUnbreakable(buildHTML_buildExpression(tag, options, true));
    tagChild.classes = ["tag"];
    children.push(tagChild);
  }

  var htmlNode = buildHTML_makeSpan(["katex-html"], children);
  htmlNode.setAttribute("aria-hidden", "true"); // Adjust the strut of the tag to be the maximum height of all children
  // (the height of the enclosing htmlNode) for proper vertical alignment.

  if (tagChild) {
    var strut = tagChild.children[0];
    strut.style.height = htmlNode.height + htmlNode.depth + "em";
    strut.style.verticalAlign = -htmlNode.depth + "em";
  }

  return htmlNode;
}
// CONCATENATED MODULE: ./src/mathMLTree.js
/**
 * These objects store data about MathML nodes. This is the MathML equivalent
 * of the types in domTree.js. Since MathML handles its own rendering, and
 * since we're mainly using MathML to improve accessibility, we don't manage
 * any of the styling state that the plain DOM nodes do.
 *
 * The `toNode` and `toMarkup` functions work simlarly to how they do in
 * domTree.js, creating namespaced DOM nodes and HTML text markup respectively.
 */


function newDocumentFragment(children) {
  return new tree_DocumentFragment(children);
}
/**
 * This node represents a general purpose MathML node of any type. The
 * constructor requires the type of node to create (for example, `"mo"` or
 * `"mspace"`, corresponding to `<mo>` and `<mspace>` tags).
 */

var mathMLTree_MathNode =
/*#__PURE__*/
function () {
  function MathNode(type, children) {
    this.type = void 0;
    this.attributes = void 0;
    this.children = void 0;
    this.type = type;
    this.attributes = {};
    this.children = children || [];
  }
  /**
   * Sets an attribute on a MathML node. MathML depends on attributes to convey a
   * semantic content, so this is used heavily.
   */


  var _proto = MathNode.prototype;

  _proto.setAttribute = function setAttribute(name, value) {
    this.attributes[name] = value;
  }
  /**
   * Gets an attribute on a MathML node.
   */
  ;

  _proto.getAttribute = function getAttribute(name) {
    return this.attributes[name];
  }
  /**
   * Converts the math node into a MathML-namespaced DOM element.
   */
  ;

  _proto.toNode = function toNode() {
    var node = document.createElementNS("http://www.w3.org/1998/Math/MathML", this.type);

    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        node.setAttribute(attr, this.attributes[attr]);
      }
    }

    for (var i = 0; i < this.children.length; i++) {
      node.appendChild(this.children[i].toNode());
    }

    return node;
  }
  /**
   * Converts the math node into an HTML markup string.
   */
  ;

  _proto.toMarkup = function toMarkup() {
    var markup = "<" + this.type; // Add the attributes

    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        markup += " " + attr + "=\"";
        markup += utils.escape(this.attributes[attr]);
        markup += "\"";
      }
    }

    markup += ">";

    for (var i = 0; i < this.children.length; i++) {
      markup += this.children[i].toMarkup();
    }

    markup += "</" + this.type + ">";
    return markup;
  }
  /**
   * Converts the math node into a string, similar to innerText, but escaped.
   */
  ;

  _proto.toText = function toText() {
    return this.children.map(function (child) {
      return child.toText();
    }).join("");
  };

  return MathNode;
}();
/**
 * This node represents a piece of text.
 */

var mathMLTree_TextNode =
/*#__PURE__*/
function () {
  function TextNode(text) {
    this.text = void 0;
    this.text = text;
  }
  /**
   * Converts the text node into a DOM text node.
   */


  var _proto2 = TextNode.prototype;

  _proto2.toNode = function toNode() {
    return document.createTextNode(this.text);
  }
  /**
   * Converts the text node into escaped HTML markup
   * (representing the text itself).
   */
  ;

  _proto2.toMarkup = function toMarkup() {
    return utils.escape(this.toText());
  }
  /**
   * Converts the text node into a string
   * (representing the text iteself).
   */
  ;

  _proto2.toText = function toText() {
    return this.text;
  };

  return TextNode;
}();
/**
 * This node represents a space, but may render as <mspace.../> or as text,
 * depending on the width.
 */

var SpaceNode =
/*#__PURE__*/
function () {
  /**
   * Create a Space node with width given in CSS ems.
   */
  function SpaceNode(width) {
    this.width = void 0;
    this.character = void 0;
    this.width = width; // See https://www.w3.org/TR/2000/WD-MathML2-20000328/chapter6.html
    // for a table of space-like characters.  We use Unicode
    // representations instead of &LongNames; as it's not clear how to
    // make the latter via document.createTextNode.

    if (width >= 0.05555 && width <= 0.05556) {
      this.character = "\u200A"; // &VeryThinSpace;
    } else if (width >= 0.1666 && width <= 0.1667) {
      this.character = "\u2009"; // &ThinSpace;
    } else if (width >= 0.2222 && width <= 0.2223) {
      this.character = "\u2005"; // &MediumSpace;
    } else if (width >= 0.2777 && width <= 0.2778) {
      this.character = "\u2005\u200A"; // &ThickSpace;
    } else if (width >= -0.05556 && width <= -0.05555) {
      this.character = "\u200A\u2063"; // &NegativeVeryThinSpace;
    } else if (width >= -0.1667 && width <= -0.1666) {
      this.character = "\u2009\u2063"; // &NegativeThinSpace;
    } else if (width >= -0.2223 && width <= -0.2222) {
      this.character = "\u205F\u2063"; // &NegativeMediumSpace;
    } else if (width >= -0.2778 && width <= -0.2777) {
      this.character = "\u2005\u2063"; // &NegativeThickSpace;
    } else {
      this.character = null;
    }
  }
  /**
   * Converts the math node into a MathML-namespaced DOM element.
   */


  var _proto3 = SpaceNode.prototype;

  _proto3.toNode = function toNode() {
    if (this.character) {
      return document.createTextNode(this.character);
    } else {
      var node = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mspace");
      node.setAttribute("width", this.width + "em");
      return node;
    }
  }
  /**
   * Converts the math node into an HTML markup string.
   */
  ;

  _proto3.toMarkup = function toMarkup() {
    if (this.character) {
      return "<mtext>" + this.character + "</mtext>";
    } else {
      return "<mspace width=\"" + this.width + "em\"/>";
    }
  }
  /**
   * Converts the math node into a string, similar to innerText.
   */
  ;

  _proto3.toText = function toText() {
    if (this.character) {
      return this.character;
    } else {
      return " ";
    }
  };

  return SpaceNode;
}();

/* harmony default export */ var mathMLTree = ({
  MathNode: mathMLTree_MathNode,
  TextNode: mathMLTree_TextNode,
  SpaceNode: SpaceNode,
  newDocumentFragment: newDocumentFragment
});
// CONCATENATED MODULE: ./src/buildMathML.js
/**
 * This file converts a parse tree into a cooresponding MathML tree. The main
 * entry point is the `buildMathML` function, which takes a parse tree from the
 * parser.
 */









/**
 * Takes a symbol and converts it into a MathML text node after performing
 * optional replacement from symbols.js.
 */
var buildMathML_makeText = function makeText(text, mode, options) {
  if (src_symbols[mode][text] && src_symbols[mode][text].replace && text.charCodeAt(0) !== 0xD835 && !(ligatures.hasOwnProperty(text) && options && (options.fontFamily && options.fontFamily.substr(4, 2) === "tt" || options.font && options.font.substr(4, 2) === "tt"))) {
    text = src_symbols[mode][text].replace;
  }

  return new mathMLTree.TextNode(text);
};
/**
 * Wrap the given array of nodes in an <mrow> node if needed, i.e.,
 * unless the array has length 1.  Always returns a single node.
 */

var buildMathML_makeRow = function makeRow(body) {
  if (body.length === 1) {
    return body[0];
  } else {
    return new mathMLTree.MathNode("mrow", body);
  }
};
/**
 * Returns the math variant as a string or null if none is required.
 */

var buildMathML_getVariant = function getVariant(group, options) {
  // Handle \text... font specifiers as best we can.
  // MathML has a limited list of allowable mathvariant specifiers; see
  // https://www.w3.org/TR/MathML3/chapter3.html#presm.commatt
  if (options.fontFamily === "texttt") {
    return "monospace";
  } else if (options.fontFamily === "textsf") {
    if (options.fontShape === "textit" && options.fontWeight === "textbf") {
      return "sans-serif-bold-italic";
    } else if (options.fontShape === "textit") {
      return "sans-serif-italic";
    } else if (options.fontWeight === "textbf") {
      return "bold-sans-serif";
    } else {
      return "sans-serif";
    }
  } else if (options.fontShape === "textit" && options.fontWeight === "textbf") {
    return "bold-italic";
  } else if (options.fontShape === "textit") {
    return "italic";
  } else if (options.fontWeight === "textbf") {
    return "bold";
  }

  var font = options.font;

  if (!font || font === "mathnormal") {
    return null;
  }

  var mode = group.mode;

  if (font === "mathit") {
    return "italic";
  } else if (font === "boldsymbol") {
    return "bold-italic";
  } else if (font === "mathbf") {
    return "bold";
  } else if (font === "mathbb") {
    return "double-struck";
  } else if (font === "mathfrak") {
    return "fraktur";
  } else if (font === "mathscr" || font === "mathcal") {
    // MathML makes no distinction between script and caligrahpic
    return "script";
  } else if (font === "mathsf") {
    return "sans-serif";
  } else if (font === "mathtt") {
    return "monospace";
  }

  var text = group.text;

  if (utils.contains(["\\imath", "\\jmath"], text)) {
    return null;
  }

  if (src_symbols[mode][text] && src_symbols[mode][text].replace) {
    text = src_symbols[mode][text].replace;
  }

  var fontName = buildCommon.fontMap[font].fontName;

  if (getCharacterMetrics(text, fontName, mode)) {
    return buildCommon.fontMap[font].variant;
  }

  return null;
};
/**
 * Takes a list of nodes, builds them, and returns a list of the generated
 * MathML nodes.  Also combine consecutive <mtext> outputs into a single
 * <mtext> tag.
 */

var buildMathML_buildExpression = function buildExpression(expression, options, isOrdgroup) {
  if (expression.length === 1) {
    var group = buildMathML_buildGroup(expression[0], options);

    if (isOrdgroup && group instanceof mathMLTree_MathNode && group.type === "mo") {
      // When TeX writers want to suppress spacing on an operator,
      // they often put the operator by itself inside braces.
      group.setAttribute("lspace", "0em");
      group.setAttribute("rspace", "0em");
    }

    return [group];
  }

  var groups = [];
  var lastGroup;

  for (var i = 0; i < expression.length; i++) {
    var _group = buildMathML_buildGroup(expression[i], options);

    if (_group instanceof mathMLTree_MathNode && lastGroup instanceof mathMLTree_MathNode) {
      // Concatenate adjacent <mtext>s
      if (_group.type === 'mtext' && lastGroup.type === 'mtext' && _group.getAttribute('mathvariant') === lastGroup.getAttribute('mathvariant')) {
        var _lastGroup$children;

        (_lastGroup$children = lastGroup.children).push.apply(_lastGroup$children, _group.children);

        continue; // Concatenate adjacent <mn>s
      } else if (_group.type === 'mn' && lastGroup.type === 'mn') {
        var _lastGroup$children2;

        (_lastGroup$children2 = lastGroup.children).push.apply(_lastGroup$children2, _group.children);

        continue; // Concatenate <mn>...</mn> followed by <mi>.</mi>
      } else if (_group.type === 'mi' && _group.children.length === 1 && lastGroup.type === 'mn') {
        var child = _group.children[0];

        if (child instanceof mathMLTree_TextNode && child.text === '.') {
          var _lastGroup$children3;

          (_lastGroup$children3 = lastGroup.children).push.apply(_lastGroup$children3, _group.children);

          continue;
        }
      } else if (lastGroup.type === 'mi' && lastGroup.children.length === 1) {
        var lastChild = lastGroup.children[0];

        if (lastChild instanceof mathMLTree_TextNode && lastChild.text === "\u0338" && (_group.type === 'mo' || _group.type === 'mi' || _group.type === 'mn')) {
          var _child = _group.children[0];

          if (_child instanceof mathMLTree_TextNode && _child.text.length > 0) {
            // Overlay with combining character long solidus
            _child.text = _child.text.slice(0, 1) + "\u0338" + _child.text.slice(1);
            groups.pop();
          }
        }
      }
    }

    groups.push(_group);
    lastGroup = _group;
  }

  return groups;
};
/**
 * Equivalent to buildExpression, but wraps the elements in an <mrow>
 * if there's more than one.  Returns a single node instead of an array.
 */

var buildExpressionRow = function buildExpressionRow(expression, options, isOrdgroup) {
  return buildMathML_makeRow(buildMathML_buildExpression(expression, options, isOrdgroup));
};
/**
 * Takes a group from the parser and calls the appropriate groupBuilders function
 * on it to produce a MathML node.
 */

var buildMathML_buildGroup = function buildGroup(group, options) {
  if (!group) {
    return new mathMLTree.MathNode("mrow");
  }

  if (_mathmlGroupBuilders[group.type]) {
    // Call the groupBuilders function
    var result = _mathmlGroupBuilders[group.type](group, options);
    return result;
  } else {
    throw new src_ParseError("Got group of unknown type: '" + group.type + "'");
  }
};
/**
 * Takes a full parse tree and settings and builds a MathML representation of
 * it. In particular, we put the elements from building the parse tree into a
 * <semantics> tag so we can also include that TeX source as an annotation.
 *
 * Note that we actually return a domTree element with a `<math>` inside it so
 * we can do appropriate styling.
 */

function buildMathML(tree, texExpression, options, forMathmlOnly) {
  var expression = buildMathML_buildExpression(tree, options); // Wrap up the expression in an mrow so it is presented in the semantics
  // tag correctly, unless it's a single <mrow> or <mtable>.

  var wrapper;

  if (expression.length === 1 && expression[0] instanceof mathMLTree_MathNode && utils.contains(["mrow", "mtable"], expression[0].type)) {
    wrapper = expression[0];
  } else {
    wrapper = new mathMLTree.MathNode("mrow", expression);
  } // Build a TeX annotation of the source


  var annotation = new mathMLTree.MathNode("annotation", [new mathMLTree.TextNode(texExpression)]);
  annotation.setAttribute("encoding", "application/x-tex");
  var semantics = new mathMLTree.MathNode("semantics", [wrapper, annotation]);
  var math = new mathMLTree.MathNode("math", [semantics]);
  math.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML"); // You can't style <math> nodes, so we wrap the node in a span.
  // NOTE: The span class is not typed to have <math> nodes as children, and
  // we don't want to make the children type more generic since the children
  // of span are expected to have more fields in `buildHtml` contexts.

  var wrapperClass = forMathmlOnly ? "katex" : "katex-mathml"; // $FlowFixMe

  return buildCommon.makeSpan([wrapperClass], [math]);
}
// CONCATENATED MODULE: ./src/buildTree.js







var buildTree_optionsFromSettings = function optionsFromSettings(settings) {
  return new src_Options({
    style: settings.displayMode ? src_Style.DISPLAY : src_Style.TEXT,
    maxSize: settings.maxSize,
    minRuleThickness: settings.minRuleThickness
  });
};

var buildTree_displayWrap = function displayWrap(node, settings) {
  if (settings.displayMode) {
    var classes = ["katex-display"];

    if (settings.leqno) {
      classes.push("leqno");
    }

    if (settings.fleqn) {
      classes.push("fleqn");
    }

    node = buildCommon.makeSpan(classes, [node]);
  }

  return node;
};

var buildTree_buildTree = function buildTree(tree, expression, settings) {
  var options = buildTree_optionsFromSettings(settings);
  var katexNode;

  if (settings.output === "mathml") {
    return buildMathML(tree, expression, options, true);
  } else if (settings.output === "html") {
    var htmlNode = buildHTML(tree, options);
    katexNode = buildCommon.makeSpan(["katex"], [htmlNode]);
  } else {
    var mathMLNode = buildMathML(tree, expression, options, false);

    var _htmlNode = buildHTML(tree, options);

    katexNode = buildCommon.makeSpan(["katex"], [mathMLNode, _htmlNode]);
  }

  return buildTree_displayWrap(katexNode, settings);
};
var buildTree_buildHTMLTree = function buildHTMLTree(tree, expression, settings) {
  var options = buildTree_optionsFromSettings(settings);
  var htmlNode = buildHTML(tree, options);
  var katexNode = buildCommon.makeSpan(["katex"], [htmlNode]);
  return buildTree_displayWrap(katexNode, settings);
};
/* harmony default export */ var src_buildTree = (buildTree_buildTree);
// CONCATENATED MODULE: ./src/stretchy.js
/**
 * This file provides support to buildMathML.js and buildHTML.js
 * for stretchy wide elements rendered from SVG files
 * and other CSS trickery.
 */




var stretchyCodePoint = {
  widehat: "^",
  widecheck: "ˇ",
  widetilde: "~",
  utilde: "~",
  overleftarrow: "\u2190",
  underleftarrow: "\u2190",
  xleftarrow: "\u2190",
  overrightarrow: "\u2192",
  underrightarrow: "\u2192",
  xrightarrow: "\u2192",
  underbrace: "\u23DF",
  overbrace: "\u23DE",
  overgroup: "\u23E0",
  undergroup: "\u23E1",
  overleftrightarrow: "\u2194",
  underleftrightarrow: "\u2194",
  xleftrightarrow: "\u2194",
  Overrightarrow: "\u21D2",
  xRightarrow: "\u21D2",
  overleftharpoon: "\u21BC",
  xleftharpoonup: "\u21BC",
  overrightharpoon: "\u21C0",
  xrightharpoonup: "\u21C0",
  xLeftarrow: "\u21D0",
  xLeftrightarrow: "\u21D4",
  xhookleftarrow: "\u21A9",
  xhookrightarrow: "\u21AA",
  xmapsto: "\u21A6",
  xrightharpoondown: "\u21C1",
  xleftharpoondown: "\u21BD",
  xrightleftharpoons: "\u21CC",
  xleftrightharpoons: "\u21CB",
  xtwoheadleftarrow: "\u219E",
  xtwoheadrightarrow: "\u21A0",
  xlongequal: "=",
  xtofrom: "\u21C4",
  xrightleftarrows: "\u21C4",
  xrightequilibrium: "\u21CC",
  // Not a perfect match.
  xleftequilibrium: "\u21CB" // None better available.

};

var stretchy_mathMLnode = function mathMLnode(label) {
  var node = new mathMLTree.MathNode("mo", [new mathMLTree.TextNode(stretchyCodePoint[label.substr(1)])]);
  node.setAttribute("stretchy", "true");
  return node;
}; // Many of the KaTeX SVG images have been adapted from glyphs in KaTeX fonts.
// Copyright (c) 2009-2010, Design Science, Inc. (<www.mathjax.org>)
// Copyright (c) 2014-2017 Khan Academy (<www.khanacademy.org>)
// Licensed under the SIL Open Font License, Version 1.1.
// See \nhttp://scripts.sil.org/OFL
// Very Long SVGs
//    Many of the KaTeX stretchy wide elements use a long SVG image and an
//    overflow: hidden tactic to achieve a stretchy image while avoiding
//    distortion of arrowheads or brace corners.
//    The SVG typically contains a very long (400 em) arrow.
//    The SVG is in a container span that has overflow: hidden, so the span
//    acts like a window that exposes only part of the  SVG.
//    The SVG always has a longer, thinner aspect ratio than the container span.
//    After the SVG fills 100% of the height of the container span,
//    there is a long arrow shaft left over. That left-over shaft is not shown.
//    Instead, it is sliced off because the span's CSS has overflow: hidden.
//    Thus, the reader sees an arrow that matches the subject matter width
//    without distortion.
//    Some functions, such as \cancel, need to vary their aspect ratio. These
//    functions do not get the overflow SVG treatment.
// Second Brush Stroke
//    Low resolution monitors struggle to display images in fine detail.
//    So browsers apply anti-aliasing. A long straight arrow shaft therefore
//    will sometimes appear as if it has a blurred edge.
//    To mitigate this, these SVG files contain a second "brush-stroke" on the
//    arrow shafts. That is, a second long thin rectangular SVG path has been
//    written directly on top of each arrow shaft. This reinforcement causes
//    some of the screen pixels to display as black instead of the anti-aliased
//    gray pixel that a  single path would generate. So we get arrow shafts
//    whose edges appear to be sharper.
// In the katexImagesData object just below, the dimensions all
// correspond to path geometry inside the relevant SVG.
// For example, \overrightarrow uses the same arrowhead as glyph U+2192
// from the KaTeX Main font. The scaling factor is 1000.
// That is, inside the font, that arrowhead is 522 units tall, which
// corresponds to 0.522 em inside the document.


var katexImagesData = {
  //   path(s), minWidth, height, align
  overrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"],
  overleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"],
  underrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"],
  underleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"],
  xrightarrow: [["rightarrow"], 1.469, 522, "xMaxYMin"],
  xleftarrow: [["leftarrow"], 1.469, 522, "xMinYMin"],
  Overrightarrow: [["doublerightarrow"], 0.888, 560, "xMaxYMin"],
  xRightarrow: [["doublerightarrow"], 1.526, 560, "xMaxYMin"],
  xLeftarrow: [["doubleleftarrow"], 1.526, 560, "xMinYMin"],
  overleftharpoon: [["leftharpoon"], 0.888, 522, "xMinYMin"],
  xleftharpoonup: [["leftharpoon"], 0.888, 522, "xMinYMin"],
  xleftharpoondown: [["leftharpoondown"], 0.888, 522, "xMinYMin"],
  overrightharpoon: [["rightharpoon"], 0.888, 522, "xMaxYMin"],
  xrightharpoonup: [["rightharpoon"], 0.888, 522, "xMaxYMin"],
  xrightharpoondown: [["rightharpoondown"], 0.888, 522, "xMaxYMin"],
  xlongequal: [["longequal"], 0.888, 334, "xMinYMin"],
  xtwoheadleftarrow: [["twoheadleftarrow"], 0.888, 334, "xMinYMin"],
  xtwoheadrightarrow: [["twoheadrightarrow"], 0.888, 334, "xMaxYMin"],
  overleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522],
  overbrace: [["leftbrace", "midbrace", "rightbrace"], 1.6, 548],
  underbrace: [["leftbraceunder", "midbraceunder", "rightbraceunder"], 1.6, 548],
  underleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522],
  xleftrightarrow: [["leftarrow", "rightarrow"], 1.75, 522],
  xLeftrightarrow: [["doubleleftarrow", "doublerightarrow"], 1.75, 560],
  xrightleftharpoons: [["leftharpoondownplus", "rightharpoonplus"], 1.75, 716],
  xleftrightharpoons: [["leftharpoonplus", "rightharpoondownplus"], 1.75, 716],
  xhookleftarrow: [["leftarrow", "righthook"], 1.08, 522],
  xhookrightarrow: [["lefthook", "rightarrow"], 1.08, 522],
  overlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522],
  underlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522],
  overgroup: [["leftgroup", "rightgroup"], 0.888, 342],
  undergroup: [["leftgroupunder", "rightgroupunder"], 0.888, 342],
  xmapsto: [["leftmapsto", "rightarrow"], 1.5, 522],
  xtofrom: [["leftToFrom", "rightToFrom"], 1.75, 528],
  // The next three arrows are from the mhchem package.
  // In mhchem.sty, min-length is 2.0em. But these arrows might appear in the
  // document as \xrightarrow or \xrightleftharpoons. Those have
  // min-length = 1.75em, so we set min-length on these next three to match.
  xrightleftarrows: [["baraboveleftarrow", "rightarrowabovebar"], 1.75, 901],
  xrightequilibrium: [["baraboveshortleftharpoon", "rightharpoonaboveshortbar"], 1.75, 716],
  xleftequilibrium: [["shortbaraboveleftharpoon", "shortrightharpoonabovebar"], 1.75, 716]
};

var groupLength = function groupLength(arg) {
  if (arg.type === "ordgroup") {
    return arg.body.length;
  } else {
    return 1;
  }
};

var stretchy_svgSpan = function svgSpan(group, options) {
  // Create a span with inline SVG for the element.
  function buildSvgSpan_() {
    var viewBoxWidth = 400000; // default

    var label = group.label.substr(1);

    if (utils.contains(["widehat", "widecheck", "widetilde", "utilde"], label)) {
      // Each type in the `if` statement corresponds to one of the ParseNode
      // types below. This narrowing is required to access `grp.base`.
      var grp = group; // There are four SVG images available for each function.
      // Choose a taller image when there are more characters.

      var numChars = groupLength(grp.base);
      var viewBoxHeight;
      var pathName;

      var _height;

      if (numChars > 5) {
        if (label === "widehat" || label === "widecheck") {
          viewBoxHeight = 420;
          viewBoxWidth = 2364;
          _height = 0.42;
          pathName = label + "4";
        } else {
          viewBoxHeight = 312;
          viewBoxWidth = 2340;
          _height = 0.34;
          pathName = "tilde4";
        }
      } else {
        var imgIndex = [1, 1, 2, 2, 3, 3][numChars];

        if (label === "widehat" || label === "widecheck") {
          viewBoxWidth = [0, 1062, 2364, 2364, 2364][imgIndex];
          viewBoxHeight = [0, 239, 300, 360, 420][imgIndex];
          _height = [0, 0.24, 0.3, 0.3, 0.36, 0.42][imgIndex];
          pathName = label + imgIndex;
        } else {
          viewBoxWidth = [0, 600, 1033, 2339, 2340][imgIndex];
          viewBoxHeight = [0, 260, 286, 306, 312][imgIndex];
          _height = [0, 0.26, 0.286, 0.3, 0.306, 0.34][imgIndex];
          pathName = "tilde" + imgIndex;
        }
      }

      var path = new domTree_PathNode(pathName);
      var svgNode = new SvgNode([path], {
        "width": "100%",
        "height": _height + "em",
        "viewBox": "0 0 " + viewBoxWidth + " " + viewBoxHeight,
        "preserveAspectRatio": "none"
      });
      return {
        span: buildCommon.makeSvgSpan([], [svgNode], options),
        minWidth: 0,
        height: _height
      };
    } else {
      var spans = [];
      var data = katexImagesData[label];
      var paths = data[0],
          _minWidth = data[1],
          _viewBoxHeight = data[2];

      var _height2 = _viewBoxHeight / 1000;

      var numSvgChildren = paths.length;
      var widthClasses;
      var aligns;

      if (numSvgChildren === 1) {
        // $FlowFixMe: All these cases must be of the 4-tuple type.
        var align1 = data[3];
        widthClasses = ["hide-tail"];
        aligns = [align1];
      } else if (numSvgChildren === 2) {
        widthClasses = ["halfarrow-left", "halfarrow-right"];
        aligns = ["xMinYMin", "xMaxYMin"];
      } else if (numSvgChildren === 3) {
        widthClasses = ["brace-left", "brace-center", "brace-right"];
        aligns = ["xMinYMin", "xMidYMin", "xMaxYMin"];
      } else {
        throw new Error("Correct katexImagesData or update code here to support\n                    " + numSvgChildren + " children.");
      }

      for (var i = 0; i < numSvgChildren; i++) {
        var _path = new domTree_PathNode(paths[i]);

        var _svgNode = new SvgNode([_path], {
          "width": "400em",
          "height": _height2 + "em",
          "viewBox": "0 0 " + viewBoxWidth + " " + _viewBoxHeight,
          "preserveAspectRatio": aligns[i] + " slice"
        });

        var _span = buildCommon.makeSvgSpan([widthClasses[i]], [_svgNode], options);

        if (numSvgChildren === 1) {
          return {
            span: _span,
            minWidth: _minWidth,
            height: _height2
          };
        } else {
          _span.style.height = _height2 + "em";
          spans.push(_span);
        }
      }

      return {
        span: buildCommon.makeSpan(["stretchy"], spans, options),
        minWidth: _minWidth,
        height: _height2
      };
    }
  } // buildSvgSpan_()


  var _buildSvgSpan_ = buildSvgSpan_(),
      span = _buildSvgSpan_.span,
      minWidth = _buildSvgSpan_.minWidth,
      height = _buildSvgSpan_.height; // Note that we are returning span.depth = 0.
  // Any adjustments relative to the baseline must be done in buildHTML.


  span.height = height;
  span.style.height = height + "em";

  if (minWidth > 0) {
    span.style.minWidth = minWidth + "em";
  }

  return span;
};

var stretchy_encloseSpan = function encloseSpan(inner, label, pad, options) {
  // Return an image span for \cancel, \bcancel, \xcancel, or \fbox
  var img;
  var totalHeight = inner.height + inner.depth + 2 * pad;

  if (/fbox|color/.test(label)) {
    img = buildCommon.makeSpan(["stretchy", label], [], options);

    if (label === "fbox") {
      var color = options.color && options.getColor();

      if (color) {
        img.style.borderColor = color;
      }
    }
  } else {
    // \cancel, \bcancel, or \xcancel
    // Since \cancel's SVG is inline and it omits the viewBox attribute,
    // its stroke-width will not vary with span area.
    var lines = [];

    if (/^[bx]cancel$/.test(label)) {
      lines.push(new LineNode({
        "x1": "0",
        "y1": "0",
        "x2": "100%",
        "y2": "100%",
        "stroke-width": "0.046em"
      }));
    }

    if (/^x?cancel$/.test(label)) {
      lines.push(new LineNode({
        "x1": "0",
        "y1": "100%",
        "x2": "100%",
        "y2": "0",
        "stroke-width": "0.046em"
      }));
    }

    var svgNode = new SvgNode(lines, {
      "width": "100%",
      "height": totalHeight + "em"
    });
    img = buildCommon.makeSvgSpan([], [svgNode], options);
  }

  img.height = totalHeight;
  img.style.height = totalHeight + "em";
  return img;
};

/* harmony default export */ var stretchy = ({
  encloseSpan: stretchy_encloseSpan,
  mathMLnode: stretchy_mathMLnode,
  svgSpan: stretchy_svgSpan
});
// CONCATENATED MODULE: ./src/functions/accent.js









// NOTE: Unlike most `htmlBuilder`s, this one handles not only "accent", but
var accent_htmlBuilder = function htmlBuilder(grp, options) {
  // Accents are handled in the TeXbook pg. 443, rule 12.
  var base;
  var group;
  var supSub = checkNodeType(grp, "supsub");
  var supSubGroup;

  if (supSub) {
    // If our base is a character box, and we have superscripts and
    // subscripts, the supsub will defer to us. In particular, we want
    // to attach the superscripts and subscripts to the inner body (so
    // that the position of the superscripts and subscripts won't be
    // affected by the height of the accent). We accomplish this by
    // sticking the base of the accent into the base of the supsub, and
    // rendering that, while keeping track of where the accent is.
    // The real accent group is the base of the supsub group
    group = assertNodeType(supSub.base, "accent"); // The character box is the base of the accent group

    base = group.base; // Stick the character box into the base of the supsub group

    supSub.base = base; // Rerender the supsub group with its new base, and store that
    // result.

    supSubGroup = assertSpan(buildHTML_buildGroup(supSub, options)); // reset original base

    supSub.base = group;
  } else {
    group = assertNodeType(grp, "accent");
    base = group.base;
  } // Build the base group


  var body = buildHTML_buildGroup(base, options.havingCrampedStyle()); // Does the accent need to shift for the skew of a character?

  var mustShift = group.isShifty && utils.isCharacterBox(base); // Calculate the skew of the accent. This is based on the line "If the
  // nucleus is not a single character, let s = 0; otherwise set s to the
  // kern amount for the nucleus followed by the \skewchar of its font."
  // Note that our skew metrics are just the kern between each character
  // and the skewchar.

  var skew = 0;

  if (mustShift) {
    // If the base is a character box, then we want the skew of the
    // innermost character. To do that, we find the innermost character:
    var baseChar = utils.getBaseElem(base); // Then, we render its group to get the symbol inside it

    var baseGroup = buildHTML_buildGroup(baseChar, options.havingCrampedStyle()); // Finally, we pull the skew off of the symbol.

    skew = assertSymbolDomNode(baseGroup).skew; // Note that we now throw away baseGroup, because the layers we
    // removed with getBaseElem might contain things like \color which
    // we can't get rid of.
    // TODO(emily): Find a better way to get the skew
  } // calculate the amount of space between the body and the accent


  var clearance = Math.min(body.height, options.fontMetrics().xHeight); // Build the accent

  var accentBody;

  if (!group.isStretchy) {
    var accent;
    var width;

    if (group.label === "\\vec") {
      // Before version 0.9, \vec used the combining font glyph U+20D7.
      // But browsers, especially Safari, are not consistent in how they
      // render combining characters when not preceded by a character.
      // So now we use an SVG.
      // If Safari reforms, we should consider reverting to the glyph.
      accent = buildCommon.staticSvg("vec", options);
      width = buildCommon.svgData.vec[1];
    } else {
      accent = buildCommon.makeOrd({
        mode: group.mode,
        text: group.label
      }, options, "textord");
      accent = assertSymbolDomNode(accent); // Remove the italic correction of the accent, because it only serves to
      // shift the accent over to a place we don't want.

      accent.italic = 0;
      width = accent.width;
    }

    accentBody = buildCommon.makeSpan(["accent-body"], [accent]); // "Full" accents expand the width of the resulting symbol to be
    // at least the width of the accent, and overlap directly onto the
    // character without any vertical offset.

    var accentFull = group.label === "\\textcircled";

    if (accentFull) {
      accentBody.classes.push('accent-full');
      clearance = body.height;
    } // Shift the accent over by the skew.


    var left = skew; // CSS defines `.katex .accent .accent-body:not(.accent-full) { width: 0 }`
    // so that the accent doesn't contribute to the bounding box.
    // We need to shift the character by its width (effectively half
    // its width) to compensate.

    if (!accentFull) {
      left -= width / 2;
    }

    accentBody.style.left = left + "em"; // \textcircled uses the \bigcirc glyph, so it needs some
    // vertical adjustment to match LaTeX.

    if (group.label === "\\textcircled") {
      accentBody.style.top = ".2em";
    }

    accentBody = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: body
      }, {
        type: "kern",
        size: -clearance
      }, {
        type: "elem",
        elem: accentBody
      }]
    }, options);
  } else {
    accentBody = stretchy.svgSpan(group, options);
    accentBody = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: body
      }, {
        type: "elem",
        elem: accentBody,
        wrapperClasses: ["svg-align"],
        wrapperStyle: skew > 0 ? {
          width: "calc(100% - " + 2 * skew + "em)",
          marginLeft: 2 * skew + "em"
        } : undefined
      }]
    }, options);
  }

  var accentWrap = buildCommon.makeSpan(["mord", "accent"], [accentBody], options);

  if (supSubGroup) {
    // Here, we replace the "base" child of the supsub with our newly
    // generated accent.
    supSubGroup.children[0] = accentWrap; // Since we don't rerun the height calculation after replacing the
    // accent, we manually recalculate height.

    supSubGroup.height = Math.max(accentWrap.height, supSubGroup.height); // Accents should always be ords, even when their innards are not.

    supSubGroup.classes[0] = "mord";
    return supSubGroup;
  } else {
    return accentWrap;
  }
};

var accent_mathmlBuilder = function mathmlBuilder(group, options) {
  var accentNode = group.isStretchy ? stretchy.mathMLnode(group.label) : new mathMLTree.MathNode("mo", [buildMathML_makeText(group.label, group.mode)]);
  var node = new mathMLTree.MathNode("mover", [buildMathML_buildGroup(group.base, options), accentNode]);
  node.setAttribute("accent", "true");
  return node;
};

var NON_STRETCHY_ACCENT_REGEX = new RegExp(["\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve", "\\check", "\\hat", "\\vec", "\\dot", "\\mathring"].map(function (accent) {
  return "\\" + accent;
}).join("|")); // Accents

defineFunction({
  type: "accent",
  names: ["\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve", "\\check", "\\hat", "\\vec", "\\dot", "\\mathring", "\\widecheck", "\\widehat", "\\widetilde", "\\overrightarrow", "\\overleftarrow", "\\Overrightarrow", "\\overleftrightarrow", "\\overgroup", "\\overlinesegment", "\\overleftharpoon", "\\overrightharpoon"],
  props: {
    numArgs: 1
  },
  handler: function handler(context, args) {
    var base = args[0];
    var isStretchy = !NON_STRETCHY_ACCENT_REGEX.test(context.funcName);
    var isShifty = !isStretchy || context.funcName === "\\widehat" || context.funcName === "\\widetilde" || context.funcName === "\\widecheck";
    return {
      type: "accent",
      mode: context.parser.mode,
      label: context.funcName,
      isStretchy: isStretchy,
      isShifty: isShifty,
      base: base
    };
  },
  htmlBuilder: accent_htmlBuilder,
  mathmlBuilder: accent_mathmlBuilder
}); // Text-mode accents

defineFunction({
  type: "accent",
  names: ["\\'", "\\`", "\\^", "\\~", "\\=", "\\u", "\\.", '\\"', "\\r", "\\H", "\\v", "\\textcircled"],
  props: {
    numArgs: 1,
    allowedInText: true,
    allowedInMath: false
  },
  handler: function handler(context, args) {
    var base = args[0];
    return {
      type: "accent",
      mode: context.parser.mode,
      label: context.funcName,
      isStretchy: false,
      isShifty: true,
      base: base
    };
  },
  htmlBuilder: accent_htmlBuilder,
  mathmlBuilder: accent_mathmlBuilder
});
// CONCATENATED MODULE: ./src/functions/accentunder.js
// Horizontal overlap functions






defineFunction({
  type: "accentUnder",
  names: ["\\underleftarrow", "\\underrightarrow", "\\underleftrightarrow", "\\undergroup", "\\underlinesegment", "\\utilde"],
  props: {
    numArgs: 1
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var base = args[0];
    return {
      type: "accentUnder",
      mode: parser.mode,
      label: funcName,
      base: base
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    // Treat under accents much like underlines.
    var innerGroup = buildHTML_buildGroup(group.base, options);
    var accentBody = stretchy.svgSpan(group, options);
    var kern = group.label === "\\utilde" ? 0.12 : 0; // Generate the vlist, with the appropriate kerns

    var vlist = buildCommon.makeVList({
      positionType: "bottom",
      positionData: accentBody.height + kern,
      children: [{
        type: "elem",
        elem: accentBody,
        wrapperClasses: ["svg-align"]
      }, {
        type: "kern",
        size: kern
      }, {
        type: "elem",
        elem: innerGroup
      }]
    }, options);
    return buildCommon.makeSpan(["mord", "accentunder"], [vlist], options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var accentNode = stretchy.mathMLnode(group.label);
    var node = new mathMLTree.MathNode("munder", [buildMathML_buildGroup(group.base, options), accentNode]);
    node.setAttribute("accentunder", "true");
    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/arrow.js







// Helper function
var arrow_paddedNode = function paddedNode(group) {
  var node = new mathMLTree.MathNode("mpadded", group ? [group] : []);
  node.setAttribute("width", "+0.6em");
  node.setAttribute("lspace", "0.3em");
  return node;
}; // Stretchy arrows with an optional argument


defineFunction({
  type: "xArrow",
  names: ["\\xleftarrow", "\\xrightarrow", "\\xLeftarrow", "\\xRightarrow", "\\xleftrightarrow", "\\xLeftrightarrow", "\\xhookleftarrow", "\\xhookrightarrow", "\\xmapsto", "\\xrightharpoondown", "\\xrightharpoonup", "\\xleftharpoondown", "\\xleftharpoonup", "\\xrightleftharpoons", "\\xleftrightharpoons", "\\xlongequal", "\\xtwoheadrightarrow", "\\xtwoheadleftarrow", "\\xtofrom", // The next 3 functions are here to support the mhchem extension.
  // Direct use of these functions is discouraged and may break someday.
  "\\xrightleftarrows", "\\xrightequilibrium", "\\xleftequilibrium"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1
  },
  handler: function handler(_ref, args, optArgs) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    return {
      type: "xArrow",
      mode: parser.mode,
      label: funcName,
      body: args[0],
      below: optArgs[0]
    };
  },
  // Flow is unable to correctly infer the type of `group`, even though it's
  // unamibiguously determined from the passed-in `type` above.
  htmlBuilder: function htmlBuilder(group, options) {
    var style = options.style; // Build the argument groups in the appropriate style.
    // Ref: amsmath.dtx:   \hbox{$\scriptstyle\mkern#3mu{#6}\mkern#4mu$}%
    // Some groups can return document fragments.  Handle those by wrapping
    // them in a span.

    var newOptions = options.havingStyle(style.sup());
    var upperGroup = buildCommon.wrapFragment(buildHTML_buildGroup(group.body, newOptions, options), options);
    upperGroup.classes.push("x-arrow-pad");
    var lowerGroup;

    if (group.below) {
      // Build the lower group
      newOptions = options.havingStyle(style.sub());
      lowerGroup = buildCommon.wrapFragment(buildHTML_buildGroup(group.below, newOptions, options), options);
      lowerGroup.classes.push("x-arrow-pad");
    }

    var arrowBody = stretchy.svgSpan(group, options); // Re shift: Note that stretchy.svgSpan returned arrowBody.depth = 0.
    // The point we want on the math axis is at 0.5 * arrowBody.height.

    var arrowShift = -options.fontMetrics().axisHeight + 0.5 * arrowBody.height; // 2 mu kern. Ref: amsmath.dtx: #7\if0#2\else\mkern#2mu\fi

    var upperShift = -options.fontMetrics().axisHeight - 0.5 * arrowBody.height - 0.111; // 0.111 em = 2 mu

    if (upperGroup.depth > 0.25 || group.label === "\\xleftequilibrium") {
      upperShift -= upperGroup.depth; // shift up if depth encroaches
    } // Generate the vlist


    var vlist;

    if (lowerGroup) {
      var lowerShift = -options.fontMetrics().axisHeight + lowerGroup.height + 0.5 * arrowBody.height + 0.111;
      vlist = buildCommon.makeVList({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: upperGroup,
          shift: upperShift
        }, {
          type: "elem",
          elem: arrowBody,
          shift: arrowShift
        }, {
          type: "elem",
          elem: lowerGroup,
          shift: lowerShift
        }]
      }, options);
    } else {
      vlist = buildCommon.makeVList({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: upperGroup,
          shift: upperShift
        }, {
          type: "elem",
          elem: arrowBody,
          shift: arrowShift
        }]
      }, options);
    } // $FlowFixMe: Replace this with passing "svg-align" into makeVList.


    vlist.children[0].children[0].children[1].classes.push("svg-align");
    return buildCommon.makeSpan(["mrel", "x-arrow"], [vlist], options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var arrowNode = stretchy.mathMLnode(group.label);
    var node;

    if (group.body) {
      var upperNode = arrow_paddedNode(buildMathML_buildGroup(group.body, options));

      if (group.below) {
        var lowerNode = arrow_paddedNode(buildMathML_buildGroup(group.below, options));
        node = new mathMLTree.MathNode("munderover", [arrowNode, lowerNode, upperNode]);
      } else {
        node = new mathMLTree.MathNode("mover", [arrowNode, upperNode]);
      }
    } else if (group.below) {
      var _lowerNode = arrow_paddedNode(buildMathML_buildGroup(group.below, options));

      node = new mathMLTree.MathNode("munder", [arrowNode, _lowerNode]);
    } else {
      // This should never happen.
      // Parser.js throws an error if there is no argument.
      node = arrow_paddedNode();
      node = new mathMLTree.MathNode("mover", [arrowNode, node]);
    }

    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/char.js


 // \@char is an internal function that takes a grouped decimal argument like
// {123} and converts into symbol with code 123.  It is used by the *macro*
// \char defined in macros.js.

defineFunction({
  type: "textord",
  names: ["\\@char"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser;
    var arg = assertNodeType(args[0], "ordgroup");
    var group = arg.body;
    var number = "";

    for (var i = 0; i < group.length; i++) {
      var node = assertNodeType(group[i], "textord");
      number += node.text;
    }

    var code = parseInt(number);

    if (isNaN(code)) {
      throw new src_ParseError("\\@char has non-numeric argument " + number);
    }

    return {
      type: "textord",
      mode: parser.mode,
      text: String.fromCharCode(code)
    };
  }
});
// CONCATENATED MODULE: ./src/functions/color.js







var color_htmlBuilder = function htmlBuilder(group, options) {
  var elements = buildHTML_buildExpression(group.body, options.withColor(group.color), false); // \color isn't supposed to affect the type of the elements it contains.
  // To accomplish this, we wrap the results in a fragment, so the inner
  // elements will be able to directly interact with their neighbors. For
  // example, `\color{red}{2 +} 3` has the same spacing as `2 + 3`

  return buildCommon.makeFragment(elements);
};

var color_mathmlBuilder = function mathmlBuilder(group, options) {
  var inner = buildMathML_buildExpression(group.body, options.withColor(group.color));
  var node = new mathMLTree.MathNode("mstyle", inner);
  node.setAttribute("mathcolor", group.color);
  return node;
};

defineFunction({
  type: "color",
  names: ["\\textcolor"],
  props: {
    numArgs: 2,
    allowedInText: true,
    greediness: 3,
    argTypes: ["color", "original"]
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser;
    var color = assertNodeType(args[0], "color-token").color;
    var body = args[1];
    return {
      type: "color",
      mode: parser.mode,
      color: color,
      body: defineFunction_ordargument(body)
    };
  },
  htmlBuilder: color_htmlBuilder,
  mathmlBuilder: color_mathmlBuilder
});
defineFunction({
  type: "color",
  names: ["\\color"],
  props: {
    numArgs: 1,
    allowedInText: true,
    greediness: 3,
    argTypes: ["color"]
  },
  handler: function handler(_ref2, args) {
    var parser = _ref2.parser,
        breakOnTokenText = _ref2.breakOnTokenText;
    var color = assertNodeType(args[0], "color-token").color; // Set macro \current@color in current namespace to store the current
    // color, mimicking the behavior of color.sty.
    // This is currently used just to correctly color a \right
    // that follows a \color command.

    parser.gullet.macros.set("\\current@color", color); // Parse out the implicit body that should be colored.

    var body = parser.parseExpression(true, breakOnTokenText);
    return {
      type: "color",
      mode: parser.mode,
      color: color,
      body: body
    };
  },
  htmlBuilder: color_htmlBuilder,
  mathmlBuilder: color_mathmlBuilder
});
// CONCATENATED MODULE: ./src/functions/cr.js
// Row breaks within tabular environments, and line breaks at top level





 // \\ is a macro mapping to either \cr or \newline.  Because they have the
// same signature, we implement them as one megafunction, with newRow
// indicating whether we're in the \cr case, and newLine indicating whether
// to break the line in the \newline case.

defineFunction({
  type: "cr",
  names: ["\\cr", "\\newline"],
  props: {
    numArgs: 0,
    numOptionalArgs: 1,
    argTypes: ["size"],
    allowedInText: true
  },
  handler: function handler(_ref, args, optArgs) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var size = optArgs[0];
    var newRow = funcName === "\\cr";
    var newLine = false;

    if (!newRow) {
      if (parser.settings.displayMode && parser.settings.useStrictBehavior("newLineInDisplayMode", "In LaTeX, \\\\ or \\newline " + "does nothing in display mode")) {
        newLine = false;
      } else {
        newLine = true;
      }
    }

    return {
      type: "cr",
      mode: parser.mode,
      newLine: newLine,
      newRow: newRow,
      size: size && assertNodeType(size, "size").value
    };
  },
  // The following builders are called only at the top level,
  // not within tabular/array environments.
  htmlBuilder: function htmlBuilder(group, options) {
    if (group.newRow) {
      throw new src_ParseError("\\cr valid only within a tabular/array environment");
    }

    var span = buildCommon.makeSpan(["mspace"], [], options);

    if (group.newLine) {
      span.classes.push("newline");

      if (group.size) {
        span.style.marginTop = units_calculateSize(group.size, options) + "em";
      }
    }

    return span;
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var node = new mathMLTree.MathNode("mspace");

    if (group.newLine) {
      node.setAttribute("linebreak", "newline");

      if (group.size) {
        node.setAttribute("height", units_calculateSize(group.size, options) + "em");
      }
    }

    return node;
  }
});
// CONCATENATED MODULE: ./src/delimiter.js
/**
 * This file deals with creating delimiters of various sizes. The TeXbook
 * discusses these routines on page 441-442, in the "Another subroutine sets box
 * x to a specified variable delimiter" paragraph.
 *
 * There are three main routines here. `makeSmallDelim` makes a delimiter in the
 * normal font, but in either text, script, or scriptscript style.
 * `makeLargeDelim` makes a delimiter in textstyle, but in one of the Size1,
 * Size2, Size3, or Size4 fonts. `makeStackedDelim` makes a delimiter out of
 * smaller pieces that are stacked on top of one another.
 *
 * The functions take a parameter `center`, which determines if the delimiter
 * should be centered around the axis.
 *
 * Then, there are three exposed functions. `sizedDelim` makes a delimiter in
 * one of the given sizes. This is used for things like `\bigl`.
 * `customSizedDelim` makes a delimiter with a given total height+depth. It is
 * called in places like `\sqrt`. `leftRightDelim` makes an appropriate
 * delimiter which surrounds an expression of a given height an depth. It is
 * used in `\left` and `\right`.
 */









/**
 * Get the metrics for a given symbol and font, after transformation (i.e.
 * after following replacement from symbols.js)
 */
var delimiter_getMetrics = function getMetrics(symbol, font, mode) {
  var replace = src_symbols.math[symbol] && src_symbols.math[symbol].replace;
  var metrics = getCharacterMetrics(replace || symbol, font, mode);

  if (!metrics) {
    throw new Error("Unsupported symbol " + symbol + " and font size " + font + ".");
  }

  return metrics;
};
/**
 * Puts a delimiter span in a given style, and adds appropriate height, depth,
 * and maxFontSizes.
 */


var delimiter_styleWrap = function styleWrap(delim, toStyle, options, classes) {
  var newOptions = options.havingBaseStyle(toStyle);
  var span = buildCommon.makeSpan(classes.concat(newOptions.sizingClasses(options)), [delim], options);
  var delimSizeMultiplier = newOptions.sizeMultiplier / options.sizeMultiplier;
  span.height *= delimSizeMultiplier;
  span.depth *= delimSizeMultiplier;
  span.maxFontSize = newOptions.sizeMultiplier;
  return span;
};

var centerSpan = function centerSpan(span, options, style) {
  var newOptions = options.havingBaseStyle(style);
  var shift = (1 - options.sizeMultiplier / newOptions.sizeMultiplier) * options.fontMetrics().axisHeight;
  span.classes.push("delimcenter");
  span.style.top = shift + "em";
  span.height -= shift;
  span.depth += shift;
};
/**
 * Makes a small delimiter. This is a delimiter that comes in the Main-Regular
 * font, but is restyled to either be in textstyle, scriptstyle, or
 * scriptscriptstyle.
 */


var delimiter_makeSmallDelim = function makeSmallDelim(delim, style, center, options, mode, classes) {
  var text = buildCommon.makeSymbol(delim, "Main-Regular", mode, options);
  var span = delimiter_styleWrap(text, style, options, classes);

  if (center) {
    centerSpan(span, options, style);
  }

  return span;
};
/**
 * Builds a symbol in the given font size (note size is an integer)
 */


var delimiter_mathrmSize = function mathrmSize(value, size, mode, options) {
  return buildCommon.makeSymbol(value, "Size" + size + "-Regular", mode, options);
};
/**
 * Makes a large delimiter. This is a delimiter that comes in the Size1, Size2,
 * Size3, or Size4 fonts. It is always rendered in textstyle.
 */


var delimiter_makeLargeDelim = function makeLargeDelim(delim, size, center, options, mode, classes) {
  var inner = delimiter_mathrmSize(delim, size, mode, options);
  var span = delimiter_styleWrap(buildCommon.makeSpan(["delimsizing", "size" + size], [inner], options), src_Style.TEXT, options, classes);

  if (center) {
    centerSpan(span, options, src_Style.TEXT);
  }

  return span;
};
/**
 * Make an inner span with the given offset and in the given font. This is used
 * in `makeStackedDelim` to make the stacking pieces for the delimiter.
 */


var delimiter_makeInner = function makeInner(symbol, font, mode) {
  var sizeClass; // Apply the correct CSS class to choose the right font.

  if (font === "Size1-Regular") {
    sizeClass = "delim-size1";
  } else
    /* if (font === "Size4-Regular") */
    {
      sizeClass = "delim-size4";
    }

  var inner = buildCommon.makeSpan(["delimsizinginner", sizeClass], [buildCommon.makeSpan([], [buildCommon.makeSymbol(symbol, font, mode)])]); // Since this will be passed into `makeVList` in the end, wrap the element
  // in the appropriate tag that VList uses.

  return {
    type: "elem",
    elem: inner
  };
}; // Helper for makeStackedDelim


var lap = {
  type: "kern",
  size: -0.005
};
/**
 * Make a stacked delimiter out of a given delimiter, with the total height at
 * least `heightTotal`. This routine is mentioned on page 442 of the TeXbook.
 */

var delimiter_makeStackedDelim = function makeStackedDelim(delim, heightTotal, center, options, mode, classes) {
  // There are four parts, the top, an optional middle, a repeated part, and a
  // bottom.
  var top;
  var middle;
  var repeat;
  var bottom;
  top = repeat = bottom = delim;
  middle = null; // Also keep track of what font the delimiters are in

  var font = "Size1-Regular"; // We set the parts and font based on the symbol. Note that we use
  // '\u23d0' instead of '|' and '\u2016' instead of '\\|' for the
  // repeats of the arrows

  if (delim === "\\uparrow") {
    repeat = bottom = "\u23D0";
  } else if (delim === "\\Uparrow") {
    repeat = bottom = "\u2016";
  } else if (delim === "\\downarrow") {
    top = repeat = "\u23D0";
  } else if (delim === "\\Downarrow") {
    top = repeat = "\u2016";
  } else if (delim === "\\updownarrow") {
    top = "\\uparrow";
    repeat = "\u23D0";
    bottom = "\\downarrow";
  } else if (delim === "\\Updownarrow") {
    top = "\\Uparrow";
    repeat = "\u2016";
    bottom = "\\Downarrow";
  } else if (delim === "[" || delim === "\\lbrack") {
    top = "\u23A1";
    repeat = "\u23A2";
    bottom = "\u23A3";
    font = "Size4-Regular";
  } else if (delim === "]" || delim === "\\rbrack") {
    top = "\u23A4";
    repeat = "\u23A5";
    bottom = "\u23A6";
    font = "Size4-Regular";
  } else if (delim === "\\lfloor" || delim === "\u230A") {
    repeat = top = "\u23A2";
    bottom = "\u23A3";
    font = "Size4-Regular";
  } else if (delim === "\\lceil" || delim === "\u2308") {
    top = "\u23A1";
    repeat = bottom = "\u23A2";
    font = "Size4-Regular";
  } else if (delim === "\\rfloor" || delim === "\u230B") {
    repeat = top = "\u23A5";
    bottom = "\u23A6";
    font = "Size4-Regular";
  } else if (delim === "\\rceil" || delim === "\u2309") {
    top = "\u23A4";
    repeat = bottom = "\u23A5";
    font = "Size4-Regular";
  } else if (delim === "(" || delim === "\\lparen") {
    top = "\u239B";
    repeat = "\u239C";
    bottom = "\u239D";
    font = "Size4-Regular";
  } else if (delim === ")" || delim === "\\rparen") {
    top = "\u239E";
    repeat = "\u239F";
    bottom = "\u23A0";
    font = "Size4-Regular";
  } else if (delim === "\\{" || delim === "\\lbrace") {
    top = "\u23A7";
    middle = "\u23A8";
    bottom = "\u23A9";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } else if (delim === "\\}" || delim === "\\rbrace") {
    top = "\u23AB";
    middle = "\u23AC";
    bottom = "\u23AD";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } else if (delim === "\\lgroup" || delim === "\u27EE") {
    top = "\u23A7";
    bottom = "\u23A9";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } else if (delim === "\\rgroup" || delim === "\u27EF") {
    top = "\u23AB";
    bottom = "\u23AD";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } else if (delim === "\\lmoustache" || delim === "\u23B0") {
    top = "\u23A7";
    bottom = "\u23AD";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } else if (delim === "\\rmoustache" || delim === "\u23B1") {
    top = "\u23AB";
    bottom = "\u23A9";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } // Get the metrics of the four sections


  var topMetrics = delimiter_getMetrics(top, font, mode);
  var topHeightTotal = topMetrics.height + topMetrics.depth;
  var repeatMetrics = delimiter_getMetrics(repeat, font, mode);
  var repeatHeightTotal = repeatMetrics.height + repeatMetrics.depth;
  var bottomMetrics = delimiter_getMetrics(bottom, font, mode);
  var bottomHeightTotal = bottomMetrics.height + bottomMetrics.depth;
  var middleHeightTotal = 0;
  var middleFactor = 1;

  if (middle !== null) {
    var middleMetrics = delimiter_getMetrics(middle, font, mode);
    middleHeightTotal = middleMetrics.height + middleMetrics.depth;
    middleFactor = 2; // repeat symmetrically above and below middle
  } // Calcuate the minimal height that the delimiter can have.
  // It is at least the size of the top, bottom, and optional middle combined.


  var minHeight = topHeightTotal + bottomHeightTotal + middleHeightTotal; // Compute the number of copies of the repeat symbol we will need

  var repeatCount = Math.max(0, Math.ceil((heightTotal - minHeight) / (middleFactor * repeatHeightTotal))); // Compute the total height of the delimiter including all the symbols

  var realHeightTotal = minHeight + repeatCount * middleFactor * repeatHeightTotal; // The center of the delimiter is placed at the center of the axis. Note
  // that in this context, "center" means that the delimiter should be
  // centered around the axis in the current style, while normally it is
  // centered around the axis in textstyle.

  var axisHeight = options.fontMetrics().axisHeight;

  if (center) {
    axisHeight *= options.sizeMultiplier;
  } // Calculate the depth


  var depth = realHeightTotal / 2 - axisHeight; // This function differs from the TeX procedure in one way.
  // We shift each repeat element downwards by 0.005em, to prevent a gap
  // due to browser floating point rounding error.
  // Then, at the last element-to element joint, we add one extra repeat
  // element to cover the gap created by the shifts.
  // Find the shift needed to align the upper end of the extra element at a point
  // 0.005em above the lower end of the top element.

  var shiftOfExtraElement = (repeatCount + 1) * 0.005 - repeatHeightTotal; // Now, we start building the pieces that will go into the vlist
  // Keep a list of the inner pieces

  var inners = []; // Add the bottom symbol

  inners.push(delimiter_makeInner(bottom, font, mode));

  if (middle === null) {
    // Add that many symbols
    for (var i = 0; i < repeatCount; i++) {
      inners.push(lap); // overlap

      inners.push(delimiter_makeInner(repeat, font, mode));
    }
  } else {
    // When there is a middle bit, we need the middle part and two repeated
    // sections
    for (var _i = 0; _i < repeatCount; _i++) {
      inners.push(lap);
      inners.push(delimiter_makeInner(repeat, font, mode));
    } // Insert one extra repeat element.


    inners.push({
      type: "kern",
      size: shiftOfExtraElement
    });
    inners.push(delimiter_makeInner(repeat, font, mode));
    inners.push(lap); // Now insert the middle of the brace.

    inners.push(delimiter_makeInner(middle, font, mode));

    for (var _i2 = 0; _i2 < repeatCount; _i2++) {
      inners.push(lap);
      inners.push(delimiter_makeInner(repeat, font, mode));
    }
  } // To cover the gap create by the overlaps, insert one more repeat element,
  // at a position that juts 0.005 above the bottom of the top element.


  inners.push({
    type: "kern",
    size: shiftOfExtraElement
  });
  inners.push(delimiter_makeInner(repeat, font, mode));
  inners.push(lap); // Add the top symbol

  inners.push(delimiter_makeInner(top, font, mode)); // Finally, build the vlist

  var newOptions = options.havingBaseStyle(src_Style.TEXT);
  var inner = buildCommon.makeVList({
    positionType: "bottom",
    positionData: depth,
    children: inners
  }, newOptions);
  return delimiter_styleWrap(buildCommon.makeSpan(["delimsizing", "mult"], [inner], newOptions), src_Style.TEXT, options, classes);
}; // All surds have 0.08em padding above the viniculum inside the SVG.
// That keeps browser span height rounding error from pinching the line.


var vbPad = 80; // padding above the surd, measured inside the viewBox.

var emPad = 0.08; // padding, in ems, measured in the document.

var delimiter_sqrtSvg = function sqrtSvg(sqrtName, height, viewBoxHeight, extraViniculum, options) {
  var path = sqrtPath(sqrtName, extraViniculum, viewBoxHeight);
  var pathNode = new domTree_PathNode(sqrtName, path);
  var svg = new SvgNode([pathNode], {
    // Note: 1000:1 ratio of viewBox to document em width.
    "width": "400em",
    "height": height + "em",
    "viewBox": "0 0 400000 " + viewBoxHeight,
    "preserveAspectRatio": "xMinYMin slice"
  });
  return buildCommon.makeSvgSpan(["hide-tail"], [svg], options);
};
/**
 * Make a sqrt image of the given height,
 */


var makeSqrtImage = function makeSqrtImage(height, options) {
  // Define a newOptions that removes the effect of size changes such as \Huge.
  // We don't pick different a height surd for \Huge. For it, we scale up.
  var newOptions = options.havingBaseSizing(); // Pick the desired surd glyph from a sequence of surds.

  var delim = traverseSequence("\\surd", height * newOptions.sizeMultiplier, stackLargeDelimiterSequence, newOptions);
  var sizeMultiplier = newOptions.sizeMultiplier; // default
  // The standard sqrt SVGs each have a 0.04em thick viniculum.
  // If Settings.minRuleThickness is larger than that, we add extraViniculum.

  var extraViniculum = Math.max(0, options.minRuleThickness - options.fontMetrics().sqrtRuleThickness); // Create a span containing an SVG image of a sqrt symbol.

  var span;
  var spanHeight = 0;
  var texHeight = 0;
  var viewBoxHeight = 0;
  var advanceWidth; // We create viewBoxes with 80 units of "padding" above each surd.
  // Then browser rounding error on the parent span height will not
  // encroach on the ink of the viniculum. But that padding is not
  // included in the TeX-like `height` used for calculation of
  // vertical alignment. So texHeight = span.height < span.style.height.

  if (delim.type === "small") {
    // Get an SVG that is derived from glyph U+221A in font KaTeX-Main.
    // 1000 unit normal glyph height.
    viewBoxHeight = 1000 + 1000 * extraViniculum + vbPad;

    if (height < 1.0) {
      sizeMultiplier = 1.0; // mimic a \textfont radical
    } else if (height < 1.4) {
      sizeMultiplier = 0.7; // mimic a \scriptfont radical
    }

    spanHeight = (1.0 + extraViniculum + emPad) / sizeMultiplier;
    texHeight = (1.00 + extraViniculum) / sizeMultiplier;
    span = delimiter_sqrtSvg("sqrtMain", spanHeight, viewBoxHeight, extraViniculum, options);
    span.style.minWidth = "0.853em";
    advanceWidth = 0.833 / sizeMultiplier; // from the font.
  } else if (delim.type === "large") {
    // These SVGs come from fonts: KaTeX_Size1, _Size2, etc.
    viewBoxHeight = (1000 + vbPad) * sizeToMaxHeight[delim.size];
    texHeight = (sizeToMaxHeight[delim.size] + extraViniculum) / sizeMultiplier;
    spanHeight = (sizeToMaxHeight[delim.size] + extraViniculum + emPad) / sizeMultiplier;
    span = delimiter_sqrtSvg("sqrtSize" + delim.size, spanHeight, viewBoxHeight, extraViniculum, options);
    span.style.minWidth = "1.02em";
    advanceWidth = 1.0 / sizeMultiplier; // 1.0 from the font.
  } else {
    // Tall sqrt. In TeX, this would be stacked using multiple glyphs.
    // We'll use a single SVG to accomplish the same thing.
    spanHeight = height + extraViniculum + emPad;
    texHeight = height + extraViniculum;
    viewBoxHeight = Math.floor(1000 * height + extraViniculum) + vbPad;
    span = delimiter_sqrtSvg("sqrtTall", spanHeight, viewBoxHeight, extraViniculum, options);
    span.style.minWidth = "0.742em";
    advanceWidth = 1.056;
  }

  span.height = texHeight;
  span.style.height = spanHeight + "em";
  return {
    span: span,
    advanceWidth: advanceWidth,
    // Calculate the actual line width.
    // This actually should depend on the chosen font -- e.g. \boldmath
    // should use the thicker surd symbols from e.g. KaTeX_Main-Bold, and
    // have thicker rules.
    ruleWidth: (options.fontMetrics().sqrtRuleThickness + extraViniculum) * sizeMultiplier
  };
}; // There are three kinds of delimiters, delimiters that stack when they become
// too large


var stackLargeDelimiters = ["(", "\\lparen", ")", "\\rparen", "[", "\\lbrack", "]", "\\rbrack", "\\{", "\\lbrace", "\\}", "\\rbrace", "\\lfloor", "\\rfloor", "\u230A", "\u230B", "\\lceil", "\\rceil", "\u2308", "\u2309", "\\surd"]; // delimiters that always stack

var stackAlwaysDelimiters = ["\\uparrow", "\\downarrow", "\\updownarrow", "\\Uparrow", "\\Downarrow", "\\Updownarrow", "|", "\\|", "\\vert", "\\Vert", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\lgroup", "\\rgroup", "\u27EE", "\u27EF", "\\lmoustache", "\\rmoustache", "\u23B0", "\u23B1"]; // and delimiters that never stack

var stackNeverDelimiters = ["<", ">", "\\langle", "\\rangle", "/", "\\backslash", "\\lt", "\\gt"]; // Metrics of the different sizes. Found by looking at TeX's output of
// $\bigl| // \Bigl| \biggl| \Biggl| \showlists$
// Used to create stacked delimiters of appropriate sizes in makeSizedDelim.

var sizeToMaxHeight = [0, 1.2, 1.8, 2.4, 3.0];
/**
 * Used to create a delimiter of a specific size, where `size` is 1, 2, 3, or 4.
 */

var delimiter_makeSizedDelim = function makeSizedDelim(delim, size, options, mode, classes) {
  // < and > turn into \langle and \rangle in delimiters
  if (delim === "<" || delim === "\\lt" || delim === "\u27E8") {
    delim = "\\langle";
  } else if (delim === ">" || delim === "\\gt" || delim === "\u27E9") {
    delim = "\\rangle";
  } // Sized delimiters are never centered.


  if (utils.contains(stackLargeDelimiters, delim) || utils.contains(stackNeverDelimiters, delim)) {
    return delimiter_makeLargeDelim(delim, size, false, options, mode, classes);
  } else if (utils.contains(stackAlwaysDelimiters, delim)) {
    return delimiter_makeStackedDelim(delim, sizeToMaxHeight[size], false, options, mode, classes);
  } else {
    throw new src_ParseError("Illegal delimiter: '" + delim + "'");
  }
};
/**
 * There are three different sequences of delimiter sizes that the delimiters
 * follow depending on the kind of delimiter. This is used when creating custom
 * sized delimiters to decide whether to create a small, large, or stacked
 * delimiter.
 *
 * In real TeX, these sequences aren't explicitly defined, but are instead
 * defined inside the font metrics. Since there are only three sequences that
 * are possible for the delimiters that TeX defines, it is easier to just encode
 * them explicitly here.
 */


// Delimiters that never stack try small delimiters and large delimiters only
var stackNeverDelimiterSequence = [{
  type: "small",
  style: src_Style.SCRIPTSCRIPT
}, {
  type: "small",
  style: src_Style.SCRIPT
}, {
  type: "small",
  style: src_Style.TEXT
}, {
  type: "large",
  size: 1
}, {
  type: "large",
  size: 2
}, {
  type: "large",
  size: 3
}, {
  type: "large",
  size: 4
}]; // Delimiters that always stack try the small delimiters first, then stack

var stackAlwaysDelimiterSequence = [{
  type: "small",
  style: src_Style.SCRIPTSCRIPT
}, {
  type: "small",
  style: src_Style.SCRIPT
}, {
  type: "small",
  style: src_Style.TEXT
}, {
  type: "stack"
}]; // Delimiters that stack when large try the small and then large delimiters, and
// stack afterwards

var stackLargeDelimiterSequence = [{
  type: "small",
  style: src_Style.SCRIPTSCRIPT
}, {
  type: "small",
  style: src_Style.SCRIPT
}, {
  type: "small",
  style: src_Style.TEXT
}, {
  type: "large",
  size: 1
}, {
  type: "large",
  size: 2
}, {
  type: "large",
  size: 3
}, {
  type: "large",
  size: 4
}, {
  type: "stack"
}];
/**
 * Get the font used in a delimiter based on what kind of delimiter it is.
 * TODO(#963) Use more specific font family return type once that is introduced.
 */

var delimTypeToFont = function delimTypeToFont(type) {
  if (type.type === "small") {
    return "Main-Regular";
  } else if (type.type === "large") {
    return "Size" + type.size + "-Regular";
  } else if (type.type === "stack") {
    return "Size4-Regular";
  } else {
    throw new Error("Add support for delim type '" + type.type + "' here.");
  }
};
/**
 * Traverse a sequence of types of delimiters to decide what kind of delimiter
 * should be used to create a delimiter of the given height+depth.
 */


var traverseSequence = function traverseSequence(delim, height, sequence, options) {
  // Here, we choose the index we should start at in the sequences. In smaller
  // sizes (which correspond to larger numbers in style.size) we start earlier
  // in the sequence. Thus, scriptscript starts at index 3-3=0, script starts
  // at index 3-2=1, text starts at 3-1=2, and display starts at min(2,3-0)=2
  var start = Math.min(2, 3 - options.style.size);

  for (var i = start; i < sequence.length; i++) {
    if (sequence[i].type === "stack") {
      // This is always the last delimiter, so we just break the loop now.
      break;
    }

    var metrics = delimiter_getMetrics(delim, delimTypeToFont(sequence[i]), "math");
    var heightDepth = metrics.height + metrics.depth; // Small delimiters are scaled down versions of the same font, so we
    // account for the style change size.

    if (sequence[i].type === "small") {
      var newOptions = options.havingBaseStyle(sequence[i].style);
      heightDepth *= newOptions.sizeMultiplier;
    } // Check if the delimiter at this size works for the given height.


    if (heightDepth > height) {
      return sequence[i];
    }
  } // If we reached the end of the sequence, return the last sequence element.


  return sequence[sequence.length - 1];
};
/**
 * Make a delimiter of a given height+depth, with optional centering. Here, we
 * traverse the sequences, and create a delimiter that the sequence tells us to.
 */


var delimiter_makeCustomSizedDelim = function makeCustomSizedDelim(delim, height, center, options, mode, classes) {
  if (delim === "<" || delim === "\\lt" || delim === "\u27E8") {
    delim = "\\langle";
  } else if (delim === ">" || delim === "\\gt" || delim === "\u27E9") {
    delim = "\\rangle";
  } // Decide what sequence to use


  var sequence;

  if (utils.contains(stackNeverDelimiters, delim)) {
    sequence = stackNeverDelimiterSequence;
  } else if (utils.contains(stackLargeDelimiters, delim)) {
    sequence = stackLargeDelimiterSequence;
  } else {
    sequence = stackAlwaysDelimiterSequence;
  } // Look through the sequence


  var delimType = traverseSequence(delim, height, sequence, options); // Get the delimiter from font glyphs.
  // Depending on the sequence element we decided on, call the
  // appropriate function.

  if (delimType.type === "small") {
    return delimiter_makeSmallDelim(delim, delimType.style, center, options, mode, classes);
  } else if (delimType.type === "large") {
    return delimiter_makeLargeDelim(delim, delimType.size, center, options, mode, classes);
  } else
    /* if (delimType.type === "stack") */
    {
      return delimiter_makeStackedDelim(delim, height, center, options, mode, classes);
    }
};
/**
 * Make a delimiter for use with `\left` and `\right`, given a height and depth
 * of an expression that the delimiters surround.
 */


var makeLeftRightDelim = function makeLeftRightDelim(delim, height, depth, options, mode, classes) {
  // We always center \left/\right delimiters, so the axis is always shifted
  var axisHeight = options.fontMetrics().axisHeight * options.sizeMultiplier; // Taken from TeX source, tex.web, function make_left_right

  var delimiterFactor = 901;
  var delimiterExtend = 5.0 / options.fontMetrics().ptPerEm;
  var maxDistFromAxis = Math.max(height - axisHeight, depth + axisHeight);
  var totalHeight = Math.max( // In real TeX, calculations are done using integral values which are
  // 65536 per pt, or 655360 per em. So, the division here truncates in
  // TeX but doesn't here, producing different results. If we wanted to
  // exactly match TeX's calculation, we could do
  //   Math.floor(655360 * maxDistFromAxis / 500) *
  //    delimiterFactor / 655360
  // (To see the difference, compare
  //    x^{x^{\left(\rule{0.1em}{0.68em}\right)}}
  // in TeX and KaTeX)
  maxDistFromAxis / 500 * delimiterFactor, 2 * maxDistFromAxis - delimiterExtend); // Finally, we defer to `makeCustomSizedDelim` with our calculated total
  // height

  return delimiter_makeCustomSizedDelim(delim, totalHeight, true, options, mode, classes);
};

/* harmony default export */ var delimiter = ({
  sqrtImage: makeSqrtImage,
  sizedDelim: delimiter_makeSizedDelim,
  customSizedDelim: delimiter_makeCustomSizedDelim,
  leftRightDelim: makeLeftRightDelim
});
// CONCATENATED MODULE: ./src/functions/delimsizing.js









// Extra data needed for the delimiter handler down below
var delimiterSizes = {
  "\\bigl": {
    mclass: "mopen",
    size: 1
  },
  "\\Bigl": {
    mclass: "mopen",
    size: 2
  },
  "\\biggl": {
    mclass: "mopen",
    size: 3
  },
  "\\Biggl": {
    mclass: "mopen",
    size: 4
  },
  "\\bigr": {
    mclass: "mclose",
    size: 1
  },
  "\\Bigr": {
    mclass: "mclose",
    size: 2
  },
  "\\biggr": {
    mclass: "mclose",
    size: 3
  },
  "\\Biggr": {
    mclass: "mclose",
    size: 4
  },
  "\\bigm": {
    mclass: "mrel",
    size: 1
  },
  "\\Bigm": {
    mclass: "mrel",
    size: 2
  },
  "\\biggm": {
    mclass: "mrel",
    size: 3
  },
  "\\Biggm": {
    mclass: "mrel",
    size: 4
  },
  "\\big": {
    mclass: "mord",
    size: 1
  },
  "\\Big": {
    mclass: "mord",
    size: 2
  },
  "\\bigg": {
    mclass: "mord",
    size: 3
  },
  "\\Bigg": {
    mclass: "mord",
    size: 4
  }
};
var delimiters = ["(", "\\lparen", ")", "\\rparen", "[", "\\lbrack", "]", "\\rbrack", "\\{", "\\lbrace", "\\}", "\\rbrace", "\\lfloor", "\\rfloor", "\u230A", "\u230B", "\\lceil", "\\rceil", "\u2308", "\u2309", "<", ">", "\\langle", "\u27E8", "\\rangle", "\u27E9", "\\lt", "\\gt", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\lgroup", "\\rgroup", "\u27EE", "\u27EF", "\\lmoustache", "\\rmoustache", "\u23B0", "\u23B1", "/", "\\backslash", "|", "\\vert", "\\|", "\\Vert", "\\uparrow", "\\Uparrow", "\\downarrow", "\\Downarrow", "\\updownarrow", "\\Updownarrow", "."];

// Delimiter functions
function checkDelimiter(delim, context) {
  var symDelim = checkSymbolNodeType(delim);

  if (symDelim && utils.contains(delimiters, symDelim.text)) {
    return symDelim;
  } else {
    throw new src_ParseError("Invalid delimiter: '" + (symDelim ? symDelim.text : JSON.stringify(delim)) + "' after '" + context.funcName + "'", delim);
  }
}

defineFunction({
  type: "delimsizing",
  names: ["\\bigl", "\\Bigl", "\\biggl", "\\Biggl", "\\bigr", "\\Bigr", "\\biggr", "\\Biggr", "\\bigm", "\\Bigm", "\\biggm", "\\Biggm", "\\big", "\\Big", "\\bigg", "\\Bigg"],
  props: {
    numArgs: 1
  },
  handler: function handler(context, args) {
    var delim = checkDelimiter(args[0], context);
    return {
      type: "delimsizing",
      mode: context.parser.mode,
      size: delimiterSizes[context.funcName].size,
      mclass: delimiterSizes[context.funcName].mclass,
      delim: delim.text
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    if (group.delim === ".") {
      // Empty delimiters still count as elements, even though they don't
      // show anything.
      return buildCommon.makeSpan([group.mclass]);
    } // Use delimiter.sizedDelim to generate the delimiter.


    return delimiter.sizedDelim(group.delim, group.size, options, group.mode, [group.mclass]);
  },
  mathmlBuilder: function mathmlBuilder(group) {
    var children = [];

    if (group.delim !== ".") {
      children.push(buildMathML_makeText(group.delim, group.mode));
    }

    var node = new mathMLTree.MathNode("mo", children);

    if (group.mclass === "mopen" || group.mclass === "mclose") {
      // Only some of the delimsizing functions act as fences, and they
      // return "mopen" or "mclose" mclass.
      node.setAttribute("fence", "true");
    } else {
      // Explicitly disable fencing if it's not a fence, to override the
      // defaults.
      node.setAttribute("fence", "false");
    }

    return node;
  }
});

function assertParsed(group) {
  if (!group.body) {
    throw new Error("Bug: The leftright ParseNode wasn't fully parsed.");
  }
}

defineFunction({
  type: "leftright-right",
  names: ["\\right"],
  props: {
    numArgs: 1
  },
  handler: function handler(context, args) {
    // \left case below triggers parsing of \right in
    //   `const right = parser.parseFunction();`
    // uses this return value.
    var color = context.parser.gullet.macros.get("\\current@color");

    if (color && typeof color !== "string") {
      throw new src_ParseError("\\current@color set to non-string in \\right");
    }

    return {
      type: "leftright-right",
      mode: context.parser.mode,
      delim: checkDelimiter(args[0], context).text,
      color: color // undefined if not set via \color

    };
  }
});
defineFunction({
  type: "leftright",
  names: ["\\left"],
  props: {
    numArgs: 1
  },
  handler: function handler(context, args) {
    var delim = checkDelimiter(args[0], context);
    var parser = context.parser; // Parse out the implicit body

    ++parser.leftrightDepth; // parseExpression stops before '\\right'

    var body = parser.parseExpression(false);
    --parser.leftrightDepth; // Check the next token

    parser.expect("\\right", false);
    var right = assertNodeType(parser.parseFunction(), "leftright-right");
    return {
      type: "leftright",
      mode: parser.mode,
      body: body,
      left: delim.text,
      right: right.delim,
      rightColor: right.color
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    assertParsed(group); // Build the inner expression

    var inner = buildHTML_buildExpression(group.body, options, true, ["mopen", "mclose"]);
    var innerHeight = 0;
    var innerDepth = 0;
    var hadMiddle = false; // Calculate its height and depth

    for (var i = 0; i < inner.length; i++) {
      // Property `isMiddle` not defined on `span`. See comment in
      // "middle"'s htmlBuilder.
      // $FlowFixMe
      if (inner[i].isMiddle) {
        hadMiddle = true;
      } else {
        innerHeight = Math.max(inner[i].height, innerHeight);
        innerDepth = Math.max(inner[i].depth, innerDepth);
      }
    } // The size of delimiters is the same, regardless of what style we are
    // in. Thus, to correctly calculate the size of delimiter we need around
    // a group, we scale down the inner size based on the size.


    innerHeight *= options.sizeMultiplier;
    innerDepth *= options.sizeMultiplier;
    var leftDelim;

    if (group.left === ".") {
      // Empty delimiters in \left and \right make null delimiter spaces.
      leftDelim = makeNullDelimiter(options, ["mopen"]);
    } else {
      // Otherwise, use leftRightDelim to generate the correct sized
      // delimiter.
      leftDelim = delimiter.leftRightDelim(group.left, innerHeight, innerDepth, options, group.mode, ["mopen"]);
    } // Add it to the beginning of the expression


    inner.unshift(leftDelim); // Handle middle delimiters

    if (hadMiddle) {
      for (var _i = 1; _i < inner.length; _i++) {
        var middleDelim = inner[_i]; // Property `isMiddle` not defined on `span`. See comment in
        // "middle"'s htmlBuilder.
        // $FlowFixMe

        var isMiddle = middleDelim.isMiddle;

        if (isMiddle) {
          // Apply the options that were active when \middle was called
          inner[_i] = delimiter.leftRightDelim(isMiddle.delim, innerHeight, innerDepth, isMiddle.options, group.mode, []);
        }
      }
    }

    var rightDelim; // Same for the right delimiter, but using color specified by \color

    if (group.right === ".") {
      rightDelim = makeNullDelimiter(options, ["mclose"]);
    } else {
      var colorOptions = group.rightColor ? options.withColor(group.rightColor) : options;
      rightDelim = delimiter.leftRightDelim(group.right, innerHeight, innerDepth, colorOptions, group.mode, ["mclose"]);
    } // Add it to the end of the expression.


    inner.push(rightDelim);
    return buildCommon.makeSpan(["minner"], inner, options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    assertParsed(group);
    var inner = buildMathML_buildExpression(group.body, options);

    if (group.left !== ".") {
      var leftNode = new mathMLTree.MathNode("mo", [buildMathML_makeText(group.left, group.mode)]);
      leftNode.setAttribute("fence", "true");
      inner.unshift(leftNode);
    }

    if (group.right !== ".") {
      var rightNode = new mathMLTree.MathNode("mo", [buildMathML_makeText(group.right, group.mode)]);
      rightNode.setAttribute("fence", "true");

      if (group.rightColor) {
        rightNode.setAttribute("mathcolor", group.rightColor);
      }

      inner.push(rightNode);
    }

    return buildMathML_makeRow(inner);
  }
});
defineFunction({
  type: "middle",
  names: ["\\middle"],
  props: {
    numArgs: 1
  },
  handler: function handler(context, args) {
    var delim = checkDelimiter(args[0], context);

    if (!context.parser.leftrightDepth) {
      throw new src_ParseError("\\middle without preceding \\left", delim);
    }

    return {
      type: "middle",
      mode: context.parser.mode,
      delim: delim.text
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var middleDelim;

    if (group.delim === ".") {
      middleDelim = makeNullDelimiter(options, []);
    } else {
      middleDelim = delimiter.sizedDelim(group.delim, 1, options, group.mode, []);
      var isMiddle = {
        delim: group.delim,
        options: options
      }; // Property `isMiddle` not defined on `span`. It is only used in
      // this file above.
      // TODO: Fix this violation of the `span` type and possibly rename
      // things since `isMiddle` sounds like a boolean, but is a struct.
      // $FlowFixMe

      middleDelim.isMiddle = isMiddle;
    }

    return middleDelim;
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    // A Firefox \middle will strech a character vertically only if it
    // is in the fence part of the operator dictionary at:
    // https://www.w3.org/TR/MathML3/appendixc.html.
    // So we need to avoid U+2223 and use plain "|" instead.
    var textNode = group.delim === "\\vert" || group.delim === "|" ? buildMathML_makeText("|", "text") : buildMathML_makeText(group.delim, group.mode);
    var middleNode = new mathMLTree.MathNode("mo", [textNode]);
    middleNode.setAttribute("fence", "true"); // MathML gives 5/18em spacing to each <mo> element.
    // \middle should get delimiter spacing instead.

    middleNode.setAttribute("lspace", "0.05em");
    middleNode.setAttribute("rspace", "0.05em");
    return middleNode;
  }
});
// CONCATENATED MODULE: ./src/functions/enclose.js









var enclose_htmlBuilder = function htmlBuilder(group, options) {
  // \cancel, \bcancel, \xcancel, \sout, \fbox, \colorbox, \fcolorbox
  // Some groups can return document fragments.  Handle those by wrapping
  // them in a span.
  var inner = buildCommon.wrapFragment(buildHTML_buildGroup(group.body, options), options);
  var label = group.label.substr(1);
  var scale = options.sizeMultiplier;
  var img;
  var imgShift = 0; // In the LaTeX cancel package, line geometry is slightly different
  // depending on whether the subject is wider than it is tall, or vice versa.
  // We don't know the width of a group, so as a proxy, we test if
  // the subject is a single character. This captures most of the
  // subjects that should get the "tall" treatment.

  var isSingleChar = utils.isCharacterBox(group.body);

  if (label === "sout") {
    img = buildCommon.makeSpan(["stretchy", "sout"]);
    img.height = options.fontMetrics().defaultRuleThickness / scale;
    imgShift = -0.5 * options.fontMetrics().xHeight;
  } else {
    // Add horizontal padding
    if (/cancel/.test(label)) {
      if (!isSingleChar) {
        inner.classes.push("cancel-pad");
      }
    } else {
      inner.classes.push("boxpad");
    } // Add vertical padding


    var vertPad = 0;
    var ruleThickness = 0; // ref: cancel package: \advance\totalheight2\p@ % "+2"

    if (/box/.test(label)) {
      ruleThickness = Math.max(options.fontMetrics().fboxrule, // default
      options.minRuleThickness // User override.
      );
      vertPad = options.fontMetrics().fboxsep + (label === "colorbox" ? 0 : ruleThickness);
    } else {
      vertPad = isSingleChar ? 0.2 : 0;
    }

    img = stretchy.encloseSpan(inner, label, vertPad, options);

    if (/fbox|boxed|fcolorbox/.test(label)) {
      img.style.borderStyle = "solid";
      img.style.borderWidth = ruleThickness + "em";
    }

    imgShift = inner.depth + vertPad;

    if (group.backgroundColor) {
      img.style.backgroundColor = group.backgroundColor;

      if (group.borderColor) {
        img.style.borderColor = group.borderColor;
      }
    }
  }

  var vlist;

  if (group.backgroundColor) {
    vlist = buildCommon.makeVList({
      positionType: "individualShift",
      children: [// Put the color background behind inner;
      {
        type: "elem",
        elem: img,
        shift: imgShift
      }, {
        type: "elem",
        elem: inner,
        shift: 0
      }]
    }, options);
  } else {
    vlist = buildCommon.makeVList({
      positionType: "individualShift",
      children: [// Write the \cancel stroke on top of inner.
      {
        type: "elem",
        elem: inner,
        shift: 0
      }, {
        type: "elem",
        elem: img,
        shift: imgShift,
        wrapperClasses: /cancel/.test(label) ? ["svg-align"] : []
      }]
    }, options);
  }

  if (/cancel/.test(label)) {
    // The cancel package documentation says that cancel lines add their height
    // to the expression, but tests show that isn't how it actually works.
    vlist.height = inner.height;
    vlist.depth = inner.depth;
  }

  if (/cancel/.test(label) && !isSingleChar) {
    // cancel does not create horiz space for its line extension.
    return buildCommon.makeSpan(["mord", "cancel-lap"], [vlist], options);
  } else {
    return buildCommon.makeSpan(["mord"], [vlist], options);
  }
};

var enclose_mathmlBuilder = function mathmlBuilder(group, options) {
  var fboxsep = 0;
  var node = new mathMLTree.MathNode(group.label.indexOf("colorbox") > -1 ? "mpadded" : "menclose", [buildMathML_buildGroup(group.body, options)]);

  switch (group.label) {
    case "\\cancel":
      node.setAttribute("notation", "updiagonalstrike");
      break;

    case "\\bcancel":
      node.setAttribute("notation", "downdiagonalstrike");
      break;

    case "\\sout":
      node.setAttribute("notation", "horizontalstrike");
      break;

    case "\\fbox":
      node.setAttribute("notation", "box");
      break;

    case "\\fcolorbox":
    case "\\colorbox":
      // <menclose> doesn't have a good notation option. So use <mpadded>
      // instead. Set some attributes that come included with <menclose>.
      fboxsep = options.fontMetrics().fboxsep * options.fontMetrics().ptPerEm;
      node.setAttribute("width", "+" + 2 * fboxsep + "pt");
      node.setAttribute("height", "+" + 2 * fboxsep + "pt");
      node.setAttribute("lspace", fboxsep + "pt"); //

      node.setAttribute("voffset", fboxsep + "pt");

      if (group.label === "\\fcolorbox") {
        var thk = Math.max(options.fontMetrics().fboxrule, // default
        options.minRuleThickness // user override
        );
        node.setAttribute("style", "border: " + thk + "em solid " + String(group.borderColor));
      }

      break;

    case "\\xcancel":
      node.setAttribute("notation", "updiagonalstrike downdiagonalstrike");
      break;
  }

  if (group.backgroundColor) {
    node.setAttribute("mathbackground", group.backgroundColor);
  }

  return node;
};

defineFunction({
  type: "enclose",
  names: ["\\colorbox"],
  props: {
    numArgs: 2,
    allowedInText: true,
    greediness: 3,
    argTypes: ["color", "text"]
  },
  handler: function handler(_ref, args, optArgs) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var color = assertNodeType(args[0], "color-token").color;
    var body = args[1];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      backgroundColor: color,
      body: body
    };
  },
  htmlBuilder: enclose_htmlBuilder,
  mathmlBuilder: enclose_mathmlBuilder
});
defineFunction({
  type: "enclose",
  names: ["\\fcolorbox"],
  props: {
    numArgs: 3,
    allowedInText: true,
    greediness: 3,
    argTypes: ["color", "color", "text"]
  },
  handler: function handler(_ref2, args, optArgs) {
    var parser = _ref2.parser,
        funcName = _ref2.funcName;
    var borderColor = assertNodeType(args[0], "color-token").color;
    var backgroundColor = assertNodeType(args[1], "color-token").color;
    var body = args[2];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      body: body
    };
  },
  htmlBuilder: enclose_htmlBuilder,
  mathmlBuilder: enclose_mathmlBuilder
});
defineFunction({
  type: "enclose",
  names: ["\\fbox"],
  props: {
    numArgs: 1,
    argTypes: ["hbox"],
    allowedInText: true
  },
  handler: function handler(_ref3, args) {
    var parser = _ref3.parser;
    return {
      type: "enclose",
      mode: parser.mode,
      label: "\\fbox",
      body: args[0]
    };
  }
});
defineFunction({
  type: "enclose",
  names: ["\\cancel", "\\bcancel", "\\xcancel", "\\sout"],
  props: {
    numArgs: 1
  },
  handler: function handler(_ref4, args, optArgs) {
    var parser = _ref4.parser,
        funcName = _ref4.funcName;
    var body = args[0];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      body: body
    };
  },
  htmlBuilder: enclose_htmlBuilder,
  mathmlBuilder: enclose_mathmlBuilder
});
// CONCATENATED MODULE: ./src/defineEnvironment.js


/**
 * All registered environments.
 * `environments.js` exports this same dictionary again and makes it public.
 * `Parser.js` requires this dictionary via `environments.js`.
 */
var _environments = {};
function defineEnvironment(_ref) {
  var type = _ref.type,
      names = _ref.names,
      props = _ref.props,
      handler = _ref.handler,
      htmlBuilder = _ref.htmlBuilder,
      mathmlBuilder = _ref.mathmlBuilder;
  // Set default values of environments.
  var data = {
    type: type,
    numArgs: props.numArgs || 0,
    greediness: 1,
    allowedInText: false,
    numOptionalArgs: 0,
    handler: handler
  };

  for (var i = 0; i < names.length; ++i) {
    // TODO: The value type of _environments should be a type union of all
    // possible `EnvSpec<>` possibilities instead of `EnvSpec<*>`, which is
    // an existential type.
    // $FlowFixMe
    _environments[names[i]] = data;
  }

  if (htmlBuilder) {
    _htmlGroupBuilders[type] = htmlBuilder;
  }

  if (mathmlBuilder) {
    _mathmlGroupBuilders[type] = mathmlBuilder;
  }
}
// CONCATENATED MODULE: ./src/environments/array.js













function getHLines(parser) {
  // Return an array. The array length = number of hlines.
  // Each element in the array tells if the line is dashed.
  var hlineInfo = [];
  parser.consumeSpaces();
  var nxt = parser.fetch().text;

  while (nxt === "\\hline" || nxt === "\\hdashline") {
    parser.consume();
    hlineInfo.push(nxt === "\\hdashline");
    parser.consumeSpaces();
    nxt = parser.fetch().text;
  }

  return hlineInfo;
}
/**
 * Parse the body of the environment, with rows delimited by \\ and
 * columns delimited by &, and create a nested list in row-major order
 * with one group per cell.  If given an optional argument style
 * ("text", "display", etc.), then each cell is cast into that style.
 */


function parseArray(parser, _ref, style) {
  var hskipBeforeAndAfter = _ref.hskipBeforeAndAfter,
      addJot = _ref.addJot,
      cols = _ref.cols,
      arraystretch = _ref.arraystretch,
      colSeparationType = _ref.colSeparationType;
  // Parse body of array with \\ temporarily mapped to \cr
  parser.gullet.beginGroup();
  parser.gullet.macros.set("\\\\", "\\cr"); // Get current arraystretch if it's not set by the environment

  if (!arraystretch) {
    var stretch = parser.gullet.expandMacroAsText("\\arraystretch");

    if (stretch == null) {
      // Default \arraystretch from lttab.dtx
      arraystretch = 1;
    } else {
      arraystretch = parseFloat(stretch);

      if (!arraystretch || arraystretch < 0) {
        throw new src_ParseError("Invalid \\arraystretch: " + stretch);
      }
    }
  } // Start group for first cell


  parser.gullet.beginGroup();
  var row = [];
  var body = [row];
  var rowGaps = [];
  var hLinesBeforeRow = []; // Test for \hline at the top of the array.

  hLinesBeforeRow.push(getHLines(parser));

  while (true) {
    // eslint-disable-line no-constant-condition
    // Parse each cell in its own group (namespace)
    var cell = parser.parseExpression(false, "\\cr");
    parser.gullet.endGroup();
    parser.gullet.beginGroup();
    cell = {
      type: "ordgroup",
      mode: parser.mode,
      body: cell
    };

    if (style) {
      cell = {
        type: "styling",
        mode: parser.mode,
        style: style,
        body: [cell]
      };
    }

    row.push(cell);
    var next = parser.fetch().text;

    if (next === "&") {
      parser.consume();
    } else if (next === "\\end") {
      // Arrays terminate newlines with `\crcr` which consumes a `\cr` if
      // the last line is empty.
      // NOTE: Currently, `cell` is the last item added into `row`.
      if (row.length === 1 && cell.type === "styling" && cell.body[0].body.length === 0) {
        body.pop();
      }

      if (hLinesBeforeRow.length < body.length + 1) {
        hLinesBeforeRow.push([]);
      }

      break;
    } else if (next === "\\cr") {
      var cr = assertNodeType(parser.parseFunction(), "cr");
      rowGaps.push(cr.size); // check for \hline(s) following the row separator

      hLinesBeforeRow.push(getHLines(parser));
      row = [];
      body.push(row);
    } else {
      throw new src_ParseError("Expected & or \\\\ or \\cr or \\end", parser.nextToken);
    }
  } // End cell group


  parser.gullet.endGroup(); // End array group defining \\

  parser.gullet.endGroup();
  return {
    type: "array",
    mode: parser.mode,
    addJot: addJot,
    arraystretch: arraystretch,
    body: body,
    cols: cols,
    rowGaps: rowGaps,
    hskipBeforeAndAfter: hskipBeforeAndAfter,
    hLinesBeforeRow: hLinesBeforeRow,
    colSeparationType: colSeparationType
  };
} // Decides on a style for cells in an array according to whether the given
// environment name starts with the letter 'd'.


function dCellStyle(envName) {
  if (envName.substr(0, 1) === "d") {
    return "display";
  } else {
    return "text";
  }
}

var array_htmlBuilder = function htmlBuilder(group, options) {
  var r;
  var c;
  var nr = group.body.length;
  var hLinesBeforeRow = group.hLinesBeforeRow;
  var nc = 0;
  var body = new Array(nr);
  var hlines = [];
  var ruleThickness = Math.max( // From LaTeX \showthe\arrayrulewidth. Equals 0.04 em.
  options.fontMetrics().arrayRuleWidth, options.minRuleThickness // User override.
  ); // Horizontal spacing

  var pt = 1 / options.fontMetrics().ptPerEm;
  var arraycolsep = 5 * pt; // default value, i.e. \arraycolsep in article.cls

  if (group.colSeparationType && group.colSeparationType === "small") {
    // We're in a {smallmatrix}. Default column space is \thickspace,
    // i.e. 5/18em = 0.2778em, per amsmath.dtx for {smallmatrix}.
    // But that needs adjustment because LaTeX applies \scriptstyle to the
    // entire array, including the colspace, but this function applies
    // \scriptstyle only inside each element.
    var localMultiplier = options.havingStyle(src_Style.SCRIPT).sizeMultiplier;
    arraycolsep = 0.2778 * (localMultiplier / options.sizeMultiplier);
  } // Vertical spacing


  var baselineskip = 12 * pt; // see size10.clo
  // Default \jot from ltmath.dtx
  // TODO(edemaine): allow overriding \jot via \setlength (#687)

  var jot = 3 * pt;
  var arrayskip = group.arraystretch * baselineskip;
  var arstrutHeight = 0.7 * arrayskip; // \strutbox in ltfsstrc.dtx and

  var arstrutDepth = 0.3 * arrayskip; // \@arstrutbox in lttab.dtx

  var totalHeight = 0; // Set a position for \hline(s) at the top of the array, if any.

  function setHLinePos(hlinesInGap) {
    for (var i = 0; i < hlinesInGap.length; ++i) {
      if (i > 0) {
        totalHeight += 0.25;
      }

      hlines.push({
        pos: totalHeight,
        isDashed: hlinesInGap[i]
      });
    }
  }

  setHLinePos(hLinesBeforeRow[0]);

  for (r = 0; r < group.body.length; ++r) {
    var inrow = group.body[r];
    var height = arstrutHeight; // \@array adds an \@arstrut

    var depth = arstrutDepth; // to each tow (via the template)

    if (nc < inrow.length) {
      nc = inrow.length;
    }

    var outrow = new Array(inrow.length);

    for (c = 0; c < inrow.length; ++c) {
      var elt = buildHTML_buildGroup(inrow[c], options);

      if (depth < elt.depth) {
        depth = elt.depth;
      }

      if (height < elt.height) {
        height = elt.height;
      }

      outrow[c] = elt;
    }

    var rowGap = group.rowGaps[r];
    var gap = 0;

    if (rowGap) {
      gap = units_calculateSize(rowGap, options);

      if (gap > 0) {
        // \@argarraycr
        gap += arstrutDepth;

        if (depth < gap) {
          depth = gap; // \@xargarraycr
        }

        gap = 0;
      }
    } // In AMS multiline environments such as aligned and gathered, rows
    // correspond to lines that have additional \jot added to the
    // \baselineskip via \openup.


    if (group.addJot) {
      depth += jot;
    }

    outrow.height = height;
    outrow.depth = depth;
    totalHeight += height;
    outrow.pos = totalHeight;
    totalHeight += depth + gap; // \@yargarraycr

    body[r] = outrow; // Set a position for \hline(s), if any.

    setHLinePos(hLinesBeforeRow[r + 1]);
  }

  var offset = totalHeight / 2 + options.fontMetrics().axisHeight;
  var colDescriptions = group.cols || [];
  var cols = [];
  var colSep;
  var colDescrNum;

  for (c = 0, colDescrNum = 0; // Continue while either there are more columns or more column
  // descriptions, so trailing separators don't get lost.
  c < nc || colDescrNum < colDescriptions.length; ++c, ++colDescrNum) {
    var colDescr = colDescriptions[colDescrNum] || {};
    var firstSeparator = true;

    while (colDescr.type === "separator") {
      // If there is more than one separator in a row, add a space
      // between them.
      if (!firstSeparator) {
        colSep = buildCommon.makeSpan(["arraycolsep"], []);
        colSep.style.width = options.fontMetrics().doubleRuleSep + "em";
        cols.push(colSep);
      }

      if (colDescr.separator === "|" || colDescr.separator === ":") {
        var lineType = colDescr.separator === "|" ? "solid" : "dashed";
        var separator = buildCommon.makeSpan(["vertical-separator"], [], options);
        separator.style.height = totalHeight + "em";
        separator.style.borderRightWidth = ruleThickness + "em";
        separator.style.borderRightStyle = lineType;
        separator.style.margin = "0 -" + ruleThickness / 2 + "em";
        separator.style.verticalAlign = -(totalHeight - offset) + "em";
        cols.push(separator);
      } else {
        throw new src_ParseError("Invalid separator type: " + colDescr.separator);
      }

      colDescrNum++;
      colDescr = colDescriptions[colDescrNum] || {};
      firstSeparator = false;
    }

    if (c >= nc) {
      continue;
    }

    var sepwidth = void 0;

    if (c > 0 || group.hskipBeforeAndAfter) {
      sepwidth = utils.deflt(colDescr.pregap, arraycolsep);

      if (sepwidth !== 0) {
        colSep = buildCommon.makeSpan(["arraycolsep"], []);
        colSep.style.width = sepwidth + "em";
        cols.push(colSep);
      }
    }

    var col = [];

    for (r = 0; r < nr; ++r) {
      var row = body[r];
      var elem = row[c];

      if (!elem) {
        continue;
      }

      var shift = row.pos - offset;
      elem.depth = row.depth;
      elem.height = row.height;
      col.push({
        type: "elem",
        elem: elem,
        shift: shift
      });
    }

    col = buildCommon.makeVList({
      positionType: "individualShift",
      children: col
    }, options);
    col = buildCommon.makeSpan(["col-align-" + (colDescr.align || "c")], [col]);
    cols.push(col);

    if (c < nc - 1 || group.hskipBeforeAndAfter) {
      sepwidth = utils.deflt(colDescr.postgap, arraycolsep);

      if (sepwidth !== 0) {
        colSep = buildCommon.makeSpan(["arraycolsep"], []);
        colSep.style.width = sepwidth + "em";
        cols.push(colSep);
      }
    }
  }

  body = buildCommon.makeSpan(["mtable"], cols); // Add \hline(s), if any.

  if (hlines.length > 0) {
    var line = buildCommon.makeLineSpan("hline", options, ruleThickness);
    var dashes = buildCommon.makeLineSpan("hdashline", options, ruleThickness);
    var vListElems = [{
      type: "elem",
      elem: body,
      shift: 0
    }];

    while (hlines.length > 0) {
      var hline = hlines.pop();
      var lineShift = hline.pos - offset;

      if (hline.isDashed) {
        vListElems.push({
          type: "elem",
          elem: dashes,
          shift: lineShift
        });
      } else {
        vListElems.push({
          type: "elem",
          elem: line,
          shift: lineShift
        });
      }
    }

    body = buildCommon.makeVList({
      positionType: "individualShift",
      children: vListElems
    }, options);
  }

  return buildCommon.makeSpan(["mord"], [body], options);
};

var alignMap = {
  c: "center ",
  l: "left ",
  r: "right "
};

var array_mathmlBuilder = function mathmlBuilder(group, options) {
  var table = new mathMLTree.MathNode("mtable", group.body.map(function (row) {
    return new mathMLTree.MathNode("mtr", row.map(function (cell) {
      return new mathMLTree.MathNode("mtd", [buildMathML_buildGroup(cell, options)]);
    }));
  })); // Set column alignment, row spacing, column spacing, and
  // array lines by setting attributes on the table element.
  // Set the row spacing. In MathML, we specify a gap distance.
  // We do not use rowGap[] because MathML automatically increases
  // cell height with the height/depth of the element content.
  // LaTeX \arraystretch multiplies the row baseline-to-baseline distance.
  // We simulate this by adding (arraystretch - 1)em to the gap. This
  // does a reasonable job of adjusting arrays containing 1 em tall content.
  // The 0.16 and 0.09 values are found emprically. They produce an array
  // similar to LaTeX and in which content does not interfere with \hines.

  var gap = group.arraystretch === 0.5 ? 0.1 // {smallmatrix}, {subarray}
  : 0.16 + group.arraystretch - 1 + (group.addJot ? 0.09 : 0);
  table.setAttribute("rowspacing", gap + "em"); // MathML table lines go only between cells.
  // To place a line on an edge we'll use <menclose>, if necessary.

  var menclose = "";
  var align = "";

  if (group.cols) {
    // Find column alignment, column spacing, and  vertical lines.
    var cols = group.cols;
    var columnLines = "";
    var prevTypeWasAlign = false;
    var iStart = 0;
    var iEnd = cols.length;

    if (cols[0].type === "separator") {
      menclose += "top ";
      iStart = 1;
    }

    if (cols[cols.length - 1].type === "separator") {
      menclose += "bottom ";
      iEnd -= 1;
    }

    for (var i = iStart; i < iEnd; i++) {
      if (cols[i].type === "align") {
        align += alignMap[cols[i].align];

        if (prevTypeWasAlign) {
          columnLines += "none ";
        }

        prevTypeWasAlign = true;
      } else if (cols[i].type === "separator") {
        // MathML accepts only single lines between cells.
        // So we read only the first of consecutive separators.
        if (prevTypeWasAlign) {
          columnLines += cols[i].separator === "|" ? "solid " : "dashed ";
          prevTypeWasAlign = false;
        }
      }
    }

    table.setAttribute("columnalign", align.trim());

    if (/[sd]/.test(columnLines)) {
      table.setAttribute("columnlines", columnLines.trim());
    }
  } // Set column spacing.


  if (group.colSeparationType === "align") {
    var _cols = group.cols || [];

    var spacing = "";

    for (var _i = 1; _i < _cols.length; _i++) {
      spacing += _i % 2 ? "0em " : "1em ";
    }

    table.setAttribute("columnspacing", spacing.trim());
  } else if (group.colSeparationType === "alignat") {
    table.setAttribute("columnspacing", "0em");
  } else if (group.colSeparationType === "small") {
    table.setAttribute("columnspacing", "0.2778em");
  } else {
    table.setAttribute("columnspacing", "1em");
  } // Address \hline and \hdashline


  var rowLines = "";
  var hlines = group.hLinesBeforeRow;
  menclose += hlines[0].length > 0 ? "left " : "";
  menclose += hlines[hlines.length - 1].length > 0 ? "right " : "";

  for (var _i2 = 1; _i2 < hlines.length - 1; _i2++) {
    rowLines += hlines[_i2].length === 0 ? "none " // MathML accepts only a single line between rows. Read one element.
    : hlines[_i2][0] ? "dashed " : "solid ";
  }

  if (/[sd]/.test(rowLines)) {
    table.setAttribute("rowlines", rowLines.trim());
  }

  if (menclose !== "") {
    table = new mathMLTree.MathNode("menclose", [table]);
    table.setAttribute("notation", menclose.trim());
  }

  if (group.arraystretch && group.arraystretch < 1) {
    // A small array. Wrap in scriptstyle so row gap is not too large.
    table = new mathMLTree.MathNode("mstyle", [table]);
    table.setAttribute("scriptlevel", "1");
  }

  return table;
}; // Convenience function for aligned and alignedat environments.


var array_alignedHandler = function alignedHandler(context, args) {
  var cols = [];
  var res = parseArray(context.parser, {
    cols: cols,
    addJot: true
  }, "display"); // Determining number of columns.
  // 1. If the first argument is given, we use it as a number of columns,
  //    and makes sure that each row doesn't exceed that number.
  // 2. Otherwise, just count number of columns = maximum number
  //    of cells in each row ("aligned" mode -- isAligned will be true).
  //
  // At the same time, prepend empty group {} at beginning of every second
  // cell in each row (starting with second cell) so that operators become
  // binary.  This behavior is implemented in amsmath's \start@aligned.

  var numMaths;
  var numCols = 0;
  var emptyGroup = {
    type: "ordgroup",
    mode: context.mode,
    body: []
  };
  var ordgroup = checkNodeType(args[0], "ordgroup");

  if (ordgroup) {
    var arg0 = "";

    for (var i = 0; i < ordgroup.body.length; i++) {
      var textord = assertNodeType(ordgroup.body[i], "textord");
      arg0 += textord.text;
    }

    numMaths = Number(arg0);
    numCols = numMaths * 2;
  }

  var isAligned = !numCols;
  res.body.forEach(function (row) {
    for (var _i3 = 1; _i3 < row.length; _i3 += 2) {
      // Modify ordgroup node within styling node
      var styling = assertNodeType(row[_i3], "styling");

      var _ordgroup = assertNodeType(styling.body[0], "ordgroup");

      _ordgroup.body.unshift(emptyGroup);
    }

    if (!isAligned) {
      // Case 1
      var curMaths = row.length / 2;

      if (numMaths < curMaths) {
        throw new src_ParseError("Too many math in a row: " + ("expected " + numMaths + ", but got " + curMaths), row[0]);
      }
    } else if (numCols < row.length) {
      // Case 2
      numCols = row.length;
    }
  }); // Adjusting alignment.
  // In aligned mode, we add one \qquad between columns;
  // otherwise we add nothing.

  for (var _i4 = 0; _i4 < numCols; ++_i4) {
    var align = "r";
    var pregap = 0;

    if (_i4 % 2 === 1) {
      align = "l";
    } else if (_i4 > 0 && isAligned) {
      // "aligned" mode.
      pregap = 1; // add one \quad
    }

    cols[_i4] = {
      type: "align",
      align: align,
      pregap: pregap,
      postgap: 0
    };
  }

  res.colSeparationType = isAligned ? "align" : "alignat";
  return res;
}; // Arrays are part of LaTeX, defined in lttab.dtx so its documentation
// is part of the source2e.pdf file of LaTeX2e source documentation.
// {darray} is an {array} environment where cells are set in \displaystyle,
// as defined in nccmath.sty.


defineEnvironment({
  type: "array",
  names: ["array", "darray"],
  props: {
    numArgs: 1
  },
  handler: function handler(context, args) {
    // Since no types are specified above, the two possibilities are
    // - The argument is wrapped in {} or [], in which case Parser's
    //   parseGroup() returns an "ordgroup" wrapping some symbol node.
    // - The argument is a bare symbol node.
    var symNode = checkSymbolNodeType(args[0]);
    var colalign = symNode ? [args[0]] : assertNodeType(args[0], "ordgroup").body;
    var cols = colalign.map(function (nde) {
      var node = assertSymbolNodeType(nde);
      var ca = node.text;

      if ("lcr".indexOf(ca) !== -1) {
        return {
          type: "align",
          align: ca
        };
      } else if (ca === "|") {
        return {
          type: "separator",
          separator: "|"
        };
      } else if (ca === ":") {
        return {
          type: "separator",
          separator: ":"
        };
      }

      throw new src_ParseError("Unknown column alignment: " + ca, nde);
    });
    var res = {
      cols: cols,
      hskipBeforeAndAfter: true // \@preamble in lttab.dtx

    };
    return parseArray(context.parser, res, dCellStyle(context.envName));
  },
  htmlBuilder: array_htmlBuilder,
  mathmlBuilder: array_mathmlBuilder
}); // The matrix environments of amsmath builds on the array environment
// of LaTeX, which is discussed above.

defineEnvironment({
  type: "array",
  names: ["matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix"],
  props: {
    numArgs: 0
  },
  handler: function handler(context) {
    var delimiters = {
      "matrix": null,
      "pmatrix": ["(", ")"],
      "bmatrix": ["[", "]"],
      "Bmatrix": ["\\{", "\\}"],
      "vmatrix": ["|", "|"],
      "Vmatrix": ["\\Vert", "\\Vert"]
    }[context.envName]; // \hskip -\arraycolsep in amsmath

    var payload = {
      hskipBeforeAndAfter: false
    };
    var res = parseArray(context.parser, payload, dCellStyle(context.envName));
    return delimiters ? {
      type: "leftright",
      mode: context.mode,
      body: [res],
      left: delimiters[0],
      right: delimiters[1],
      rightColor: undefined // \right uninfluenced by \color in array

    } : res;
  },
  htmlBuilder: array_htmlBuilder,
  mathmlBuilder: array_mathmlBuilder
});
defineEnvironment({
  type: "array",
  names: ["smallmatrix"],
  props: {
    numArgs: 0
  },
  handler: function handler(context) {
    var payload = {
      arraystretch: 0.5
    };
    var res = parseArray(context.parser, payload, "script");
    res.colSeparationType = "small";
    return res;
  },
  htmlBuilder: array_htmlBuilder,
  mathmlBuilder: array_mathmlBuilder
});
defineEnvironment({
  type: "array",
  names: ["subarray"],
  props: {
    numArgs: 1
  },
  handler: function handler(context, args) {
    // Parsing of {subarray} is similar to {array}
    var symNode = checkSymbolNodeType(args[0]);
    var colalign = symNode ? [args[0]] : assertNodeType(args[0], "ordgroup").body;
    var cols = colalign.map(function (nde) {
      var node = assertSymbolNodeType(nde);
      var ca = node.text; // {subarray} only recognizes "l" & "c"

      if ("lc".indexOf(ca) !== -1) {
        return {
          type: "align",
          align: ca
        };
      }

      throw new src_ParseError("Unknown column alignment: " + ca, nde);
    });

    if (cols.length > 1) {
      throw new src_ParseError("{subarray} can contain only one column");
    }

    var res = {
      cols: cols,
      hskipBeforeAndAfter: false,
      arraystretch: 0.5
    };
    res = parseArray(context.parser, res, "script");

    if (res.body[0].length > 1) {
      throw new src_ParseError("{subarray} can contain only one column");
    }

    return res;
  },
  htmlBuilder: array_htmlBuilder,
  mathmlBuilder: array_mathmlBuilder
}); // A cases environment (in amsmath.sty) is almost equivalent to
// \def\arraystretch{1.2}%
// \left\{\begin{array}{@{}l@{\quad}l@{}} … \end{array}\right.
// {dcases} is a {cases} environment where cells are set in \displaystyle,
// as defined in mathtools.sty.

defineEnvironment({
  type: "array",
  names: ["cases", "dcases"],
  props: {
    numArgs: 0
  },
  handler: function handler(context) {
    var payload = {
      arraystretch: 1.2,
      cols: [{
        type: "align",
        align: "l",
        pregap: 0,
        // TODO(kevinb) get the current style.
        // For now we use the metrics for TEXT style which is what we were
        // doing before.  Before attempting to get the current style we
        // should look at TeX's behavior especially for \over and matrices.
        postgap: 1.0
        /* 1em quad */

      }, {
        type: "align",
        align: "l",
        pregap: 0,
        postgap: 0
      }]
    };
    var res = parseArray(context.parser, payload, dCellStyle(context.envName));
    return {
      type: "leftright",
      mode: context.mode,
      body: [res],
      left: "\\{",
      right: ".",
      rightColor: undefined
    };
  },
  htmlBuilder: array_htmlBuilder,
  mathmlBuilder: array_mathmlBuilder
}); // An aligned environment is like the align* environment
// except it operates within math mode.
// Note that we assume \nomallineskiplimit to be zero,
// so that \strut@ is the same as \strut.

defineEnvironment({
  type: "array",
  names: ["aligned"],
  props: {
    numArgs: 0
  },
  handler: array_alignedHandler,
  htmlBuilder: array_htmlBuilder,
  mathmlBuilder: array_mathmlBuilder
}); // A gathered environment is like an array environment with one centered
// column, but where rows are considered lines so get \jot line spacing
// and contents are set in \displaystyle.

defineEnvironment({
  type: "array",
  names: ["gathered"],
  props: {
    numArgs: 0
  },
  handler: function handler(context) {
    var res = {
      cols: [{
        type: "align",
        align: "c"
      }],
      addJot: true
    };
    return parseArray(context.parser, res, "display");
  },
  htmlBuilder: array_htmlBuilder,
  mathmlBuilder: array_mathmlBuilder
}); // alignat environment is like an align environment, but one must explicitly
// specify maximum number of columns in each row, and can adjust spacing between
// each columns.

defineEnvironment({
  type: "array",
  names: ["alignedat"],
  // One for numbered and for unnumbered;
  // but, KaTeX doesn't supports math numbering yet,
  // they make no difference for now.
  props: {
    numArgs: 1
  },
  handler: array_alignedHandler,
  htmlBuilder: array_htmlBuilder,
  mathmlBuilder: array_mathmlBuilder
}); // Catch \hline outside array environment

defineFunction({
  type: "text",
  // Doesn't matter what this is.
  names: ["\\hline", "\\hdashline"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInMath: true
  },
  handler: function handler(context, args) {
    throw new src_ParseError(context.funcName + " valid only within array environment");
  }
});
// CONCATENATED MODULE: ./src/environments.js

var environments = _environments;
/* harmony default export */ var src_environments = (environments); // All environment definitions should be imported below


// CONCATENATED MODULE: ./src/functions/environment.js



 // Environment delimiters. HTML/MathML rendering is defined in the corresponding
// defineEnvironment definitions.
// $FlowFixMe, "environment" handler returns an environment ParseNode

defineFunction({
  type: "environment",
  names: ["\\begin", "\\end"],
  props: {
    numArgs: 1,
    argTypes: ["text"]
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var nameGroup = args[0];

    if (nameGroup.type !== "ordgroup") {
      throw new src_ParseError("Invalid environment name", nameGroup);
    }

    var envName = "";

    for (var i = 0; i < nameGroup.body.length; ++i) {
      envName += assertNodeType(nameGroup.body[i], "textord").text;
    }

    if (funcName === "\\begin") {
      // begin...end is similar to left...right
      if (!src_environments.hasOwnProperty(envName)) {
        throw new src_ParseError("No such environment: " + envName, nameGroup);
      } // Build the environment object. Arguments and other information will
      // be made available to the begin and end methods using properties.


      var env = src_environments[envName];

      var _parser$parseArgument = parser.parseArguments("\\begin{" + envName + "}", env),
          _args = _parser$parseArgument.args,
          optArgs = _parser$parseArgument.optArgs;

      var context = {
        mode: parser.mode,
        envName: envName,
        parser: parser
      };
      var result = env.handler(context, _args, optArgs);
      parser.expect("\\end", false);
      var endNameToken = parser.nextToken;
      var end = assertNodeType(parser.parseFunction(), "environment");

      if (end.name !== envName) {
        throw new src_ParseError("Mismatch: \\begin{" + envName + "} matched by \\end{" + end.name + "}", endNameToken);
      }

      return result;
    }

    return {
      type: "environment",
      mode: parser.mode,
      name: envName,
      nameGroup: nameGroup
    };
  }
});
// CONCATENATED MODULE: ./src/functions/mclass.js






var mclass_makeSpan = buildCommon.makeSpan;

function mclass_htmlBuilder(group, options) {
  var elements = buildHTML_buildExpression(group.body, options, true);
  return mclass_makeSpan([group.mclass], elements, options);
}

function mclass_mathmlBuilder(group, options) {
  var node;
  var inner = buildMathML_buildExpression(group.body, options);

  if (group.mclass === "minner") {
    return mathMLTree.newDocumentFragment(inner);
  } else if (group.mclass === "mord") {
    if (group.isCharacterBox) {
      node = inner[0];
      node.type = "mi";
    } else {
      node = new mathMLTree.MathNode("mi", inner);
    }
  } else {
    if (group.isCharacterBox) {
      node = inner[0];
      node.type = "mo";
    } else {
      node = new mathMLTree.MathNode("mo", inner);
    } // Set spacing based on what is the most likely adjacent atom type.
    // See TeXbook p170.


    if (group.mclass === "mbin") {
      node.attributes.lspace = "0.22em"; // medium space

      node.attributes.rspace = "0.22em";
    } else if (group.mclass === "mpunct") {
      node.attributes.lspace = "0em";
      node.attributes.rspace = "0.17em"; // thinspace
    } else if (group.mclass === "mopen" || group.mclass === "mclose") {
      node.attributes.lspace = "0em";
      node.attributes.rspace = "0em";
    } // MathML <mo> default space is 5/18 em, so <mrel> needs no action.
    // Ref: https://developer.mozilla.org/en-US/docs/Web/MathML/Element/mo

  }

  return node;
} // Math class commands except \mathop


defineFunction({
  type: "mclass",
  names: ["\\mathord", "\\mathbin", "\\mathrel", "\\mathopen", "\\mathclose", "\\mathpunct", "\\mathinner"],
  props: {
    numArgs: 1
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var body = args[0];
    return {
      type: "mclass",
      mode: parser.mode,
      mclass: "m" + funcName.substr(5),
      // TODO(kevinb): don't prefix with 'm'
      body: defineFunction_ordargument(body),
      isCharacterBox: utils.isCharacterBox(body)
    };
  },
  htmlBuilder: mclass_htmlBuilder,
  mathmlBuilder: mclass_mathmlBuilder
});
var binrelClass = function binrelClass(arg) {
  // \binrel@ spacing varies with (bin|rel|ord) of the atom in the argument.
  // (by rendering separately and with {}s before and after, and measuring
  // the change in spacing).  We'll do roughly the same by detecting the
  // atom type directly.
  var atom = arg.type === "ordgroup" && arg.body.length ? arg.body[0] : arg;

  if (atom.type === "atom" && (atom.family === "bin" || atom.family === "rel")) {
    return "m" + atom.family;
  } else {
    return "mord";
  }
}; // \@binrel{x}{y} renders like y but as mbin/mrel/mord if x is mbin/mrel/mord.
// This is equivalent to \binrel@{x}\binrel@@{y} in AMSTeX.

defineFunction({
  type: "mclass",
  names: ["\\@binrel"],
  props: {
    numArgs: 2
  },
  handler: function handler(_ref2, args) {
    var parser = _ref2.parser;
    return {
      type: "mclass",
      mode: parser.mode,
      mclass: binrelClass(args[0]),
      body: [args[1]],
      isCharacterBox: utils.isCharacterBox(args[1])
    };
  }
}); // Build a relation or stacked op by placing one symbol on top of another

defineFunction({
  type: "mclass",
  names: ["\\stackrel", "\\overset", "\\underset"],
  props: {
    numArgs: 2
  },
  handler: function handler(_ref3, args) {
    var parser = _ref3.parser,
        funcName = _ref3.funcName;
    var baseArg = args[1];
    var shiftedArg = args[0];
    var mclass;

    if (funcName !== "\\stackrel") {
      // LaTeX applies \binrel spacing to \overset and \underset.
      mclass = binrelClass(baseArg);
    } else {
      mclass = "mrel"; // for \stackrel
    }

    var baseOp = {
      type: "op",
      mode: baseArg.mode,
      limits: true,
      alwaysHandleSupSub: true,
      parentIsSupSub: false,
      symbol: false,
      suppressBaseShift: funcName !== "\\stackrel",
      body: defineFunction_ordargument(baseArg)
    };
    var supsub = {
      type: "supsub",
      mode: shiftedArg.mode,
      base: baseOp,
      sup: funcName === "\\underset" ? null : shiftedArg,
      sub: funcName === "\\underset" ? shiftedArg : null
    };
    return {
      type: "mclass",
      mode: parser.mode,
      mclass: mclass,
      body: [supsub],
      isCharacterBox: utils.isCharacterBox(supsub)
    };
  },
  htmlBuilder: mclass_htmlBuilder,
  mathmlBuilder: mclass_mathmlBuilder
});
// CONCATENATED MODULE: ./src/functions/font.js
// TODO(kevinb): implement \\sl and \\sc






var font_htmlBuilder = function htmlBuilder(group, options) {
  var font = group.font;
  var newOptions = options.withFont(font);
  return buildHTML_buildGroup(group.body, newOptions);
};

var font_mathmlBuilder = function mathmlBuilder(group, options) {
  var font = group.font;
  var newOptions = options.withFont(font);
  return buildMathML_buildGroup(group.body, newOptions);
};

var fontAliases = {
  "\\Bbb": "\\mathbb",
  "\\bold": "\\mathbf",
  "\\frak": "\\mathfrak",
  "\\bm": "\\boldsymbol"
};
defineFunction({
  type: "font",
  names: [// styles, except \boldsymbol defined below
  "\\mathrm", "\\mathit", "\\mathbf", "\\mathnormal", // families
  "\\mathbb", "\\mathcal", "\\mathfrak", "\\mathscr", "\\mathsf", "\\mathtt", // aliases, except \bm defined below
  "\\Bbb", "\\bold", "\\frak"],
  props: {
    numArgs: 1,
    greediness: 2
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var body = args[0];
    var func = funcName;

    if (func in fontAliases) {
      func = fontAliases[func];
    }

    return {
      type: "font",
      mode: parser.mode,
      font: func.slice(1),
      body: body
    };
  },
  htmlBuilder: font_htmlBuilder,
  mathmlBuilder: font_mathmlBuilder
});
defineFunction({
  type: "mclass",
  names: ["\\boldsymbol", "\\bm"],
  props: {
    numArgs: 1,
    greediness: 2
  },
  handler: function handler(_ref2, args) {
    var parser = _ref2.parser;
    var body = args[0];
    var isCharacterBox = utils.isCharacterBox(body); // amsbsy.sty's \boldsymbol uses \binrel spacing to inherit the
    // argument's bin|rel|ord status

    return {
      type: "mclass",
      mode: parser.mode,
      mclass: binrelClass(body),
      body: [{
        type: "font",
        mode: parser.mode,
        font: "boldsymbol",
        body: body
      }],
      isCharacterBox: isCharacterBox
    };
  }
}); // Old font changing functions

defineFunction({
  type: "font",
  names: ["\\rm", "\\sf", "\\tt", "\\bf", "\\it"],
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler: function handler(_ref3, args) {
    var parser = _ref3.parser,
        funcName = _ref3.funcName,
        breakOnTokenText = _ref3.breakOnTokenText;
    var mode = parser.mode;
    var body = parser.parseExpression(true, breakOnTokenText);
    var style = "math" + funcName.slice(1);
    return {
      type: "font",
      mode: mode,
      font: style,
      body: {
        type: "ordgroup",
        mode: parser.mode,
        body: body
      }
    };
  },
  htmlBuilder: font_htmlBuilder,
  mathmlBuilder: font_mathmlBuilder
});
// CONCATENATED MODULE: ./src/functions/genfrac.js











var genfrac_adjustStyle = function adjustStyle(size, originalStyle) {
  // Figure out what style this fraction should be in based on the
  // function used
  var style = originalStyle;

  if (size === "display") {
    // Get display style as a default.
    // If incoming style is sub/sup, use style.text() to get correct size.
    style = style.id >= src_Style.SCRIPT.id ? style.text() : src_Style.DISPLAY;
  } else if (size === "text" && style.size === src_Style.DISPLAY.size) {
    // We're in a \tfrac but incoming style is displaystyle, so:
    style = src_Style.TEXT;
  } else if (size === "script") {
    style = src_Style.SCRIPT;
  } else if (size === "scriptscript") {
    style = src_Style.SCRIPTSCRIPT;
  }

  return style;
};

var genfrac_htmlBuilder = function htmlBuilder(group, options) {
  // Fractions are handled in the TeXbook on pages 444-445, rules 15(a-e).
  var style = genfrac_adjustStyle(group.size, options.style);
  var nstyle = style.fracNum();
  var dstyle = style.fracDen();
  var newOptions;
  newOptions = options.havingStyle(nstyle);
  var numerm = buildHTML_buildGroup(group.numer, newOptions, options);

  if (group.continued) {
    // \cfrac inserts a \strut into the numerator.
    // Get \strut dimensions from TeXbook page 353.
    var hStrut = 8.5 / options.fontMetrics().ptPerEm;
    var dStrut = 3.5 / options.fontMetrics().ptPerEm;
    numerm.height = numerm.height < hStrut ? hStrut : numerm.height;
    numerm.depth = numerm.depth < dStrut ? dStrut : numerm.depth;
  }

  newOptions = options.havingStyle(dstyle);
  var denomm = buildHTML_buildGroup(group.denom, newOptions, options);
  var rule;
  var ruleWidth;
  var ruleSpacing;

  if (group.hasBarLine) {
    if (group.barSize) {
      ruleWidth = units_calculateSize(group.barSize, options);
      rule = buildCommon.makeLineSpan("frac-line", options, ruleWidth);
    } else {
      rule = buildCommon.makeLineSpan("frac-line", options);
    }

    ruleWidth = rule.height;
    ruleSpacing = rule.height;
  } else {
    rule = null;
    ruleWidth = 0;
    ruleSpacing = options.fontMetrics().defaultRuleThickness;
  } // Rule 15b


  var numShift;
  var clearance;
  var denomShift;

  if (style.size === src_Style.DISPLAY.size || group.size === "display") {
    numShift = options.fontMetrics().num1;

    if (ruleWidth > 0) {
      clearance = 3 * ruleSpacing;
    } else {
      clearance = 7 * ruleSpacing;
    }

    denomShift = options.fontMetrics().denom1;
  } else {
    if (ruleWidth > 0) {
      numShift = options.fontMetrics().num2;
      clearance = ruleSpacing;
    } else {
      numShift = options.fontMetrics().num3;
      clearance = 3 * ruleSpacing;
    }

    denomShift = options.fontMetrics().denom2;
  }

  var frac;

  if (!rule) {
    // Rule 15c
    var candidateClearance = numShift - numerm.depth - (denomm.height - denomShift);

    if (candidateClearance < clearance) {
      numShift += 0.5 * (clearance - candidateClearance);
      denomShift += 0.5 * (clearance - candidateClearance);
    }

    frac = buildCommon.makeVList({
      positionType: "individualShift",
      children: [{
        type: "elem",
        elem: denomm,
        shift: denomShift
      }, {
        type: "elem",
        elem: numerm,
        shift: -numShift
      }]
    }, options);
  } else {
    // Rule 15d
    var axisHeight = options.fontMetrics().axisHeight;

    if (numShift - numerm.depth - (axisHeight + 0.5 * ruleWidth) < clearance) {
      numShift += clearance - (numShift - numerm.depth - (axisHeight + 0.5 * ruleWidth));
    }

    if (axisHeight - 0.5 * ruleWidth - (denomm.height - denomShift) < clearance) {
      denomShift += clearance - (axisHeight - 0.5 * ruleWidth - (denomm.height - denomShift));
    }

    var midShift = -(axisHeight - 0.5 * ruleWidth);
    frac = buildCommon.makeVList({
      positionType: "individualShift",
      children: [{
        type: "elem",
        elem: denomm,
        shift: denomShift
      }, {
        type: "elem",
        elem: rule,
        shift: midShift
      }, {
        type: "elem",
        elem: numerm,
        shift: -numShift
      }]
    }, options);
  } // Since we manually change the style sometimes (with \dfrac or \tfrac),
  // account for the possible size change here.


  newOptions = options.havingStyle(style);
  frac.height *= newOptions.sizeMultiplier / options.sizeMultiplier;
  frac.depth *= newOptions.sizeMultiplier / options.sizeMultiplier; // Rule 15e

  var delimSize;

  if (style.size === src_Style.DISPLAY.size) {
    delimSize = options.fontMetrics().delim1;
  } else {
    delimSize = options.fontMetrics().delim2;
  }

  var leftDelim;
  var rightDelim;

  if (group.leftDelim == null) {
    leftDelim = makeNullDelimiter(options, ["mopen"]);
  } else {
    leftDelim = delimiter.customSizedDelim(group.leftDelim, delimSize, true, options.havingStyle(style), group.mode, ["mopen"]);
  }

  if (group.continued) {
    rightDelim = buildCommon.makeSpan([]); // zero width for \cfrac
  } else if (group.rightDelim == null) {
    rightDelim = makeNullDelimiter(options, ["mclose"]);
  } else {
    rightDelim = delimiter.customSizedDelim(group.rightDelim, delimSize, true, options.havingStyle(style), group.mode, ["mclose"]);
  }

  return buildCommon.makeSpan(["mord"].concat(newOptions.sizingClasses(options)), [leftDelim, buildCommon.makeSpan(["mfrac"], [frac]), rightDelim], options);
};

var genfrac_mathmlBuilder = function mathmlBuilder(group, options) {
  var node = new mathMLTree.MathNode("mfrac", [buildMathML_buildGroup(group.numer, options), buildMathML_buildGroup(group.denom, options)]);

  if (!group.hasBarLine) {
    node.setAttribute("linethickness", "0px");
  } else if (group.barSize) {
    var ruleWidth = units_calculateSize(group.barSize, options);
    node.setAttribute("linethickness", ruleWidth + "em");
  }

  var style = genfrac_adjustStyle(group.size, options.style);

  if (style.size !== options.style.size) {
    node = new mathMLTree.MathNode("mstyle", [node]);
    var isDisplay = style.size === src_Style.DISPLAY.size ? "true" : "false";
    node.setAttribute("displaystyle", isDisplay);
    node.setAttribute("scriptlevel", "0");
  }

  if (group.leftDelim != null || group.rightDelim != null) {
    var withDelims = [];

    if (group.leftDelim != null) {
      var leftOp = new mathMLTree.MathNode("mo", [new mathMLTree.TextNode(group.leftDelim.replace("\\", ""))]);
      leftOp.setAttribute("fence", "true");
      withDelims.push(leftOp);
    }

    withDelims.push(node);

    if (group.rightDelim != null) {
      var rightOp = new mathMLTree.MathNode("mo", [new mathMLTree.TextNode(group.rightDelim.replace("\\", ""))]);
      rightOp.setAttribute("fence", "true");
      withDelims.push(rightOp);
    }

    return buildMathML_makeRow(withDelims);
  }

  return node;
};

defineFunction({
  type: "genfrac",
  names: ["\\cfrac", "\\dfrac", "\\frac", "\\tfrac", "\\dbinom", "\\binom", "\\tbinom", "\\\\atopfrac", // can’t be entered directly
  "\\\\bracefrac", "\\\\brackfrac"],
  props: {
    numArgs: 2,
    greediness: 2
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var numer = args[0];
    var denom = args[1];
    var hasBarLine;
    var leftDelim = null;
    var rightDelim = null;
    var size = "auto";

    switch (funcName) {
      case "\\cfrac":
      case "\\dfrac":
      case "\\frac":
      case "\\tfrac":
        hasBarLine = true;
        break;

      case "\\\\atopfrac":
        hasBarLine = false;
        break;

      case "\\dbinom":
      case "\\binom":
      case "\\tbinom":
        hasBarLine = false;
        leftDelim = "(";
        rightDelim = ")";
        break;

      case "\\\\bracefrac":
        hasBarLine = false;
        leftDelim = "\\{";
        rightDelim = "\\}";
        break;

      case "\\\\brackfrac":
        hasBarLine = false;
        leftDelim = "[";
        rightDelim = "]";
        break;

      default:
        throw new Error("Unrecognized genfrac command");
    }

    switch (funcName) {
      case "\\cfrac":
      case "\\dfrac":
      case "\\dbinom":
        size = "display";
        break;

      case "\\tfrac":
      case "\\tbinom":
        size = "text";
        break;
    }

    return {
      type: "genfrac",
      mode: parser.mode,
      continued: funcName === "\\cfrac",
      numer: numer,
      denom: denom,
      hasBarLine: hasBarLine,
      leftDelim: leftDelim,
      rightDelim: rightDelim,
      size: size,
      barSize: null
    };
  },
  htmlBuilder: genfrac_htmlBuilder,
  mathmlBuilder: genfrac_mathmlBuilder
}); // Infix generalized fractions -- these are not rendered directly, but replaced
// immediately by one of the variants above.

defineFunction({
  type: "infix",
  names: ["\\over", "\\choose", "\\atop", "\\brace", "\\brack"],
  props: {
    numArgs: 0,
    infix: true
  },
  handler: function handler(_ref2) {
    var parser = _ref2.parser,
        funcName = _ref2.funcName,
        token = _ref2.token;
    var replaceWith;

    switch (funcName) {
      case "\\over":
        replaceWith = "\\frac";
        break;

      case "\\choose":
        replaceWith = "\\binom";
        break;

      case "\\atop":
        replaceWith = "\\\\atopfrac";
        break;

      case "\\brace":
        replaceWith = "\\\\bracefrac";
        break;

      case "\\brack":
        replaceWith = "\\\\brackfrac";
        break;

      default:
        throw new Error("Unrecognized infix genfrac command");
    }

    return {
      type: "infix",
      mode: parser.mode,
      replaceWith: replaceWith,
      token: token
    };
  }
});
var stylArray = ["display", "text", "script", "scriptscript"];

var delimFromValue = function delimFromValue(delimString) {
  var delim = null;

  if (delimString.length > 0) {
    delim = delimString;
    delim = delim === "." ? null : delim;
  }

  return delim;
};

defineFunction({
  type: "genfrac",
  names: ["\\genfrac"],
  props: {
    numArgs: 6,
    greediness: 6,
    argTypes: ["math", "math", "size", "text", "math", "math"]
  },
  handler: function handler(_ref3, args) {
    var parser = _ref3.parser;
    var numer = args[4];
    var denom = args[5]; // Look into the parse nodes to get the desired delimiters.

    var leftNode = checkNodeType(args[0], "atom");

    if (leftNode) {
      leftNode = assertAtomFamily(args[0], "open");
    }

    var leftDelim = leftNode ? delimFromValue(leftNode.text) : null;
    var rightNode = checkNodeType(args[1], "atom");

    if (rightNode) {
      rightNode = assertAtomFamily(args[1], "close");
    }

    var rightDelim = rightNode ? delimFromValue(rightNode.text) : null;
    var barNode = assertNodeType(args[2], "size");
    var hasBarLine;
    var barSize = null;

    if (barNode.isBlank) {
      // \genfrac acts differently than \above.
      // \genfrac treats an empty size group as a signal to use a
      // standard bar size. \above would see size = 0 and omit the bar.
      hasBarLine = true;
    } else {
      barSize = barNode.value;
      hasBarLine = barSize.number > 0;
    } // Find out if we want displaystyle, textstyle, etc.


    var size = "auto";
    var styl = checkNodeType(args[3], "ordgroup");

    if (styl) {
      if (styl.body.length > 0) {
        var textOrd = assertNodeType(styl.body[0], "textord");
        size = stylArray[Number(textOrd.text)];
      }
    } else {
      styl = assertNodeType(args[3], "textord");
      size = stylArray[Number(styl.text)];
    }

    return {
      type: "genfrac",
      mode: parser.mode,
      numer: numer,
      denom: denom,
      continued: false,
      hasBarLine: hasBarLine,
      barSize: barSize,
      leftDelim: leftDelim,
      rightDelim: rightDelim,
      size: size
    };
  },
  htmlBuilder: genfrac_htmlBuilder,
  mathmlBuilder: genfrac_mathmlBuilder
}); // \above is an infix fraction that also defines a fraction bar size.

defineFunction({
  type: "infix",
  names: ["\\above"],
  props: {
    numArgs: 1,
    argTypes: ["size"],
    infix: true
  },
  handler: function handler(_ref4, args) {
    var parser = _ref4.parser,
        funcName = _ref4.funcName,
        token = _ref4.token;
    return {
      type: "infix",
      mode: parser.mode,
      replaceWith: "\\\\abovefrac",
      size: assertNodeType(args[0], "size").value,
      token: token
    };
  }
});
defineFunction({
  type: "genfrac",
  names: ["\\\\abovefrac"],
  props: {
    numArgs: 3,
    argTypes: ["math", "size", "math"]
  },
  handler: function handler(_ref5, args) {
    var parser = _ref5.parser,
        funcName = _ref5.funcName;
    var numer = args[0];
    var barSize = assert(assertNodeType(args[1], "infix").size);
    var denom = args[2];
    var hasBarLine = barSize.number > 0;
    return {
      type: "genfrac",
      mode: parser.mode,
      numer: numer,
      denom: denom,
      continued: false,
      hasBarLine: hasBarLine,
      barSize: barSize,
      leftDelim: null,
      rightDelim: null,
      size: "auto"
    };
  },
  htmlBuilder: genfrac_htmlBuilder,
  mathmlBuilder: genfrac_mathmlBuilder
});
// CONCATENATED MODULE: ./src/functions/horizBrace.js








// NOTE: Unlike most `htmlBuilder`s, this one handles not only "horizBrace", but
var horizBrace_htmlBuilder = function htmlBuilder(grp, options) {
  var style = options.style; // Pull out the `ParseNode<"horizBrace">` if `grp` is a "supsub" node.

  var supSubGroup;
  var group;
  var supSub = checkNodeType(grp, "supsub");

  if (supSub) {
    // Ref: LaTeX source2e: }}}}\limits}
    // i.e. LaTeX treats the brace similar to an op and passes it
    // with \limits, so we need to assign supsub style.
    supSubGroup = supSub.sup ? buildHTML_buildGroup(supSub.sup, options.havingStyle(style.sup()), options) : buildHTML_buildGroup(supSub.sub, options.havingStyle(style.sub()), options);
    group = assertNodeType(supSub.base, "horizBrace");
  } else {
    group = assertNodeType(grp, "horizBrace");
  } // Build the base group


  var body = buildHTML_buildGroup(group.base, options.havingBaseStyle(src_Style.DISPLAY)); // Create the stretchy element

  var braceBody = stretchy.svgSpan(group, options); // Generate the vlist, with the appropriate kerns        ┏━━━━━━━━┓
  // This first vlist contains the content and the brace:   equation

  var vlist;

  if (group.isOver) {
    vlist = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: body
      }, {
        type: "kern",
        size: 0.1
      }, {
        type: "elem",
        elem: braceBody
      }]
    }, options); // $FlowFixMe: Replace this with passing "svg-align" into makeVList.

    vlist.children[0].children[0].children[1].classes.push("svg-align");
  } else {
    vlist = buildCommon.makeVList({
      positionType: "bottom",
      positionData: body.depth + 0.1 + braceBody.height,
      children: [{
        type: "elem",
        elem: braceBody
      }, {
        type: "kern",
        size: 0.1
      }, {
        type: "elem",
        elem: body
      }]
    }, options); // $FlowFixMe: Replace this with passing "svg-align" into makeVList.

    vlist.children[0].children[0].children[0].classes.push("svg-align");
  }

  if (supSubGroup) {
    // To write the supsub, wrap the first vlist in another vlist:
    // They can't all go in the same vlist, because the note might be
    // wider than the equation. We want the equation to control the
    // brace width.
    //      note          long note           long note
    //   ┏━━━━━━━━┓   or    ┏━━━┓     not    ┏━━━━━━━━━┓
    //    equation           eqn                 eqn
    var vSpan = buildCommon.makeSpan(["mord", group.isOver ? "mover" : "munder"], [vlist], options);

    if (group.isOver) {
      vlist = buildCommon.makeVList({
        positionType: "firstBaseline",
        children: [{
          type: "elem",
          elem: vSpan
        }, {
          type: "kern",
          size: 0.2
        }, {
          type: "elem",
          elem: supSubGroup
        }]
      }, options);
    } else {
      vlist = buildCommon.makeVList({
        positionType: "bottom",
        positionData: vSpan.depth + 0.2 + supSubGroup.height + supSubGroup.depth,
        children: [{
          type: "elem",
          elem: supSubGroup
        }, {
          type: "kern",
          size: 0.2
        }, {
          type: "elem",
          elem: vSpan
        }]
      }, options);
    }
  }

  return buildCommon.makeSpan(["mord", group.isOver ? "mover" : "munder"], [vlist], options);
};

var horizBrace_mathmlBuilder = function mathmlBuilder(group, options) {
  var accentNode = stretchy.mathMLnode(group.label);
  return new mathMLTree.MathNode(group.isOver ? "mover" : "munder", [buildMathML_buildGroup(group.base, options), accentNode]);
}; // Horizontal stretchy braces


defineFunction({
  type: "horizBrace",
  names: ["\\overbrace", "\\underbrace"],
  props: {
    numArgs: 1
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    return {
      type: "horizBrace",
      mode: parser.mode,
      label: funcName,
      isOver: /^\\over/.test(funcName),
      base: args[0]
    };
  },
  htmlBuilder: horizBrace_htmlBuilder,
  mathmlBuilder: horizBrace_mathmlBuilder
});
// CONCATENATED MODULE: ./src/functions/href.js






defineFunction({
  type: "href",
  names: ["\\href"],
  props: {
    numArgs: 2,
    argTypes: ["url", "original"],
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser;
    var body = args[1];
    var href = assertNodeType(args[0], "url").url;

    if (!parser.settings.isTrusted({
      command: "\\href",
      url: href
    })) {
      return parser.formatUnsupportedCmd("\\href");
    }

    return {
      type: "href",
      mode: parser.mode,
      href: href,
      body: defineFunction_ordargument(body)
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var elements = buildHTML_buildExpression(group.body, options, false);
    return buildCommon.makeAnchor(group.href, [], elements, options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var math = buildExpressionRow(group.body, options);

    if (!(math instanceof mathMLTree_MathNode)) {
      math = new mathMLTree_MathNode("mrow", [math]);
    }

    math.setAttribute("href", group.href);
    return math;
  }
});
defineFunction({
  type: "href",
  names: ["\\url"],
  props: {
    numArgs: 1,
    argTypes: ["url"],
    allowedInText: true
  },
  handler: function handler(_ref2, args) {
    var parser = _ref2.parser;
    var href = assertNodeType(args[0], "url").url;

    if (!parser.settings.isTrusted({
      command: "\\url",
      url: href
    })) {
      return parser.formatUnsupportedCmd("\\url");
    }

    var chars = [];

    for (var i = 0; i < href.length; i++) {
      var c = href[i];

      if (c === "~") {
        c = "\\textasciitilde";
      }

      chars.push({
        type: "textord",
        mode: "text",
        text: c
      });
    }

    var body = {
      type: "text",
      mode: parser.mode,
      font: "\\texttt",
      body: chars
    };
    return {
      type: "href",
      mode: parser.mode,
      href: href,
      body: defineFunction_ordargument(body)
    };
  }
});
// CONCATENATED MODULE: ./src/functions/htmlmathml.js




defineFunction({
  type: "htmlmathml",
  names: ["\\html@mathml"],
  props: {
    numArgs: 2,
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser;
    return {
      type: "htmlmathml",
      mode: parser.mode,
      html: defineFunction_ordargument(args[0]),
      mathml: defineFunction_ordargument(args[1])
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var elements = buildHTML_buildExpression(group.html, options, false);
    return buildCommon.makeFragment(elements);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    return buildExpressionRow(group.mathml, options);
  }
});
// CONCATENATED MODULE: ./src/functions/includegraphics.js







var includegraphics_sizeData = function sizeData(str) {
  if (/^[-+]? *(\d+(\.\d*)?|\.\d+)$/.test(str)) {
    // str is a number with no unit specified.
    // default unit is bp, per graphix package.
    return {
      number: +str,
      unit: "bp"
    };
  } else {
    var match = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(str);

    if (!match) {
      throw new src_ParseError("Invalid size: '" + str + "' in \\includegraphics");
    }

    var data = {
      number: +(match[1] + match[2]),
      // sign + magnitude, cast to number
      unit: match[3]
    };

    if (!validUnit(data)) {
      throw new src_ParseError("Invalid unit: '" + data.unit + "' in \\includegraphics.");
    }

    return data;
  }
};

defineFunction({
  type: "includegraphics",
  names: ["\\includegraphics"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1,
    argTypes: ["raw", "url"],
    allowedInText: false
  },
  handler: function handler(_ref, args, optArgs) {
    var parser = _ref.parser;
    var width = {
      number: 0,
      unit: "em"
    };
    var height = {
      number: 0.9,
      unit: "em"
    }; // sorta character sized.

    var totalheight = {
      number: 0,
      unit: "em"
    };
    var alt = "";

    if (optArgs[0]) {
      var attributeStr = assertNodeType(optArgs[0], "raw").string; // Parser.js does not parse key/value pairs. We get a string.

      var attributes = attributeStr.split(",");

      for (var i = 0; i < attributes.length; i++) {
        var keyVal = attributes[i].split("=");

        if (keyVal.length === 2) {
          var str = keyVal[1].trim();

          switch (keyVal[0].trim()) {
            case "alt":
              alt = str;
              break;

            case "width":
              width = includegraphics_sizeData(str);
              break;

            case "height":
              height = includegraphics_sizeData(str);
              break;

            case "totalheight":
              totalheight = includegraphics_sizeData(str);
              break;

            default:
              throw new src_ParseError("Invalid key: '" + keyVal[0] + "' in \\includegraphics.");
          }
        }
      }
    }

    var src = assertNodeType(args[0], "url").url;

    if (alt === "") {
      // No alt given. Use the file name. Strip away the path.
      alt = src;
      alt = alt.replace(/^.*[\\/]/, '');
      alt = alt.substring(0, alt.lastIndexOf('.'));
    }

    if (!parser.settings.isTrusted({
      command: "\\includegraphics",
      url: src
    })) {
      return parser.formatUnsupportedCmd("\\includegraphics");
    }

    return {
      type: "includegraphics",
      mode: parser.mode,
      alt: alt,
      width: width,
      height: height,
      totalheight: totalheight,
      src: src
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var height = units_calculateSize(group.height, options);
    var depth = 0;

    if (group.totalheight.number > 0) {
      depth = units_calculateSize(group.totalheight, options) - height;
      depth = Number(depth.toFixed(2));
    }

    var width = 0;

    if (group.width.number > 0) {
      width = units_calculateSize(group.width, options);
    }

    var style = {
      height: height + depth + "em"
    };

    if (width > 0) {
      style.width = width + "em";
    }

    if (depth > 0) {
      style.verticalAlign = -depth + "em";
    }

    var node = new domTree_Img(group.src, group.alt, style);
    node.height = height;
    node.depth = depth;
    return node;
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var node = new mathMLTree.MathNode("mglyph", []);
    node.setAttribute("alt", group.alt);
    var height = units_calculateSize(group.height, options);
    var depth = 0;

    if (group.totalheight.number > 0) {
      depth = units_calculateSize(group.totalheight, options) - height;
      depth = depth.toFixed(2);
      node.setAttribute("valign", "-" + depth + "em");
    }

    node.setAttribute("height", height + depth + "em");

    if (group.width.number > 0) {
      var width = units_calculateSize(group.width, options);
      node.setAttribute("width", width + "em");
    }

    node.setAttribute("src", group.src);
    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/kern.js
// Horizontal spacing commands




 // TODO: \hskip and \mskip should support plus and minus in lengths

defineFunction({
  type: "kern",
  names: ["\\kern", "\\mkern", "\\hskip", "\\mskip"],
  props: {
    numArgs: 1,
    argTypes: ["size"],
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var size = assertNodeType(args[0], "size");

    if (parser.settings.strict) {
      var mathFunction = funcName[1] === 'm'; // \mkern, \mskip

      var muUnit = size.value.unit === 'mu';

      if (mathFunction) {
        if (!muUnit) {
          parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " supports only mu units, " + ("not " + size.value.unit + " units"));
        }

        if (parser.mode !== "math") {
          parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " works only in math mode");
        }
      } else {
        // !mathFunction
        if (muUnit) {
          parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " doesn't support mu units");
        }
      }
    }

    return {
      type: "kern",
      mode: parser.mode,
      dimension: size.value
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    return buildCommon.makeGlue(group.dimension, options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var dimension = units_calculateSize(group.dimension, options);
    return new mathMLTree.SpaceNode(dimension);
  }
});
// CONCATENATED MODULE: ./src/functions/lap.js
// Horizontal overlap functions





defineFunction({
  type: "lap",
  names: ["\\mathllap", "\\mathrlap", "\\mathclap"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var body = args[0];
    return {
      type: "lap",
      mode: parser.mode,
      alignment: funcName.slice(5),
      body: body
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    // mathllap, mathrlap, mathclap
    var inner;

    if (group.alignment === "clap") {
      // ref: https://www.math.lsu.edu/~aperlis/publications/mathclap/
      inner = buildCommon.makeSpan([], [buildHTML_buildGroup(group.body, options)]); // wrap, since CSS will center a .clap > .inner > span

      inner = buildCommon.makeSpan(["inner"], [inner], options);
    } else {
      inner = buildCommon.makeSpan(["inner"], [buildHTML_buildGroup(group.body, options)]);
    }

    var fix = buildCommon.makeSpan(["fix"], []);
    var node = buildCommon.makeSpan([group.alignment], [inner, fix], options); // At this point, we have correctly set horizontal alignment of the
    // two items involved in the lap.
    // Next, use a strut to set the height of the HTML bounding box.
    // Otherwise, a tall argument may be misplaced.

    var strut = buildCommon.makeSpan(["strut"]);
    strut.style.height = node.height + node.depth + "em";
    strut.style.verticalAlign = -node.depth + "em";
    node.children.unshift(strut); // Next, prevent vertical misplacement when next to something tall.

    node = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: node
      }]
    }, options); // Get the horizontal spacing correct relative to adjacent items.

    return buildCommon.makeSpan(["mord"], [node], options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    // mathllap, mathrlap, mathclap
    var node = new mathMLTree.MathNode("mpadded", [buildMathML_buildGroup(group.body, options)]);

    if (group.alignment !== "rlap") {
      var offset = group.alignment === "llap" ? "-1" : "-0.5";
      node.setAttribute("lspace", offset + "width");
    }

    node.setAttribute("width", "0px");
    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/math.js

 // Switching from text mode back to math mode

defineFunction({
  type: "styling",
  names: ["\\(", "$"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInMath: false
  },
  handler: function handler(_ref, args) {
    var funcName = _ref.funcName,
        parser = _ref.parser;
    var outerMode = parser.mode;
    parser.switchMode("math");
    var close = funcName === "\\(" ? "\\)" : "$";
    var body = parser.parseExpression(false, close);
    parser.expect(close);
    parser.switchMode(outerMode);
    return {
      type: "styling",
      mode: parser.mode,
      style: "text",
      body: body
    };
  }
}); // Check for extra closing math delimiters

defineFunction({
  type: "text",
  // Doesn't matter what this is.
  names: ["\\)", "\\]"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInMath: false
  },
  handler: function handler(context, args) {
    throw new src_ParseError("Mismatched " + context.funcName);
  }
});
// CONCATENATED MODULE: ./src/functions/mathchoice.js






var mathchoice_chooseMathStyle = function chooseMathStyle(group, options) {
  switch (options.style.size) {
    case src_Style.DISPLAY.size:
      return group.display;

    case src_Style.TEXT.size:
      return group.text;

    case src_Style.SCRIPT.size:
      return group.script;

    case src_Style.SCRIPTSCRIPT.size:
      return group.scriptscript;

    default:
      return group.text;
  }
};

defineFunction({
  type: "mathchoice",
  names: ["\\mathchoice"],
  props: {
    numArgs: 4
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser;
    return {
      type: "mathchoice",
      mode: parser.mode,
      display: defineFunction_ordargument(args[0]),
      text: defineFunction_ordargument(args[1]),
      script: defineFunction_ordargument(args[2]),
      scriptscript: defineFunction_ordargument(args[3])
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var body = mathchoice_chooseMathStyle(group, options);
    var elements = buildHTML_buildExpression(body, options, false);
    return buildCommon.makeFragment(elements);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var body = mathchoice_chooseMathStyle(group, options);
    return buildExpressionRow(body, options);
  }
});
// CONCATENATED MODULE: ./src/functions/utils/assembleSupSub.js


// For an operator with limits, assemble the base, sup, and sub into a span.
var assembleSupSub_assembleSupSub = function assembleSupSub(base, supGroup, subGroup, options, style, slant, baseShift) {
  // IE 8 clips \int if it is in a display: inline-block. We wrap it
  // in a new span so it is an inline, and works.
  base = buildCommon.makeSpan([], [base]);
  var sub;
  var sup; // We manually have to handle the superscripts and subscripts. This,
  // aside from the kern calculations, is copied from supsub.

  if (supGroup) {
    var elem = buildHTML_buildGroup(supGroup, options.havingStyle(style.sup()), options);
    sup = {
      elem: elem,
      kern: Math.max(options.fontMetrics().bigOpSpacing1, options.fontMetrics().bigOpSpacing3 - elem.depth)
    };
  }

  if (subGroup) {
    var _elem = buildHTML_buildGroup(subGroup, options.havingStyle(style.sub()), options);

    sub = {
      elem: _elem,
      kern: Math.max(options.fontMetrics().bigOpSpacing2, options.fontMetrics().bigOpSpacing4 - _elem.height)
    };
  } // Build the final group as a vlist of the possible subscript, base,
  // and possible superscript.


  var finalGroup;

  if (sup && sub) {
    var bottom = options.fontMetrics().bigOpSpacing5 + sub.elem.height + sub.elem.depth + sub.kern + base.depth + baseShift;
    finalGroup = buildCommon.makeVList({
      positionType: "bottom",
      positionData: bottom,
      children: [{
        type: "kern",
        size: options.fontMetrics().bigOpSpacing5
      }, {
        type: "elem",
        elem: sub.elem,
        marginLeft: -slant + "em"
      }, {
        type: "kern",
        size: sub.kern
      }, {
        type: "elem",
        elem: base
      }, {
        type: "kern",
        size: sup.kern
      }, {
        type: "elem",
        elem: sup.elem,
        marginLeft: slant + "em"
      }, {
        type: "kern",
        size: options.fontMetrics().bigOpSpacing5
      }]
    }, options);
  } else if (sub) {
    var top = base.height - baseShift; // Shift the limits by the slant of the symbol. Note
    // that we are supposed to shift the limits by 1/2 of the slant,
    // but since we are centering the limits adding a full slant of
    // margin will shift by 1/2 that.

    finalGroup = buildCommon.makeVList({
      positionType: "top",
      positionData: top,
      children: [{
        type: "kern",
        size: options.fontMetrics().bigOpSpacing5
      }, {
        type: "elem",
        elem: sub.elem,
        marginLeft: -slant + "em"
      }, {
        type: "kern",
        size: sub.kern
      }, {
        type: "elem",
        elem: base
      }]
    }, options);
  } else if (sup) {
    var _bottom = base.depth + baseShift;

    finalGroup = buildCommon.makeVList({
      positionType: "bottom",
      positionData: _bottom,
      children: [{
        type: "elem",
        elem: base
      }, {
        type: "kern",
        size: sup.kern
      }, {
        type: "elem",
        elem: sup.elem,
        marginLeft: slant + "em"
      }, {
        type: "kern",
        size: options.fontMetrics().bigOpSpacing5
      }]
    }, options);
  } else {
    // This case probably shouldn't occur (this would mean the
    // supsub was sending us a group with no superscript or
    // subscript) but be safe.
    return base;
  }

  return buildCommon.makeSpan(["mop", "op-limits"], [finalGroup], options);
};
// CONCATENATED MODULE: ./src/functions/op.js
// Limits, symbols










// Most operators have a large successor symbol, but these don't.
var noSuccessor = ["\\smallint"]; // NOTE: Unlike most `htmlBuilder`s, this one handles not only "op", but also
// "supsub" since some of them (like \int) can affect super/subscripting.

var op_htmlBuilder = function htmlBuilder(grp, options) {
  // Operators are handled in the TeXbook pg. 443-444, rule 13(a).
  var supGroup;
  var subGroup;
  var hasLimits = false;
  var group;
  var supSub = checkNodeType(grp, "supsub");

  if (supSub) {
    // If we have limits, supsub will pass us its group to handle. Pull
    // out the superscript and subscript and set the group to the op in
    // its base.
    supGroup = supSub.sup;
    subGroup = supSub.sub;
    group = assertNodeType(supSub.base, "op");
    hasLimits = true;
  } else {
    group = assertNodeType(grp, "op");
  }

  var style = options.style;
  var large = false;

  if (style.size === src_Style.DISPLAY.size && group.symbol && !utils.contains(noSuccessor, group.name)) {
    // Most symbol operators get larger in displaystyle (rule 13)
    large = true;
  }

  var base;

  if (group.symbol) {
    // If this is a symbol, create the symbol.
    var fontName = large ? "Size2-Regular" : "Size1-Regular";
    var stash = "";

    if (group.name === "\\oiint" || group.name === "\\oiiint") {
      // No font glyphs yet, so use a glyph w/o the oval.
      // TODO: When font glyphs are available, delete this code.
      stash = group.name.substr(1); // $FlowFixMe

      group.name = stash === "oiint" ? "\\iint" : "\\iiint";
    }

    base = buildCommon.makeSymbol(group.name, fontName, "math", options, ["mop", "op-symbol", large ? "large-op" : "small-op"]);

    if (stash.length > 0) {
      // We're in \oiint or \oiiint. Overlay the oval.
      // TODO: When font glyphs are available, delete this code.
      var italic = base.italic;
      var oval = buildCommon.staticSvg(stash + "Size" + (large ? "2" : "1"), options);
      base = buildCommon.makeVList({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: base,
          shift: 0
        }, {
          type: "elem",
          elem: oval,
          shift: large ? 0.08 : 0
        }]
      }, options); // $FlowFixMe

      group.name = "\\" + stash;
      base.classes.unshift("mop"); // $FlowFixMe

      base.italic = italic;
    }
  } else if (group.body) {
    // If this is a list, compose that list.
    var inner = buildHTML_buildExpression(group.body, options, true);

    if (inner.length === 1 && inner[0] instanceof domTree_SymbolNode) {
      base = inner[0];
      base.classes[0] = "mop"; // replace old mclass
    } else {
      base = buildCommon.makeSpan(["mop"], buildCommon.tryCombineChars(inner), options);
    }
  } else {
    // Otherwise, this is a text operator. Build the text from the
    // operator's name.
    // TODO(emily): Add a space in the middle of some of these
    // operators, like \limsup
    var output = [];

    for (var i = 1; i < group.name.length; i++) {
      output.push(buildCommon.mathsym(group.name[i], group.mode, options));
    }

    base = buildCommon.makeSpan(["mop"], output, options);
  } // If content of op is a single symbol, shift it vertically.


  var baseShift = 0;
  var slant = 0;

  if ((base instanceof domTree_SymbolNode || group.name === "\\oiint" || group.name === "\\oiiint") && !group.suppressBaseShift) {
    // We suppress the shift of the base of \overset and \underset. Otherwise,
    // shift the symbol so its center lies on the axis (rule 13). It
    // appears that our fonts have the centers of the symbols already
    // almost on the axis, so these numbers are very small. Note we
    // don't actually apply this here, but instead it is used either in
    // the vlist creation or separately when there are no limits.
    baseShift = (base.height - base.depth) / 2 - options.fontMetrics().axisHeight; // The slant of the symbol is just its italic correction.
    // $FlowFixMe

    slant = base.italic;
  }

  if (hasLimits) {
    return assembleSupSub_assembleSupSub(base, supGroup, subGroup, options, style, slant, baseShift);
  } else {
    if (baseShift) {
      base.style.position = "relative";
      base.style.top = baseShift + "em";
    }

    return base;
  }
};

var op_mathmlBuilder = function mathmlBuilder(group, options) {
  var node;

  if (group.symbol) {
    // This is a symbol. Just add the symbol.
    node = new mathMLTree_MathNode("mo", [buildMathML_makeText(group.name, group.mode)]);

    if (utils.contains(noSuccessor, group.name)) {
      node.setAttribute("largeop", "false");
    }
  } else if (group.body) {
    // This is an operator with children. Add them.
    node = new mathMLTree_MathNode("mo", buildMathML_buildExpression(group.body, options));
  } else {
    // This is a text operator. Add all of the characters from the
    // operator's name.
    node = new mathMLTree_MathNode("mi", [new mathMLTree_TextNode(group.name.slice(1))]); // Append an <mo>&ApplyFunction;</mo>.
    // ref: https://www.w3.org/TR/REC-MathML/chap3_2.html#sec3.2.4

    var operator = new mathMLTree_MathNode("mo", [buildMathML_makeText("\u2061", "text")]);

    if (group.parentIsSupSub) {
      node = new mathMLTree_MathNode("mo", [node, operator]);
    } else {
      node = newDocumentFragment([node, operator]);
    }
  }

  return node;
};

var singleCharBigOps = {
  "\u220F": "\\prod",
  "\u2210": "\\coprod",
  "\u2211": "\\sum",
  "\u22C0": "\\bigwedge",
  "\u22C1": "\\bigvee",
  "\u22C2": "\\bigcap",
  "\u22C3": "\\bigcup",
  "\u2A00": "\\bigodot",
  "\u2A01": "\\bigoplus",
  "\u2A02": "\\bigotimes",
  "\u2A04": "\\biguplus",
  "\u2A06": "\\bigsqcup"
};
defineFunction({
  type: "op",
  names: ["\\coprod", "\\bigvee", "\\bigwedge", "\\biguplus", "\\bigcap", "\\bigcup", "\\intop", "\\prod", "\\sum", "\\bigotimes", "\\bigoplus", "\\bigodot", "\\bigsqcup", "\\smallint", "\u220F", "\u2210", "\u2211", "\u22C0", "\u22C1", "\u22C2", "\u22C3", "\u2A00", "\u2A01", "\u2A02", "\u2A04", "\u2A06"],
  props: {
    numArgs: 0
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var fName = funcName;

    if (fName.length === 1) {
      fName = singleCharBigOps[fName];
    }

    return {
      type: "op",
      mode: parser.mode,
      limits: true,
      parentIsSupSub: false,
      symbol: true,
      name: fName
    };
  },
  htmlBuilder: op_htmlBuilder,
  mathmlBuilder: op_mathmlBuilder
}); // Note: calling defineFunction with a type that's already been defined only
// works because the same htmlBuilder and mathmlBuilder are being used.

defineFunction({
  type: "op",
  names: ["\\mathop"],
  props: {
    numArgs: 1
  },
  handler: function handler(_ref2, args) {
    var parser = _ref2.parser;
    var body = args[0];
    return {
      type: "op",
      mode: parser.mode,
      limits: false,
      parentIsSupSub: false,
      symbol: false,
      body: defineFunction_ordargument(body)
    };
  },
  htmlBuilder: op_htmlBuilder,
  mathmlBuilder: op_mathmlBuilder
}); // There are 2 flags for operators; whether they produce limits in
// displaystyle, and whether they are symbols and should grow in
// displaystyle. These four groups cover the four possible choices.

var singleCharIntegrals = {
  "\u222B": "\\int",
  "\u222C": "\\iint",
  "\u222D": "\\iiint",
  "\u222E": "\\oint",
  "\u222F": "\\oiint",
  "\u2230": "\\oiiint"
}; // No limits, not symbols

defineFunction({
  type: "op",
  names: ["\\arcsin", "\\arccos", "\\arctan", "\\arctg", "\\arcctg", "\\arg", "\\ch", "\\cos", "\\cosec", "\\cosh", "\\cot", "\\cotg", "\\coth", "\\csc", "\\ctg", "\\cth", "\\deg", "\\dim", "\\exp", "\\hom", "\\ker", "\\lg", "\\ln", "\\log", "\\sec", "\\sin", "\\sinh", "\\sh", "\\tan", "\\tanh", "\\tg", "\\th"],
  props: {
    numArgs: 0
  },
  handler: function handler(_ref3) {
    var parser = _ref3.parser,
        funcName = _ref3.funcName;
    return {
      type: "op",
      mode: parser.mode,
      limits: false,
      parentIsSupSub: false,
      symbol: false,
      name: funcName
    };
  },
  htmlBuilder: op_htmlBuilder,
  mathmlBuilder: op_mathmlBuilder
}); // Limits, not symbols

defineFunction({
  type: "op",
  names: ["\\det", "\\gcd", "\\inf", "\\lim", "\\max", "\\min", "\\Pr", "\\sup"],
  props: {
    numArgs: 0
  },
  handler: function handler(_ref4) {
    var parser = _ref4.parser,
        funcName = _ref4.funcName;
    return {
      type: "op",
      mode: parser.mode,
      limits: true,
      parentIsSupSub: false,
      symbol: false,
      name: funcName
    };
  },
  htmlBuilder: op_htmlBuilder,
  mathmlBuilder: op_mathmlBuilder
}); // No limits, symbols

defineFunction({
  type: "op",
  names: ["\\int", "\\iint", "\\iiint", "\\oint", "\\oiint", "\\oiiint", "\u222B", "\u222C", "\u222D", "\u222E", "\u222F", "\u2230"],
  props: {
    numArgs: 0
  },
  handler: function handler(_ref5) {
    var parser = _ref5.parser,
        funcName = _ref5.funcName;
    var fName = funcName;

    if (fName.length === 1) {
      fName = singleCharIntegrals[fName];
    }

    return {
      type: "op",
      mode: parser.mode,
      limits: false,
      parentIsSupSub: false,
      symbol: true,
      name: fName
    };
  },
  htmlBuilder: op_htmlBuilder,
  mathmlBuilder: op_mathmlBuilder
});
// CONCATENATED MODULE: ./src/functions/operatorname.js








// NOTE: Unlike most `htmlBuilder`s, this one handles not only
// "operatorname", but also  "supsub" since \operatorname* can
var operatorname_htmlBuilder = function htmlBuilder(grp, options) {
  // Operators are handled in the TeXbook pg. 443-444, rule 13(a).
  var supGroup;
  var subGroup;
  var hasLimits = false;
  var group;
  var supSub = checkNodeType(grp, "supsub");

  if (supSub) {
    // If we have limits, supsub will pass us its group to handle. Pull
    // out the superscript and subscript and set the group to the op in
    // its base.
    supGroup = supSub.sup;
    subGroup = supSub.sub;
    group = assertNodeType(supSub.base, "operatorname");
    hasLimits = true;
  } else {
    group = assertNodeType(grp, "operatorname");
  }

  var base;

  if (group.body.length > 0) {
    var body = group.body.map(function (child) {
      // $FlowFixMe: Check if the node has a string `text` property.
      var childText = child.text;

      if (typeof childText === "string") {
        return {
          type: "textord",
          mode: child.mode,
          text: childText
        };
      } else {
        return child;
      }
    }); // Consolidate function names into symbol characters.

    var expression = buildHTML_buildExpression(body, options.withFont("mathrm"), true);

    for (var i = 0; i < expression.length; i++) {
      var child = expression[i];

      if (child instanceof domTree_SymbolNode) {
        // Per amsopn package,
        // change minus to hyphen and \ast to asterisk
        child.text = child.text.replace(/\u2212/, "-").replace(/\u2217/, "*");
      }
    }

    base = buildCommon.makeSpan(["mop"], expression, options);
  } else {
    base = buildCommon.makeSpan(["mop"], [], options);
  }

  if (hasLimits) {
    return assembleSupSub_assembleSupSub(base, supGroup, subGroup, options, options.style, 0, 0);
  } else {
    return base;
  }
};

var operatorname_mathmlBuilder = function mathmlBuilder(group, options) {
  // The steps taken here are similar to the html version.
  var expression = buildMathML_buildExpression(group.body, options.withFont("mathrm")); // Is expression a string or has it something like a fraction?

  var isAllString = true; // default

  for (var i = 0; i < expression.length; i++) {
    var node = expression[i];

    if (node instanceof mathMLTree.SpaceNode) {// Do nothing
    } else if (node instanceof mathMLTree.MathNode) {
      switch (node.type) {
        case "mi":
        case "mn":
        case "ms":
        case "mspace":
        case "mtext":
          break;
        // Do nothing yet.

        case "mo":
          {
            var child = node.children[0];

            if (node.children.length === 1 && child instanceof mathMLTree.TextNode) {
              child.text = child.text.replace(/\u2212/, "-").replace(/\u2217/, "*");
            } else {
              isAllString = false;
            }

            break;
          }

        default:
          isAllString = false;
      }
    } else {
      isAllString = false;
    }
  }

  if (isAllString) {
    // Write a single TextNode instead of multiple nested tags.
    var word = expression.map(function (node) {
      return node.toText();
    }).join("");
    expression = [new mathMLTree.TextNode(word)];
  }

  var identifier = new mathMLTree.MathNode("mi", expression);
  identifier.setAttribute("mathvariant", "normal"); // \u2061 is the same as &ApplyFunction;
  // ref: https://www.w3schools.com/charsets/ref_html_entities_a.asp

  var operator = new mathMLTree.MathNode("mo", [buildMathML_makeText("\u2061", "text")]);

  if (group.parentIsSupSub) {
    return new mathMLTree.MathNode("mo", [identifier, operator]);
  } else {
    return mathMLTree.newDocumentFragment([identifier, operator]);
  }
}; // \operatorname
// amsopn.dtx: \mathop{#1\kern\z@\operator@font#3}\newmcodes@


defineFunction({
  type: "operatorname",
  names: ["\\operatorname", "\\operatorname*"],
  props: {
    numArgs: 1
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var body = args[0];
    return {
      type: "operatorname",
      mode: parser.mode,
      body: defineFunction_ordargument(body),
      alwaysHandleSupSub: funcName === "\\operatorname*",
      limits: false,
      parentIsSupSub: false
    };
  },
  htmlBuilder: operatorname_htmlBuilder,
  mathmlBuilder: operatorname_mathmlBuilder
});
// CONCATENATED MODULE: ./src/functions/ordgroup.js




defineFunctionBuilders({
  type: "ordgroup",
  htmlBuilder: function htmlBuilder(group, options) {
    if (group.semisimple) {
      return buildCommon.makeFragment(buildHTML_buildExpression(group.body, options, false));
    }

    return buildCommon.makeSpan(["mord"], buildHTML_buildExpression(group.body, options, true), options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    return buildExpressionRow(group.body, options, true);
  }
});
// CONCATENATED MODULE: ./src/functions/overline.js





defineFunction({
  type: "overline",
  names: ["\\overline"],
  props: {
    numArgs: 1
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser;
    var body = args[0];
    return {
      type: "overline",
      mode: parser.mode,
      body: body
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    // Overlines are handled in the TeXbook pg 443, Rule 9.
    // Build the inner group in the cramped style.
    var innerGroup = buildHTML_buildGroup(group.body, options.havingCrampedStyle()); // Create the line above the body

    var line = buildCommon.makeLineSpan("overline-line", options); // Generate the vlist, with the appropriate kerns

    var defaultRuleThickness = options.fontMetrics().defaultRuleThickness;
    var vlist = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: innerGroup
      }, {
        type: "kern",
        size: 3 * defaultRuleThickness
      }, {
        type: "elem",
        elem: line
      }, {
        type: "kern",
        size: defaultRuleThickness
      }]
    }, options);
    return buildCommon.makeSpan(["mord", "overline"], [vlist], options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var operator = new mathMLTree.MathNode("mo", [new mathMLTree.TextNode("\u203E")]);
    operator.setAttribute("stretchy", "true");
    var node = new mathMLTree.MathNode("mover", [buildMathML_buildGroup(group.body, options), operator]);
    node.setAttribute("accent", "true");
    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/phantom.js





defineFunction({
  type: "phantom",
  names: ["\\phantom"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser;
    var body = args[0];
    return {
      type: "phantom",
      mode: parser.mode,
      body: defineFunction_ordargument(body)
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var elements = buildHTML_buildExpression(group.body, options.withPhantom(), false); // \phantom isn't supposed to affect the elements it contains.
    // See "color" for more details.

    return buildCommon.makeFragment(elements);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var inner = buildMathML_buildExpression(group.body, options);
    return new mathMLTree.MathNode("mphantom", inner);
  }
});
defineFunction({
  type: "hphantom",
  names: ["\\hphantom"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: function handler(_ref2, args) {
    var parser = _ref2.parser;
    var body = args[0];
    return {
      type: "hphantom",
      mode: parser.mode,
      body: body
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var node = buildCommon.makeSpan([], [buildHTML_buildGroup(group.body, options.withPhantom())]);
    node.height = 0;
    node.depth = 0;

    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        node.children[i].height = 0;
        node.children[i].depth = 0;
      }
    } // See smash for comment re: use of makeVList


    node = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: node
      }]
    }, options); // For spacing, TeX treats \smash as a math group (same spacing as ord).

    return buildCommon.makeSpan(["mord"], [node], options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var inner = buildMathML_buildExpression(defineFunction_ordargument(group.body), options);
    var phantom = new mathMLTree.MathNode("mphantom", inner);
    var node = new mathMLTree.MathNode("mpadded", [phantom]);
    node.setAttribute("height", "0px");
    node.setAttribute("depth", "0px");
    return node;
  }
});
defineFunction({
  type: "vphantom",
  names: ["\\vphantom"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: function handler(_ref3, args) {
    var parser = _ref3.parser;
    var body = args[0];
    return {
      type: "vphantom",
      mode: parser.mode,
      body: body
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var inner = buildCommon.makeSpan(["inner"], [buildHTML_buildGroup(group.body, options.withPhantom())]);
    var fix = buildCommon.makeSpan(["fix"], []);
    return buildCommon.makeSpan(["mord", "rlap"], [inner, fix], options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var inner = buildMathML_buildExpression(defineFunction_ordargument(group.body), options);
    var phantom = new mathMLTree.MathNode("mphantom", inner);
    var node = new mathMLTree.MathNode("mpadded", [phantom]);
    node.setAttribute("width", "0px");
    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/raisebox.js






 // Box manipulation

defineFunction({
  type: "raisebox",
  names: ["\\raisebox"],
  props: {
    numArgs: 2,
    argTypes: ["size", "hbox"],
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser;
    var amount = assertNodeType(args[0], "size").value;
    var body = args[1];
    return {
      type: "raisebox",
      mode: parser.mode,
      dy: amount,
      body: body
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var body = buildHTML_buildGroup(group.body, options);
    var dy = units_calculateSize(group.dy, options);
    return buildCommon.makeVList({
      positionType: "shift",
      positionData: -dy,
      children: [{
        type: "elem",
        elem: body
      }]
    }, options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var node = new mathMLTree.MathNode("mpadded", [buildMathML_buildGroup(group.body, options)]);
    var dy = group.dy.number + group.dy.unit;
    node.setAttribute("voffset", dy);
    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/rule.js





defineFunction({
  type: "rule",
  names: ["\\rule"],
  props: {
    numArgs: 2,
    numOptionalArgs: 1,
    argTypes: ["size", "size", "size"]
  },
  handler: function handler(_ref, args, optArgs) {
    var parser = _ref.parser;
    var shift = optArgs[0];
    var width = assertNodeType(args[0], "size");
    var height = assertNodeType(args[1], "size");
    return {
      type: "rule",
      mode: parser.mode,
      shift: shift && assertNodeType(shift, "size").value,
      width: width.value,
      height: height.value
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    // Make an empty span for the rule
    var rule = buildCommon.makeSpan(["mord", "rule"], [], options); // Calculate the shift, width, and height of the rule, and account for units

    var width = units_calculateSize(group.width, options);
    var height = units_calculateSize(group.height, options);
    var shift = group.shift ? units_calculateSize(group.shift, options) : 0; // Style the rule to the right size

    rule.style.borderRightWidth = width + "em";
    rule.style.borderTopWidth = height + "em";
    rule.style.bottom = shift + "em"; // Record the height and width

    rule.width = width;
    rule.height = height + shift;
    rule.depth = -shift; // Font size is the number large enough that the browser will
    // reserve at least `absHeight` space above the baseline.
    // The 1.125 factor was empirically determined

    rule.maxFontSize = height * 1.125 * options.sizeMultiplier;
    return rule;
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var width = units_calculateSize(group.width, options);
    var height = units_calculateSize(group.height, options);
    var shift = group.shift ? units_calculateSize(group.shift, options) : 0;
    var color = options.color && options.getColor() || "black";
    var rule = new mathMLTree.MathNode("mspace");
    rule.setAttribute("mathbackground", color);
    rule.setAttribute("width", width + "em");
    rule.setAttribute("height", height + "em");
    var wrapper = new mathMLTree.MathNode("mpadded", [rule]);

    if (shift >= 0) {
      wrapper.setAttribute("height", "+" + shift + "em");
    } else {
      wrapper.setAttribute("height", shift + "em");
      wrapper.setAttribute("depth", "+" + -shift + "em");
    }

    wrapper.setAttribute("voffset", shift + "em");
    return wrapper;
  }
});
// CONCATENATED MODULE: ./src/functions/sizing.js





function sizingGroup(value, options, baseOptions) {
  var inner = buildHTML_buildExpression(value, options, false);
  var multiplier = options.sizeMultiplier / baseOptions.sizeMultiplier; // Add size-resetting classes to the inner list and set maxFontSize
  // manually. Handle nested size changes.

  for (var i = 0; i < inner.length; i++) {
    var pos = inner[i].classes.indexOf("sizing");

    if (pos < 0) {
      Array.prototype.push.apply(inner[i].classes, options.sizingClasses(baseOptions));
    } else if (inner[i].classes[pos + 1] === "reset-size" + options.size) {
      // This is a nested size change: e.g., inner[i] is the "b" in
      // `\Huge a \small b`. Override the old size (the `reset-` class)
      // but not the new size.
      inner[i].classes[pos + 1] = "reset-size" + baseOptions.size;
    }

    inner[i].height *= multiplier;
    inner[i].depth *= multiplier;
  }

  return buildCommon.makeFragment(inner);
}
var sizeFuncs = ["\\tiny", "\\sixptsize", "\\scriptsize", "\\footnotesize", "\\small", "\\normalsize", "\\large", "\\Large", "\\LARGE", "\\huge", "\\Huge"];
var sizing_htmlBuilder = function htmlBuilder(group, options) {
  // Handle sizing operators like \Huge. Real TeX doesn't actually allow
  // these functions inside of math expressions, so we do some special
  // handling.
  var newOptions = options.havingSize(group.size);
  return sizingGroup(group.body, newOptions, options);
};
defineFunction({
  type: "sizing",
  names: sizeFuncs,
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var breakOnTokenText = _ref.breakOnTokenText,
        funcName = _ref.funcName,
        parser = _ref.parser;
    var body = parser.parseExpression(false, breakOnTokenText);
    return {
      type: "sizing",
      mode: parser.mode,
      // Figure out what size to use based on the list of functions above
      size: sizeFuncs.indexOf(funcName) + 1,
      body: body
    };
  },
  htmlBuilder: sizing_htmlBuilder,
  mathmlBuilder: function mathmlBuilder(group, options) {
    var newOptions = options.havingSize(group.size);
    var inner = buildMathML_buildExpression(group.body, newOptions);
    var node = new mathMLTree.MathNode("mstyle", inner); // TODO(emily): This doesn't produce the correct size for nested size
    // changes, because we don't keep state of what style we're currently
    // in, so we can't reset the size to normal before changing it.  Now
    // that we're passing an options parameter we should be able to fix
    // this.

    node.setAttribute("mathsize", newOptions.sizeMultiplier + "em");
    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/smash.js
// smash, with optional [tb], as in AMS






defineFunction({
  type: "smash",
  names: ["\\smash"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1,
    allowedInText: true
  },
  handler: function handler(_ref, args, optArgs) {
    var parser = _ref.parser;
    var smashHeight = false;
    var smashDepth = false;
    var tbArg = optArgs[0] && assertNodeType(optArgs[0], "ordgroup");

    if (tbArg) {
      // Optional [tb] argument is engaged.
      // ref: amsmath: \renewcommand{\smash}[1][tb]{%
      //               def\mb@t{\ht}\def\mb@b{\dp}\def\mb@tb{\ht\z@\z@\dp}%
      var letter = "";

      for (var i = 0; i < tbArg.body.length; ++i) {
        var node = tbArg.body[i]; // $FlowFixMe: Not every node type has a `text` property.

        letter = node.text;

        if (letter === "t") {
          smashHeight = true;
        } else if (letter === "b") {
          smashDepth = true;
        } else {
          smashHeight = false;
          smashDepth = false;
          break;
        }
      }
    } else {
      smashHeight = true;
      smashDepth = true;
    }

    var body = args[0];
    return {
      type: "smash",
      mode: parser.mode,
      body: body,
      smashHeight: smashHeight,
      smashDepth: smashDepth
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var node = buildCommon.makeSpan([], [buildHTML_buildGroup(group.body, options)]);

    if (!group.smashHeight && !group.smashDepth) {
      return node;
    }

    if (group.smashHeight) {
      node.height = 0; // In order to influence makeVList, we have to reset the children.

      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          node.children[i].height = 0;
        }
      }
    }

    if (group.smashDepth) {
      node.depth = 0;

      if (node.children) {
        for (var _i = 0; _i < node.children.length; _i++) {
          node.children[_i].depth = 0;
        }
      }
    } // At this point, we've reset the TeX-like height and depth values.
    // But the span still has an HTML line height.
    // makeVList applies "display: table-cell", which prevents the browser
    // from acting on that line height. So we'll call makeVList now.


    var smashedNode = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: node
      }]
    }, options); // For spacing, TeX treats \hphantom as a math group (same spacing as ord).

    return buildCommon.makeSpan(["mord"], [smashedNode], options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var node = new mathMLTree.MathNode("mpadded", [buildMathML_buildGroup(group.body, options)]);

    if (group.smashHeight) {
      node.setAttribute("height", "0px");
    }

    if (group.smashDepth) {
      node.setAttribute("depth", "0px");
    }

    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/sqrt.js







defineFunction({
  type: "sqrt",
  names: ["\\sqrt"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1
  },
  handler: function handler(_ref, args, optArgs) {
    var parser = _ref.parser;
    var index = optArgs[0];
    var body = args[0];
    return {
      type: "sqrt",
      mode: parser.mode,
      body: body,
      index: index
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    // Square roots are handled in the TeXbook pg. 443, Rule 11.
    // First, we do the same steps as in overline to build the inner group
    // and line
    var inner = buildHTML_buildGroup(group.body, options.havingCrampedStyle());

    if (inner.height === 0) {
      // Render a small surd.
      inner.height = options.fontMetrics().xHeight;
    } // Some groups can return document fragments.  Handle those by wrapping
    // them in a span.


    inner = buildCommon.wrapFragment(inner, options); // Calculate the minimum size for the \surd delimiter

    var metrics = options.fontMetrics();
    var theta = metrics.defaultRuleThickness;
    var phi = theta;

    if (options.style.id < src_Style.TEXT.id) {
      phi = options.fontMetrics().xHeight;
    } // Calculate the clearance between the body and line


    var lineClearance = theta + phi / 4;
    var minDelimiterHeight = inner.height + inner.depth + lineClearance + theta; // Create a sqrt SVG of the required minimum size

    var _delimiter$sqrtImage = delimiter.sqrtImage(minDelimiterHeight, options),
        img = _delimiter$sqrtImage.span,
        ruleWidth = _delimiter$sqrtImage.ruleWidth,
        advanceWidth = _delimiter$sqrtImage.advanceWidth;

    var delimDepth = img.height - ruleWidth; // Adjust the clearance based on the delimiter size

    if (delimDepth > inner.height + inner.depth + lineClearance) {
      lineClearance = (lineClearance + delimDepth - inner.height - inner.depth) / 2;
    } // Shift the sqrt image


    var imgShift = img.height - inner.height - lineClearance - ruleWidth;
    inner.style.paddingLeft = advanceWidth + "em"; // Overlay the image and the argument.

    var body = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: inner,
        wrapperClasses: ["svg-align"]
      }, {
        type: "kern",
        size: -(inner.height + imgShift)
      }, {
        type: "elem",
        elem: img
      }, {
        type: "kern",
        size: ruleWidth
      }]
    }, options);

    if (!group.index) {
      return buildCommon.makeSpan(["mord", "sqrt"], [body], options);
    } else {
      // Handle the optional root index
      // The index is always in scriptscript style
      var newOptions = options.havingStyle(src_Style.SCRIPTSCRIPT);
      var rootm = buildHTML_buildGroup(group.index, newOptions, options); // The amount the index is shifted by. This is taken from the TeX
      // source, in the definition of `\r@@t`.

      var toShift = 0.6 * (body.height - body.depth); // Build a VList with the superscript shifted up correctly

      var rootVList = buildCommon.makeVList({
        positionType: "shift",
        positionData: -toShift,
        children: [{
          type: "elem",
          elem: rootm
        }]
      }, options); // Add a class surrounding it so we can add on the appropriate
      // kerning

      var rootVListWrap = buildCommon.makeSpan(["root"], [rootVList]);
      return buildCommon.makeSpan(["mord", "sqrt"], [rootVListWrap, body], options);
    }
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var body = group.body,
        index = group.index;
    return index ? new mathMLTree.MathNode("mroot", [buildMathML_buildGroup(body, options), buildMathML_buildGroup(index, options)]) : new mathMLTree.MathNode("msqrt", [buildMathML_buildGroup(body, options)]);
  }
});
// CONCATENATED MODULE: ./src/functions/styling.js





var styling_styleMap = {
  "display": src_Style.DISPLAY,
  "text": src_Style.TEXT,
  "script": src_Style.SCRIPT,
  "scriptscript": src_Style.SCRIPTSCRIPT
};
defineFunction({
  type: "styling",
  names: ["\\displaystyle", "\\textstyle", "\\scriptstyle", "\\scriptscriptstyle"],
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var breakOnTokenText = _ref.breakOnTokenText,
        funcName = _ref.funcName,
        parser = _ref.parser;
    // parse out the implicit body
    var body = parser.parseExpression(true, breakOnTokenText); // TODO: Refactor to avoid duplicating styleMap in multiple places (e.g.
    // here and in buildHTML and de-dupe the enumeration of all the styles).
    // $FlowFixMe: The names above exactly match the styles.

    var style = funcName.slice(1, funcName.length - 5);
    return {
      type: "styling",
      mode: parser.mode,
      // Figure out what style to use by pulling out the style from
      // the function name
      style: style,
      body: body
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    // Style changes are handled in the TeXbook on pg. 442, Rule 3.
    var newStyle = styling_styleMap[group.style];
    var newOptions = options.havingStyle(newStyle).withFont('');
    return sizingGroup(group.body, newOptions, options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    // Figure out what style we're changing to.
    var newStyle = styling_styleMap[group.style];
    var newOptions = options.havingStyle(newStyle);
    var inner = buildMathML_buildExpression(group.body, newOptions);
    var node = new mathMLTree.MathNode("mstyle", inner);
    var styleAttributes = {
      "display": ["0", "true"],
      "text": ["0", "false"],
      "script": ["1", "false"],
      "scriptscript": ["2", "false"]
    };
    var attr = styleAttributes[group.style];
    node.setAttribute("scriptlevel", attr[0]);
    node.setAttribute("displaystyle", attr[1]);
    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/supsub.js














/**
 * Sometimes, groups perform special rules when they have superscripts or
 * subscripts attached to them. This function lets the `supsub` group know that
 * Sometimes, groups perform special rules when they have superscripts or
 * its inner element should handle the superscripts and subscripts instead of
 * handling them itself.
 */
var supsub_htmlBuilderDelegate = function htmlBuilderDelegate(group, options) {
  var base = group.base;

  if (!base) {
    return null;
  } else if (base.type === "op") {
    // Operators handle supsubs differently when they have limits
    // (e.g. `\displaystyle\sum_2^3`)
    var delegate = base.limits && (options.style.size === src_Style.DISPLAY.size || base.alwaysHandleSupSub);
    return delegate ? op_htmlBuilder : null;
  } else if (base.type === "operatorname") {
    var _delegate = base.alwaysHandleSupSub && (options.style.size === src_Style.DISPLAY.size || base.limits);

    return _delegate ? operatorname_htmlBuilder : null;
  } else if (base.type === "accent") {
    return utils.isCharacterBox(base.base) ? accent_htmlBuilder : null;
  } else if (base.type === "horizBrace") {
    var isSup = !group.sub;
    return isSup === base.isOver ? horizBrace_htmlBuilder : null;
  } else {
    return null;
  }
}; // Super scripts and subscripts, whose precise placement can depend on other
// functions that precede them.


defineFunctionBuilders({
  type: "supsub",
  htmlBuilder: function htmlBuilder(group, options) {
    // Superscript and subscripts are handled in the TeXbook on page
    // 445-446, rules 18(a-f).
    // Here is where we defer to the inner group if it should handle
    // superscripts and subscripts itself.
    var builderDelegate = supsub_htmlBuilderDelegate(group, options);

    if (builderDelegate) {
      return builderDelegate(group, options);
    }

    var valueBase = group.base,
        valueSup = group.sup,
        valueSub = group.sub;
    var base = buildHTML_buildGroup(valueBase, options);
    var supm;
    var subm;
    var metrics = options.fontMetrics(); // Rule 18a

    var supShift = 0;
    var subShift = 0;
    var isCharacterBox = valueBase && utils.isCharacterBox(valueBase);

    if (valueSup) {
      var newOptions = options.havingStyle(options.style.sup());
      supm = buildHTML_buildGroup(valueSup, newOptions, options);

      if (!isCharacterBox) {
        supShift = base.height - newOptions.fontMetrics().supDrop * newOptions.sizeMultiplier / options.sizeMultiplier;
      }
    }

    if (valueSub) {
      var _newOptions = options.havingStyle(options.style.sub());

      subm = buildHTML_buildGroup(valueSub, _newOptions, options);

      if (!isCharacterBox) {
        subShift = base.depth + _newOptions.fontMetrics().subDrop * _newOptions.sizeMultiplier / options.sizeMultiplier;
      }
    } // Rule 18c


    var minSupShift;

    if (options.style === src_Style.DISPLAY) {
      minSupShift = metrics.sup1;
    } else if (options.style.cramped) {
      minSupShift = metrics.sup3;
    } else {
      minSupShift = metrics.sup2;
    } // scriptspace is a font-size-independent size, so scale it
    // appropriately for use as the marginRight.


    var multiplier = options.sizeMultiplier;
    var marginRight = 0.5 / metrics.ptPerEm / multiplier + "em";
    var marginLeft = null;

    if (subm) {
      // Subscripts shouldn't be shifted by the base's italic correction.
      // Account for that by shifting the subscript back the appropriate
      // amount. Note we only do this when the base is a single symbol.
      var isOiint = group.base && group.base.type === "op" && group.base.name && (group.base.name === "\\oiint" || group.base.name === "\\oiiint");

      if (base instanceof domTree_SymbolNode || isOiint) {
        // $FlowFixMe
        marginLeft = -base.italic + "em";
      }
    }

    var supsub;

    if (supm && subm) {
      supShift = Math.max(supShift, minSupShift, supm.depth + 0.25 * metrics.xHeight);
      subShift = Math.max(subShift, metrics.sub2);
      var ruleWidth = metrics.defaultRuleThickness; // Rule 18e

      var maxWidth = 4 * ruleWidth;

      if (supShift - supm.depth - (subm.height - subShift) < maxWidth) {
        subShift = maxWidth - (supShift - supm.depth) + subm.height;
        var psi = 0.8 * metrics.xHeight - (supShift - supm.depth);

        if (psi > 0) {
          supShift += psi;
          subShift -= psi;
        }
      }

      var vlistElem = [{
        type: "elem",
        elem: subm,
        shift: subShift,
        marginRight: marginRight,
        marginLeft: marginLeft
      }, {
        type: "elem",
        elem: supm,
        shift: -supShift,
        marginRight: marginRight
      }];
      supsub = buildCommon.makeVList({
        positionType: "individualShift",
        children: vlistElem
      }, options);
    } else if (subm) {
      // Rule 18b
      subShift = Math.max(subShift, metrics.sub1, subm.height - 0.8 * metrics.xHeight);
      var _vlistElem = [{
        type: "elem",
        elem: subm,
        marginLeft: marginLeft,
        marginRight: marginRight
      }];
      supsub = buildCommon.makeVList({
        positionType: "shift",
        positionData: subShift,
        children: _vlistElem
      }, options);
    } else if (supm) {
      // Rule 18c, d
      supShift = Math.max(supShift, minSupShift, supm.depth + 0.25 * metrics.xHeight);
      supsub = buildCommon.makeVList({
        positionType: "shift",
        positionData: -supShift,
        children: [{
          type: "elem",
          elem: supm,
          marginRight: marginRight
        }]
      }, options);
    } else {
      throw new Error("supsub must have either sup or sub.");
    } // Wrap the supsub vlist in a span.msupsub to reset text-align.


    var mclass = getTypeOfDomTree(base, "right") || "mord";
    return buildCommon.makeSpan([mclass], [base, buildCommon.makeSpan(["msupsub"], [supsub])], options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    // Is the inner group a relevant horizonal brace?
    var isBrace = false;
    var isOver;
    var isSup;
    var horizBrace = checkNodeType(group.base, "horizBrace");

    if (horizBrace) {
      isSup = !!group.sup;

      if (isSup === horizBrace.isOver) {
        isBrace = true;
        isOver = horizBrace.isOver;
      }
    }

    if (group.base && (group.base.type === "op" || group.base.type === "operatorname")) {
      group.base.parentIsSupSub = true;
    }

    var children = [buildMathML_buildGroup(group.base, options)];

    if (group.sub) {
      children.push(buildMathML_buildGroup(group.sub, options));
    }

    if (group.sup) {
      children.push(buildMathML_buildGroup(group.sup, options));
    }

    var nodeType;

    if (isBrace) {
      nodeType = isOver ? "mover" : "munder";
    } else if (!group.sub) {
      var base = group.base;

      if (base && base.type === "op" && base.limits && (options.style === src_Style.DISPLAY || base.alwaysHandleSupSub)) {
        nodeType = "mover";
      } else if (base && base.type === "operatorname" && base.alwaysHandleSupSub && (base.limits || options.style === src_Style.DISPLAY)) {
        nodeType = "mover";
      } else {
        nodeType = "msup";
      }
    } else if (!group.sup) {
      var _base = group.base;

      if (_base && _base.type === "op" && _base.limits && (options.style === src_Style.DISPLAY || _base.alwaysHandleSupSub)) {
        nodeType = "munder";
      } else if (_base && _base.type === "operatorname" && _base.alwaysHandleSupSub && (_base.limits || options.style === src_Style.DISPLAY)) {
        nodeType = "munder";
      } else {
        nodeType = "msub";
      }
    } else {
      var _base2 = group.base;

      if (_base2 && _base2.type === "op" && _base2.limits && options.style === src_Style.DISPLAY) {
        nodeType = "munderover";
      } else if (_base2 && _base2.type === "operatorname" && _base2.alwaysHandleSupSub && (options.style === src_Style.DISPLAY || _base2.limits)) {
        nodeType = "munderover";
      } else {
        nodeType = "msubsup";
      }
    }

    var node = new mathMLTree.MathNode(nodeType, children);
    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/symbolsOp.js



 // Operator ParseNodes created in Parser.js from symbol Groups in src/symbols.js.

defineFunctionBuilders({
  type: "atom",
  htmlBuilder: function htmlBuilder(group, options) {
    return buildCommon.mathsym(group.text, group.mode, options, ["m" + group.family]);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var node = new mathMLTree.MathNode("mo", [buildMathML_makeText(group.text, group.mode)]);

    if (group.family === "bin") {
      var variant = buildMathML_getVariant(group, options);

      if (variant === "bold-italic") {
        node.setAttribute("mathvariant", variant);
      }
    } else if (group.family === "punct") {
      node.setAttribute("separator", "true");
    } else if (group.family === "open" || group.family === "close") {
      // Delims built here should not stretch vertically.
      // See delimsizing.js for stretchy delims.
      node.setAttribute("stretchy", "false");
    }

    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/symbolsOrd.js




// "mathord" and "textord" ParseNodes created in Parser.js from symbol Groups in
var defaultVariant = {
  "mi": "italic",
  "mn": "normal",
  "mtext": "normal"
};
defineFunctionBuilders({
  type: "mathord",
  htmlBuilder: function htmlBuilder(group, options) {
    return buildCommon.makeOrd(group, options, "mathord");
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var node = new mathMLTree.MathNode("mi", [buildMathML_makeText(group.text, group.mode, options)]);
    var variant = buildMathML_getVariant(group, options) || "italic";

    if (variant !== defaultVariant[node.type]) {
      node.setAttribute("mathvariant", variant);
    }

    return node;
  }
});
defineFunctionBuilders({
  type: "textord",
  htmlBuilder: function htmlBuilder(group, options) {
    return buildCommon.makeOrd(group, options, "textord");
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var text = buildMathML_makeText(group.text, group.mode, options);
    var variant = buildMathML_getVariant(group, options) || "normal";
    var node;

    if (group.mode === 'text') {
      node = new mathMLTree.MathNode("mtext", [text]);
    } else if (/[0-9]/.test(group.text)) {
      // TODO(kevinb) merge adjacent <mn> nodes
      // do it as a post processing step
      node = new mathMLTree.MathNode("mn", [text]);
    } else if (group.text === "\\prime") {
      node = new mathMLTree.MathNode("mo", [text]);
    } else {
      node = new mathMLTree.MathNode("mi", [text]);
    }

    if (variant !== defaultVariant[node.type]) {
      node.setAttribute("mathvariant", variant);
    }

    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/symbolsSpacing.js



 // A map of CSS-based spacing functions to their CSS class.

var cssSpace = {
  "\\nobreak": "nobreak",
  "\\allowbreak": "allowbreak"
}; // A lookup table to determine whether a spacing function/symbol should be
// treated like a regular space character.  If a symbol or command is a key
// in this table, then it should be a regular space character.  Furthermore,
// the associated value may have a `className` specifying an extra CSS class
// to add to the created `span`.

var regularSpace = {
  " ": {},
  "\\ ": {},
  "~": {
    className: "nobreak"
  },
  "\\space": {},
  "\\nobreakspace": {
    className: "nobreak"
  }
}; // ParseNode<"spacing"> created in Parser.js from the "spacing" symbol Groups in
// src/symbols.js.

defineFunctionBuilders({
  type: "spacing",
  htmlBuilder: function htmlBuilder(group, options) {
    if (regularSpace.hasOwnProperty(group.text)) {
      var className = regularSpace[group.text].className || ""; // Spaces are generated by adding an actual space. Each of these
      // things has an entry in the symbols table, so these will be turned
      // into appropriate outputs.

      if (group.mode === "text") {
        var ord = buildCommon.makeOrd(group, options, "textord");
        ord.classes.push(className);
        return ord;
      } else {
        return buildCommon.makeSpan(["mspace", className], [buildCommon.mathsym(group.text, group.mode, options)], options);
      }
    } else if (cssSpace.hasOwnProperty(group.text)) {
      // Spaces based on just a CSS class.
      return buildCommon.makeSpan(["mspace", cssSpace[group.text]], [], options);
    } else {
      throw new src_ParseError("Unknown type of space \"" + group.text + "\"");
    }
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var node;

    if (regularSpace.hasOwnProperty(group.text)) {
      node = new mathMLTree.MathNode("mtext", [new mathMLTree.TextNode("\xA0")]);
    } else if (cssSpace.hasOwnProperty(group.text)) {
      // CSS-based MathML spaces (\nobreak, \allowbreak) are ignored
      return new mathMLTree.MathNode("mspace");
    } else {
      throw new src_ParseError("Unknown type of space \"" + group.text + "\"");
    }

    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/tag.js




var tag_pad = function pad() {
  var padNode = new mathMLTree.MathNode("mtd", []);
  padNode.setAttribute("width", "50%");
  return padNode;
};

defineFunctionBuilders({
  type: "tag",
  mathmlBuilder: function mathmlBuilder(group, options) {
    var table = new mathMLTree.MathNode("mtable", [new mathMLTree.MathNode("mtr", [tag_pad(), new mathMLTree.MathNode("mtd", [buildExpressionRow(group.body, options)]), tag_pad(), new mathMLTree.MathNode("mtd", [buildExpressionRow(group.tag, options)])])]);
    table.setAttribute("width", "100%");
    return table; // TODO: Left-aligned tags.
    // Currently, the group and options passed here do not contain
    // enough info to set tag alignment. `leqno` is in Settings but it is
    // not passed to Options. On the HTML side, leqno is
    // set by a CSS class applied in buildTree.js. That would have worked
    // in MathML if browsers supported <mlabeledtr>. Since they don't, we
    // need to rewrite the way this function is called.
  }
});
// CONCATENATED MODULE: ./src/functions/text.js



 // Non-mathy text, possibly in a font

var textFontFamilies = {
  "\\text": undefined,
  "\\textrm": "textrm",
  "\\textsf": "textsf",
  "\\texttt": "texttt",
  "\\textnormal": "textrm"
};
var textFontWeights = {
  "\\textbf": "textbf",
  "\\textmd": "textmd"
};
var textFontShapes = {
  "\\textit": "textit",
  "\\textup": "textup"
};

var optionsWithFont = function optionsWithFont(group, options) {
  var font = group.font; // Checks if the argument is a font family or a font style.

  if (!font) {
    return options;
  } else if (textFontFamilies[font]) {
    return options.withTextFontFamily(textFontFamilies[font]);
  } else if (textFontWeights[font]) {
    return options.withTextFontWeight(textFontWeights[font]);
  } else {
    return options.withTextFontShape(textFontShapes[font]);
  }
};

defineFunction({
  type: "text",
  names: [// Font families
  "\\text", "\\textrm", "\\textsf", "\\texttt", "\\textnormal", // Font weights
  "\\textbf", "\\textmd", // Font Shapes
  "\\textit", "\\textup"],
  props: {
    numArgs: 1,
    argTypes: ["text"],
    greediness: 2,
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser,
        funcName = _ref.funcName;
    var body = args[0];
    return {
      type: "text",
      mode: parser.mode,
      body: defineFunction_ordargument(body),
      font: funcName
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var newOptions = optionsWithFont(group, options);
    var inner = buildHTML_buildExpression(group.body, newOptions, true);
    return buildCommon.makeSpan(["mord", "text"], buildCommon.tryCombineChars(inner), newOptions);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var newOptions = optionsWithFont(group, options);
    return buildExpressionRow(group.body, newOptions);
  }
});
// CONCATENATED MODULE: ./src/functions/underline.js





defineFunction({
  type: "underline",
  names: ["\\underline"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: function handler(_ref, args) {
    var parser = _ref.parser;
    return {
      type: "underline",
      mode: parser.mode,
      body: args[0]
    };
  },
  htmlBuilder: function htmlBuilder(group, options) {
    // Underlines are handled in the TeXbook pg 443, Rule 10.
    // Build the inner group.
    var innerGroup = buildHTML_buildGroup(group.body, options); // Create the line to go below the body

    var line = buildCommon.makeLineSpan("underline-line", options); // Generate the vlist, with the appropriate kerns

    var defaultRuleThickness = options.fontMetrics().defaultRuleThickness;
    var vlist = buildCommon.makeVList({
      positionType: "top",
      positionData: innerGroup.height,
      children: [{
        type: "kern",
        size: defaultRuleThickness
      }, {
        type: "elem",
        elem: line
      }, {
        type: "kern",
        size: 3 * defaultRuleThickness
      }, {
        type: "elem",
        elem: innerGroup
      }]
    }, options);
    return buildCommon.makeSpan(["mord", "underline"], [vlist], options);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var operator = new mathMLTree.MathNode("mo", [new mathMLTree.TextNode("\u203E")]);
    operator.setAttribute("stretchy", "true");
    var node = new mathMLTree.MathNode("munder", [buildMathML_buildGroup(group.body, options), operator]);
    node.setAttribute("accentunder", "true");
    return node;
  }
});
// CONCATENATED MODULE: ./src/functions/verb.js




defineFunction({
  type: "verb",
  names: ["\\verb"],
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler: function handler(context, args, optArgs) {
    // \verb and \verb* are dealt with directly in Parser.js.
    // If we end up here, it's because of a failure to match the two delimiters
    // in the regex in Lexer.js.  LaTeX raises the following error when \verb is
    // terminated by end of line (or file).
    throw new src_ParseError("\\verb ended by end of line instead of matching delimiter");
  },
  htmlBuilder: function htmlBuilder(group, options) {
    var text = makeVerb(group);
    var body = []; // \verb enters text mode and therefore is sized like \textstyle

    var newOptions = options.havingStyle(options.style.text());

    for (var i = 0; i < text.length; i++) {
      var c = text[i];

      if (c === '~') {
        c = '\\textasciitilde';
      }

      body.push(buildCommon.makeSymbol(c, "Typewriter-Regular", group.mode, newOptions, ["mord", "texttt"]));
    }

    return buildCommon.makeSpan(["mord", "text"].concat(newOptions.sizingClasses(options)), buildCommon.tryCombineChars(body), newOptions);
  },
  mathmlBuilder: function mathmlBuilder(group, options) {
    var text = new mathMLTree.TextNode(makeVerb(group));
    var node = new mathMLTree.MathNode("mtext", [text]);
    node.setAttribute("mathvariant", "monospace");
    return node;
  }
});
/**
 * Converts verb group into body string.
 *
 * \verb* replaces each space with an open box \u2423
 * \verb replaces each space with a no-break space \xA0
 */

var makeVerb = function makeVerb(group) {
  return group.body.replace(/ /g, group.star ? "\u2423" : '\xA0');
};
// CONCATENATED MODULE: ./src/functions.js
/** Include this to ensure that all functions are defined. */

var functions = _functions;
/* harmony default export */ var src_functions = (functions); // TODO(kevinb): have functions return an object and call defineFunction with
// that object in this file instead of relying on side-effects.








































// CONCATENATED MODULE: ./src/Lexer.js
/**
 * The Lexer class handles tokenizing the input in various ways. Since our
 * parser expects us to be able to backtrack, the lexer allows lexing from any
 * given starting point.
 *
 * Its main exposed function is the `lex` function, which takes a position to
 * lex from and a type of token to lex. It defers to the appropriate `_innerLex`
 * function.
 *
 * The various `_innerLex` functions perform the actual lexing of different
 * kinds.
 */




/* The following tokenRegex
 * - matches typical whitespace (but not NBSP etc.) using its first group
 * - does not match any control character \x00-\x1f except whitespace
 * - does not match a bare backslash
 * - matches any ASCII character except those just mentioned
 * - does not match the BMP private use area \uE000-\uF8FF
 * - does not match bare surrogate code units
 * - matches any BMP character except for those just described
 * - matches any valid Unicode surrogate pair
 * - matches a backslash followed by one or more letters
 * - matches a backslash followed by any BMP character, including newline
 * Just because the Lexer matches something doesn't mean it's valid input:
 * If there is no matching function or symbol definition, the Parser will
 * still reject the input.
 */
var spaceRegexString = "[ \r\n\t]";
var controlWordRegexString = "\\\\[a-zA-Z@]+";
var controlSymbolRegexString = "\\\\[^\uD800-\uDFFF]";
var controlWordWhitespaceRegexString = "" + controlWordRegexString + spaceRegexString + "*";
var controlWordWhitespaceRegex = new RegExp("^(" + controlWordRegexString + ")" + spaceRegexString + "*$");
var combiningDiacriticalMarkString = "[\u0300-\u036F]";
var combiningDiacriticalMarksEndRegex = new RegExp(combiningDiacriticalMarkString + "+$");
var tokenRegexString = "(" + spaceRegexString + "+)|" + // whitespace
"([!-\\[\\]-\u2027\u202A-\uD7FF\uF900-\uFFFF]" + ( // single codepoint
combiningDiacriticalMarkString + "*") + // ...plus accents
"|[\uD800-\uDBFF][\uDC00-\uDFFF]" + ( // surrogate pair
combiningDiacriticalMarkString + "*") + // ...plus accents
"|\\\\verb\\*([^]).*?\\3" + // \verb*
"|\\\\verb([^*a-zA-Z]).*?\\4" + // \verb unstarred
"|\\\\operatorname\\*" + ( // \operatorname*
"|" + controlWordWhitespaceRegexString) + ( // \macroName + spaces
"|" + controlSymbolRegexString + ")"); // \\, \', etc.

/** Main Lexer class */

var Lexer_Lexer =
/*#__PURE__*/
function () {
  // category codes, only supports comment characters (14) for now
  function Lexer(input, settings) {
    this.input = void 0;
    this.settings = void 0;
    this.tokenRegex = void 0;
    this.catcodes = void 0;
    // Separate accents from characters
    this.input = input;
    this.settings = settings;
    this.tokenRegex = new RegExp(tokenRegexString, 'g');
    this.catcodes = {
      "%": 14 // comment character

    };
  }

  var _proto = Lexer.prototype;

  _proto.setCatcode = function setCatcode(char, code) {
    this.catcodes[char] = code;
  }
  /**
   * This function lexes a single token.
   */
  ;

  _proto.lex = function lex() {
    var input = this.input;
    var pos = this.tokenRegex.lastIndex;

    if (pos === input.length) {
      return new Token_Token("EOF", new SourceLocation(this, pos, pos));
    }

    var match = this.tokenRegex.exec(input);

    if (match === null || match.index !== pos) {
      throw new src_ParseError("Unexpected character: '" + input[pos] + "'", new Token_Token(input[pos], new SourceLocation(this, pos, pos + 1)));
    }

    var text = match[2] || " ";

    if (this.catcodes[text] === 14) {
      // comment character
      var nlIndex = input.indexOf('\n', this.tokenRegex.lastIndex);

      if (nlIndex === -1) {
        this.tokenRegex.lastIndex = input.length; // EOF

        this.settings.reportNonstrict("commentAtEnd", "% comment has no terminating newline; LaTeX would " + "fail because of commenting the end of math mode (e.g. $)");
      } else {
        this.tokenRegex.lastIndex = nlIndex + 1;
      }

      return this.lex();
    } // Trim any trailing whitespace from control word match


    var controlMatch = text.match(controlWordWhitespaceRegex);

    if (controlMatch) {
      text = controlMatch[1];
    }

    return new Token_Token(text, new SourceLocation(this, pos, this.tokenRegex.lastIndex));
  };

  return Lexer;
}();


// CONCATENATED MODULE: ./src/Namespace.js
/**
 * A `Namespace` refers to a space of nameable things like macros or lengths,
 * which can be `set` either globally or local to a nested group, using an
 * undo stack similar to how TeX implements this functionality.
 * Performance-wise, `get` and local `set` take constant time, while global
 * `set` takes time proportional to the depth of group nesting.
 */


var Namespace_Namespace =
/*#__PURE__*/
function () {
  /**
   * Both arguments are optional.  The first argument is an object of
   * built-in mappings which never change.  The second argument is an object
   * of initial (global-level) mappings, which will constantly change
   * according to any global/top-level `set`s done.
   */
  function Namespace(builtins, globalMacros) {
    if (builtins === void 0) {
      builtins = {};
    }

    if (globalMacros === void 0) {
      globalMacros = {};
    }

    this.current = void 0;
    this.builtins = void 0;
    this.undefStack = void 0;
    this.current = globalMacros;
    this.builtins = builtins;
    this.undefStack = [];
  }
  /**
   * Start a new nested group, affecting future local `set`s.
   */


  var _proto = Namespace.prototype;

  _proto.beginGroup = function beginGroup() {
    this.undefStack.push({});
  }
  /**
   * End current nested group, restoring values before the group began.
   */
  ;

  _proto.endGroup = function endGroup() {
    if (this.undefStack.length === 0) {
      throw new src_ParseError("Unbalanced namespace destruction: attempt " + "to pop global namespace; please report this as a bug");
    }

    var undefs = this.undefStack.pop();

    for (var undef in undefs) {
      if (undefs.hasOwnProperty(undef)) {
        if (undefs[undef] === undefined) {
          delete this.current[undef];
        } else {
          this.current[undef] = undefs[undef];
        }
      }
    }
  }
  /**
   * Detect whether `name` has a definition.  Equivalent to
   * `get(name) != null`.
   */
  ;

  _proto.has = function has(name) {
    return this.current.hasOwnProperty(name) || this.builtins.hasOwnProperty(name);
  }
  /**
   * Get the current value of a name, or `undefined` if there is no value.
   *
   * Note: Do not use `if (namespace.get(...))` to detect whether a macro
   * is defined, as the definition may be the empty string which evaluates
   * to `false` in JavaScript.  Use `if (namespace.get(...) != null)` or
   * `if (namespace.has(...))`.
   */
  ;

  _proto.get = function get(name) {
    if (this.current.hasOwnProperty(name)) {
      return this.current[name];
    } else {
      return this.builtins[name];
    }
  }
  /**
   * Set the current value of a name, and optionally set it globally too.
   * Local set() sets the current value and (when appropriate) adds an undo
   * operation to the undo stack.  Global set() may change the undo
   * operation at every level, so takes time linear in their number.
   */
  ;

  _proto.set = function set(name, value, global) {
    if (global === void 0) {
      global = false;
    }

    if (global) {
      // Global set is equivalent to setting in all groups.  Simulate this
      // by destroying any undos currently scheduled for this name,
      // and adding an undo with the *new* value (in case it later gets
      // locally reset within this environment).
      for (var i = 0; i < this.undefStack.length; i++) {
        delete this.undefStack[i][name];
      }

      if (this.undefStack.length > 0) {
        this.undefStack[this.undefStack.length - 1][name] = value;
      }
    } else {
      // Undo this set at end of this group (possibly to `undefined`),
      // unless an undo is already in place, in which case that older
      // value is the correct one.
      var top = this.undefStack[this.undefStack.length - 1];

      if (top && !top.hasOwnProperty(name)) {
        top[name] = this.current[name];
      }
    }

    this.current[name] = value;
  };

  return Namespace;
}();


// CONCATENATED MODULE: ./src/macros.js
/**
 * Predefined macros for KaTeX.
 * This can be used to define some commands in terms of others.
 */





var builtinMacros = {};
/* harmony default export */ var macros = (builtinMacros); // This function might one day accept an additional argument and do more things.

function defineMacro(name, body) {
  builtinMacros[name] = body;
} //////////////////////////////////////////////////////////////////////
// macro tools
// LaTeX's \@firstoftwo{#1}{#2} expands to #1, skipping #2
// TeX source: \long\def\@firstoftwo#1#2{#1}

defineMacro("\\@firstoftwo", function (context) {
  var args = context.consumeArgs(2);
  return {
    tokens: args[0],
    numArgs: 0
  };
}); // LaTeX's \@secondoftwo{#1}{#2} expands to #2, skipping #1
// TeX source: \long\def\@secondoftwo#1#2{#2}

defineMacro("\\@secondoftwo", function (context) {
  var args = context.consumeArgs(2);
  return {
    tokens: args[1],
    numArgs: 0
  };
}); // LaTeX's \@ifnextchar{#1}{#2}{#3} looks ahead to the next (unexpanded)
// symbol.  If it matches #1, then the macro expands to #2; otherwise, #3.
// Note, however, that it does not consume the next symbol in either case.

defineMacro("\\@ifnextchar", function (context) {
  var args = context.consumeArgs(3); // symbol, if, else

  var nextToken = context.future();

  if (args[0].length === 1 && args[0][0].text === nextToken.text) {
    return {
      tokens: args[1],
      numArgs: 0
    };
  } else {
    return {
      tokens: args[2],
      numArgs: 0
    };
  }
}); // LaTeX's \@ifstar{#1}{#2} looks ahead to the next (unexpanded) symbol.
// If it is `*`, then it consumes the symbol, and the macro expands to #1;
// otherwise, the macro expands to #2 (without consuming the symbol).
// TeX source: \def\@ifstar#1{\@ifnextchar *{\@firstoftwo{#1}}}

defineMacro("\\@ifstar", "\\@ifnextchar *{\\@firstoftwo{#1}}"); // LaTeX's \TextOrMath{#1}{#2} expands to #1 in text mode, #2 in math mode

defineMacro("\\TextOrMath", function (context) {
  var args = context.consumeArgs(2);

  if (context.mode === 'text') {
    return {
      tokens: args[0],
      numArgs: 0
    };
  } else {
    return {
      tokens: args[1],
      numArgs: 0
    };
  }
}); // Lookup table for parsing numbers in base 8 through 16

var digitToNumber = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "a": 10,
  "A": 10,
  "b": 11,
  "B": 11,
  "c": 12,
  "C": 12,
  "d": 13,
  "D": 13,
  "e": 14,
  "E": 14,
  "f": 15,
  "F": 15
}; // TeX \char makes a literal character (catcode 12) using the following forms:
// (see The TeXBook, p. 43)
//   \char123  -- decimal
//   \char'123 -- octal
//   \char"123 -- hex
//   \char`x   -- character that can be written (i.e. isn't active)
//   \char`\x  -- character that cannot be written (e.g. %)
// These all refer to characters from the font, so we turn them into special
// calls to a function \@char dealt with in the Parser.

defineMacro("\\char", function (context) {
  var token = context.popToken();
  var base;
  var number = '';

  if (token.text === "'") {
    base = 8;
    token = context.popToken();
  } else if (token.text === '"') {
    base = 16;
    token = context.popToken();
  } else if (token.text === "`") {
    token = context.popToken();

    if (token.text[0] === "\\") {
      number = token.text.charCodeAt(1);
    } else if (token.text === "EOF") {
      throw new src_ParseError("\\char` missing argument");
    } else {
      number = token.text.charCodeAt(0);
    }
  } else {
    base = 10;
  }

  if (base) {
    // Parse a number in the given base, starting with first `token`.
    number = digitToNumber[token.text];

    if (number == null || number >= base) {
      throw new src_ParseError("Invalid base-" + base + " digit " + token.text);
    }

    var digit;

    while ((digit = digitToNumber[context.future().text]) != null && digit < base) {
      number *= base;
      number += digit;
      context.popToken();
    }
  }

  return "\\@char{" + number + "}";
}); // Basic support for macro definitions:
//     \def\macro{expansion}
//     \def\macro#1{expansion}
//     \def\macro#1#2{expansion}
//     \def\macro#1#2#3#4#5#6#7#8#9{expansion}
// Also the \gdef and \global\def equivalents

var macros_def = function def(context, global) {
  var arg = context.consumeArgs(1)[0];

  if (arg.length !== 1) {
    throw new src_ParseError("\\gdef's first argument must be a macro name");
  }

  var name = arg[0].text; // Count argument specifiers, and check they are in the order #1 #2 ...

  var numArgs = 0;
  arg = context.consumeArgs(1)[0];

  while (arg.length === 1 && arg[0].text === "#") {
    arg = context.consumeArgs(1)[0];

    if (arg.length !== 1) {
      throw new src_ParseError("Invalid argument number length \"" + arg.length + "\"");
    }

    if (!/^[1-9]$/.test(arg[0].text)) {
      throw new src_ParseError("Invalid argument number \"" + arg[0].text + "\"");
    }

    numArgs++;

    if (parseInt(arg[0].text) !== numArgs) {
      throw new src_ParseError("Argument number \"" + arg[0].text + "\" out of order");
    }

    arg = context.consumeArgs(1)[0];
  } // Final arg is the expansion of the macro


  context.macros.set(name, {
    tokens: arg,
    numArgs: numArgs
  }, global);
  return '';
};

defineMacro("\\gdef", function (context) {
  return macros_def(context, true);
});
defineMacro("\\def", function (context) {
  return macros_def(context, false);
});
defineMacro("\\global", function (context) {
  var next = context.consumeArgs(1)[0];

  if (next.length !== 1) {
    throw new src_ParseError("Invalid command after \\global");
  }

  var command = next[0].text; // TODO: Should expand command

  if (command === "\\def") {
    // \global\def is equivalent to \gdef
    return macros_def(context, true);
  } else {
    throw new src_ParseError("Invalid command '" + command + "' after \\global");
  }
}); // \newcommand{\macro}[args]{definition}
// \renewcommand{\macro}[args]{definition}
// TODO: Optional arguments: \newcommand{\macro}[args][default]{definition}

var macros_newcommand = function newcommand(context, existsOK, nonexistsOK) {
  var arg = context.consumeArgs(1)[0];

  if (arg.length !== 1) {
    throw new src_ParseError("\\newcommand's first argument must be a macro name");
  }

  var name = arg[0].text;
  var exists = context.isDefined(name);

  if (exists && !existsOK) {
    throw new src_ParseError("\\newcommand{" + name + "} attempting to redefine " + (name + "; use \\renewcommand"));
  }

  if (!exists && !nonexistsOK) {
    throw new src_ParseError("\\renewcommand{" + name + "} when command " + name + " " + "does not yet exist; use \\newcommand");
  }

  var numArgs = 0;
  arg = context.consumeArgs(1)[0];

  if (arg.length === 1 && arg[0].text === "[") {
    var argText = '';
    var token = context.expandNextToken();

    while (token.text !== "]" && token.text !== "EOF") {
      // TODO: Should properly expand arg, e.g., ignore {}s
      argText += token.text;
      token = context.expandNextToken();
    }

    if (!argText.match(/^\s*[0-9]+\s*$/)) {
      throw new src_ParseError("Invalid number of arguments: " + argText);
    }

    numArgs = parseInt(argText);
    arg = context.consumeArgs(1)[0];
  } // Final arg is the expansion of the macro


  context.macros.set(name, {
    tokens: arg,
    numArgs: numArgs
  });
  return '';
};

defineMacro("\\newcommand", function (context) {
  return macros_newcommand(context, false, true);
});
defineMacro("\\renewcommand", function (context) {
  return macros_newcommand(context, true, false);
});
defineMacro("\\providecommand", function (context) {
  return macros_newcommand(context, true, true);
}); //////////////////////////////////////////////////////////////////////
// Grouping
// \let\bgroup={ \let\egroup=}

defineMacro("\\bgroup", "{");
defineMacro("\\egroup", "}"); // Symbols from latex.ltx:
// \def\lq{`}
// \def\rq{'}
// \def \aa {\r a}
// \def \AA {\r A}

defineMacro("\\lq", "`");
defineMacro("\\rq", "'");
defineMacro("\\aa", "\\r a");
defineMacro("\\AA", "\\r A"); // Copyright (C) and registered (R) symbols. Use raw symbol in MathML.
// \DeclareTextCommandDefault{\textcopyright}{\textcircled{c}}
// \DeclareTextCommandDefault{\textregistered}{\textcircled{%
//      \check@mathfonts\fontsize\sf@size\z@\math@fontsfalse\selectfont R}}
// \DeclareRobustCommand{\copyright}{%
//    \ifmmode{\nfss@text{\textcopyright}}\else\textcopyright\fi}

defineMacro("\\textcopyright", "\\html@mathml{\\textcircled{c}}{\\char`©}");
defineMacro("\\copyright", "\\TextOrMath{\\textcopyright}{\\text{\\textcopyright}}");
defineMacro("\\textregistered", "\\html@mathml{\\textcircled{\\scriptsize R}}{\\char`®}"); // Characters omitted from Unicode range 1D400–1D7FF

defineMacro("\u212C", "\\mathscr{B}"); // script

defineMacro("\u2130", "\\mathscr{E}");
defineMacro("\u2131", "\\mathscr{F}");
defineMacro("\u210B", "\\mathscr{H}");
defineMacro("\u2110", "\\mathscr{I}");
defineMacro("\u2112", "\\mathscr{L}");
defineMacro("\u2133", "\\mathscr{M}");
defineMacro("\u211B", "\\mathscr{R}");
defineMacro("\u212D", "\\mathfrak{C}"); // Fraktur

defineMacro("\u210C", "\\mathfrak{H}");
defineMacro("\u2128", "\\mathfrak{Z}"); // Define \Bbbk with a macro that works in both HTML and MathML.

defineMacro("\\Bbbk", "\\Bbb{k}"); // Unicode middle dot
// The KaTeX fonts do not contain U+00B7. Instead, \cdotp displays
// the dot at U+22C5 and gives it punct spacing.

defineMacro("\xB7", "\\cdotp"); // \llap and \rlap render their contents in text mode

defineMacro("\\llap", "\\mathllap{\\textrm{#1}}");
defineMacro("\\rlap", "\\mathrlap{\\textrm{#1}}");
defineMacro("\\clap", "\\mathclap{\\textrm{#1}}"); // \not is defined by base/fontmath.ltx via
// \DeclareMathSymbol{\not}{\mathrel}{symbols}{"36}
// It's thus treated like a \mathrel, but defined by a symbol that has zero
// width but extends to the right.  We use \rlap to get that spacing.
// For MathML we write U+0338 here. buildMathML.js will then do the overlay.

defineMacro("\\not", '\\html@mathml{\\mathrel{\\mathrlap\\@not}}{\\char"338}'); // Negated symbols from base/fontmath.ltx:
// \def\neq{\not=} \let\ne=\neq
// \DeclareRobustCommand
//   \notin{\mathrel{\m@th\mathpalette\c@ncel\in}}
// \def\c@ncel#1#2{\m@th\ooalign{$\hfil#1\mkern1mu/\hfil$\crcr$#1#2$}}

defineMacro("\\neq", "\\html@mathml{\\mathrel{\\not=}}{\\mathrel{\\char`≠}}");
defineMacro("\\ne", "\\neq");
defineMacro("\u2260", "\\neq");
defineMacro("\\notin", "\\html@mathml{\\mathrel{{\\in}\\mathllap{/\\mskip1mu}}}" + "{\\mathrel{\\char`∉}}");
defineMacro("\u2209", "\\notin"); // Unicode stacked relations

defineMacro("\u2258", "\\html@mathml{" + "\\mathrel{=\\kern{-1em}\\raisebox{0.4em}{$\\scriptsize\\frown$}}" + "}{\\mathrel{\\char`\u2258}}");
defineMacro("\u2259", "\\html@mathml{\\stackrel{\\tiny\\wedge}{=}}{\\mathrel{\\char`\u2258}}");
defineMacro("\u225A", "\\html@mathml{\\stackrel{\\tiny\\vee}{=}}{\\mathrel{\\char`\u225A}}");
defineMacro("\u225B", "\\html@mathml{\\stackrel{\\scriptsize\\star}{=}}" + "{\\mathrel{\\char`\u225B}}");
defineMacro("\u225D", "\\html@mathml{\\stackrel{\\tiny\\mathrm{def}}{=}}" + "{\\mathrel{\\char`\u225D}}");
defineMacro("\u225E", "\\html@mathml{\\stackrel{\\tiny\\mathrm{m}}{=}}" + "{\\mathrel{\\char`\u225E}}");
defineMacro("\u225F", "\\html@mathml{\\stackrel{\\tiny?}{=}}{\\mathrel{\\char`\u225F}}"); // Misc Unicode

defineMacro("\u27C2", "\\perp");
defineMacro("\u203C", "\\mathclose{!\\mkern-0.8mu!}");
defineMacro("\u220C", "\\notni");
defineMacro("\u231C", "\\ulcorner");
defineMacro("\u231D", "\\urcorner");
defineMacro("\u231E", "\\llcorner");
defineMacro("\u231F", "\\lrcorner");
defineMacro("\xA9", "\\copyright");
defineMacro("\xAE", "\\textregistered");
defineMacro("\uFE0F", "\\textregistered"); //////////////////////////////////////////////////////////////////////
// LaTeX_2ε
// \vdots{\vbox{\baselineskip4\p@  \lineskiplimit\z@
// \kern6\p@\hbox{.}\hbox{.}\hbox{.}}}
// We'll call \varvdots, which gets a glyph from symbols.js.
// The zero-width rule gets us an equivalent to the vertical 6pt kern.

defineMacro("\\vdots", "\\mathord{\\varvdots\\rule{0pt}{15pt}}");
defineMacro("\u22EE", "\\vdots"); //////////////////////////////////////////////////////////////////////
// amsmath.sty
// http://mirrors.concertpass.com/tex-archive/macros/latex/required/amsmath/amsmath.pdf
// Italic Greek capital letters.  AMS defines these with \DeclareMathSymbol,
// but they are equivalent to \mathit{\Letter}.

defineMacro("\\varGamma", "\\mathit{\\Gamma}");
defineMacro("\\varDelta", "\\mathit{\\Delta}");
defineMacro("\\varTheta", "\\mathit{\\Theta}");
defineMacro("\\varLambda", "\\mathit{\\Lambda}");
defineMacro("\\varXi", "\\mathit{\\Xi}");
defineMacro("\\varPi", "\\mathit{\\Pi}");
defineMacro("\\varSigma", "\\mathit{\\Sigma}");
defineMacro("\\varUpsilon", "\\mathit{\\Upsilon}");
defineMacro("\\varPhi", "\\mathit{\\Phi}");
defineMacro("\\varPsi", "\\mathit{\\Psi}");
defineMacro("\\varOmega", "\\mathit{\\Omega}"); //\newcommand{\substack}[1]{\subarray{c}#1\endsubarray}

defineMacro("\\substack", "\\begin{subarray}{c}#1\\end{subarray}"); // \renewcommand{\colon}{\nobreak\mskip2mu\mathpunct{}\nonscript
// \mkern-\thinmuskip{:}\mskip6muplus1mu\relax}

defineMacro("\\colon", "\\nobreak\\mskip2mu\\mathpunct{}" + "\\mathchoice{\\mkern-3mu}{\\mkern-3mu}{}{}{:}\\mskip6mu"); // \newcommand{\boxed}[1]{\fbox{\m@th$\displaystyle#1$}}

defineMacro("\\boxed", "\\fbox{$\\displaystyle{#1}$}"); // \def\iff{\DOTSB\;\Longleftrightarrow\;}
// \def\implies{\DOTSB\;\Longrightarrow\;}
// \def\impliedby{\DOTSB\;\Longleftarrow\;}

defineMacro("\\iff", "\\DOTSB\\;\\Longleftrightarrow\\;");
defineMacro("\\implies", "\\DOTSB\\;\\Longrightarrow\\;");
defineMacro("\\impliedby", "\\DOTSB\\;\\Longleftarrow\\;"); // AMSMath's automatic \dots, based on \mdots@@ macro.

var dotsByToken = {
  ',': '\\dotsc',
  '\\not': '\\dotsb',
  // \keybin@ checks for the following:
  '+': '\\dotsb',
  '=': '\\dotsb',
  '<': '\\dotsb',
  '>': '\\dotsb',
  '-': '\\dotsb',
  '*': '\\dotsb',
  ':': '\\dotsb',
  // Symbols whose definition starts with \DOTSB:
  '\\DOTSB': '\\dotsb',
  '\\coprod': '\\dotsb',
  '\\bigvee': '\\dotsb',
  '\\bigwedge': '\\dotsb',
  '\\biguplus': '\\dotsb',
  '\\bigcap': '\\dotsb',
  '\\bigcup': '\\dotsb',
  '\\prod': '\\dotsb',
  '\\sum': '\\dotsb',
  '\\bigotimes': '\\dotsb',
  '\\bigoplus': '\\dotsb',
  '\\bigodot': '\\dotsb',
  '\\bigsqcup': '\\dotsb',
  '\\And': '\\dotsb',
  '\\longrightarrow': '\\dotsb',
  '\\Longrightarrow': '\\dotsb',
  '\\longleftarrow': '\\dotsb',
  '\\Longleftarrow': '\\dotsb',
  '\\longleftrightarrow': '\\dotsb',
  '\\Longleftrightarrow': '\\dotsb',
  '\\mapsto': '\\dotsb',
  '\\longmapsto': '\\dotsb',
  '\\hookrightarrow': '\\dotsb',
  '\\doteq': '\\dotsb',
  // Symbols whose definition starts with \mathbin:
  '\\mathbin': '\\dotsb',
  // Symbols whose definition starts with \mathrel:
  '\\mathrel': '\\dotsb',
  '\\relbar': '\\dotsb',
  '\\Relbar': '\\dotsb',
  '\\xrightarrow': '\\dotsb',
  '\\xleftarrow': '\\dotsb',
  // Symbols whose definition starts with \DOTSI:
  '\\DOTSI': '\\dotsi',
  '\\int': '\\dotsi',
  '\\oint': '\\dotsi',
  '\\iint': '\\dotsi',
  '\\iiint': '\\dotsi',
  '\\iiiint': '\\dotsi',
  '\\idotsint': '\\dotsi',
  // Symbols whose definition starts with \DOTSX:
  '\\DOTSX': '\\dotsx'
};
defineMacro("\\dots", function (context) {
  // TODO: If used in text mode, should expand to \textellipsis.
  // However, in KaTeX, \textellipsis and \ldots behave the same
  // (in text mode), and it's unlikely we'd see any of the math commands
  // that affect the behavior of \dots when in text mode.  So fine for now
  // (until we support \ifmmode ... \else ... \fi).
  var thedots = '\\dotso';
  var next = context.expandAfterFuture().text;

  if (next in dotsByToken) {
    thedots = dotsByToken[next];
  } else if (next.substr(0, 4) === '\\not') {
    thedots = '\\dotsb';
  } else if (next in src_symbols.math) {
    if (utils.contains(['bin', 'rel'], src_symbols.math[next].group)) {
      thedots = '\\dotsb';
    }
  }

  return thedots;
});
var spaceAfterDots = {
  // \rightdelim@ checks for the following:
  ')': true,
  ']': true,
  '\\rbrack': true,
  '\\}': true,
  '\\rbrace': true,
  '\\rangle': true,
  '\\rceil': true,
  '\\rfloor': true,
  '\\rgroup': true,
  '\\rmoustache': true,
  '\\right': true,
  '\\bigr': true,
  '\\biggr': true,
  '\\Bigr': true,
  '\\Biggr': true,
  // \extra@ also tests for the following:
  '$': true,
  // \extrap@ checks for the following:
  ';': true,
  '.': true,
  ',': true
};
defineMacro("\\dotso", function (context) {
  var next = context.future().text;

  if (next in spaceAfterDots) {
    return "\\ldots\\,";
  } else {
    return "\\ldots";
  }
});
defineMacro("\\dotsc", function (context) {
  var next = context.future().text; // \dotsc uses \extra@ but not \extrap@, instead specially checking for
  // ';' and '.', but doesn't check for ','.

  if (next in spaceAfterDots && next !== ',') {
    return "\\ldots\\,";
  } else {
    return "\\ldots";
  }
});
defineMacro("\\cdots", function (context) {
  var next = context.future().text;

  if (next in spaceAfterDots) {
    return "\\@cdots\\,";
  } else {
    return "\\@cdots";
  }
});
defineMacro("\\dotsb", "\\cdots");
defineMacro("\\dotsm", "\\cdots");
defineMacro("\\dotsi", "\\!\\cdots"); // amsmath doesn't actually define \dotsx, but \dots followed by a macro
// starting with \DOTSX implies \dotso, and then \extra@ detects this case
// and forces the added `\,`.

defineMacro("\\dotsx", "\\ldots\\,"); // \let\DOTSI\relax
// \let\DOTSB\relax
// \let\DOTSX\relax

defineMacro("\\DOTSI", "\\relax");
defineMacro("\\DOTSB", "\\relax");
defineMacro("\\DOTSX", "\\relax"); // Spacing, based on amsmath.sty's override of LaTeX defaults
// \DeclareRobustCommand{\tmspace}[3]{%
//   \ifmmode\mskip#1#2\else\kern#1#3\fi\relax}

defineMacro("\\tmspace", "\\TextOrMath{\\kern#1#3}{\\mskip#1#2}\\relax"); // \renewcommand{\,}{\tmspace+\thinmuskip{.1667em}}
// TODO: math mode should use \thinmuskip

defineMacro("\\,", "\\tmspace+{3mu}{.1667em}"); // \let\thinspace\,

defineMacro("\\thinspace", "\\,"); // \def\>{\mskip\medmuskip}
// \renewcommand{\:}{\tmspace+\medmuskip{.2222em}}
// TODO: \> and math mode of \: should use \medmuskip = 4mu plus 2mu minus 4mu

defineMacro("\\>", "\\mskip{4mu}");
defineMacro("\\:", "\\tmspace+{4mu}{.2222em}"); // \let\medspace\:

defineMacro("\\medspace", "\\:"); // \renewcommand{\;}{\tmspace+\thickmuskip{.2777em}}
// TODO: math mode should use \thickmuskip = 5mu plus 5mu

defineMacro("\\;", "\\tmspace+{5mu}{.2777em}"); // \let\thickspace\;

defineMacro("\\thickspace", "\\;"); // \renewcommand{\!}{\tmspace-\thinmuskip{.1667em}}
// TODO: math mode should use \thinmuskip

defineMacro("\\!", "\\tmspace-{3mu}{.1667em}"); // \let\negthinspace\!

defineMacro("\\negthinspace", "\\!"); // \newcommand{\negmedspace}{\tmspace-\medmuskip{.2222em}}
// TODO: math mode should use \medmuskip

defineMacro("\\negmedspace", "\\tmspace-{4mu}{.2222em}"); // \newcommand{\negthickspace}{\tmspace-\thickmuskip{.2777em}}
// TODO: math mode should use \thickmuskip

defineMacro("\\negthickspace", "\\tmspace-{5mu}{.277em}"); // \def\enspace{\kern.5em }

defineMacro("\\enspace", "\\kern.5em "); // \def\enskip{\hskip.5em\relax}

defineMacro("\\enskip", "\\hskip.5em\\relax"); // \def\quad{\hskip1em\relax}

defineMacro("\\quad", "\\hskip1em\\relax"); // \def\qquad{\hskip2em\relax}

defineMacro("\\qquad", "\\hskip2em\\relax"); // \tag@in@display form of \tag

defineMacro("\\tag", "\\@ifstar\\tag@literal\\tag@paren");
defineMacro("\\tag@paren", "\\tag@literal{({#1})}");
defineMacro("\\tag@literal", function (context) {
  if (context.macros.get("\\df@tag")) {
    throw new src_ParseError("Multiple \\tag");
  }

  return "\\gdef\\df@tag{\\text{#1}}";
}); // \renewcommand{\bmod}{\nonscript\mskip-\medmuskip\mkern5mu\mathbin
//   {\operator@font mod}\penalty900
//   \mkern5mu\nonscript\mskip-\medmuskip}
// \newcommand{\pod}[1]{\allowbreak
//   \if@display\mkern18mu\else\mkern8mu\fi(#1)}
// \renewcommand{\pmod}[1]{\pod{{\operator@font mod}\mkern6mu#1}}
// \newcommand{\mod}[1]{\allowbreak\if@display\mkern18mu
//   \else\mkern12mu\fi{\operator@font mod}\,\,#1}
// TODO: math mode should use \medmuskip = 4mu plus 2mu minus 4mu

defineMacro("\\bmod", "\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}" + "\\mathbin{\\rm mod}" + "\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}");
defineMacro("\\pod", "\\allowbreak" + "\\mathchoice{\\mkern18mu}{\\mkern8mu}{\\mkern8mu}{\\mkern8mu}(#1)");
defineMacro("\\pmod", "\\pod{{\\rm mod}\\mkern6mu#1}");
defineMacro("\\mod", "\\allowbreak" + "\\mathchoice{\\mkern18mu}{\\mkern12mu}{\\mkern12mu}{\\mkern12mu}" + "{\\rm mod}\\,\\,#1"); // \pmb    --   A simulation of bold.
// The version in ambsy.sty works by typesetting three copies of the argument
// with small offsets. We use two copies. We omit the vertical offset because
// of rendering problems that makeVList encounters in Safari.

defineMacro("\\pmb", "\\html@mathml{" + "\\@binrel{#1}{\\mathrlap{#1}\\kern0.5px#1}}" + "{\\mathbf{#1}}"); //////////////////////////////////////////////////////////////////////
// LaTeX source2e
// \\ defaults to \newline, but changes to \cr within array environment

defineMacro("\\\\", "\\newline"); // \def\TeX{T\kern-.1667em\lower.5ex\hbox{E}\kern-.125emX\@}
// TODO: Doesn't normally work in math mode because \@ fails.  KaTeX doesn't
// support \@ yet, so that's omitted, and we add \text so that the result
// doesn't look funny in math mode.

defineMacro("\\TeX", "\\textrm{\\html@mathml{" + "T\\kern-.1667em\\raisebox{-.5ex}{E}\\kern-.125emX" + "}{TeX}}"); // \DeclareRobustCommand{\LaTeX}{L\kern-.36em%
//         {\sbox\z@ T%
//          \vbox to\ht\z@{\hbox{\check@mathfonts
//                               \fontsize\sf@size\z@
//                               \math@fontsfalse\selectfont
//                               A}%
//                         \vss}%
//         }%
//         \kern-.15em%
//         \TeX}
// This code aligns the top of the A with the T (from the perspective of TeX's
// boxes, though visually the A appears to extend above slightly).
// We compute the corresponding \raisebox when A is rendered in \normalsize
// \scriptstyle, which has a scale factor of 0.7 (see Options.js).

var latexRaiseA = fontMetricsData['Main-Regular']["T".charCodeAt(0)][1] - 0.7 * fontMetricsData['Main-Regular']["A".charCodeAt(0)][1] + "em";
defineMacro("\\LaTeX", "\\textrm{\\html@mathml{" + ("L\\kern-.36em\\raisebox{" + latexRaiseA + "}{\\scriptstyle A}") + "\\kern-.15em\\TeX}{LaTeX}}"); // New KaTeX logo based on tweaking LaTeX logo

defineMacro("\\KaTeX", "\\textrm{\\html@mathml{" + ("K\\kern-.17em\\raisebox{" + latexRaiseA + "}{\\scriptstyle A}") + "\\kern-.15em\\TeX}{KaTeX}}"); // \DeclareRobustCommand\hspace{\@ifstar\@hspacer\@hspace}
// \def\@hspace#1{\hskip  #1\relax}
// \def\@hspacer#1{\vrule \@width\z@\nobreak
//                 \hskip #1\hskip \z@skip}

defineMacro("\\hspace", "\\@ifstar\\@hspacer\\@hspace");
defineMacro("\\@hspace", "\\hskip #1\\relax");
defineMacro("\\@hspacer", "\\rule{0pt}{0pt}\\hskip #1\\relax"); //////////////////////////////////////////////////////////////////////
// mathtools.sty
//\providecommand\ordinarycolon{:}

defineMacro("\\ordinarycolon", ":"); //\def\vcentcolon{\mathrel{\mathop\ordinarycolon}}
//TODO(edemaine): Not yet centered. Fix via \raisebox or #726

defineMacro("\\vcentcolon", "\\mathrel{\\mathop\\ordinarycolon}"); // \providecommand*\dblcolon{\vcentcolon\mathrel{\mkern-.9mu}\vcentcolon}

defineMacro("\\dblcolon", "\\html@mathml{" + "\\mathrel{\\vcentcolon\\mathrel{\\mkern-.9mu}\\vcentcolon}}" + "{\\mathop{\\char\"2237}}"); // \providecommand*\coloneqq{\vcentcolon\mathrel{\mkern-1.2mu}=}

defineMacro("\\coloneqq", "\\html@mathml{" + "\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}=}}" + "{\\mathop{\\char\"2254}}"); // ≔
// \providecommand*\Coloneqq{\dblcolon\mathrel{\mkern-1.2mu}=}

defineMacro("\\Coloneqq", "\\html@mathml{" + "\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}=}}" + "{\\mathop{\\char\"2237\\char\"3d}}"); // \providecommand*\coloneq{\vcentcolon\mathrel{\mkern-1.2mu}\mathrel{-}}

defineMacro("\\coloneq", "\\html@mathml{" + "\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}" + "{\\mathop{\\char\"3a\\char\"2212}}"); // \providecommand*\Coloneq{\dblcolon\mathrel{\mkern-1.2mu}\mathrel{-}}

defineMacro("\\Coloneq", "\\html@mathml{" + "\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}" + "{\\mathop{\\char\"2237\\char\"2212}}"); // \providecommand*\eqqcolon{=\mathrel{\mkern-1.2mu}\vcentcolon}

defineMacro("\\eqqcolon", "\\html@mathml{" + "\\mathrel{=\\mathrel{\\mkern-1.2mu}\\vcentcolon}}" + "{\\mathop{\\char\"2255}}"); // ≕
// \providecommand*\Eqqcolon{=\mathrel{\mkern-1.2mu}\dblcolon}

defineMacro("\\Eqqcolon", "\\html@mathml{" + "\\mathrel{=\\mathrel{\\mkern-1.2mu}\\dblcolon}}" + "{\\mathop{\\char\"3d\\char\"2237}}"); // \providecommand*\eqcolon{\mathrel{-}\mathrel{\mkern-1.2mu}\vcentcolon}

defineMacro("\\eqcolon", "\\html@mathml{" + "\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\vcentcolon}}" + "{\\mathop{\\char\"2239}}"); // \providecommand*\Eqcolon{\mathrel{-}\mathrel{\mkern-1.2mu}\dblcolon}

defineMacro("\\Eqcolon", "\\html@mathml{" + "\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\dblcolon}}" + "{\\mathop{\\char\"2212\\char\"2237}}"); // \providecommand*\colonapprox{\vcentcolon\mathrel{\mkern-1.2mu}\approx}

defineMacro("\\colonapprox", "\\html@mathml{" + "\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\approx}}" + "{\\mathop{\\char\"3a\\char\"2248}}"); // \providecommand*\Colonapprox{\dblcolon\mathrel{\mkern-1.2mu}\approx}

defineMacro("\\Colonapprox", "\\html@mathml{" + "\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\approx}}" + "{\\mathop{\\char\"2237\\char\"2248}}"); // \providecommand*\colonsim{\vcentcolon\mathrel{\mkern-1.2mu}\sim}

defineMacro("\\colonsim", "\\html@mathml{" + "\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\sim}}" + "{\\mathop{\\char\"3a\\char\"223c}}"); // \providecommand*\Colonsim{\dblcolon\mathrel{\mkern-1.2mu}\sim}

defineMacro("\\Colonsim", "\\html@mathml{" + "\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\sim}}" + "{\\mathop{\\char\"2237\\char\"223c}}"); // Some Unicode characters are implemented with macros to mathtools functions.

defineMacro("\u2237", "\\dblcolon"); // ::

defineMacro("\u2239", "\\eqcolon"); // -:

defineMacro("\u2254", "\\coloneqq"); // :=

defineMacro("\u2255", "\\eqqcolon"); // =:

defineMacro("\u2A74", "\\Coloneqq"); // ::=
//////////////////////////////////////////////////////////////////////
// colonequals.sty
// Alternate names for mathtools's macros:

defineMacro("\\ratio", "\\vcentcolon");
defineMacro("\\coloncolon", "\\dblcolon");
defineMacro("\\colonequals", "\\coloneqq");
defineMacro("\\coloncolonequals", "\\Coloneqq");
defineMacro("\\equalscolon", "\\eqqcolon");
defineMacro("\\equalscoloncolon", "\\Eqqcolon");
defineMacro("\\colonminus", "\\coloneq");
defineMacro("\\coloncolonminus", "\\Coloneq");
defineMacro("\\minuscolon", "\\eqcolon");
defineMacro("\\minuscoloncolon", "\\Eqcolon"); // \colonapprox name is same in mathtools and colonequals.

defineMacro("\\coloncolonapprox", "\\Colonapprox"); // \colonsim name is same in mathtools and colonequals.

defineMacro("\\coloncolonsim", "\\Colonsim"); // Additional macros, implemented by analogy with mathtools definitions:

defineMacro("\\simcolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\vcentcolon}");
defineMacro("\\simcoloncolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}");
defineMacro("\\approxcolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\vcentcolon}");
defineMacro("\\approxcoloncolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}"); // Present in newtxmath, pxfonts and txfonts

defineMacro("\\notni", "\\html@mathml{\\not\\ni}{\\mathrel{\\char`\u220C}}");
defineMacro("\\limsup", "\\DOTSB\\operatorname*{lim\\,sup}");
defineMacro("\\liminf", "\\DOTSB\\operatorname*{lim\\,inf}"); //////////////////////////////////////////////////////////////////////
// MathML alternates for KaTeX glyphs in the Unicode private area

defineMacro("\\gvertneqq", "\\html@mathml{\\@gvertneqq}{\u2269}");
defineMacro("\\lvertneqq", "\\html@mathml{\\@lvertneqq}{\u2268}");
defineMacro("\\ngeqq", "\\html@mathml{\\@ngeqq}{\u2271}");
defineMacro("\\ngeqslant", "\\html@mathml{\\@ngeqslant}{\u2271}");
defineMacro("\\nleqq", "\\html@mathml{\\@nleqq}{\u2270}");
defineMacro("\\nleqslant", "\\html@mathml{\\@nleqslant}{\u2270}");
defineMacro("\\nshortmid", "\\html@mathml{\\@nshortmid}{∤}");
defineMacro("\\nshortparallel", "\\html@mathml{\\@nshortparallel}{∦}");
defineMacro("\\nsubseteqq", "\\html@mathml{\\@nsubseteqq}{\u2288}");
defineMacro("\\nsupseteqq", "\\html@mathml{\\@nsupseteqq}{\u2289}");
defineMacro("\\varsubsetneq", "\\html@mathml{\\@varsubsetneq}{⊊}");
defineMacro("\\varsubsetneqq", "\\html@mathml{\\@varsubsetneqq}{⫋}");
defineMacro("\\varsupsetneq", "\\html@mathml{\\@varsupsetneq}{⊋}");
defineMacro("\\varsupsetneqq", "\\html@mathml{\\@varsupsetneqq}{⫌}"); //////////////////////////////////////////////////////////////////////
// stmaryrd and semantic
// The stmaryrd and semantic packages render the next four items by calling a
// glyph. Those glyphs do not exist in the KaTeX fonts. Hence the macros.

defineMacro("\\llbracket", "\\html@mathml{" + "\\mathopen{[\\mkern-3.2mu[}}" + "{\\mathopen{\\char`\u27E6}}");
defineMacro("\\rrbracket", "\\html@mathml{" + "\\mathclose{]\\mkern-3.2mu]}}" + "{\\mathclose{\\char`\u27E7}}");
defineMacro("\u27E6", "\\llbracket"); // blackboard bold [

defineMacro("\u27E7", "\\rrbracket"); // blackboard bold ]

defineMacro("\\lBrace", "\\html@mathml{" + "\\mathopen{\\{\\mkern-3.2mu[}}" + "{\\mathopen{\\char`\u2983}}");
defineMacro("\\rBrace", "\\html@mathml{" + "\\mathclose{]\\mkern-3.2mu\\}}}" + "{\\mathclose{\\char`\u2984}}");
defineMacro("\u2983", "\\lBrace"); // blackboard bold {

defineMacro("\u2984", "\\rBrace"); // blackboard bold }
// TODO: Create variable sized versions of the last two items. I believe that
// will require new font glyphs.
//////////////////////////////////////////////////////////////////////
// texvc.sty
// The texvc package contains macros available in mediawiki pages.
// We omit the functions deprecated at
// https://en.wikipedia.org/wiki/Help:Displaying_a_formula#Deprecated_syntax
// We also omit texvc's \O, which conflicts with \text{\O}

defineMacro("\\darr", "\\downarrow");
defineMacro("\\dArr", "\\Downarrow");
defineMacro("\\Darr", "\\Downarrow");
defineMacro("\\lang", "\\langle");
defineMacro("\\rang", "\\rangle");
defineMacro("\\uarr", "\\uparrow");
defineMacro("\\uArr", "\\Uparrow");
defineMacro("\\Uarr", "\\Uparrow");
defineMacro("\\N", "\\mathbb{N}");
defineMacro("\\R", "\\mathbb{R}");
defineMacro("\\Z", "\\mathbb{Z}");
defineMacro("\\alef", "\\aleph");
defineMacro("\\alefsym", "\\aleph");
defineMacro("\\Alpha", "\\mathrm{A}");
defineMacro("\\Beta", "\\mathrm{B}");
defineMacro("\\bull", "\\bullet");
defineMacro("\\Chi", "\\mathrm{X}");
defineMacro("\\clubs", "\\clubsuit");
defineMacro("\\cnums", "\\mathbb{C}");
defineMacro("\\Complex", "\\mathbb{C}");
defineMacro("\\Dagger", "\\ddagger");
defineMacro("\\diamonds", "\\diamondsuit");
defineMacro("\\empty", "\\emptyset");
defineMacro("\\Epsilon", "\\mathrm{E}");
defineMacro("\\Eta", "\\mathrm{H}");
defineMacro("\\exist", "\\exists");
defineMacro("\\harr", "\\leftrightarrow");
defineMacro("\\hArr", "\\Leftrightarrow");
defineMacro("\\Harr", "\\Leftrightarrow");
defineMacro("\\hearts", "\\heartsuit");
defineMacro("\\image", "\\Im");
defineMacro("\\infin", "\\infty");
defineMacro("\\Iota", "\\mathrm{I}");
defineMacro("\\isin", "\\in");
defineMacro("\\Kappa", "\\mathrm{K}");
defineMacro("\\larr", "\\leftarrow");
defineMacro("\\lArr", "\\Leftarrow");
defineMacro("\\Larr", "\\Leftarrow");
defineMacro("\\lrarr", "\\leftrightarrow");
defineMacro("\\lrArr", "\\Leftrightarrow");
defineMacro("\\Lrarr", "\\Leftrightarrow");
defineMacro("\\Mu", "\\mathrm{M}");
defineMacro("\\natnums", "\\mathbb{N}");
defineMacro("\\Nu", "\\mathrm{N}");
defineMacro("\\Omicron", "\\mathrm{O}");
defineMacro("\\plusmn", "\\pm");
defineMacro("\\rarr", "\\rightarrow");
defineMacro("\\rArr", "\\Rightarrow");
defineMacro("\\Rarr", "\\Rightarrow");
defineMacro("\\real", "\\Re");
defineMacro("\\reals", "\\mathbb{R}");
defineMacro("\\Reals", "\\mathbb{R}");
defineMacro("\\Rho", "\\mathrm{P}");
defineMacro("\\sdot", "\\cdot");
defineMacro("\\sect", "\\S");
defineMacro("\\spades", "\\spadesuit");
defineMacro("\\sub", "\\subset");
defineMacro("\\sube", "\\subseteq");
defineMacro("\\supe", "\\supseteq");
defineMacro("\\Tau", "\\mathrm{T}");
defineMacro("\\thetasym", "\\vartheta"); // TODO: defineMacro("\\varcoppa", "\\\mbox{\\coppa}");

defineMacro("\\weierp", "\\wp");
defineMacro("\\Zeta", "\\mathrm{Z}"); //////////////////////////////////////////////////////////////////////
// statmath.sty
// https://ctan.math.illinois.edu/macros/latex/contrib/statmath/statmath.pdf

defineMacro("\\argmin", "\\DOTSB\\operatorname*{arg\\,min}");
defineMacro("\\argmax", "\\DOTSB\\operatorname*{arg\\,max}");
defineMacro("\\plim", "\\DOTSB\\mathop{\\operatorname{plim}}\\limits"); // Custom Khan Academy colors, should be moved to an optional package

defineMacro("\\blue", "\\textcolor{##6495ed}{#1}");
defineMacro("\\orange", "\\textcolor{##ffa500}{#1}");
defineMacro("\\pink", "\\textcolor{##ff00af}{#1}");
defineMacro("\\red", "\\textcolor{##df0030}{#1}");
defineMacro("\\green", "\\textcolor{##28ae7b}{#1}");
defineMacro("\\gray", "\\textcolor{gray}{#1}");
defineMacro("\\purple", "\\textcolor{##9d38bd}{#1}");
defineMacro("\\blueA", "\\textcolor{##ccfaff}{#1}");
defineMacro("\\blueB", "\\textcolor{##80f6ff}{#1}");
defineMacro("\\blueC", "\\textcolor{##63d9ea}{#1}");
defineMacro("\\blueD", "\\textcolor{##11accd}{#1}");
defineMacro("\\blueE", "\\textcolor{##0c7f99}{#1}");
defineMacro("\\tealA", "\\textcolor{##94fff5}{#1}");
defineMacro("\\tealB", "\\textcolor{##26edd5}{#1}");
defineMacro("\\tealC", "\\textcolor{##01d1c1}{#1}");
defineMacro("\\tealD", "\\textcolor{##01a995}{#1}");
defineMacro("\\tealE", "\\textcolor{##208170}{#1}");
defineMacro("\\greenA", "\\textcolor{##b6ffb0}{#1}");
defineMacro("\\greenB", "\\textcolor{##8af281}{#1}");
defineMacro("\\greenC", "\\textcolor{##74cf70}{#1}");
defineMacro("\\greenD", "\\textcolor{##1fab54}{#1}");
defineMacro("\\greenE", "\\textcolor{##0d923f}{#1}");
defineMacro("\\goldA", "\\textcolor{##ffd0a9}{#1}");
defineMacro("\\goldB", "\\textcolor{##ffbb71}{#1}");
defineMacro("\\goldC", "\\textcolor{##ff9c39}{#1}");
defineMacro("\\goldD", "\\textcolor{##e07d10}{#1}");
defineMacro("\\goldE", "\\textcolor{##a75a05}{#1}");
defineMacro("\\redA", "\\textcolor{##fca9a9}{#1}");
defineMacro("\\redB", "\\textcolor{##ff8482}{#1}");
defineMacro("\\redC", "\\textcolor{##f9685d}{#1}");
defineMacro("\\redD", "\\textcolor{##e84d39}{#1}");
defineMacro("\\redE", "\\textcolor{##bc2612}{#1}");
defineMacro("\\maroonA", "\\textcolor{##ffbde0}{#1}");
defineMacro("\\maroonB", "\\textcolor{##ff92c6}{#1}");
defineMacro("\\maroonC", "\\textcolor{##ed5fa6}{#1}");
defineMacro("\\maroonD", "\\textcolor{##ca337c}{#1}");
defineMacro("\\maroonE", "\\textcolor{##9e034e}{#1}");
defineMacro("\\purpleA", "\\textcolor{##ddd7ff}{#1}");
defineMacro("\\purpleB", "\\textcolor{##c6b9fc}{#1}");
defineMacro("\\purpleC", "\\textcolor{##aa87ff}{#1}");
defineMacro("\\purpleD", "\\textcolor{##7854ab}{#1}");
defineMacro("\\purpleE", "\\textcolor{##543b78}{#1}");
defineMacro("\\mintA", "\\textcolor{##f5f9e8}{#1}");
defineMacro("\\mintB", "\\textcolor{##edf2df}{#1}");
defineMacro("\\mintC", "\\textcolor{##e0e5cc}{#1}");
defineMacro("\\grayA", "\\textcolor{##f6f7f7}{#1}");
defineMacro("\\grayB", "\\textcolor{##f0f1f2}{#1}");
defineMacro("\\grayC", "\\textcolor{##e3e5e6}{#1}");
defineMacro("\\grayD", "\\textcolor{##d6d8da}{#1}");
defineMacro("\\grayE", "\\textcolor{##babec2}{#1}");
defineMacro("\\grayF", "\\textcolor{##888d93}{#1}");
defineMacro("\\grayG", "\\textcolor{##626569}{#1}");
defineMacro("\\grayH", "\\textcolor{##3b3e40}{#1}");
defineMacro("\\grayI", "\\textcolor{##21242c}{#1}");
defineMacro("\\kaBlue", "\\textcolor{##314453}{#1}");
defineMacro("\\kaGreen", "\\textcolor{##71B307}{#1}");
// CONCATENATED MODULE: ./src/MacroExpander.js
/**
 * This file contains the “gullet” where macros are expanded
 * until only non-macro tokens remain.
 */







// List of commands that act like macros but aren't defined as a macro,
// function, or symbol.  Used in `isDefined`.
var implicitCommands = {
  "\\relax": true,
  // MacroExpander.js
  "^": true,
  // Parser.js
  "_": true,
  // Parser.js
  "\\limits": true,
  // Parser.js
  "\\nolimits": true // Parser.js

};

var MacroExpander_MacroExpander =
/*#__PURE__*/
function () {
  function MacroExpander(input, settings, mode) {
    this.settings = void 0;
    this.expansionCount = void 0;
    this.lexer = void 0;
    this.macros = void 0;
    this.stack = void 0;
    this.mode = void 0;
    this.settings = settings;
    this.expansionCount = 0;
    this.feed(input); // Make new global namespace

    this.macros = new Namespace_Namespace(macros, settings.macros);
    this.mode = mode;
    this.stack = []; // contains tokens in REVERSE order
  }
  /**
   * Feed a new input string to the same MacroExpander
   * (with existing macros etc.).
   */


  var _proto = MacroExpander.prototype;

  _proto.feed = function feed(input) {
    this.lexer = new Lexer_Lexer(input, this.settings);
  }
  /**
   * Switches between "text" and "math" modes.
   */
  ;

  _proto.switchMode = function switchMode(newMode) {
    this.mode = newMode;
  }
  /**
   * Start a new group nesting within all namespaces.
   */
  ;

  _proto.beginGroup = function beginGroup() {
    this.macros.beginGroup();
  }
  /**
   * End current group nesting within all namespaces.
   */
  ;

  _proto.endGroup = function endGroup() {
    this.macros.endGroup();
  }
  /**
   * Returns the topmost token on the stack, without expanding it.
   * Similar in behavior to TeX's `\futurelet`.
   */
  ;

  _proto.future = function future() {
    if (this.stack.length === 0) {
      this.pushToken(this.lexer.lex());
    }

    return this.stack[this.stack.length - 1];
  }
  /**
   * Remove and return the next unexpanded token.
   */
  ;

  _proto.popToken = function popToken() {
    this.future(); // ensure non-empty stack

    return this.stack.pop();
  }
  /**
   * Add a given token to the token stack.  In particular, this get be used
   * to put back a token returned from one of the other methods.
   */
  ;

  _proto.pushToken = function pushToken(token) {
    this.stack.push(token);
  }
  /**
   * Append an array of tokens to the token stack.
   */
  ;

  _proto.pushTokens = function pushTokens(tokens) {
    var _this$stack;

    (_this$stack = this.stack).push.apply(_this$stack, tokens);
  }
  /**
   * Consume all following space tokens, without expansion.
   */
  ;

  _proto.consumeSpaces = function consumeSpaces() {
    for (;;) {
      var token = this.future();

      if (token.text === " ") {
        this.stack.pop();
      } else {
        break;
      }
    }
  }
  /**
   * Consume the specified number of arguments from the token stream,
   * and return the resulting array of arguments.
   */
  ;

  _proto.consumeArgs = function consumeArgs(numArgs) {
    var args = []; // obtain arguments, either single token or balanced {…} group

    for (var i = 0; i < numArgs; ++i) {
      this.consumeSpaces(); // ignore spaces before each argument

      var startOfArg = this.popToken();

      if (startOfArg.text === "{") {
        var arg = [];
        var depth = 1;

        while (depth !== 0) {
          var tok = this.popToken();
          arg.push(tok);

          if (tok.text === "{") {
            ++depth;
          } else if (tok.text === "}") {
            --depth;
          } else if (tok.text === "EOF") {
            throw new src_ParseError("End of input in macro argument", startOfArg);
          }
        }

        arg.pop(); // remove last }

        arg.reverse(); // like above, to fit in with stack order

        args[i] = arg;
      } else if (startOfArg.text === "EOF") {
        throw new src_ParseError("End of input expecting macro argument");
      } else {
        args[i] = [startOfArg];
      }
    }

    return args;
  }
  /**
   * Expand the next token only once if possible.
   *
   * If the token is expanded, the resulting tokens will be pushed onto
   * the stack in reverse order and will be returned as an array,
   * also in reverse order.
   *
   * If not, the next token will be returned without removing it
   * from the stack.  This case can be detected by a `Token` return value
   * instead of an `Array` return value.
   *
   * In either case, the next token will be on the top of the stack,
   * or the stack will be empty.
   *
   * Used to implement `expandAfterFuture` and `expandNextToken`.
   *
   * At the moment, macro expansion doesn't handle delimited macros,
   * i.e. things like those defined by \def\foo#1\end{…}.
   * See the TeX book page 202ff. for details on how those should behave.
   */
  ;

  _proto.expandOnce = function expandOnce() {
    var topToken = this.popToken();
    var name = topToken.text;

    var expansion = this._getExpansion(name);

    if (expansion == null) {
      // mainly checking for undefined here
      // Fully expanded
      this.pushToken(topToken);
      return topToken;
    }

    this.expansionCount++;

    if (this.expansionCount > this.settings.maxExpand) {
      throw new src_ParseError("Too many expansions: infinite loop or " + "need to increase maxExpand setting");
    }

    var tokens = expansion.tokens;

    if (expansion.numArgs) {
      var args = this.consumeArgs(expansion.numArgs); // paste arguments in place of the placeholders

      tokens = tokens.slice(); // make a shallow copy

      for (var i = tokens.length - 1; i >= 0; --i) {
        var tok = tokens[i];

        if (tok.text === "#") {
          if (i === 0) {
            throw new src_ParseError("Incomplete placeholder at end of macro body", tok);
          }

          tok = tokens[--i]; // next token on stack

          if (tok.text === "#") {
            // ## → #
            tokens.splice(i + 1, 1); // drop first #
          } else if (/^[1-9]$/.test(tok.text)) {
            var _tokens;

            // replace the placeholder with the indicated argument
            (_tokens = tokens).splice.apply(_tokens, [i, 2].concat(args[+tok.text - 1]));
          } else {
            throw new src_ParseError("Not a valid argument number", tok);
          }
        }
      }
    } // Concatenate expansion onto top of stack.


    this.pushTokens(tokens);
    return tokens;
  }
  /**
   * Expand the next token only once (if possible), and return the resulting
   * top token on the stack (without removing anything from the stack).
   * Similar in behavior to TeX's `\expandafter\futurelet`.
   * Equivalent to expandOnce() followed by future().
   */
  ;

  _proto.expandAfterFuture = function expandAfterFuture() {
    this.expandOnce();
    return this.future();
  }
  /**
   * Recursively expand first token, then return first non-expandable token.
   */
  ;

  _proto.expandNextToken = function expandNextToken() {
    for (;;) {
      var expanded = this.expandOnce(); // expandOnce returns Token if and only if it's fully expanded.

      if (expanded instanceof Token_Token) {
        // \relax stops the expansion, but shouldn't get returned (a
        // null return value couldn't get implemented as a function).
        if (expanded.text === "\\relax") {
          this.stack.pop();
        } else {
          return this.stack.pop(); // === expanded
        }
      }
    } // Flow unable to figure out that this pathway is impossible.
    // https://github.com/facebook/flow/issues/4808


    throw new Error(); // eslint-disable-line no-unreachable
  }
  /**
   * Fully expand the given macro name and return the resulting list of
   * tokens, or return `undefined` if no such macro is defined.
   */
  ;

  _proto.expandMacro = function expandMacro(name) {
    if (!this.macros.get(name)) {
      return undefined;
    }

    var output = [];
    var oldStackLength = this.stack.length;
    this.pushToken(new Token_Token(name));

    while (this.stack.length > oldStackLength) {
      var expanded = this.expandOnce(); // expandOnce returns Token if and only if it's fully expanded.

      if (expanded instanceof Token_Token) {
        output.push(this.stack.pop());
      }
    }

    return output;
  }
  /**
   * Fully expand the given macro name and return the result as a string,
   * or return `undefined` if no such macro is defined.
   */
  ;

  _proto.expandMacroAsText = function expandMacroAsText(name) {
    var tokens = this.expandMacro(name);

    if (tokens) {
      return tokens.map(function (token) {
        return token.text;
      }).join("");
    } else {
      return tokens;
    }
  }
  /**
   * Returns the expanded macro as a reversed array of tokens and a macro
   * argument count.  Or returns `null` if no such macro.
   */
  ;

  _proto._getExpansion = function _getExpansion(name) {
    var definition = this.macros.get(name);

    if (definition == null) {
      // mainly checking for undefined here
      return definition;
    }

    var expansion = typeof definition === "function" ? definition(this) : definition;

    if (typeof expansion === "string") {
      var numArgs = 0;

      if (expansion.indexOf("#") !== -1) {
        var stripped = expansion.replace(/##/g, "");

        while (stripped.indexOf("#" + (numArgs + 1)) !== -1) {
          ++numArgs;
        }
      }

      var bodyLexer = new Lexer_Lexer(expansion, this.settings);
      var tokens = [];
      var tok = bodyLexer.lex();

      while (tok.text !== "EOF") {
        tokens.push(tok);
        tok = bodyLexer.lex();
      }

      tokens.reverse(); // to fit in with stack using push and pop

      var expanded = {
        tokens: tokens,
        numArgs: numArgs
      };
      return expanded;
    }

    return expansion;
  }
  /**
   * Determine whether a command is currently "defined" (has some
   * functionality), meaning that it's a macro (in the current group),
   * a function, a symbol, or one of the special commands listed in
   * `implicitCommands`.
   */
  ;

  _proto.isDefined = function isDefined(name) {
    return this.macros.has(name) || src_functions.hasOwnProperty(name) || src_symbols.math.hasOwnProperty(name) || src_symbols.text.hasOwnProperty(name) || implicitCommands.hasOwnProperty(name);
  };

  return MacroExpander;
}();


// CONCATENATED MODULE: ./src/unicodeAccents.js
// Mapping of Unicode accent characters to their LaTeX equivalent in text and
// math mode (when they exist).
/* harmony default export */ var unicodeAccents = ({
  "\u0301": {
    text: "\\'",
    math: '\\acute'
  },
  "\u0300": {
    text: '\\`',
    math: '\\grave'
  },
  "\u0308": {
    text: '\\"',
    math: '\\ddot'
  },
  "\u0303": {
    text: '\\~',
    math: '\\tilde'
  },
  "\u0304": {
    text: '\\=',
    math: '\\bar'
  },
  "\u0306": {
    text: "\\u",
    math: '\\breve'
  },
  "\u030C": {
    text: '\\v',
    math: '\\check'
  },
  "\u0302": {
    text: '\\^',
    math: '\\hat'
  },
  "\u0307": {
    text: '\\.',
    math: '\\dot'
  },
  "\u030A": {
    text: '\\r',
    math: '\\mathring'
  },
  "\u030B": {
    text: '\\H'
  }
});
// CONCATENATED MODULE: ./src/unicodeSymbols.js
// This file is GENERATED by unicodeMake.js. DO NOT MODIFY.
/* harmony default export */ var unicodeSymbols = ({
  "\xE1": "a\u0301",
  // á = \'{a}
  "\xE0": "a\u0300",
  // à = \`{a}
  "\xE4": "a\u0308",
  // ä = \"{a}
  "\u01DF": "a\u0308\u0304",
  // ǟ = \"\={a}
  "\xE3": "a\u0303",
  // ã = \~{a}
  "\u0101": "a\u0304",
  // ā = \={a}
  "\u0103": "a\u0306",
  // ă = \u{a}
  "\u1EAF": "a\u0306\u0301",
  // ắ = \u\'{a}
  "\u1EB1": "a\u0306\u0300",
  // ằ = \u\`{a}
  "\u1EB5": "a\u0306\u0303",
  // ẵ = \u\~{a}
  "\u01CE": "a\u030C",
  // ǎ = \v{a}
  "\xE2": "a\u0302",
  // â = \^{a}
  "\u1EA5": "a\u0302\u0301",
  // ấ = \^\'{a}
  "\u1EA7": "a\u0302\u0300",
  // ầ = \^\`{a}
  "\u1EAB": "a\u0302\u0303",
  // ẫ = \^\~{a}
  "\u0227": "a\u0307",
  // ȧ = \.{a}
  "\u01E1": "a\u0307\u0304",
  // ǡ = \.\={a}
  "\xE5": "a\u030A",
  // å = \r{a}
  "\u01FB": "a\u030A\u0301",
  // ǻ = \r\'{a}
  "\u1E03": "b\u0307",
  // ḃ = \.{b}
  "\u0107": "c\u0301",
  // ć = \'{c}
  "\u010D": "c\u030C",
  // č = \v{c}
  "\u0109": "c\u0302",
  // ĉ = \^{c}
  "\u010B": "c\u0307",
  // ċ = \.{c}
  "\u010F": "d\u030C",
  // ď = \v{d}
  "\u1E0B": "d\u0307",
  // ḋ = \.{d}
  "\xE9": "e\u0301",
  // é = \'{e}
  "\xE8": "e\u0300",
  // è = \`{e}
  "\xEB": "e\u0308",
  // ë = \"{e}
  "\u1EBD": "e\u0303",
  // ẽ = \~{e}
  "\u0113": "e\u0304",
  // ē = \={e}
  "\u1E17": "e\u0304\u0301",
  // ḗ = \=\'{e}
  "\u1E15": "e\u0304\u0300",
  // ḕ = \=\`{e}
  "\u0115": "e\u0306",
  // ĕ = \u{e}
  "\u011B": "e\u030C",
  // ě = \v{e}
  "\xEA": "e\u0302",
  // ê = \^{e}
  "\u1EBF": "e\u0302\u0301",
  // ế = \^\'{e}
  "\u1EC1": "e\u0302\u0300",
  // ề = \^\`{e}
  "\u1EC5": "e\u0302\u0303",
  // ễ = \^\~{e}
  "\u0117": "e\u0307",
  // ė = \.{e}
  "\u1E1F": "f\u0307",
  // ḟ = \.{f}
  "\u01F5": "g\u0301",
  // ǵ = \'{g}
  "\u1E21": "g\u0304",
  // ḡ = \={g}
  "\u011F": "g\u0306",
  // ğ = \u{g}
  "\u01E7": "g\u030C",
  // ǧ = \v{g}
  "\u011D": "g\u0302",
  // ĝ = \^{g}
  "\u0121": "g\u0307",
  // ġ = \.{g}
  "\u1E27": "h\u0308",
  // ḧ = \"{h}
  "\u021F": "h\u030C",
  // ȟ = \v{h}
  "\u0125": "h\u0302",
  // ĥ = \^{h}
  "\u1E23": "h\u0307",
  // ḣ = \.{h}
  "\xED": "i\u0301",
  // í = \'{i}
  "\xEC": "i\u0300",
  // ì = \`{i}
  "\xEF": "i\u0308",
  // ï = \"{i}
  "\u1E2F": "i\u0308\u0301",
  // ḯ = \"\'{i}
  "\u0129": "i\u0303",
  // ĩ = \~{i}
  "\u012B": "i\u0304",
  // ī = \={i}
  "\u012D": "i\u0306",
  // ĭ = \u{i}
  "\u01D0": "i\u030C",
  // ǐ = \v{i}
  "\xEE": "i\u0302",
  // î = \^{i}
  "\u01F0": "j\u030C",
  // ǰ = \v{j}
  "\u0135": "j\u0302",
  // ĵ = \^{j}
  "\u1E31": "k\u0301",
  // ḱ = \'{k}
  "\u01E9": "k\u030C",
  // ǩ = \v{k}
  "\u013A": "l\u0301",
  // ĺ = \'{l}
  "\u013E": "l\u030C",
  // ľ = \v{l}
  "\u1E3F": "m\u0301",
  // ḿ = \'{m}
  "\u1E41": "m\u0307",
  // ṁ = \.{m}
  "\u0144": "n\u0301",
  // ń = \'{n}
  "\u01F9": "n\u0300",
  // ǹ = \`{n}
  "\xF1": "n\u0303",
  // ñ = \~{n}
  "\u0148": "n\u030C",
  // ň = \v{n}
  "\u1E45": "n\u0307",
  // ṅ = \.{n}
  "\xF3": "o\u0301",
  // ó = \'{o}
  "\xF2": "o\u0300",
  // ò = \`{o}
  "\xF6": "o\u0308",
  // ö = \"{o}
  "\u022B": "o\u0308\u0304",
  // ȫ = \"\={o}
  "\xF5": "o\u0303",
  // õ = \~{o}
  "\u1E4D": "o\u0303\u0301",
  // ṍ = \~\'{o}
  "\u1E4F": "o\u0303\u0308",
  // ṏ = \~\"{o}
  "\u022D": "o\u0303\u0304",
  // ȭ = \~\={o}
  "\u014D": "o\u0304",
  // ō = \={o}
  "\u1E53": "o\u0304\u0301",
  // ṓ = \=\'{o}
  "\u1E51": "o\u0304\u0300",
  // ṑ = \=\`{o}
  "\u014F": "o\u0306",
  // ŏ = \u{o}
  "\u01D2": "o\u030C",
  // ǒ = \v{o}
  "\xF4": "o\u0302",
  // ô = \^{o}
  "\u1ED1": "o\u0302\u0301",
  // ố = \^\'{o}
  "\u1ED3": "o\u0302\u0300",
  // ồ = \^\`{o}
  "\u1ED7": "o\u0302\u0303",
  // ỗ = \^\~{o}
  "\u022F": "o\u0307",
  // ȯ = \.{o}
  "\u0231": "o\u0307\u0304",
  // ȱ = \.\={o}
  "\u0151": "o\u030B",
  // ő = \H{o}
  "\u1E55": "p\u0301",
  // ṕ = \'{p}
  "\u1E57": "p\u0307",
  // ṗ = \.{p}
  "\u0155": "r\u0301",
  // ŕ = \'{r}
  "\u0159": "r\u030C",
  // ř = \v{r}
  "\u1E59": "r\u0307",
  // ṙ = \.{r}
  "\u015B": "s\u0301",
  // ś = \'{s}
  "\u1E65": "s\u0301\u0307",
  // ṥ = \'\.{s}
  "\u0161": "s\u030C",
  // š = \v{s}
  "\u1E67": "s\u030C\u0307",
  // ṧ = \v\.{s}
  "\u015D": "s\u0302",
  // ŝ = \^{s}
  "\u1E61": "s\u0307",
  // ṡ = \.{s}
  "\u1E97": "t\u0308",
  // ẗ = \"{t}
  "\u0165": "t\u030C",
  // ť = \v{t}
  "\u1E6B": "t\u0307",
  // ṫ = \.{t}
  "\xFA": "u\u0301",
  // ú = \'{u}
  "\xF9": "u\u0300",
  // ù = \`{u}
  "\xFC": "u\u0308",
  // ü = \"{u}
  "\u01D8": "u\u0308\u0301",
  // ǘ = \"\'{u}
  "\u01DC": "u\u0308\u0300",
  // ǜ = \"\`{u}
  "\u01D6": "u\u0308\u0304",
  // ǖ = \"\={u}
  "\u01DA": "u\u0308\u030C",
  // ǚ = \"\v{u}
  "\u0169": "u\u0303",
  // ũ = \~{u}
  "\u1E79": "u\u0303\u0301",
  // ṹ = \~\'{u}
  "\u016B": "u\u0304",
  // ū = \={u}
  "\u1E7B": "u\u0304\u0308",
  // ṻ = \=\"{u}
  "\u016D": "u\u0306",
  // ŭ = \u{u}
  "\u01D4": "u\u030C",
  // ǔ = \v{u}
  "\xFB": "u\u0302",
  // û = \^{u}
  "\u016F": "u\u030A",
  // ů = \r{u}
  "\u0171": "u\u030B",
  // ű = \H{u}
  "\u1E7D": "v\u0303",
  // ṽ = \~{v}
  "\u1E83": "w\u0301",
  // ẃ = \'{w}
  "\u1E81": "w\u0300",
  // ẁ = \`{w}
  "\u1E85": "w\u0308",
  // ẅ = \"{w}
  "\u0175": "w\u0302",
  // ŵ = \^{w}
  "\u1E87": "w\u0307",
  // ẇ = \.{w}
  "\u1E98": "w\u030A",
  // ẘ = \r{w}
  "\u1E8D": "x\u0308",
  // ẍ = \"{x}
  "\u1E8B": "x\u0307",
  // ẋ = \.{x}
  "\xFD": "y\u0301",
  // ý = \'{y}
  "\u1EF3": "y\u0300",
  // ỳ = \`{y}
  "\xFF": "y\u0308",
  // ÿ = \"{y}
  "\u1EF9": "y\u0303",
  // ỹ = \~{y}
  "\u0233": "y\u0304",
  // ȳ = \={y}
  "\u0177": "y\u0302",
  // ŷ = \^{y}
  "\u1E8F": "y\u0307",
  // ẏ = \.{y}
  "\u1E99": "y\u030A",
  // ẙ = \r{y}
  "\u017A": "z\u0301",
  // ź = \'{z}
  "\u017E": "z\u030C",
  // ž = \v{z}
  "\u1E91": "z\u0302",
  // ẑ = \^{z}
  "\u017C": "z\u0307",
  // ż = \.{z}
  "\xC1": "A\u0301",
  // Á = \'{A}
  "\xC0": "A\u0300",
  // À = \`{A}
  "\xC4": "A\u0308",
  // Ä = \"{A}
  "\u01DE": "A\u0308\u0304",
  // Ǟ = \"\={A}
  "\xC3": "A\u0303",
  // Ã = \~{A}
  "\u0100": "A\u0304",
  // Ā = \={A}
  "\u0102": "A\u0306",
  // Ă = \u{A}
  "\u1EAE": "A\u0306\u0301",
  // Ắ = \u\'{A}
  "\u1EB0": "A\u0306\u0300",
  // Ằ = \u\`{A}
  "\u1EB4": "A\u0306\u0303",
  // Ẵ = \u\~{A}
  "\u01CD": "A\u030C",
  // Ǎ = \v{A}
  "\xC2": "A\u0302",
  // Â = \^{A}
  "\u1EA4": "A\u0302\u0301",
  // Ấ = \^\'{A}
  "\u1EA6": "A\u0302\u0300",
  // Ầ = \^\`{A}
  "\u1EAA": "A\u0302\u0303",
  // Ẫ = \^\~{A}
  "\u0226": "A\u0307",
  // Ȧ = \.{A}
  "\u01E0": "A\u0307\u0304",
  // Ǡ = \.\={A}
  "\xC5": "A\u030A",
  // Å = \r{A}
  "\u01FA": "A\u030A\u0301",
  // Ǻ = \r\'{A}
  "\u1E02": "B\u0307",
  // Ḃ = \.{B}
  "\u0106": "C\u0301",
  // Ć = \'{C}
  "\u010C": "C\u030C",
  // Č = \v{C}
  "\u0108": "C\u0302",
  // Ĉ = \^{C}
  "\u010A": "C\u0307",
  // Ċ = \.{C}
  "\u010E": "D\u030C",
  // Ď = \v{D}
  "\u1E0A": "D\u0307",
  // Ḋ = \.{D}
  "\xC9": "E\u0301",
  // É = \'{E}
  "\xC8": "E\u0300",
  // È = \`{E}
  "\xCB": "E\u0308",
  // Ë = \"{E}
  "\u1EBC": "E\u0303",
  // Ẽ = \~{E}
  "\u0112": "E\u0304",
  // Ē = \={E}
  "\u1E16": "E\u0304\u0301",
  // Ḗ = \=\'{E}
  "\u1E14": "E\u0304\u0300",
  // Ḕ = \=\`{E}
  "\u0114": "E\u0306",
  // Ĕ = \u{E}
  "\u011A": "E\u030C",
  // Ě = \v{E}
  "\xCA": "E\u0302",
  // Ê = \^{E}
  "\u1EBE": "E\u0302\u0301",
  // Ế = \^\'{E}
  "\u1EC0": "E\u0302\u0300",
  // Ề = \^\`{E}
  "\u1EC4": "E\u0302\u0303",
  // Ễ = \^\~{E}
  "\u0116": "E\u0307",
  // Ė = \.{E}
  "\u1E1E": "F\u0307",
  // Ḟ = \.{F}
  "\u01F4": "G\u0301",
  // Ǵ = \'{G}
  "\u1E20": "G\u0304",
  // Ḡ = \={G}
  "\u011E": "G\u0306",
  // Ğ = \u{G}
  "\u01E6": "G\u030C",
  // Ǧ = \v{G}
  "\u011C": "G\u0302",
  // Ĝ = \^{G}
  "\u0120": "G\u0307",
  // Ġ = \.{G}
  "\u1E26": "H\u0308",
  // Ḧ = \"{H}
  "\u021E": "H\u030C",
  // Ȟ = \v{H}
  "\u0124": "H\u0302",
  // Ĥ = \^{H}
  "\u1E22": "H\u0307",
  // Ḣ = \.{H}
  "\xCD": "I\u0301",
  // Í = \'{I}
  "\xCC": "I\u0300",
  // Ì = \`{I}
  "\xCF": "I\u0308",
  // Ï = \"{I}
  "\u1E2E": "I\u0308\u0301",
  // Ḯ = \"\'{I}
  "\u0128": "I\u0303",
  // Ĩ = \~{I}
  "\u012A": "I\u0304",
  // Ī = \={I}
  "\u012C": "I\u0306",
  // Ĭ = \u{I}
  "\u01CF": "I\u030C",
  // Ǐ = \v{I}
  "\xCE": "I\u0302",
  // Î = \^{I}
  "\u0130": "I\u0307",
  // İ = \.{I}
  "\u0134": "J\u0302",
  // Ĵ = \^{J}
  "\u1E30": "K\u0301",
  // Ḱ = \'{K}
  "\u01E8": "K\u030C",
  // Ǩ = \v{K}
  "\u0139": "L\u0301",
  // Ĺ = \'{L}
  "\u013D": "L\u030C",
  // Ľ = \v{L}
  "\u1E3E": "M\u0301",
  // Ḿ = \'{M}
  "\u1E40": "M\u0307",
  // Ṁ = \.{M}
  "\u0143": "N\u0301",
  // Ń = \'{N}
  "\u01F8": "N\u0300",
  // Ǹ = \`{N}
  "\xD1": "N\u0303",
  // Ñ = \~{N}
  "\u0147": "N\u030C",
  // Ň = \v{N}
  "\u1E44": "N\u0307",
  // Ṅ = \.{N}
  "\xD3": "O\u0301",
  // Ó = \'{O}
  "\xD2": "O\u0300",
  // Ò = \`{O}
  "\xD6": "O\u0308",
  // Ö = \"{O}
  "\u022A": "O\u0308\u0304",
  // Ȫ = \"\={O}
  "\xD5": "O\u0303",
  // Õ = \~{O}
  "\u1E4C": "O\u0303\u0301",
  // Ṍ = \~\'{O}
  "\u1E4E": "O\u0303\u0308",
  // Ṏ = \~\"{O}
  "\u022C": "O\u0303\u0304",
  // Ȭ = \~\={O}
  "\u014C": "O\u0304",
  // Ō = \={O}
  "\u1E52": "O\u0304\u0301",
  // Ṓ = \=\'{O}
  "\u1E50": "O\u0304\u0300",
  // Ṑ = \=\`{O}
  "\u014E": "O\u0306",
  // Ŏ = \u{O}
  "\u01D1": "O\u030C",
  // Ǒ = \v{O}
  "\xD4": "O\u0302",
  // Ô = \^{O}
  "\u1ED0": "O\u0302\u0301",
  // Ố = \^\'{O}
  "\u1ED2": "O\u0302\u0300",
  // Ồ = \^\`{O}
  "\u1ED6": "O\u0302\u0303",
  // Ỗ = \^\~{O}
  "\u022E": "O\u0307",
  // Ȯ = \.{O}
  "\u0230": "O\u0307\u0304",
  // Ȱ = \.\={O}
  "\u0150": "O\u030B",
  // Ő = \H{O}
  "\u1E54": "P\u0301",
  // Ṕ = \'{P}
  "\u1E56": "P\u0307",
  // Ṗ = \.{P}
  "\u0154": "R\u0301",
  // Ŕ = \'{R}
  "\u0158": "R\u030C",
  // Ř = \v{R}
  "\u1E58": "R\u0307",
  // Ṙ = \.{R}
  "\u015A": "S\u0301",
  // Ś = \'{S}
  "\u1E64": "S\u0301\u0307",
  // Ṥ = \'\.{S}
  "\u0160": "S\u030C",
  // Š = \v{S}
  "\u1E66": "S\u030C\u0307",
  // Ṧ = \v\.{S}
  "\u015C": "S\u0302",
  // Ŝ = \^{S}
  "\u1E60": "S\u0307",
  // Ṡ = \.{S}
  "\u0164": "T\u030C",
  // Ť = \v{T}
  "\u1E6A": "T\u0307",
  // Ṫ = \.{T}
  "\xDA": "U\u0301",
  // Ú = \'{U}
  "\xD9": "U\u0300",
  // Ù = \`{U}
  "\xDC": "U\u0308",
  // Ü = \"{U}
  "\u01D7": "U\u0308\u0301",
  // Ǘ = \"\'{U}
  "\u01DB": "U\u0308\u0300",
  // Ǜ = \"\`{U}
  "\u01D5": "U\u0308\u0304",
  // Ǖ = \"\={U}
  "\u01D9": "U\u0308\u030C",
  // Ǚ = \"\v{U}
  "\u0168": "U\u0303",
  // Ũ = \~{U}
  "\u1E78": "U\u0303\u0301",
  // Ṹ = \~\'{U}
  "\u016A": "U\u0304",
  // Ū = \={U}
  "\u1E7A": "U\u0304\u0308",
  // Ṻ = \=\"{U}
  "\u016C": "U\u0306",
  // Ŭ = \u{U}
  "\u01D3": "U\u030C",
  // Ǔ = \v{U}
  "\xDB": "U\u0302",
  // Û = \^{U}
  "\u016E": "U\u030A",
  // Ů = \r{U}
  "\u0170": "U\u030B",
  // Ű = \H{U}
  "\u1E7C": "V\u0303",
  // Ṽ = \~{V}
  "\u1E82": "W\u0301",
  // Ẃ = \'{W}
  "\u1E80": "W\u0300",
  // Ẁ = \`{W}
  "\u1E84": "W\u0308",
  // Ẅ = \"{W}
  "\u0174": "W\u0302",
  // Ŵ = \^{W}
  "\u1E86": "W\u0307",
  // Ẇ = \.{W}
  "\u1E8C": "X\u0308",
  // Ẍ = \"{X}
  "\u1E8A": "X\u0307",
  // Ẋ = \.{X}
  "\xDD": "Y\u0301",
  // Ý = \'{Y}
  "\u1EF2": "Y\u0300",
  // Ỳ = \`{Y}
  "\u0178": "Y\u0308",
  // Ÿ = \"{Y}
  "\u1EF8": "Y\u0303",
  // Ỹ = \~{Y}
  "\u0232": "Y\u0304",
  // Ȳ = \={Y}
  "\u0176": "Y\u0302",
  // Ŷ = \^{Y}
  "\u1E8E": "Y\u0307",
  // Ẏ = \.{Y}
  "\u0179": "Z\u0301",
  // Ź = \'{Z}
  "\u017D": "Z\u030C",
  // Ž = \v{Z}
  "\u1E90": "Z\u0302",
  // Ẑ = \^{Z}
  "\u017B": "Z\u0307",
  // Ż = \.{Z}
  "\u03AC": "\u03B1\u0301",
  // ά = \'{α}
  "\u1F70": "\u03B1\u0300",
  // ὰ = \`{α}
  "\u1FB1": "\u03B1\u0304",
  // ᾱ = \={α}
  "\u1FB0": "\u03B1\u0306",
  // ᾰ = \u{α}
  "\u03AD": "\u03B5\u0301",
  // έ = \'{ε}
  "\u1F72": "\u03B5\u0300",
  // ὲ = \`{ε}
  "\u03AE": "\u03B7\u0301",
  // ή = \'{η}
  "\u1F74": "\u03B7\u0300",
  // ὴ = \`{η}
  "\u03AF": "\u03B9\u0301",
  // ί = \'{ι}
  "\u1F76": "\u03B9\u0300",
  // ὶ = \`{ι}
  "\u03CA": "\u03B9\u0308",
  // ϊ = \"{ι}
  "\u0390": "\u03B9\u0308\u0301",
  // ΐ = \"\'{ι}
  "\u1FD2": "\u03B9\u0308\u0300",
  // ῒ = \"\`{ι}
  "\u1FD1": "\u03B9\u0304",
  // ῑ = \={ι}
  "\u1FD0": "\u03B9\u0306",
  // ῐ = \u{ι}
  "\u03CC": "\u03BF\u0301",
  // ό = \'{ο}
  "\u1F78": "\u03BF\u0300",
  // ὸ = \`{ο}
  "\u03CD": "\u03C5\u0301",
  // ύ = \'{υ}
  "\u1F7A": "\u03C5\u0300",
  // ὺ = \`{υ}
  "\u03CB": "\u03C5\u0308",
  // ϋ = \"{υ}
  "\u03B0": "\u03C5\u0308\u0301",
  // ΰ = \"\'{υ}
  "\u1FE2": "\u03C5\u0308\u0300",
  // ῢ = \"\`{υ}
  "\u1FE1": "\u03C5\u0304",
  // ῡ = \={υ}
  "\u1FE0": "\u03C5\u0306",
  // ῠ = \u{υ}
  "\u03CE": "\u03C9\u0301",
  // ώ = \'{ω}
  "\u1F7C": "\u03C9\u0300",
  // ὼ = \`{ω}
  "\u038E": "\u03A5\u0301",
  // Ύ = \'{Υ}
  "\u1FEA": "\u03A5\u0300",
  // Ὺ = \`{Υ}
  "\u03AB": "\u03A5\u0308",
  // Ϋ = \"{Υ}
  "\u1FE9": "\u03A5\u0304",
  // Ῡ = \={Υ}
  "\u1FE8": "\u03A5\u0306",
  // Ῠ = \u{Υ}
  "\u038F": "\u03A9\u0301",
  // Ώ = \'{Ω}
  "\u1FFA": "\u03A9\u0300" // Ὼ = \`{Ω}

});
// CONCATENATED MODULE: ./src/Parser.js
/* eslint no-constant-condition:0 */














/**
 * This file contains the parser used to parse out a TeX expression from the
 * input. Since TeX isn't context-free, standard parsers don't work particularly
 * well.
 *
 * The strategy of this parser is as such:
 *
 * The main functions (the `.parse...` ones) take a position in the current
 * parse string to parse tokens from. The lexer (found in Lexer.js, stored at
 * this.gullet.lexer) also supports pulling out tokens at arbitrary places. When
 * individual tokens are needed at a position, the lexer is called to pull out a
 * token, which is then used.
 *
 * The parser has a property called "mode" indicating the mode that
 * the parser is currently in. Currently it has to be one of "math" or
 * "text", which denotes whether the current environment is a math-y
 * one or a text-y one (e.g. inside \text). Currently, this serves to
 * limit the functions which can be used in text mode.
 *
 * The main functions then return an object which contains the useful data that
 * was parsed at its given point, and a new position at the end of the parsed
 * data. The main functions can call each other and continue the parsing by
 * using the returned position as a new starting point.
 *
 * There are also extra `.handle...` functions, which pull out some reused
 * functionality into self-contained functions.
 *
 * The functions return ParseNodes.
 */
var Parser_Parser =
/*#__PURE__*/
function () {
  function Parser(input, settings) {
    this.mode = void 0;
    this.gullet = void 0;
    this.settings = void 0;
    this.leftrightDepth = void 0;
    this.nextToken = void 0;
    // Start in math mode
    this.mode = "math"; // Create a new macro expander (gullet) and (indirectly via that) also a
    // new lexer (mouth) for this parser (stomach, in the language of TeX)

    this.gullet = new MacroExpander_MacroExpander(input, settings, this.mode); // Store the settings for use in parsing

    this.settings = settings; // Count leftright depth (for \middle errors)

    this.leftrightDepth = 0;
  }
  /**
   * Checks a result to make sure it has the right type, and throws an
   * appropriate error otherwise.
   */


  var _proto = Parser.prototype;

  _proto.expect = function expect(text, consume) {
    if (consume === void 0) {
      consume = true;
    }

    if (this.fetch().text !== text) {
      throw new src_ParseError("Expected '" + text + "', got '" + this.fetch().text + "'", this.fetch());
    }

    if (consume) {
      this.consume();
    }
  }
  /**
   * Discards the current lookahead token, considering it consumed.
   */
  ;

  _proto.consume = function consume() {
    this.nextToken = null;
  }
  /**
   * Return the current lookahead token, or if there isn't one (at the
   * beginning, or if the previous lookahead token was consume()d),
   * fetch the next token as the new lookahead token and return it.
   */
  ;

  _proto.fetch = function fetch() {
    if (this.nextToken == null) {
      this.nextToken = this.gullet.expandNextToken();
    }

    return this.nextToken;
  }
  /**
   * Switches between "text" and "math" modes.
   */
  ;

  _proto.switchMode = function switchMode(newMode) {
    this.mode = newMode;
    this.gullet.switchMode(newMode);
  }
  /**
   * Main parsing function, which parses an entire input.
   */
  ;

  _proto.parse = function parse() {
    // Create a group namespace for the math expression.
    // (LaTeX creates a new group for every $...$, $$...$$, \[...\].)
    this.gullet.beginGroup(); // Use old \color behavior (same as LaTeX's \textcolor) if requested.
    // We do this within the group for the math expression, so it doesn't
    // pollute settings.macros.

    if (this.settings.colorIsTextColor) {
      this.gullet.macros.set("\\color", "\\textcolor");
    } // Try to parse the input


    var parse = this.parseExpression(false); // If we succeeded, make sure there's an EOF at the end

    this.expect("EOF"); // End the group namespace for the expression

    this.gullet.endGroup();
    return parse;
  };

  _proto.parseExpression = function parseExpression(breakOnInfix, breakOnTokenText) {
    var body = []; // Keep adding atoms to the body until we can't parse any more atoms (either
    // we reached the end, a }, or a \right)

    while (true) {
      // Ignore spaces in math mode
      if (this.mode === "math") {
        this.consumeSpaces();
      }

      var lex = this.fetch();

      if (Parser.endOfExpression.indexOf(lex.text) !== -1) {
        break;
      }

      if (breakOnTokenText && lex.text === breakOnTokenText) {
        break;
      }

      if (breakOnInfix && src_functions[lex.text] && src_functions[lex.text].infix) {
        break;
      }

      var atom = this.parseAtom(breakOnTokenText);

      if (!atom) {
        break;
      }

      body.push(atom);
    }

    if (this.mode === "text") {
      this.formLigatures(body);
    }

    return this.handleInfixNodes(body);
  }
  /**
   * Rewrites infix operators such as \over with corresponding commands such
   * as \frac.
   *
   * There can only be one infix operator per group.  If there's more than one
   * then the expression is ambiguous.  This can be resolved by adding {}.
   */
  ;

  _proto.handleInfixNodes = function handleInfixNodes(body) {
    var overIndex = -1;
    var funcName;

    for (var i = 0; i < body.length; i++) {
      var node = checkNodeType(body[i], "infix");

      if (node) {
        if (overIndex !== -1) {
          throw new src_ParseError("only one infix operator per group", node.token);
        }

        overIndex = i;
        funcName = node.replaceWith;
      }
    }

    if (overIndex !== -1 && funcName) {
      var numerNode;
      var denomNode;
      var numerBody = body.slice(0, overIndex);
      var denomBody = body.slice(overIndex + 1);

      if (numerBody.length === 1 && numerBody[0].type === "ordgroup") {
        numerNode = numerBody[0];
      } else {
        numerNode = {
          type: "ordgroup",
          mode: this.mode,
          body: numerBody
        };
      }

      if (denomBody.length === 1 && denomBody[0].type === "ordgroup") {
        denomNode = denomBody[0];
      } else {
        denomNode = {
          type: "ordgroup",
          mode: this.mode,
          body: denomBody
        };
      }

      var _node;

      if (funcName === "\\\\abovefrac") {
        _node = this.callFunction(funcName, [numerNode, body[overIndex], denomNode], []);
      } else {
        _node = this.callFunction(funcName, [numerNode, denomNode], []);
      }

      return [_node];
    } else {
      return body;
    }
  } // The greediness of a superscript or subscript
  ;

  /**
   * Handle a subscript or superscript with nice errors.
   */
  _proto.handleSupSubscript = function handleSupSubscript(name) {
    var symbolToken = this.fetch();
    var symbol = symbolToken.text;
    this.consume();
    var group = this.parseGroup(name, false, Parser.SUPSUB_GREEDINESS, undefined, undefined, true); // ignore spaces before sup/subscript argument

    if (!group) {
      throw new src_ParseError("Expected group after '" + symbol + "'", symbolToken);
    }

    return group;
  }
  /**
   * Converts the textual input of an unsupported command into a text node
   * contained within a color node whose color is determined by errorColor
   */
  ;

  _proto.formatUnsupportedCmd = function formatUnsupportedCmd(text) {
    var textordArray = [];

    for (var i = 0; i < text.length; i++) {
      textordArray.push({
        type: "textord",
        mode: "text",
        text: text[i]
      });
    }

    var textNode = {
      type: "text",
      mode: this.mode,
      body: textordArray
    };
    var colorNode = {
      type: "color",
      mode: this.mode,
      color: this.settings.errorColor,
      body: [textNode]
    };
    return colorNode;
  }
  /**
   * Parses a group with optional super/subscripts.
   */
  ;

  _proto.parseAtom = function parseAtom(breakOnTokenText) {
    // The body of an atom is an implicit group, so that things like
    // \left(x\right)^2 work correctly.
    var base = this.parseGroup("atom", false, null, breakOnTokenText); // In text mode, we don't have superscripts or subscripts

    if (this.mode === "text") {
      return base;
    } // Note that base may be empty (i.e. null) at this point.


    var superscript;
    var subscript;

    while (true) {
      // Guaranteed in math mode, so eat any spaces first.
      this.consumeSpaces(); // Lex the first token

      var lex = this.fetch();

      if (lex.text === "\\limits" || lex.text === "\\nolimits") {
        // We got a limit control
        var opNode = checkNodeType(base, "op");

        if (opNode) {
          var limits = lex.text === "\\limits";
          opNode.limits = limits;
          opNode.alwaysHandleSupSub = true;
        } else {
          opNode = checkNodeType(base, "operatorname");

          if (opNode && opNode.alwaysHandleSupSub) {
            var _limits = lex.text === "\\limits";

            opNode.limits = _limits;
          } else {
            throw new src_ParseError("Limit controls must follow a math operator", lex);
          }
        }

        this.consume();
      } else if (lex.text === "^") {
        // We got a superscript start
        if (superscript) {
          throw new src_ParseError("Double superscript", lex);
        }

        superscript = this.handleSupSubscript("superscript");
      } else if (lex.text === "_") {
        // We got a subscript start
        if (subscript) {
          throw new src_ParseError("Double subscript", lex);
        }

        subscript = this.handleSupSubscript("subscript");
      } else if (lex.text === "'") {
        // We got a prime
        if (superscript) {
          throw new src_ParseError("Double superscript", lex);
        }

        var prime = {
          type: "textord",
          mode: this.mode,
          text: "\\prime"
        }; // Many primes can be grouped together, so we handle this here

        var primes = [prime];
        this.consume(); // Keep lexing tokens until we get something that's not a prime

        while (this.fetch().text === "'") {
          // For each one, add another prime to the list
          primes.push(prime);
          this.consume();
        } // If there's a superscript following the primes, combine that
        // superscript in with the primes.


        if (this.fetch().text === "^") {
          primes.push(this.handleSupSubscript("superscript"));
        } // Put everything into an ordgroup as the superscript


        superscript = {
          type: "ordgroup",
          mode: this.mode,
          body: primes
        };
      } else {
        // If it wasn't ^, _, or ', stop parsing super/subscripts
        break;
      }
    } // Base must be set if superscript or subscript are set per logic above,
    // but need to check here for type check to pass.


    if (superscript || subscript) {
      // If we got either a superscript or subscript, create a supsub
      return {
        type: "supsub",
        mode: this.mode,
        base: base,
        sup: superscript,
        sub: subscript
      };
    } else {
      // Otherwise return the original body
      return base;
    }
  }
  /**
   * Parses an entire function, including its base and all of its arguments.
   */
  ;

  _proto.parseFunction = function parseFunction(breakOnTokenText, name, // For error reporting.
  greediness) {
    var token = this.fetch();
    var func = token.text;
    var funcData = src_functions[func];

    if (!funcData) {
      return null;
    }

    this.consume(); // consume command token

    if (greediness != null && funcData.greediness <= greediness) {
      throw new src_ParseError("Got function '" + func + "' with no arguments" + (name ? " as " + name : ""), token);
    } else if (this.mode === "text" && !funcData.allowedInText) {
      throw new src_ParseError("Can't use function '" + func + "' in text mode", token);
    } else if (this.mode === "math" && funcData.allowedInMath === false) {
      throw new src_ParseError("Can't use function '" + func + "' in math mode", token);
    }

    var _this$parseArguments = this.parseArguments(func, funcData),
        args = _this$parseArguments.args,
        optArgs = _this$parseArguments.optArgs;

    return this.callFunction(func, args, optArgs, token, breakOnTokenText);
  }
  /**
   * Call a function handler with a suitable context and arguments.
   */
  ;

  _proto.callFunction = function callFunction(name, args, optArgs, token, breakOnTokenText) {
    var context = {
      funcName: name,
      parser: this,
      token: token,
      breakOnTokenText: breakOnTokenText
    };
    var func = src_functions[name];

    if (func && func.handler) {
      return func.handler(context, args, optArgs);
    } else {
      throw new src_ParseError("No function handler for " + name);
    }
  }
  /**
   * Parses the arguments of a function or environment
   */
  ;

  _proto.parseArguments = function parseArguments(func, // Should look like "\name" or "\begin{name}".
  funcData) {
    var totalArgs = funcData.numArgs + funcData.numOptionalArgs;

    if (totalArgs === 0) {
      return {
        args: [],
        optArgs: []
      };
    }

    var baseGreediness = funcData.greediness;
    var args = [];
    var optArgs = [];

    for (var i = 0; i < totalArgs; i++) {
      var argType = funcData.argTypes && funcData.argTypes[i];
      var isOptional = i < funcData.numOptionalArgs; // Ignore spaces between arguments.  As the TeXbook says:
      // "After you have said ‘\def\row#1#2{...}’, you are allowed to
      //  put spaces between the arguments (e.g., ‘\row x n’), because
      //  TeX doesn’t use single spaces as undelimited arguments."

      var consumeSpaces = i > 0 && !isOptional || // Also consume leading spaces in math mode, as parseSymbol
      // won't know what to do with them.  This can only happen with
      // macros, e.g. \frac\foo\foo where \foo expands to a space symbol.
      // In LaTeX, the \foo's get treated as (blank) arguments.
      // In KaTeX, for now, both spaces will get consumed.
      // TODO(edemaine)
      i === 0 && !isOptional && this.mode === "math";
      var arg = this.parseGroupOfType("argument to '" + func + "'", argType, isOptional, baseGreediness, consumeSpaces);

      if (!arg) {
        if (isOptional) {
          optArgs.push(null);
          continue;
        }

        throw new src_ParseError("Expected group after '" + func + "'", this.fetch());
      }

      (isOptional ? optArgs : args).push(arg);
    }

    return {
      args: args,
      optArgs: optArgs
    };
  }
  /**
   * Parses a group when the mode is changing.
   */
  ;

  _proto.parseGroupOfType = function parseGroupOfType(name, type, optional, greediness, consumeSpaces) {
    switch (type) {
      case "color":
        if (consumeSpaces) {
          this.consumeSpaces();
        }

        return this.parseColorGroup(optional);

      case "size":
        if (consumeSpaces) {
          this.consumeSpaces();
        }

        return this.parseSizeGroup(optional);

      case "url":
        return this.parseUrlGroup(optional, consumeSpaces);

      case "math":
      case "text":
        return this.parseGroup(name, optional, greediness, undefined, type, consumeSpaces);

      case "hbox":
        {
          // hbox argument type wraps the argument in the equivalent of
          // \hbox, which is like \text but switching to \textstyle size.
          var group = this.parseGroup(name, optional, greediness, undefined, "text", consumeSpaces);

          if (!group) {
            return group;
          }

          var styledGroup = {
            type: "styling",
            mode: group.mode,
            body: [group],
            style: "text" // simulate \textstyle

          };
          return styledGroup;
        }

      case "raw":
        {
          if (consumeSpaces) {
            this.consumeSpaces();
          }

          if (optional && this.fetch().text === "{") {
            return null;
          }

          var token = this.parseStringGroup("raw", optional, true);

          if (token) {
            return {
              type: "raw",
              mode: "text",
              string: token.text
            };
          } else {
            throw new src_ParseError("Expected raw group", this.fetch());
          }
        }

      case "original":
      case null:
      case undefined:
        return this.parseGroup(name, optional, greediness, undefined, undefined, consumeSpaces);

      default:
        throw new src_ParseError("Unknown group type as " + name, this.fetch());
    }
  }
  /**
   * Discard any space tokens, fetching the next non-space token.
   */
  ;

  _proto.consumeSpaces = function consumeSpaces() {
    while (this.fetch().text === " ") {
      this.consume();
    }
  }
  /**
   * Parses a group, essentially returning the string formed by the
   * brace-enclosed tokens plus some position information.
   */
  ;

  _proto.parseStringGroup = function parseStringGroup(modeName, // Used to describe the mode in error messages.
  optional, raw) {
    var groupBegin = optional ? "[" : "{";
    var groupEnd = optional ? "]" : "}";
    var beginToken = this.fetch();

    if (beginToken.text !== groupBegin) {
      if (optional) {
        return null;
      } else if (raw && beginToken.text !== "EOF" && /[^{}[\]]/.test(beginToken.text)) {
        this.consume();
        return beginToken;
      }
    }

    var outerMode = this.mode;
    this.mode = "text";
    this.expect(groupBegin);
    var str = "";
    var firstToken = this.fetch();
    var nested = 0; // allow nested braces in raw string group

    var lastToken = firstToken;
    var nextToken;

    while ((nextToken = this.fetch()).text !== groupEnd || raw && nested > 0) {
      switch (nextToken.text) {
        case "EOF":
          throw new src_ParseError("Unexpected end of input in " + modeName, firstToken.range(lastToken, str));

        case groupBegin:
          nested++;
          break;

        case groupEnd:
          nested--;
          break;
      }

      lastToken = nextToken;
      str += lastToken.text;
      this.consume();
    }

    this.expect(groupEnd);
    this.mode = outerMode;
    return firstToken.range(lastToken, str);
  }
  /**
   * Parses a regex-delimited group: the largest sequence of tokens
   * whose concatenated strings match `regex`. Returns the string
   * formed by the tokens plus some position information.
   */
  ;

  _proto.parseRegexGroup = function parseRegexGroup(regex, modeName) {
    var outerMode = this.mode;
    this.mode = "text";
    var firstToken = this.fetch();
    var lastToken = firstToken;
    var str = "";
    var nextToken;

    while ((nextToken = this.fetch()).text !== "EOF" && regex.test(str + nextToken.text)) {
      lastToken = nextToken;
      str += lastToken.text;
      this.consume();
    }

    if (str === "") {
      throw new src_ParseError("Invalid " + modeName + ": '" + firstToken.text + "'", firstToken);
    }

    this.mode = outerMode;
    return firstToken.range(lastToken, str);
  }
  /**
   * Parses a color description.
   */
  ;

  _proto.parseColorGroup = function parseColorGroup(optional) {
    var res = this.parseStringGroup("color", optional);

    if (!res) {
      return null;
    }

    var match = /^(#[a-f0-9]{3}|#?[a-f0-9]{6}|[a-z]+)$/i.exec(res.text);

    if (!match) {
      throw new src_ParseError("Invalid color: '" + res.text + "'", res);
    }

    var color = match[0];

    if (/^[0-9a-f]{6}$/i.test(color)) {
      // We allow a 6-digit HTML color spec without a leading "#".
      // This follows the xcolor package's HTML color model.
      // Predefined color names are all missed by this RegEx pattern.
      color = "#" + color;
    }

    return {
      type: "color-token",
      mode: this.mode,
      color: color
    };
  }
  /**
   * Parses a size specification, consisting of magnitude and unit.
   */
  ;

  _proto.parseSizeGroup = function parseSizeGroup(optional) {
    var res;
    var isBlank = false;

    if (!optional && this.fetch().text !== "{") {
      res = this.parseRegexGroup(/^[-+]? *(?:$|\d+|\d+\.\d*|\.\d*) *[a-z]{0,2} *$/, "size");
    } else {
      res = this.parseStringGroup("size", optional);
    }

    if (!res) {
      return null;
    }

    if (!optional && res.text.length === 0) {
      // Because we've tested for what is !optional, this block won't
      // affect \kern, \hspace, etc. It will capture the mandatory arguments
      // to \genfrac and \above.
      res.text = "0pt"; // Enable \above{}

      isBlank = true; // This is here specifically for \genfrac
    }

    var match = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(res.text);

    if (!match) {
      throw new src_ParseError("Invalid size: '" + res.text + "'", res);
    }

    var data = {
      number: +(match[1] + match[2]),
      // sign + magnitude, cast to number
      unit: match[3]
    };

    if (!validUnit(data)) {
      throw new src_ParseError("Invalid unit: '" + data.unit + "'", res);
    }

    return {
      type: "size",
      mode: this.mode,
      value: data,
      isBlank: isBlank
    };
  }
  /**
   * Parses an URL, checking escaped letters and allowed protocols,
   * and setting the catcode of % as an active character (as in \hyperref).
   */
  ;

  _proto.parseUrlGroup = function parseUrlGroup(optional, consumeSpaces) {
    this.gullet.lexer.setCatcode("%", 13); // active character

    var res = this.parseStringGroup("url", optional, true); // get raw string

    this.gullet.lexer.setCatcode("%", 14); // comment character

    if (!res) {
      return null;
    } // hyperref package allows backslashes alone in href, but doesn't
    // generate valid links in such cases; we interpret this as
    // "undefined" behaviour, and keep them as-is. Some browser will
    // replace backslashes with forward slashes.


    var url = res.text.replace(/\\([#$%&~_^{}])/g, '$1');
    return {
      type: "url",
      mode: this.mode,
      url: url
    };
  }
  /**
   * If `optional` is false or absent, this parses an ordinary group,
   * which is either a single nucleus (like "x") or an expression
   * in braces (like "{x+y}") or an implicit group, a group that starts
   * at the current position, and ends right before a higher explicit
   * group ends, or at EOF.
   * If `optional` is true, it parses either a bracket-delimited expression
   * (like "[x+y]") or returns null to indicate the absence of a
   * bracket-enclosed group.
   * If `mode` is present, switches to that mode while parsing the group,
   * and switches back after.
   */
  ;

  _proto.parseGroup = function parseGroup(name, // For error reporting.
  optional, greediness, breakOnTokenText, mode, consumeSpaces) {
    // Switch to specified mode
    var outerMode = this.mode;

    if (mode) {
      this.switchMode(mode);
    } // Consume spaces if requested, crucially *after* we switch modes,
    // so that the next non-space token is parsed in the correct mode.


    if (consumeSpaces) {
      this.consumeSpaces();
    } // Get first token


    var firstToken = this.fetch();
    var text = firstToken.text;
    var result; // Try to parse an open brace or \begingroup

    if (optional ? text === "[" : text === "{" || text === "\\begingroup") {
      this.consume();
      var groupEnd = Parser.endOfGroup[text]; // Start a new group namespace

      this.gullet.beginGroup(); // If we get a brace, parse an expression

      var expression = this.parseExpression(false, groupEnd);
      var lastToken = this.fetch(); // Check that we got a matching closing brace

      this.expect(groupEnd); // End group namespace

      this.gullet.endGroup();
      result = {
        type: "ordgroup",
        mode: this.mode,
        loc: SourceLocation.range(firstToken, lastToken),
        body: expression,
        // A group formed by \begingroup...\endgroup is a semi-simple group
        // which doesn't affect spacing in math mode, i.e., is transparent.
        // https://tex.stackexchange.com/questions/1930/when-should-one-
        // use-begingroup-instead-of-bgroup
        semisimple: text === "\\begingroup" || undefined
      };
    } else if (optional) {
      // Return nothing for an optional group
      result = null;
    } else {
      // If there exists a function with this name, parse the function.
      // Otherwise, just return a nucleus
      result = this.parseFunction(breakOnTokenText, name, greediness) || this.parseSymbol();

      if (result == null && text[0] === "\\" && !implicitCommands.hasOwnProperty(text)) {
        if (this.settings.throwOnError) {
          throw new src_ParseError("Undefined control sequence: " + text, firstToken);
        }

        result = this.formatUnsupportedCmd(text);
        this.consume();
      }
    } // Switch mode back


    if (mode) {
      this.switchMode(outerMode);
    }

    return result;
  }
  /**
   * Form ligature-like combinations of characters for text mode.
   * This includes inputs like "--", "---", "``" and "''".
   * The result will simply replace multiple textord nodes with a single
   * character in each value by a single textord node having multiple
   * characters in its value.  The representation is still ASCII source.
   * The group will be modified in place.
   */
  ;

  _proto.formLigatures = function formLigatures(group) {
    var n = group.length - 1;

    for (var i = 0; i < n; ++i) {
      var a = group[i]; // $FlowFixMe: Not every node type has a `text` property.

      var v = a.text;

      if (v === "-" && group[i + 1].text === "-") {
        if (i + 1 < n && group[i + 2].text === "-") {
          group.splice(i, 3, {
            type: "textord",
            mode: "text",
            loc: SourceLocation.range(a, group[i + 2]),
            text: "---"
          });
          n -= 2;
        } else {
          group.splice(i, 2, {
            type: "textord",
            mode: "text",
            loc: SourceLocation.range(a, group[i + 1]),
            text: "--"
          });
          n -= 1;
        }
      }

      if ((v === "'" || v === "`") && group[i + 1].text === v) {
        group.splice(i, 2, {
          type: "textord",
          mode: "text",
          loc: SourceLocation.range(a, group[i + 1]),
          text: v + v
        });
        n -= 1;
      }
    }
  }
  /**
   * Parse a single symbol out of the string. Here, we handle single character
   * symbols and special functions like \verb.
   */
  ;

  _proto.parseSymbol = function parseSymbol() {
    var nucleus = this.fetch();
    var text = nucleus.text;

    if (/^\\verb[^a-zA-Z]/.test(text)) {
      this.consume();
      var arg = text.slice(5);
      var star = arg.charAt(0) === "*";

      if (star) {
        arg = arg.slice(1);
      } // Lexer's tokenRegex is constructed to always have matching
      // first/last characters.


      if (arg.length < 2 || arg.charAt(0) !== arg.slice(-1)) {
        throw new src_ParseError("\\verb assertion failed --\n                    please report what input caused this bug");
      }

      arg = arg.slice(1, -1); // remove first and last char

      return {
        type: "verb",
        mode: "text",
        body: arg,
        star: star
      };
    } // At this point, we should have a symbol, possibly with accents.
    // First expand any accented base symbol according to unicodeSymbols.


    if (unicodeSymbols.hasOwnProperty(text[0]) && !src_symbols[this.mode][text[0]]) {
      // This behavior is not strict (XeTeX-compatible) in math mode.
      if (this.settings.strict && this.mode === "math") {
        this.settings.reportNonstrict("unicodeTextInMathMode", "Accented Unicode text character \"" + text[0] + "\" used in " + "math mode", nucleus);
      }

      text = unicodeSymbols[text[0]] + text.substr(1);
    } // Strip off any combining characters


    var match = combiningDiacriticalMarksEndRegex.exec(text);

    if (match) {
      text = text.substring(0, match.index);

      if (text === 'i') {
        text = "\u0131"; // dotless i, in math and text mode
      } else if (text === 'j') {
        text = "\u0237"; // dotless j, in math and text mode
      }
    } // Recognize base symbol


    var symbol;

    if (src_symbols[this.mode][text]) {
      if (this.settings.strict && this.mode === 'math' && extraLatin.indexOf(text) >= 0) {
        this.settings.reportNonstrict("unicodeTextInMathMode", "Latin-1/Unicode text character \"" + text[0] + "\" used in " + "math mode", nucleus);
      }

      var group = src_symbols[this.mode][text].group;
      var loc = SourceLocation.range(nucleus);
      var s;

      if (ATOMS.hasOwnProperty(group)) {
        // $FlowFixMe
        var family = group;
        s = {
          type: "atom",
          mode: this.mode,
          family: family,
          loc: loc,
          text: text
        };
      } else {
        // $FlowFixMe
        s = {
          type: group,
          mode: this.mode,
          loc: loc,
          text: text
        };
      }

      symbol = s;
    } else if (text.charCodeAt(0) >= 0x80) {
      // no symbol for e.g. ^
      if (this.settings.strict) {
        if (!supportedCodepoint(text.charCodeAt(0))) {
          this.settings.reportNonstrict("unknownSymbol", "Unrecognized Unicode character \"" + text[0] + "\"" + (" (" + text.charCodeAt(0) + ")"), nucleus);
        } else if (this.mode === "math") {
          this.settings.reportNonstrict("unicodeTextInMathMode", "Unicode text character \"" + text[0] + "\" used in math mode", nucleus);
        }
      } // All nonmathematical Unicode characters are rendered as if they
      // are in text mode (wrapped in \text) because that's what it
      // takes to render them in LaTeX.  Setting `mode: this.mode` is
      // another natural choice (the user requested math mode), but
      // this makes it more difficult for getCharacterMetrics() to
      // distinguish Unicode characters without metrics and those for
      // which we want to simulate the letter M.


      symbol = {
        type: "textord",
        mode: "text",
        loc: SourceLocation.range(nucleus),
        text: text
      };
    } else {
      return null; // EOF, ^, _, {, }, etc.
    }

    this.consume(); // Transform combining characters into accents

    if (match) {
      for (var i = 0; i < match[0].length; i++) {
        var accent = match[0][i];

        if (!unicodeAccents[accent]) {
          throw new src_ParseError("Unknown accent ' " + accent + "'", nucleus);
        }

        var command = unicodeAccents[accent][this.mode];

        if (!command) {
          throw new src_ParseError("Accent " + accent + " unsupported in " + this.mode + " mode", nucleus);
        }

        symbol = {
          type: "accent",
          mode: this.mode,
          loc: SourceLocation.range(nucleus),
          label: command,
          isStretchy: false,
          isShifty: true,
          base: symbol
        };
      }
    }

    return symbol;
  };

  return Parser;
}();

Parser_Parser.endOfExpression = ["}", "\\endgroup", "\\end", "\\right", "&"];
Parser_Parser.endOfGroup = {
  "[": "]",
  "{": "}",
  "\\begingroup": "\\endgroup"
  /**
   * Parses an "expression", which is a list of atoms.
   *
   * `breakOnInfix`: Should the parsing stop when we hit infix nodes? This
   *                 happens when functions have higher precendence han infix
   *                 nodes in implicit parses.
   *
   * `breakOnTokenText`: The text of the token that the expression should end
   *                     with, or `null` if something else should end the
   *                     expression.
   */

};
Parser_Parser.SUPSUB_GREEDINESS = 1;

// CONCATENATED MODULE: ./src/parseTree.js
/**
 * Provides a single function for parsing an expression using a Parser
 * TODO(emily): Remove this
 */



/**
 * Parses an expression using a Parser, then returns the parsed result.
 */
var parseTree_parseTree = function parseTree(toParse, settings) {
  if (!(typeof toParse === 'string' || toParse instanceof String)) {
    throw new TypeError('KaTeX can only parse string typed expression');
  }

  var parser = new Parser_Parser(toParse, settings); // Blank out any \df@tag to avoid spurious "Duplicate \tag" errors

  delete parser.gullet.macros.current["\\df@tag"];
  var tree = parser.parse(); // If the input used \tag, it will set the \df@tag macro to the tag.
  // In this case, we separately parse the tag and wrap the tree.

  if (parser.gullet.macros.get("\\df@tag")) {
    if (!settings.displayMode) {
      throw new src_ParseError("\\tag works only in display equations");
    }

    parser.gullet.feed("\\df@tag");
    tree = [{
      type: "tag",
      mode: "text",
      body: tree,
      tag: parser.parse()
    }];
  }

  return tree;
};

/* harmony default export */ var src_parseTree = (parseTree_parseTree);
// CONCATENATED MODULE: ./katex.js
/* eslint no-console:0 */

/**
 * This is the main entry point for KaTeX. Here, we expose functions for
 * rendering expressions either to DOM nodes or to markup strings.
 *
 * We also expose the ParseError class to check if errors thrown from KaTeX are
 * errors in the expression, or errors in javascript handling.
 */










/**
 * Parse and build an expression, and place that expression in the DOM node
 * given.
 */
var katex_render = function render(expression, baseNode, options) {
  baseNode.textContent = "";
  var node = katex_renderToDomTree(expression, options).toNode();
  baseNode.appendChild(node);
}; // KaTeX's styles don't work properly in quirks mode. Print out an error, and
// disable rendering.


if (typeof document !== "undefined") {
  if (document.compatMode !== "CSS1Compat") {
    typeof console !== "undefined" && console.warn("Warning: KaTeX doesn't work in quirks mode. Make sure your " + "website has a suitable doctype.");

    katex_render = function render() {
      throw new src_ParseError("KaTeX doesn't work in quirks mode.");
    };
  }
}
/**
 * Parse and build an expression, and return the markup for that.
 */


var renderToString = function renderToString(expression, options) {
  var markup = katex_renderToDomTree(expression, options).toMarkup();
  return markup;
};
/**
 * Parse an expression and return the parse tree.
 */


var katex_generateParseTree = function generateParseTree(expression, options) {
  var settings = new Settings_Settings(options);
  return src_parseTree(expression, settings);
};
/**
 * If the given error is a KaTeX ParseError and options.throwOnError is false,
 * renders the invalid LaTeX as a span with hover title giving the KaTeX
 * error message.  Otherwise, simply throws the error.
 */


var katex_renderError = function renderError(error, expression, options) {
  if (options.throwOnError || !(error instanceof src_ParseError)) {
    throw error;
  }

  var node = buildCommon.makeSpan(["katex-error"], [new domTree_SymbolNode(expression)]);
  node.setAttribute("title", error.toString());
  node.setAttribute("style", "color:" + options.errorColor);
  return node;
};
/**
 * Generates and returns the katex build tree. This is used for advanced
 * use cases (like rendering to custom output).
 */


var katex_renderToDomTree = function renderToDomTree(expression, options) {
  var settings = new Settings_Settings(options);

  try {
    var tree = src_parseTree(expression, settings);
    return buildTree_buildTree(tree, expression, settings);
  } catch (error) {
    return katex_renderError(error, expression, settings);
  }
};
/**
 * Generates and returns the katex build tree, with just HTML (no MathML).
 * This is used for advanced use cases (like rendering to custom output).
 */


var katex_renderToHTMLTree = function renderToHTMLTree(expression, options) {
  var settings = new Settings_Settings(options);

  try {
    var tree = src_parseTree(expression, settings);
    return buildTree_buildHTMLTree(tree, expression, settings);
  } catch (error) {
    return katex_renderError(error, expression, settings);
  }
};

/* harmony default export */ var katex_0 = ({
  /**
   * Current KaTeX version
   */
  version: "0.11.1",

  /**
   * Renders the given LaTeX into an HTML+MathML combination, and adds
   * it as a child to the specified DOM node.
   */
  render: katex_render,

  /**
   * Renders the given LaTeX into an HTML+MathML combination string,
   * for sending to the client.
   */
  renderToString: renderToString,

  /**
   * KaTeX error, usually during parsing.
   */
  ParseError: src_ParseError,

  /**
   * Parses the given LaTeX into KaTeX's internal parse tree structure,
   * without rendering to HTML or MathML.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __parse: katex_generateParseTree,

  /**
   * Renders the given LaTeX into an HTML+MathML internal DOM tree
   * representation, without flattening that representation to a string.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __renderToDomTree: katex_renderToDomTree,

  /**
   * Renders the given LaTeX into an HTML internal DOM tree representation,
   * without MathML and without flattening that representation to a string.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __renderToHTMLTree: katex_renderToHTMLTree,

  /**
   * extends internal font metrics object with a new object
   * each key in the new object represents a font name
  */
  __setFontMetrics: setFontMetrics,

  /**
   * adds a new symbol to builtin symbols table
   */
  __defineSymbol: defineSymbol,

  /**
   * adds a new macro to builtin macro list
   */
  __defineMacro: defineMacro,

  /**
   * Expose the dom tree node types, which can be useful for type checking nodes.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __domTree: {
    Span: domTree_Span,
    Anchor: domTree_Anchor,
    SymbolNode: domTree_SymbolNode,
    SvgNode: SvgNode,
    PathNode: domTree_PathNode,
    LineNode: LineNode
  }
});
// CONCATENATED MODULE: ./katex.webpack.js
/**
 * This is the webpack entry point for KaTeX. As ECMAScript, flow[1] and jest[2]
 * doesn't support CSS modules natively, a separate entry point is used and
 * it is not flowtyped.
 *
 * [1] https://gist.github.com/lambdahands/d19e0da96285b749f0ef
 * [2] https://facebook.github.io/jest/docs/en/webpack.html
 */


/* harmony default export */ var katex_webpack = __webpack_exports__["default"] = (katex_0);

/***/ })
/******/ ])["default"];
});