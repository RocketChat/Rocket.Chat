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
Object.defineProperty(exports, "__esModule", { value: true });
exports.$convention = void 0;
var $convention = function (rename) {
    var main = function (input) {
        if (typeof input === "object")
            if (input === null)
                return null;
            else if (Array.isArray(input))
                return input.map(main);
            else if (input instanceof Boolean ||
                input instanceof BigInt ||
                input instanceof Number ||
                input instanceof String)
                return input.valueOf();
            else if (input instanceof Date)
                return new Date(input);
            else if (input instanceof Uint8Array ||
                input instanceof Uint8ClampedArray ||
                input instanceof Uint16Array ||
                input instanceof Uint32Array ||
                input instanceof BigUint64Array ||
                input instanceof Int8Array ||
                input instanceof Int16Array ||
                input instanceof Int32Array ||
                input instanceof BigInt64Array ||
                input instanceof Float32Array ||
                input instanceof Float64Array ||
                input instanceof DataView)
                return input;
            else
                return object(input);
        return input;
    };
    var object = function (input) {
        return Object.fromEntries(Object.entries(input).map(function (_a) {
            var _b = __read(_a, 2), key = _b[0], value = _b[1];
            return [rename(key), main(value)];
        }));
    };
    return main;
};
exports.$convention = $convention;
//# sourceMappingURL=$convention.js.map