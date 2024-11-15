"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNumberElement = exports.createLiteralElement = exports.isDateTimeSkeleton = exports.isNumberSkeleton = exports.isTagElement = exports.isPoundElement = exports.isPluralElement = exports.isSelectElement = exports.isTimeElement = exports.isDateElement = exports.isNumberElement = exports.isArgumentElement = exports.isLiteralElement = exports.SKELETON_TYPE = exports.TYPE = void 0;
var TYPE;
(function (TYPE) {
    /**
     * Raw text
     */
    TYPE[TYPE["literal"] = 0] = "literal";
    /**
     * Variable w/o any format, e.g `var` in `this is a {var}`
     */
    TYPE[TYPE["argument"] = 1] = "argument";
    /**
     * Variable w/ number format
     */
    TYPE[TYPE["number"] = 2] = "number";
    /**
     * Variable w/ date format
     */
    TYPE[TYPE["date"] = 3] = "date";
    /**
     * Variable w/ time format
     */
    TYPE[TYPE["time"] = 4] = "time";
    /**
     * Variable w/ select format
     */
    TYPE[TYPE["select"] = 5] = "select";
    /**
     * Variable w/ plural format
     */
    TYPE[TYPE["plural"] = 6] = "plural";
    /**
     * Only possible within plural argument.
     * This is the `#` symbol that will be substituted with the count.
     */
    TYPE[TYPE["pound"] = 7] = "pound";
    /**
     * XML-like tag
     */
    TYPE[TYPE["tag"] = 8] = "tag";
})(TYPE = exports.TYPE || (exports.TYPE = {}));
var SKELETON_TYPE;
(function (SKELETON_TYPE) {
    SKELETON_TYPE[SKELETON_TYPE["number"] = 0] = "number";
    SKELETON_TYPE[SKELETON_TYPE["dateTime"] = 1] = "dateTime";
})(SKELETON_TYPE = exports.SKELETON_TYPE || (exports.SKELETON_TYPE = {}));
/**
 * Type Guards
 */
function isLiteralElement(el) {
    return el.type === TYPE.literal;
}
exports.isLiteralElement = isLiteralElement;
function isArgumentElement(el) {
    return el.type === TYPE.argument;
}
exports.isArgumentElement = isArgumentElement;
function isNumberElement(el) {
    return el.type === TYPE.number;
}
exports.isNumberElement = isNumberElement;
function isDateElement(el) {
    return el.type === TYPE.date;
}
exports.isDateElement = isDateElement;
function isTimeElement(el) {
    return el.type === TYPE.time;
}
exports.isTimeElement = isTimeElement;
function isSelectElement(el) {
    return el.type === TYPE.select;
}
exports.isSelectElement = isSelectElement;
function isPluralElement(el) {
    return el.type === TYPE.plural;
}
exports.isPluralElement = isPluralElement;
function isPoundElement(el) {
    return el.type === TYPE.pound;
}
exports.isPoundElement = isPoundElement;
function isTagElement(el) {
    return el.type === TYPE.tag;
}
exports.isTagElement = isTagElement;
function isNumberSkeleton(el) {
    return !!(el && typeof el === 'object' && el.type === SKELETON_TYPE.number);
}
exports.isNumberSkeleton = isNumberSkeleton;
function isDateTimeSkeleton(el) {
    return !!(el && typeof el === 'object' && el.type === SKELETON_TYPE.dateTime);
}
exports.isDateTimeSkeleton = isDateTimeSkeleton;
function createLiteralElement(value) {
    return {
        type: TYPE.literal,
        value: value,
    };
}
exports.createLiteralElement = createLiteralElement;
function createNumberElement(value, style) {
    return {
        type: TYPE.number,
        value: value,
        style: style,
    };
}
exports.createNumberElement = createNumberElement;
