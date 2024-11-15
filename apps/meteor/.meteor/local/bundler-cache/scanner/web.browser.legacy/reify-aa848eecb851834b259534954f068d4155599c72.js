"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.$clone = void 0;
var $clone = function (value) {
    return $cloneMain(value);
};
exports.$clone = $clone;
var $cloneMain = function (value) {
    if (value === undefined)
        return undefined;
    else if (typeof value === "object")
        if (value === null)
            return null;
        else if (Array.isArray(value))
            return value.map($cloneMain);
        else if (value instanceof Date)
            return new Date(value);
        else if (value instanceof Uint8Array)
            return new Uint8Array(value);
        else if (value instanceof Uint8ClampedArray)
            return new Uint8ClampedArray(value);
        else if (value instanceof Uint16Array)
            return new Uint16Array(value);
        else if (value instanceof Uint32Array)
            return new Uint32Array(value);
        else if (value instanceof BigUint64Array)
            return new BigUint64Array(value);
        else if (value instanceof Int8Array)
            return new Int8Array(value);
        else if (value instanceof Int16Array)
            return new Int16Array(value);
        else if (value instanceof Int32Array)
            return new Int32Array(value);
        else if (value instanceof BigInt64Array)
            return new BigInt64Array(value);
        else if (value instanceof Float32Array)
            return new Float32Array(value);
        else if (value instanceof Float64Array)
            return new Float64Array(value);
        else if (value instanceof ArrayBuffer)
            return value.slice(0);
        else if (value instanceof SharedArrayBuffer)
            return value.slice(0);
        else if (value instanceof DataView)
            return new DataView(value.buffer.slice(0));
        else if (typeof File !== "undefined" && value instanceof File)
            return new File([value], value.name, { type: value.type });
        else if (typeof Blob !== "undefined" && value instanceof Blob)
            return new Blob([value], { type: value.type });
        else if (value instanceof Set)
            return new Set(__spreadArray([], __read(value), false).map($cloneMain));
        else if (value instanceof Map)
            return new Map(__spreadArray([], __read(value), false).map(function (_a) {
                var _b = __read(_a, 2), k = _b[0], v = _b[1];
                return [$cloneMain(k), $cloneMain(v)];
            }));
        else if (value instanceof WeakSet || value instanceof WeakMap)
            throw new Error("WeakSet and WeakMap are not supported");
        else if (value.valueOf() !== value)
            return $cloneMain(value.valueOf());
        else
            return Object.fromEntries(Object.entries(value)
                .map(function (_a) {
                var _b = __read(_a, 2), k = _b[0], v = _b[1];
                return [k, $cloneMain(v)];
            })
                .filter(function (_a) {
                var _b = __read(_a, 2), v = _b[1];
                return v !== undefined;
            }));
    else if (typeof value === "function")
        return undefined;
    return value;
};
//# sourceMappingURL=$clone.js.map