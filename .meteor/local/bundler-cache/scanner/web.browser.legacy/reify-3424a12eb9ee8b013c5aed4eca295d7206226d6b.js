"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwUnhandledCaseError = exports.splitAndCapture = exports.remove = exports.indexOf = exports.ellipsis = exports.defaults = void 0;
/**
 * Assigns (shallow copies) the properties of `src` onto `dest`, if the
 * corresponding property on `dest` === `undefined`.
 *
 * @param {Object} dest The destination object.
 * @param {Object} src The source object.
 * @return {Object} The destination object (`dest`)
 */
function defaults(dest, src) {
    for (var prop in src) {
        if (src.hasOwnProperty(prop) && dest[prop] === undefined) {
            dest[prop] = src[prop];
        }
    }
    return dest;
}
exports.defaults = defaults;
/**
 * Truncates the `str` at `len - ellipsisChars.length`, and adds the `ellipsisChars` to the
 * end of the string (by default, two periods: '..'). If the `str` length does not exceed
 * `len`, the string will be returned unchanged.
 *
 * @param {String} str The string to truncate and add an ellipsis to.
 * @param {Number} truncateLen The length to truncate the string at.
 * @param {String} [ellipsisChars=...] The ellipsis character(s) to add to the end of `str`
 *   when truncated. Defaults to '...'
 */
function ellipsis(str, truncateLen, ellipsisChars) {
    var ellipsisLength;
    if (str.length > truncateLen) {
        if (ellipsisChars == null) {
            ellipsisChars = '&hellip;';
            ellipsisLength = 3;
        }
        else {
            ellipsisLength = ellipsisChars.length;
        }
        str = str.substring(0, truncateLen - ellipsisLength) + ellipsisChars;
    }
    return str;
}
exports.ellipsis = ellipsis;
/**
 * Supports `Array.prototype.indexOf()` functionality for old IE (IE8 and below).
 *
 * @param {Array} arr The array to find an element of.
 * @param {*} element The element to find in the array, and return the index of.
 * @return {Number} The index of the `element`, or -1 if it was not found.
 */
function indexOf(arr, element) {
    // @ts-ignore - As far as TypeScript is concerned, this method will always
    // exist (lowest "lib" in TS is "ES5"). Hence we need to ignore this error
    // to support IE8 which only implements ES3 and doesn't have this method
    if (Array.prototype.indexOf) {
        return arr.indexOf(element);
    }
    else {
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] === element)
                return i;
        }
        return -1;
    }
}
exports.indexOf = indexOf;
/**
 * Removes array elements based on a filtering function. Mutates the input
 * array.
 *
 * Using this instead of the ES5 Array.prototype.filter() function, to allow
 * Autolinker compatibility with IE8, and also to prevent creating many new
 * arrays in memory for filtering.
 *
 * @param {Array} arr The array to remove elements from. This array is
 *   mutated.
 * @param {Function} fn A function which should return `true` to
 *   remove an element.
 * @return {Array} The mutated input `arr`.
 */
function remove(arr, fn) {
    for (var i = arr.length - 1; i >= 0; i--) {
        if (fn(arr[i]) === true) {
            arr.splice(i, 1);
        }
    }
}
exports.remove = remove;
/**
 * Performs the functionality of what modern browsers do when `String.prototype.split()` is called
 * with a regular expression that contains capturing parenthesis.
 *
 * For example:
 *
 *     // Modern browsers:
 *     "a,b,c".split( /(,)/ );  // --> [ 'a', ',', 'b', ',', 'c' ]
 *
 *     // Old IE (including IE8):
 *     "a,b,c".split( /(,)/ );  // --> [ 'a', 'b', 'c' ]
 *
 * This method emulates the functionality of modern browsers for the old IE case.
 *
 * @param {String} str The string to split.
 * @param {RegExp} splitRegex The regular expression to split the input `str` on. The splitting
 *   character(s) will be spliced into the array, as in the "modern browsers" example in the
 *   description of this method.
 *   Note #1: the supplied regular expression **must** have the 'g' flag specified.
 *   Note #2: for simplicity's sake, the regular expression does not need
 *   to contain capturing parenthesis - it will be assumed that any match has them.
 * @return {String[]} The split array of strings, with the splitting character(s) included.
 */
function splitAndCapture(str, splitRegex) {
    if (!splitRegex.global)
        throw new Error("`splitRegex` must have the 'g' flag set");
    var result = [], lastIdx = 0, match;
    while ((match = splitRegex.exec(str))) {
        result.push(str.substring(lastIdx, match.index));
        result.push(match[0]); // push the splitting char(s)
        lastIdx = match.index + match[0].length;
    }
    result.push(str.substring(lastIdx));
    return result;
}
exports.splitAndCapture = splitAndCapture;
/**
 * Function that should never be called but is used to check that every
 * enum value is handled using TypeScript's 'never' type.
 */
function throwUnhandledCaseError(theValue) {
    throw new Error("Unhandled case for value: '".concat(theValue, "'"));
}
exports.throwUnhandledCaseError = throwUnhandledCaseError;
//# sourceMappingURL=utils.js.map